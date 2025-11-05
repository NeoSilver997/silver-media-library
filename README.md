# Silver Media Library

A powerful media management system built with Strapi.io for scanning, organizing, and managing files across your network. This is a rewrite of [SilverFileSystem](https://github.com/NeoSilver997/SilverFileSystem) using the Strapi headless CMS framework.

## Features

- 🔍 **File Scanning** - Scan directories and store file information in database
- 📁 **Duplicate Detection** - Find duplicate files by comparing content hashes
- 📷 **Photo Metadata** - Extract EXIF data from photos (camera, GPS, settings)
- 🎵 **Music Metadata** - Extract ID3 tags from music files (artist, album, bitrate)
- 🎬 **Video Metadata** - Extract video properties (codec, resolution, duration)
- 🖼️ **Photo Library UI** - Beautiful web interface for browsing photos
- 🎵 **Music Player UI** - Interactive music player with metadata display
- 🎬 **Video Player UI** - Video player with streaming support
- 🖥️ **Admin Panel** - Built-in Strapi admin interface for managing files
- 🔌 **REST API** - Full REST API for programmatic access
- 🔐 **User Authentication** - Built-in user management and permissions
- 💾 **Database Support** - SQLite (default), MySQL, PostgreSQL support

## Installation

### Prerequisites

- Node.js 18.x or 20.x
- npm 6.x or higher

### Install

```bash
git clone https://github.com/NeoSilver997/silver-media-library.git
cd silver-media-library
npm install
```

## Quick Start

### 1. Start the Development Server

```bash
npm run develop
```

This will start Strapi in development mode with auto-reload enabled.

On first run, you'll be prompted to create an admin user. Open your browser to `http://localhost:1337/admin` and complete the registration.

### 2. Scan Files via API

Once the server is running, you can use the REST API to scan directories:

```bash
# Start a scan
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/path/to/your/media",
    "extractMetadata": true
  }'

# Find duplicates
curl -X POST http://localhost:1337/api/scanner/find-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 0,
    "calculateHashes": true
  }'

# Get scan sessions
curl http://localhost:1337/api/scanner/sessions

# Get specific session with files
curl http://localhost:1337/api/scanner/sessions/1
```

### 3. Browse Media in Web UIs

After logging in to the admin panel, access the media UIs:

- **Photo Library**: `http://localhost:1337/api/media-ui/photos`
- **Music Player**: `http://localhost:1337/api/media-ui/music`
- **Video Player**: `http://localhost:1337/api/media-ui/videos`

Or use the **Admin Panel** at `http://localhost:1337/admin` to:
- View scanned files
- Browse media metadata
- Check duplicate groups
- Manage scan sessions

## Content Types

The system includes the following content types:

### Scanned File
Stores information about scanned files including path, size, hash, and metadata relationships.

### Scan Session
Tracks file scanning operations with statistics and status.

### Photo Metadata
EXIF data for photos including camera info, settings, GPS coordinates.

### Music Metadata
ID3 tags for music files including artist, album, bitrate, sample rate.

### Video Metadata
Video properties including codec, resolution, frame rate, audio info.

### Duplicate Group
Groups of duplicate files with wasted space calculations.

## API Endpoints

### Scanner API

- `POST /api/scanner/scan` - Start a directory scan
- `POST /api/scanner/find-duplicates` - Find duplicate files
- `GET /api/scanner/sessions` - List all scan sessions
- `GET /api/scanner/sessions/:id` - Get session details

### Content API

All content types are available via Strapi's REST API:

- `/api/scanned-files` - Manage scanned files
- `/api/scan-sessions` - Manage scan sessions
- `/api/photo-metadata` - Access photo metadata
- `/api/music-metadata` - Access music metadata
- `/api/video-metadata` - Access video metadata
- `/api/duplicate-groups` - View duplicate groups

## Configuration

### Database

By default, Strapi uses SQLite. To use MySQL or PostgreSQL, update `config/database.ts`:

```typescript
// MySQL example
export default ({ env }) => ({
  connection: {
    client: 'mysql2',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME', 'silver_media'),
      user: env('DATABASE_USERNAME', 'root'),
      password: env('DATABASE_PASSWORD', ''),
    },
  },
});
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret
```

## Development

### Build Admin Panel

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### TypeScript

This project uses TypeScript. Run type checking:

```bash
npm run strapi ts:generate-types
```

## Supported Media Types

### Photos
JPG, PNG, GIF, BMP, TIFF, WebP, HEIC, HEIF

### Music
MP3, FLAC, WAV, AAC, M4A, OGG, WMA, Opus

### Videos
MP4, MKV, AVI, MOV, WMV, FLV, WebM, M4V, MPEG

## Original Project

This is a rewrite of [SilverFileSystem](https://github.com/NeoSilver997/SilverFileSystem) using Strapi.io framework, providing:
- Better structure and maintainability
- Built-in admin panel
- REST API out of the box
- User authentication and permissions
- Extensible plugin architecture

## Learn More About Strapi

- [Resource center](https://strapi.io/resource-center) - Strapi resource center
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation
- [Strapi tutorials](https://strapi.io/tutorials) - Tutorials by the community
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog

## License

ISC

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
