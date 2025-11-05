import { factories } from '@strapi/strapi';
import { FileScanner } from '../../../services/file-scanner';
import { MediaMetadataExtractor } from '../../../services/media-extractor';
import path from 'path';

export default factories.createCoreController('api::scanned-file.scanned-file', ({ strapi }) => ({
  /**
   * Scan a directory and store files in database
   */
  async scan(ctx) {
    try {
      const { scanPath, extractMetadata = false } = ctx.request.body;

      if (!scanPath) {
        return ctx.badRequest('scanPath is required');
      }

      // Create scan session
      const session = await strapi.entityService.create('api::scan-session.scan-session', {
        data: {
          scanPath,
          startTime: new Date(),
          status: 'running',
        },
      });

      // Start scanning in background
      ctx.send({
        message: 'Scan started',
        sessionId: session.id,
        scanPath,
      });

      // Perform scan asynchronously
      (async () => {
        try {
          const scanner = new FileScanner();
          const files = await scanner.scanDirectory(scanPath);

          let totalSize = 0;
          const mediaExtractor = extractMetadata ? new MediaMetadataExtractor() : null;

          // Store files in batches
          for (const file of files) {
            totalSize += file.size;

            const extension = path.extname(file.name).toLowerCase().slice(1);
            let mediaType: 'photo' | 'music' | 'video' | 'other' = 'other';

            if (mediaExtractor) {
              if (mediaExtractor.isImage(file.name)) {
                mediaType = 'photo';
              } else if (mediaExtractor.isAudio(file.name)) {
                mediaType = 'music';
              } else if (mediaExtractor.isVideo(file.name)) {
                mediaType = 'video';
              }
            }

            // Create scanned file entry
            const scannedFile = await strapi.entityService.create('api::scanned-file.scanned-file', {
              data: {
                path: file.path,
                filename: file.name,
                extension,
                size: file.size.toString(),
                modifiedTime: file.mtime,
                createdTime: file.ctime,
                mediaType,
                scanSession: session.id,
              },
            });

            // Extract and store metadata if requested
            if (extractMetadata && mediaType !== 'other') {
              try {
                const metadata = await mediaExtractor!.extractMetadata(file.path);
                if (metadata && metadata.metadata) {
                  if (metadata.type === 'photo') {
                    await strapi.entityService.create('api::photo-metadata.photo-metadata', {
                      data: {
                        file: scannedFile.id,
                        ...metadata.metadata,
                      },
                    });
                  } else if (metadata.type === 'music') {
                    await strapi.entityService.create('api::music-metadata.music-metadata', {
                      data: {
                        file: scannedFile.id,
                        ...metadata.metadata,
                      },
                    });
                  } else if (metadata.type === 'video') {
                    await strapi.entityService.create('api::video-metadata.video-metadata', {
                      data: {
                        file: scannedFile.id,
                        ...metadata.metadata,
                      },
                    });
                  }
                }
              } catch (err) {
                console.error(`Failed to extract metadata for ${file.path}:`, err);
              }
            }
          }

          // Cleanup media extractor
          if (mediaExtractor) {
            await mediaExtractor.cleanup();
          }

          // Update scan session
          await strapi.entityService.update('api::scan-session.scan-session', session.id, {
            data: {
              endTime: new Date(),
              status: 'completed',
              filesScanned: files.length,
              totalSize: totalSize.toString(),
            },
          });

          console.log(`Scan completed: ${files.length} files, ${totalSize} bytes`);
        } catch (error) {
          console.error('Scan error:', error);
          await strapi.entityService.update('api::scan-session.scan-session', session.id, {
            data: {
              endTime: new Date(),
              status: 'failed',
              errorMessage: error.message,
            },
          });
        }
      })();
    } catch (error) {
      console.error('Error starting scan:', error);
      return ctx.internalServerError('Failed to start scan');
    }
  },

  /**
   * Find duplicate files based on hash
   */
  async findDuplicates(ctx) {
    try {
      const { minSize = 0, calculateHashes = true } = ctx.request.body;

      // If calculateHashes is true, calculate hashes for files
      if (calculateHashes) {
        const files = await strapi.entityService.findMany('api::scanned-file.scanned-file', {
          filters: {
            size: { $gte: minSize },
            hash: { $null: true },
          },
          limit: -1,
        });

        const scanner = new FileScanner();
        
        for (const file of files) {
          try {
            const hash = await scanner.calculateHash(file.path);
            await strapi.entityService.update('api::scanned-file.scanned-file', file.id, {
              data: { hash } as any,
            });
          } catch (err) {
            console.error(`Failed to hash ${file.path}:`, err);
          }
        }
      }

      // Find files with same hash and size
      const allFiles = await strapi.entityService.findMany('api::scanned-file.scanned-file', {
        filters: {
          hash: { $notNull: true },
          size: { $gte: minSize },
        },
        limit: -1,
      });

      // Group by hash
      const hashGroups = new Map();
      for (const file of allFiles) {
        if (!hashGroups.has(file.hash)) {
          hashGroups.set(file.hash, []);
        }
        hashGroups.get(file.hash).push(file);
      }

      // Find duplicates (groups with more than 1 file)
      const duplicates = [];
      for (const [hash, files] of hashGroups) {
        if (files.length > 1) {
          const fileSize = parseInt(files[0].size);
          const wastedSpace = (files.length - 1) * fileSize;

          // Create or update duplicate group
          const existingGroup = await strapi.entityService.findMany('api::duplicate-group.duplicate-group', {
            filters: { hash },
            limit: 1,
          });

          let group;
          if (existingGroup.length > 0) {
            group = await strapi.entityService.update('api::duplicate-group.duplicate-group', existingGroup[0].id, {
              data: {
                fileSize: fileSize.toString(),
                fileCount: files.length,
                wastedSpace: wastedSpace.toString(),
              } as any,
            });
          } else {
            group = await strapi.entityService.create('api::duplicate-group.duplicate-group', {
              data: {
                hash,
                fileSize: fileSize.toString(),
                fileCount: files.length,
                wastedSpace: wastedSpace.toString(),
              } as any,
            });
          }

          // Update files with duplicate group
          for (const file of files) {
            await strapi.entityService.update('api::scanned-file.scanned-file', file.id, {
              data: { duplicateGroup: group.id } as any,
            });
          }

          duplicates.push({
            hash,
            fileSize,
            fileCount: files.length,
            wastedSpace,
            files: files.map(f => ({ id: f.id, path: f.path, size: f.size })),
          });
        }
      }

      return ctx.send({
        duplicatesFound: duplicates.length,
        totalWastedSpace: duplicates.reduce((sum, d) => sum + d.wastedSpace, 0),
        duplicates,
      });
    } catch (error) {
      console.error('Error finding duplicates:', error);
      return ctx.internalServerError('Failed to find duplicates');
    }
  },

  /**
   * Get all scan sessions
   */
  async getSessions(ctx) {
    try {
      const sessions = await strapi.entityService.findMany('api::scan-session.scan-session', {
        sort: { startTime: 'desc' },
        populate: ['scannedFiles'],
      });

      return ctx.send(sessions);
    } catch (error) {
      console.error('Error getting sessions:', error);
      return ctx.internalServerError('Failed to get sessions');
    }
  },

  /**
   * Get a specific scan session
   */
  async getSession(ctx) {
    try {
      const { id } = ctx.params;

      const session = await strapi.entityService.findOne('api::scan-session.scan-session', id, {
        populate: {
          scannedFiles: {
            populate: ['photoMetadata', 'musicMetadata', 'videoMetadata', 'duplicateGroup'],
          },
        },
      });

      if (!session) {
        return ctx.notFound('Session not found');
      }

      return ctx.send(session);
    } catch (error) {
      console.error('Error getting session:', error);
      return ctx.internalServerError('Failed to get session');
    }
  },
}));
