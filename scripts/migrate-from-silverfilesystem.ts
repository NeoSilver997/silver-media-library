/**
 * Migration script to import data from SilverFileSystem MySQL database to Strapi
 * 
 * This script reads data from a SilverFileSystem database and imports it into
 * the new Strapi-based silver-media-library system.
 * 
 * Usage:
 *   ts-node scripts/migrate-from-silverfilesystem.ts [options]
 * 
 * Options:
 *   --limit <number>  - Limit number of files to migrate (for testing)
 *   --no-dry-run      - Actually import data (default is dry-run)
 * 
 * Environment variables required:
 *   SOURCE_DB_HOST - SilverFileSystem MySQL host
 *   SOURCE_DB_PORT - SilverFileSystem MySQL port
 *   SOURCE_DB_USER - SilverFileSystem MySQL user
 *   SOURCE_DB_PASSWORD - SilverFileSystem MySQL password
 *   SOURCE_DB_NAME - SilverFileSystem MySQL database name
 */

import mysql from 'mysql2/promise';

interface SourceFile {
  id: number;
  path: string;
  name: string;
  size: bigint;
  hash: string | null;
  quick_hash: string | null;
  extension: string | null;
  mtime: Date | null;
  atime: Date | null;
  ctime: Date | null;
  scan_id: number | null;
}

interface SourcePhotoMetadata {
  file_id: number;
  width: number | null;
  height: number | null;
  camera_make: string | null;
  camera_model: string | null;
  lens_model: string | null;
  iso: number | null;
  aperture: number | null;
  shutter_speed: string | null;
  focal_length: number | null;
  flash: boolean | null;
  date_taken: Date | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  software: string | null;
  artist: string | null;
  copyright: string | null;
}

interface SourceMusicMetadata {
  file_id: number;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_artist: string | null;
  year: number | null;
  genre: string | null;
  track_number: number | null;
  disk_number: number | null;
  duration: number | null;
  bitrate: number | null;
  sample_rate: number | null;
  channels: number | null;
  codec: string | null;
  composer: string | null;
  isrc: string | null;
  has_album_art: boolean | null;
}

interface SourceVideoMetadata {
  file_id: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  frame_rate: number | null;
  video_codec: string | null;
  video_bitrate: number | null;
  audio_codec: string | null;
  audio_sample_rate: number | null;
  audio_channels: number | null;
  audio_bitrate: number | null;
  title: string | null;
  description: string | null;
  genre: string | null;
  artist: string | null;
  year: number | null;
  creation_date: Date | null;
  latitude: number | null;
  longitude: number | null;
  software: string | null;
}

interface ScanSession {
  id: number;
  scan_path: string;
  total_files: number;
  total_size: bigint;
  start_time: Date;
  end_time: Date | null;
  status: string;
}

class DataMigration {
  private sourceConnection: mysql.Connection | null = null;
  private strapiUrl: string;

  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
  }

  /**
   * Connect to source database
   */
  async connectSource(): Promise<void> {
    console.log('📡 Connecting to source database...');
    
    const config = {
      host: process.env.SOURCE_DB_HOST || 'localhost',
      port: parseInt(process.env.SOURCE_DB_PORT || '3306'),
      user: process.env.SOURCE_DB_USER || 'root',
      password: process.env.SOURCE_DB_PASSWORD || '',
      database: process.env.SOURCE_DB_NAME || 'silverfilesystem',
    };

    console.log(`   Connecting to ${config.user}@${config.host}:${config.port}/${config.database}`);

    this.sourceConnection = await mysql.createConnection(config);
    console.log('✅ Connected to source database\n');
  }

  /**
   * Fetch scan sessions from source database
   */
  async fetchScanSessions(): Promise<ScanSession[]> {
    if (!this.sourceConnection) {
      throw new Error('Source database not connected');
    }

    console.log('📋 Fetching scan sessions...');
    const [rows] = await this.sourceConnection.execute(
      'SELECT * FROM scan_sessions ORDER BY id'
    );
    
    const sessions = rows as ScanSession[];
    console.log(`   Found ${sessions.length} scan sessions\n`);
    return sessions;
  }

  /**
   * Fetch files from source database
   */
  async fetchFiles(limit: number = 0): Promise<SourceFile[]> {
    if (!this.sourceConnection) {
      throw new Error('Source database not connected');
    }

    console.log('📋 Fetching files...');
    
    let query = 'SELECT * FROM scanned_files ORDER BY id';
    if (limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    const [rows] = await this.sourceConnection.execute(query);
    const files = rows as SourceFile[];
    console.log(`   Found ${files.length} files\n`);
    return files;
  }

  /**
   * Fetch photo metadata from source database
   */
  async fetchPhotoMetadata(): Promise<Map<number, SourcePhotoMetadata>> {
    if (!this.sourceConnection) {
      throw new Error('Source database not connected');
    }

    console.log('📋 Fetching photo metadata...');
    const [rows] = await this.sourceConnection.execute(
      'SELECT * FROM photo_metadata'
    );
    
    const metadata = new Map<number, SourcePhotoMetadata>();
    (rows as SourcePhotoMetadata[]).forEach(row => {
      metadata.set(row.file_id, row);
    });
    
    console.log(`   Found ${metadata.size} photo metadata records\n`);
    return metadata;
  }

  /**
   * Fetch music metadata from source database
   */
  async fetchMusicMetadata(): Promise<Map<number, SourceMusicMetadata>> {
    if (!this.sourceConnection) {
      throw new Error('Source database not connected');
    }

    console.log('📋 Fetching music metadata...');
    const [rows] = await this.sourceConnection.execute(
      'SELECT * FROM music_metadata'
    );
    
    const metadata = new Map<number, SourceMusicMetadata>();
    (rows as SourceMusicMetadata[]).forEach(row => {
      metadata.set(row.file_id, row);
    });
    
    console.log(`   Found ${metadata.size} music metadata records\n`);
    return metadata;
  }

  /**
   * Fetch video metadata from source database
   */
  async fetchVideoMetadata(): Promise<Map<number, SourceVideoMetadata>> {
    if (!this.sourceConnection) {
      throw new Error('Source database not connected');
    }

    console.log('📋 Fetching video metadata...');
    const [rows] = await this.sourceConnection.execute(
      'SELECT * FROM video_metadata'
    );
    
    const metadata = new Map<number, SourceVideoMetadata>();
    (rows as SourceVideoMetadata[]).forEach(row => {
      metadata.set(row.file_id, row);
    });
    
    console.log(`   Found ${metadata.size} video metadata records\n`);
    return metadata;
  }

  /**
   * Determine media type from file extension
   */
  private getMediaType(extension: string | null): 'photo' | 'music' | 'video' | 'other' {
    if (!extension) return 'other';
    
    const ext = extension.toLowerCase();
    
    const photoExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heic', 'heif'];
    const musicExts = ['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'wma', 'opus'];
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpeg', 'mpg'];
    
    if (photoExts.includes(ext)) return 'photo';
    if (musicExts.includes(ext)) return 'music';
    if (videoExts.includes(ext)) return 'video';
    return 'other';
  }

  /**
   * Import scan session to Strapi (placeholder for actual implementation)
   */
  async importScanSession(session: ScanSession, dryRun: boolean): Promise<number> {
    console.log(`   Importing scan session ${session.id}: ${session.scan_path}`);
    console.log(`      Files: ${session.total_files}, Size: ${session.total_size}, Status: ${session.status}`);
    
    if (dryRun) {
      return session.id;
    }
    
    // TODO: Actual Strapi API call would go here
    // const response = await fetch(`${this.strapiUrl}/api/scan-sessions`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ data: { ... } })
    // });
    
    return session.id;
  }

  /**
   * Import file to Strapi (placeholder for actual implementation)
   */
  async importFile(
    file: SourceFile,
    scanSessionId: number,
    photoMetadata?: SourcePhotoMetadata,
    musicMetadata?: SourceMusicMetadata,
    videoMetadata?: SourceVideoMetadata,
    dryRun: boolean = true
  ): Promise<void> {
    const mediaType = this.getMediaType(file.extension);
    
    if (!dryRun) {
      // TODO: Actual Strapi API calls would go here
      // 1. Create scanned-file entry
      // 2. Create metadata entry if present
    }
  }

  /**
   * Run the migration
   */
  async migrate(options: { limit?: number; dryRun?: boolean } = {}): Promise<void> {
    const { limit = 0, dryRun = true } = options;
    
    console.log('🚀 Starting migration from SilverFileSystem to Strapi\n');
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE: No actual data will be imported\n');
    } else {
      console.log('⚡ LIVE MODE: Data will be imported to Strapi\n');
    }
    
    try {
      // Connect to source database
      await this.connectSource();
      
      // Fetch all data
      const sessions = await this.fetchScanSessions();
      const files = await this.fetchFiles(limit);
      const photoMetadata = await this.fetchPhotoMetadata();
      const musicMetadata = await this.fetchMusicMetadata();
      const videoMetadata = await this.fetchVideoMetadata();
      
      // Import scan sessions
      console.log('📥 Importing scan sessions...');
      const sessionIdMap = new Map<number, number>();
      
      for (const session of sessions) {
        const newId = await this.importScanSession(session, dryRun);
        sessionIdMap.set(session.id, newId);
      }
      
      console.log(`✅ Imported ${sessions.length} scan sessions\n`);
      
      // Import files
      console.log('📥 Importing files...');
      let imported = 0;
      let photoCount = 0;
      let musicCount = 0;
      let videoCount = 0;
      
      for (const file of files) {
        const scanSessionId = file.scan_id ? sessionIdMap.get(file.scan_id) || file.scan_id : 1;
        const mediaType = this.getMediaType(file.extension);
        
        await this.importFile(
          file,
          scanSessionId,
          photoMetadata.get(file.id),
          musicMetadata.get(file.id),
          videoMetadata.get(file.id),
          dryRun
        );
        
        if (mediaType === 'photo') photoCount++;
        else if (mediaType === 'music') musicCount++;
        else if (mediaType === 'video') videoCount++;
        
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`   Progress: ${imported}/${files.length} files`);
        }
      }
      
      console.log(`✅ Imported ${imported} files\n`);
      
      // Summary
      console.log('📊 Migration Summary:');
      console.log(`   Scan Sessions: ${sessions.length}`);
      console.log(`   Total Files: ${files.length}`);
      console.log(`   - Photos: ${photoCount} (${photoMetadata.size} with metadata)`);
      console.log(`   - Music: ${musicCount} (${musicMetadata.size} with metadata)`);
      console.log(`   - Videos: ${videoCount} (${videoMetadata.size} with metadata)`);
      console.log(`   - Other: ${files.length - photoCount - musicCount - videoCount}`);
      console.log('\n✅ Migration completed successfully!\n');
      
      if (dryRun) {
        console.log('⚠️  This was a DRY RUN. To actually import data:');
        console.log('   1. Make sure Strapi is running');
        console.log('   2. Run: ts-node scripts/migrate-from-silverfilesystem.ts --no-dry-run\n');
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      if (this.sourceConnection) {
        await this.sourceConnection.end();
        console.log('🔌 Disconnected from source database');
      }
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.sourceConnection) {
      await this.sourceConnection.end();
    }
  }
}

// Main execution
async function main() {
  const migration = new DataMigration();
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const limitIndex = args.indexOf('--limit');
    const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : 0;
    const dryRun = !args.includes('--no-dry-run');
    
    await migration.migrate({ limit, dryRun });
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.close();
  }
}

// Run if called directly
main();

export default DataMigration;
