import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

interface ScanOptions {
  followSymlinks?: boolean;
  maxDepth?: number;
  excludePatterns?: (string | RegExp)[];
  hiddenFolders?: string[];
}

interface ScannedFile {
  path: string;
  name: string;
  size: number;
  mtime: Date;
  atime: Date;
  ctime: Date;
}

interface ProgressData {
  type: 'progress' | 'warning' | 'complete';
  processedDirs?: number;
  processedFiles?: number;
  currentDir?: string;
  queueSize?: number;
  totalFiles?: number;
  message?: string;
}

/**
 * File Scanner Service - Core module for scanning and analyzing files
 */
export class FileScanner {
  private options: Required<ScanOptions>;

  constructor(options: ScanOptions = {}) {
    this.options = {
      followSymlinks: options.followSymlinks || false,
      maxDepth: options.maxDepth || Infinity,
      excludePatterns: options.excludePatterns || [],
      hiddenFolders: options.hiddenFolders || [],
    };
  }

  /**
   * Scan directory iteratively to avoid stack overflow with deep directories
   */
  async scanDirectory(
    dirPath: string,
    progressCallback?: (data: ProgressData) => void
  ): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];
    const directoriesToScan: Array<{ path: string; depth: number }> = [{ path: dirPath, depth: 0 }];
    let processedFiles = 0;
    let processedDirs = 0;

    while (directoriesToScan.length > 0) {
      const current = directoriesToScan.pop();
      if (!current) continue;
      
      const { path: currentPath, depth } = current;
      
      if (depth > this.options.maxDepth) {
        continue;
      }

      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        processedDirs++;

        // Report progress every 100 directories
        if (progressCallback && processedDirs % 100 === 0) {
          progressCallback({
            type: 'progress',
            processedDirs,
            processedFiles,
            currentDir: currentPath,
            queueSize: directoriesToScan.length,
          });
        }

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          // Check exclusion patterns
          if (this.shouldExclude(fullPath)) {
            continue;
          }

          try {
            let stat;
            if (entry.isSymbolicLink() && !this.options.followSymlinks) {
              continue;
            }
            
            stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
              directoriesToScan.push({ path: fullPath, depth: depth + 1 });
            } else if (stat.isFile()) {
              files.push({
                path: fullPath,
                name: entry.name,
                size: stat.size,
                mtime: stat.mtime,
                atime: stat.atime,
                ctime: stat.ctime,
              });
              processedFiles++;

              // Report progress every 1000 files
              if (progressCallback && processedFiles % 1000 === 0) {
                progressCallback({
                  type: 'progress',
                  processedDirs,
                  processedFiles,
                  currentDir: currentPath,
                  queueSize: directoriesToScan.length,
                });
              }
            }
          } catch (err: any) {
            // Skip files that can't be accessed
            if (err.code !== 'EACCES' && err.code !== 'EPERM') {
              if (progressCallback) {
                progressCallback({
                  type: 'warning',
                  message: `Could not access ${fullPath}: ${err.message}`,
                });
              }
            }
          }
        }
      } catch (err: any) {
        const message = `Could not read directory ${currentPath}: ${err.message}`;
        if (progressCallback) {
          progressCallback({
            type: 'warning',
            message,
          });
        }
      }
    }

    if (progressCallback) {
      progressCallback({
        type: 'complete',
        processedDirs,
        processedFiles,
        totalFiles: files.length,
      });
    }

    return files;
  }

  /**
   * Check if a path should be excluded
   */
  private shouldExclude(filePath: string): boolean {
    // Check exclude patterns
    const isExcluded = this.options.excludePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return filePath.includes(pattern);
      }
      return pattern.test(filePath);
    });
    
    if (isExcluded) return true;
    
    // Check hidden folders
    if (this.options.hiddenFolders && this.options.hiddenFolders.length > 0) {
      const pathParts = filePath.split(path.sep);
      return this.options.hiddenFolders.some(hidden => 
        pathParts.includes(hidden)
      );
    }
    
    return false;
  }

  /**
   * Calculate file hash (for duplicate detection)
   */
  async calculateHash(filePath: string, algorithm = 'sha256'): Promise<string> {
    try {
      const stat = await fs.stat(filePath);
      
      // For files larger than 2GB, use streaming approach
      if (stat.size > 2 * 1024 * 1024 * 1024) {
        return await this.calculateStreamingHash(filePath, algorithm);
      }
      
      // For smaller files, use the faster readFile approach
      const fileBuffer = await fs.readFile(filePath);
      const hash = createHash(algorithm);
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (err: any) {
      throw new Error(`Failed to calculate hash for ${filePath}: ${err.message}`);
    }
  }

  /**
   * Calculate hash using streaming for very large files
   */
  private async calculateStreamingHash(filePath: string, algorithm = 'sha256'): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash(algorithm);
      const stream = createReadStream(filePath);
      
      stream.on('data', chunk => {
        hash.update(chunk);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', err => {
        reject(new Error(`Failed to calculate streaming hash for ${filePath}: ${err.message}`));
      });
    });
  }

  /**
   * Calculate quick hash (first and last chunks only) for faster comparison
   */
  async calculateQuickHash(filePath: string, chunkSize = 8192): Promise<string> {
    try {
      const stat = await fs.stat(filePath);
      const fileHandle = await fs.open(filePath, 'r');
      
      try {
        const hash = createHash('sha256');
        const buffer = Buffer.alloc(chunkSize);

        // Read first chunk
        await fileHandle.read(buffer, 0, chunkSize, 0);
        hash.update(buffer);

        // Read last chunk if file is large enough
        if (stat.size > chunkSize) {
          await fileHandle.read(buffer, 0, chunkSize, Math.max(0, stat.size - chunkSize));
          hash.update(buffer);
        }

        return hash.digest('hex');
      } finally {
        await fileHandle.close();
      }
    } catch (err: any) {
      throw new Error(`Failed to calculate quick hash for ${filePath}: ${err.message}`);
    }
  }
}

export default FileScanner;
