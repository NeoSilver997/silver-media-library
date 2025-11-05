# Quick Start Guide

This guide will help you get started with Silver Media Library.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/NeoSilver997/silver-media-library.git
cd silver-media-library
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env to customize settings
```

## Starting the Server

### Development Mode (with auto-reload)
```bash
npm run develop
```

This will start the server on `http://localhost:1337`

On first run, you'll be redirected to `http://localhost:1337/admin/auth/register-admin` to create your admin account.

## Using the System

### 1. Create Admin Account

Navigate to `http://localhost:1337/admin` and create your admin account on first run.

### 2. Scan a Directory

Use the REST API to scan directories:

```bash
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/path/to/your/files",
    "extractMetadata": true
  }'
```

Response:
```json
{
  "message": "Scan started",
  "sessionId": 1,
  "scanPath": "/path/to/your/files"
}
```

The scan runs asynchronously. You can check its status using the session ID.

### 3. Check Scan Progress

```bash
curl http://localhost:1337/api/scanner/sessions/1
```

### 4. View All Scan Sessions

```bash
curl http://localhost:1337/api/scanner/sessions
```

### 5. Find Duplicates

After scanning, find duplicate files:

```bash
curl -X POST http://localhost:1337/api/scanner/find-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 1048576,
    "calculateHashes": true
  }'
```

This will:
- Calculate hashes for files without them
- Group files by hash
- Report duplicate groups with wasted space

### 6. Browse in Admin Panel

Navigate to `http://localhost:1337/admin` to:

- **Scanned Files** - View all scanned files with metadata
- **Scan Sessions** - View scan history and statistics
- **Photo Metadata** - Browse photo EXIF data
- **Music Metadata** - Browse music ID3 tags
- **Video Metadata** - Browse video properties
- **Duplicate Groups** - View duplicate file groups

## Example Workflows

### Scan Photos and Browse by Camera

1. Scan your photos directory:
```bash
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/home/user/Photos",
    "extractMetadata": true
  }'
```

2. In the admin panel, go to "Photo Metadatas" and filter by camera make/model

### Find Duplicate Videos

1. Scan your videos:
```bash
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/home/user/Videos",
    "extractMetadata": false
  }'
```

2. Find duplicates (only large files):
```bash
curl -X POST http://localhost:1337/api/scanner/find-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 10485760,
    "calculateHashes": true
  }'
```

3. View duplicate groups in the admin panel

### Browse Music Library

1. Scan your music:
```bash
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/home/user/Music",
    "extractMetadata": true
  }'
```

2. In the admin panel, go to "Music Metadatas" and browse by artist/album

## Using MySQL Database

By default, SQLite is used. To use MySQL:

1. Create a MySQL database:
```sql
CREATE DATABASE silver_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Update your `.env` file:
```env
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=silver_media
DATABASE_USERNAME=root
DATABASE_PASSWORD=yourpassword
```

3. Restart the server:
```bash
npm run develop
```

Strapi will automatically create the tables on first run.

## Tips

- **Large Directories**: For very large directories, the scan runs asynchronously. Check the session status periodically.
- **Metadata Extraction**: Set `extractMetadata: true` only when you need detailed media information. It's slower but provides rich data.
- **Duplicate Detection**: For large file sets, hash calculation can take time. Consider using `minSize` to filter small files.
- **Admin Panel**: The admin panel provides powerful filtering and sorting capabilities. Use it to explore your media collection.

## Troubleshooting

### Port Already in Use

If port 1337 is already in use, change it in `.env`:
```env
PORT=3000
```

### Permission Denied Errors

Make sure the scan paths are readable by the user running the Strapi server.

### Out of Memory

For very large directories, you may need to increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run develop
```

## Next Steps

- Explore the [README.md](README.md) for detailed API documentation
- Check the admin panel to understand the data model
- Customize content types if needed
- Set up user roles and permissions for multi-user access
