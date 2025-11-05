import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::photo-metadata.photo-metadata', ({ strapi }) => ({
  /**
   * Get photo metadata with viewable file info
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity: any = await strapi.entityService.findOne('api::photo-metadata.photo-metadata', id, {
      populate: ['file'],
    });

    if (!entity) {
      return ctx.notFound('Photo metadata not found');
    }

    // Add viewable URL
    if (entity.file) {
      entity.viewUrl = `/api/media-ui/file/${entity.file.id}`;
    }

    return ctx.send({ data: entity });
  },

  /**
   * Viewer page for photo metadata
   */
  async viewer(ctx) {
    const { id } = ctx.params;

    const entity: any = await strapi.entityService.findOne('api::photo-metadata.photo-metadata', id, {
      populate: ['file'],
    });

    if (!entity) {
      return ctx.notFound('Photo metadata not found');
    }

    if (!entity.file) {
      return ctx.badRequest('No file associated with this metadata');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${entity.file.filename} - Photo Viewer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            min-height: 100vh;
        }

        .header {
            background: rgba(0, 0, 0, 0.8);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
        }

        .photo-title {
            font-size: 1.2rem;
            font-weight: 600;
        }

        .back-link {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            background: rgba(102, 126, 234, 0.8);
            border-radius: 8px;
            transition: background 0.3s;
        }

        .back-link:hover {
            background: rgba(102, 126, 234, 1);
        }

        .viewer-container {
            display: flex;
            height: calc(100vh - 80px);
        }

        .photo-view {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: #0f0f0f;
        }

        .photo-img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .metadata-panel {
            width: 350px;
            background: #2a2a2a;
            padding: 2rem;
            overflow-y: auto;
        }

        .metadata-section {
            margin-bottom: 2rem;
        }

        .metadata-section h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #667eea;
        }

        .metadata-row {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metadata-row:last-child {
            border-bottom: none;
        }

        .metadata-label {
            opacity: 0.7;
            font-size: 0.9rem;
        }

        .metadata-value {
            font-weight: 500;
            text-align: right;
            max-width: 60%;
            overflow-wrap: break-word;
        }

        @media (max-width: 768px) {
            .viewer-container {
                flex-direction: column;
            }

            .metadata-panel {
                width: 100%;
                max-height: 40vh;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="photo-title">📷 ${entity.file.filename}</div>
        <a href="/admin/content-manager/collection-types/api::photo-metadata.photo-metadata/${id}" class="back-link">← Back to Admin</a>
    </div>

    <div class="viewer-container">
        <div class="photo-view">
            <img class="photo-img" src="/api/media-ui/file/${entity.file.id}" alt="${entity.file.filename}">
        </div>

        <div class="metadata-panel">
            <div class="metadata-section">
                <h3>Image Info</h3>
                ${entity.width && entity.height ? `<div class="metadata-row"><span class="metadata-label">Dimensions:</span><span class="metadata-value">${entity.width} × ${entity.height}</span></div>` : ''}
                ${entity.file.size ? `<div class="metadata-row"><span class="metadata-label">File Size:</span><span class="metadata-value">${formatFileSize(entity.file.size)}</span></div>` : ''}
                ${entity.dateTaken ? `<div class="metadata-row"><span class="metadata-label">Date Taken:</span><span class="metadata-value">${new Date(entity.dateTaken).toLocaleString()}</span></div>` : ''}
            </div>

            ${entity.cameraMake || entity.cameraModel ? `
            <div class="metadata-section">
                <h3>Camera</h3>
                ${entity.cameraMake ? `<div class="metadata-row"><span class="metadata-label">Make:</span><span class="metadata-value">${entity.cameraMake}</span></div>` : ''}
                ${entity.cameraModel ? `<div class="metadata-row"><span class="metadata-label">Model:</span><span class="metadata-value">${entity.cameraModel}</span></div>` : ''}
                ${entity.lens ? `<div class="metadata-row"><span class="metadata-label">Lens:</span><span class="metadata-value">${entity.lens}</span></div>` : ''}
            </div>
            ` : ''}

            ${entity.iso || entity.aperture || entity.shutterSpeed || entity.focalLength ? `
            <div class="metadata-section">
                <h3>Exposure</h3>
                ${entity.iso ? `<div class="metadata-row"><span class="metadata-label">ISO:</span><span class="metadata-value">${entity.iso}</span></div>` : ''}
                ${entity.aperture ? `<div class="metadata-row"><span class="metadata-label">Aperture:</span><span class="metadata-value">f/${entity.aperture}</span></div>` : ''}
                ${entity.shutterSpeed ? `<div class="metadata-row"><span class="metadata-label">Shutter Speed:</span><span class="metadata-value">${entity.shutterSpeed}</span></div>` : ''}
                ${entity.focalLength ? `<div class="metadata-row"><span class="metadata-label">Focal Length:</span><span class="metadata-value">${entity.focalLength}mm</span></div>` : ''}
                ${typeof entity.flash === 'boolean' ? `<div class="metadata-row"><span class="metadata-label">Flash:</span><span class="metadata-value">${entity.flash ? 'Yes' : 'No'}</span></div>` : ''}
            </div>
            ` : ''}

            ${entity.latitude || entity.longitude ? `
            <div class="metadata-section">
                <h3>Location</h3>
                ${entity.latitude ? `<div class="metadata-row"><span class="metadata-label">Latitude:</span><span class="metadata-value">${entity.latitude.toFixed(6)}</span></div>` : ''}
                ${entity.longitude ? `<div class="metadata-row"><span class="metadata-label">Longitude:</span><span class="metadata-value">${entity.longitude.toFixed(6)}</span></div>` : ''}
                ${entity.altitude ? `<div class="metadata-row"><span class="metadata-label">Altitude:</span><span class="metadata-value">${entity.altitude.toFixed(2)}m</span></div>` : ''}
                ${entity.latitude && entity.longitude ? `
                <div class="metadata-row">
                    <span class="metadata-label">Map:</span>
                    <span class="metadata-value">
                        <a href="https://www.google.com/maps?q=${entity.latitude},${entity.longitude}" target="_blank" style="color: #667eea; text-decoration: none;">View on Map</a>
                    </span>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${entity.software || entity.artist || entity.copyright ? `
            <div class="metadata-section">
                <h3>Other</h3>
                ${entity.software ? `<div class="metadata-row"><span class="metadata-label">Software:</span><span class="metadata-value">${entity.software}</span></div>` : ''}
                ${entity.artist ? `<div class="metadata-row"><span class="metadata-label">Artist:</span><span class="metadata-value">${entity.artist}</span></div>` : ''}
                ${entity.copyright ? `<div class="metadata-row"><span class="metadata-label">Copyright:</span><span class="metadata-value">${entity.copyright}</span></div>` : ''}
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

    ctx.type = 'html';
    ctx.body = html;
  },
}));

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
