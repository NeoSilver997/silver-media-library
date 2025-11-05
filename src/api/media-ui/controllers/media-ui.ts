import { factories } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';

export default factories.createCoreController('api::scanned-file.scanned-file', ({ strapi }) => ({
  /**
   * Serve photos UI page
   */
  async photosPage(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.redirect('/admin/auth/login');
      }

      // Generate HTML for photos page
      const html = await strapi.service('api::media-ui.media-ui').generatePhotosHTML();
      ctx.type = 'html';
      ctx.body = html;
    } catch (error) {
      console.error('Error serving photos page:', error);
      return ctx.internalServerError('Failed to load photos page');
    }
  },

  /**
   * Serve music UI page
   */
  async musicPage(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.redirect('/admin/auth/login');
      }

      // Generate HTML for music page
      const html = await strapi.service('api::media-ui.media-ui').generateMusicHTML();
      ctx.type = 'html';
      ctx.body = html;
    } catch (error) {
      console.error('Error serving music page:', error);
      return ctx.internalServerError('Failed to load music page');
    }
  },

  /**
   * Serve videos UI page
   */
  async videosPage(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.redirect('/admin/auth/login');
      }

      // Generate HTML for videos page
      const html = await strapi.service('api::media-ui.media-ui').generateVideosHTML();
      ctx.type = 'html';
      ctx.body = html;
    } catch (error) {
      console.error('Error serving videos page:', error);
      return ctx.internalServerError('Failed to load videos page');
    }
  },

  /**
   * Get photos data
   */
  async getPhotos(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const { search, camera, year, month, limit = 100, offset = 0 } = ctx.query;

      const filters: any = {
        mediaType: 'photo',
      };

      // Build query
      const query: any = {
        filters,
        populate: ['photoMetadata'],
        limit: parseInt(limit as string),
        start: parseInt(offset as string),
        sort: { createdTime: 'desc' },
      };

      // Add search filter
      if (search) {
        query.filters.$or = [
          { filename: { $containsi: search } },
          { path: { $containsi: search } },
        ];
      }

      const photos = await strapi.entityService.findMany('api::scanned-file.scanned-file', query);

      // Filter by camera or date if metadata is present
      let filteredPhotos = photos;
      if (camera || year || month) {
        filteredPhotos = photos.filter((photo: any) => {
          if (!photo.photoMetadata) return false;
          if (camera && photo.photoMetadata.cameraMake && !photo.photoMetadata.cameraMake.includes(camera)) {
            return false;
          }
          if (year && photo.photoMetadata.dateTaken) {
            const photoYear = new Date(photo.photoMetadata.dateTaken).getFullYear();
            if (photoYear !== parseInt(year)) return false;
          }
          if (month && photo.photoMetadata.dateTaken) {
            const photoMonth = new Date(photo.photoMetadata.dateTaken).getMonth() + 1;
            if (photoMonth !== parseInt(month)) return false;
          }
          return true;
        });
      }

      return ctx.send({
        data: filteredPhotos,
        meta: {
          total: filteredPhotos.length,
        },
      });
    } catch (error) {
      console.error('Error fetching photos:', error);
      return ctx.internalServerError('Failed to fetch photos');
    }
  },

  /**
   * Get music data
   */
  async getMusic(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const { search, artist, album, genre, limit = 100, offset = 0 } = ctx.query;

      const filters: any = {
        mediaType: 'music',
      };

      const query: any = {
        filters,
        populate: ['musicMetadata'],
        limit: parseInt(limit as string),
        start: parseInt(offset as string),
        sort: { createdTime: 'desc' },
      };

      if (search) {
        query.filters.$or = [
          { filename: { $containsi: search } },
          { path: { $containsi: search } },
        ];
      }

      const music = await strapi.entityService.findMany('api::scanned-file.scanned-file', query);

      // Filter by metadata if present
      let filteredMusic = music;
      if (artist || album || genre) {
        filteredMusic = music.filter((track: any) => {
          if (!track.musicMetadata) return false;
          if (artist && track.musicMetadata.artist && !track.musicMetadata.artist.toLowerCase().includes(artist.toLowerCase())) {
            return false;
          }
          if (album && track.musicMetadata.album && !track.musicMetadata.album.toLowerCase().includes(album.toLowerCase())) {
            return false;
          }
          if (genre && track.musicMetadata.genre && !track.musicMetadata.genre.toLowerCase().includes(genre.toLowerCase())) {
            return false;
          }
          return true;
        });
      }

      return ctx.send({
        data: filteredMusic,
        meta: {
          total: filteredMusic.length,
        },
      });
    } catch (error) {
      console.error('Error fetching music:', error);
      return ctx.internalServerError('Failed to fetch music');
    }
  },

  /**
   * Get videos data
   */
  async getVideos(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const { search, resolution, limit = 100, offset = 0 } = ctx.query;

      const filters: any = {
        mediaType: 'video',
      };

      const query: any = {
        filters,
        populate: ['videoMetadata'],
        limit: parseInt(limit as string),
        start: parseInt(offset as string),
        sort: { createdTime: 'desc' },
      };

      if (search) {
        query.filters.$or = [
          { filename: { $containsi: search } },
          { path: { $containsi: search } },
        ];
      }

      const videos = await strapi.entityService.findMany('api::scanned-file.scanned-file', query);

      // Filter by resolution if present
      let filteredVideos = videos;
      if (resolution) {
        filteredVideos = videos.filter((video: any) => {
          if (!video.videoMetadata) return false;
          const videoRes = `${video.videoMetadata.width}x${video.videoMetadata.height}`;
          return videoRes === resolution;
        });
      }

      return ctx.send({
        data: filteredVideos,
        meta: {
          total: filteredVideos.length,
        },
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      return ctx.internalServerError('Failed to fetch videos');
    }
  },

  /**
   * Serve media file
   */
  async serveFile(ctx) {
    try {
      // Check if user is authenticated
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const { id } = ctx.params;

      const file = await strapi.entityService.findOne('api::scanned-file.scanned-file', id);

      if (!file) {
        return ctx.notFound('File not found');
      }

      // Check if file exists on filesystem
      if (!fs.existsSync(file.path)) {
        return ctx.notFound('File not found on filesystem');
      }

      // Get file stats for content length
      const stat = fs.statSync(file.path);

      // Set appropriate headers
      ctx.set('Content-Type', this.getMimeType(file.extension));
      ctx.set('Content-Length', stat.size.toString());
      ctx.set('Accept-Ranges', 'bytes');

      // Handle range requests for video/audio streaming
      const range = ctx.request.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;

        ctx.status = 206;
        ctx.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        ctx.set('Content-Length', chunksize.toString());

        ctx.body = createReadStream(file.path, { start, end });
      } else {
        ctx.body = createReadStream(file.path);
      }
    } catch (error) {
      console.error('Error serving file:', error);
      return ctx.internalServerError('Failed to serve file');
    }
  },

  /**
   * Get MIME type from extension
   */
  getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
      // Audio
      mp3: 'audio/mpeg',
      flac: 'audio/flac',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
      // Video
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      webm: 'video/webm',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  },
}));
