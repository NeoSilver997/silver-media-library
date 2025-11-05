import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::music-metadata.music-metadata', ({ strapi }) => ({
  /**
   * Get music metadata with playable file info
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity: any = await strapi.entityService.findOne('api::music-metadata.music-metadata', id, {
      populate: ['file'],
    });

    if (!entity) {
      return ctx.notFound('Music metadata not found');
    }

    // Add playable URL
    if (entity.file) {
      entity.playUrl = `/api/media-ui/file/${entity.file.id}`;
    }

    return ctx.send({ data: entity });
  },

  /**
   * Player page for music metadata
   */
  async player(ctx) {
    const { id } = ctx.params;

    const entity: any = await strapi.entityService.findOne('api::music-metadata.music-metadata', id, {
      populate: ['file'],
    });

    if (!entity) {
      return ctx.notFound('Music metadata not found');
    }

    if (!entity.file) {
      return ctx.badRequest('No file associated with this metadata');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${entity.title || entity.file.filename} - Music Player</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .player-container {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 20px;
            padding: 3rem;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .album-art {
            width: 100%;
            aspect-ratio: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8rem;
            margin-bottom: 2rem;
        }

        .track-info {
            text-align: center;
            margin-bottom: 2rem;
        }

        .track-title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .track-artist {
            font-size: 1.2rem;
            opacity: 0.8;
            margin-bottom: 0.25rem;
        }

        .track-album {
            font-size: 1rem;
            opacity: 0.6;
        }

        .metadata {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }

        .metadata-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metadata-row:last-child {
            border-bottom: none;
        }

        .metadata-label {
            opacity: 0.7;
        }

        audio {
            width: 100%;
            margin-bottom: 1rem;
        }

        .back-link {
            display: inline-block;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            transition: background 0.3s;
        }

        .back-link:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="album-art">🎵</div>
        
        <div class="track-info">
            <div class="track-title">${entity.title || entity.file.filename}</div>
            <div class="track-artist">${entity.artist || 'Unknown Artist'}</div>
            <div class="track-album">${entity.album || ''}</div>
        </div>

        <audio controls autoplay>
            <source src="/api/media-ui/file/${entity.file.id}" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>

        <div class="metadata">
            ${entity.year ? `<div class="metadata-row"><span class="metadata-label">Year:</span><span>${entity.year}</span></div>` : ''}
            ${entity.genre ? `<div class="metadata-row"><span class="metadata-label">Genre:</span><span>${entity.genre}</span></div>` : ''}
            ${entity.duration ? `<div class="metadata-row"><span class="metadata-label">Duration:</span><span>${formatDuration(entity.duration)}</span></div>` : ''}
            ${entity.bitrate ? `<div class="metadata-row"><span class="metadata-label">Bitrate:</span><span>${Math.round(entity.bitrate / 1000)} kbps</span></div>` : ''}
            ${entity.sampleRate ? `<div class="metadata-row"><span class="metadata-label">Sample Rate:</span><span>${entity.sampleRate} Hz</span></div>` : ''}
            ${entity.codec ? `<div class="metadata-row"><span class="metadata-label">Codec:</span><span>${entity.codec}</span></div>` : ''}
        </div>

        <a href="/admin/content-manager/collection-types/api::music-metadata.music-metadata/${id}" class="back-link">← Back to Admin</a>
    </div>

    <script>
        function formatDuration(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + secs.toString().padStart(2, '0');
        }
    </script>
</body>
</html>`;

    ctx.type = 'html';
    ctx.body = html;
  },
}));

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
