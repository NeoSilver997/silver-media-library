# Migration Guide: SilverFileSystem to Silver Media Library

This guide helps users transition from the original [SilverFileSystem](https://github.com/NeoSilver997/SilverFileSystem) to the new Strapi-based Silver Media Library.

## What Changed?

### Architecture

**Before (SilverFileSystem):**
- Custom Node.js CLI application
- Express.js web server
- Custom REST API implementation
- Manual authentication with JWT
- Custom HTML UIs for photo/music/video browsers

**After (Silver Media Library):**
- Strapi headless CMS framework
- Built-in admin panel
- Auto-generated REST API
- Built-in authentication and permissions
- Strapi admin UI for content management

### Key Improvements

1. **Admin Interface**: No need for custom UIs - use Strapi's powerful admin panel
2. **API Management**: REST API automatically generated from content types
3. **Authentication**: Built-in user management and role-based permissions
4. **Extensibility**: Plugin architecture for easy customization
5. **Database Support**: Native support for SQLite, MySQL, PostgreSQL
6. **Type Safety**: Full TypeScript support with auto-generated types

## Feature Comparison

| Feature | SilverFileSystem | Silver Media Library |
|---------|------------------|---------------------|
| File Scanning | ✅ CLI command | ✅ REST API endpoint |
| Duplicate Detection | ✅ CLI command | ✅ REST API endpoint |
| Media Metadata | ✅ EXIF, ID3, video | ✅ EXIF, ID3, video |
| Database Storage | ✅ MySQL | ✅ SQLite, MySQL, PostgreSQL |
| Web UI | ✅ Custom HTML | ✅ Strapi Admin Panel |
| REST API | ✅ Custom Express | ✅ Auto-generated |
| Authentication | ✅ JWT + OAuth | ✅ Built-in + OAuth |
| User Roles | ✅ Custom | ✅ Built-in RBAC |
| GraphQL API | ❌ | ✅ Available |
| Plugins | ❌ | ✅ Strapi ecosystem |

## Command Mapping

### Scanning Files

**Before:**
```bash
node bin/cli.js scan /path/to/media --db --extract-media
```

**After:**
```bash
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/path/to/media",
    "extractMetadata": true
  }'
```

### Finding Duplicates

**Before:**
```bash
node bin/cli.js duplicates /path/to/folder -m 1048576
```

**After:**
```bash
curl -X POST http://localhost:1337/api/scanner/find-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 1048576,
    "calculateHashes": true
  }'
```

### Viewing Scan Sessions

**Before:**
- Query database directly
- No built-in UI

**After:**
```bash
# API
curl http://localhost:1337/api/scanner/sessions

# Or use the admin panel
# http://localhost:1337/admin -> Scan Sessions
```

### Browsing Media

**Before:**
- Start web server: `npm run server`
- Visit custom UIs at `http://localhost:3000`

**After:**
- Access admin panel: `http://localhost:1337/admin`
- Navigate to Photo Metadatas, Music Metadatas, or Video Metadatas
- Use built-in filters, search, and sorting

## Database Migration

If you have existing data in SilverFileSystem's MySQL database, you have several options:

### Option 1: Automated Migration Script (Recommended)

Use the provided migration script to automatically transfer data. See [DATA_MIGRATION.md](DATA_MIGRATION.md) for complete instructions.

**Quick start:**
```bash
# Configure source database
SOURCE_DB_HOST=localhost \
SOURCE_DB_USER=root \
SOURCE_DB_PASSWORD=password \
SOURCE_DB_NAME=silverfilesystem \
npm run migrate-data-dry

# Run actual migration
npm run migrate-data --no-dry-run
```

The script will migrate:
- ✅ All scanned files
- ✅ Scan session history
- ✅ Photo metadata (EXIF data)
- ✅ Music metadata (ID3 tags)
- ✅ Video metadata
- ✅ File hashes for duplicate detection

### Option 2: Re-scan (Simplest)

The easiest approach is to re-scan your directories with the new system:

1. Start Silver Media Library
2. Use the scan API to scan your directories
3. The system will extract all metadata fresh

**Advantages:** Fresh metadata, validates files exist, no compatibility issues  
**Disadvantages:** Loses scan history, takes time for large collections

### Option 3: Manual Migration

If you need custom migration logic, you can write your own script:

```javascript
// Example migration script (customize as needed)
import mysql from 'mysql2/promise';
import { factories } from '@strapi/strapi';

async function migrate() {
  // Connect to old database
  const oldDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'silverfilesystem'
  });

  // Get files from old database
  const [files] = await oldDb.query('SELECT * FROM scanned_files');

  // Create in Strapi
  for (const file of files) {
    await strapi.entityService.create('api::scanned-file.scanned-file', {
      data: {
        path: file.path,
        filename: file.filename,
        size: file.size.toString(),
        hash: file.hash,
        // ... map other fields
      }
    });
  }

  await oldDb.end();
}
```

## Configuration Changes

### Environment Variables

**Before (.env):**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=silverfilesystem
```

**After (.env):**
```env
DATABASE_CLIENT=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=silver_media
DATABASE_USERNAME=root
DATABASE_PASSWORD=yourpassword

# Plus Strapi-specific vars
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-jwt-secret
```

## API Changes

### REST Endpoints

**Before:**
- `GET /api/photos` - List photos
- `GET /api/music` - List music
- `GET /api/videos` - List videos
- `GET /api/stats` - Get statistics

**After:**
- `GET /api/scanned-files` - List all files (with filters)
- `GET /api/photo-metadatas` - List photo metadata
- `GET /api/music-metadatas` - List music metadata
- `GET /api/video-metadatas` - List video metadata
- `GET /api/scan-sessions` - List scan sessions
- `POST /api/scanner/scan` - Start scan
- `POST /api/scanner/find-duplicates` - Find duplicates

### API Filters

Strapi provides powerful filtering out of the box:

```bash
# Filter photos by camera
GET /api/photo-metadatas?filters[cameraMake][$eq]=Canon

# Filter files by size
GET /api/scanned-files?filters[size][$gt]=10485760

# Filter music by artist
GET /api/music-metadatas?filters[artist][$contains]=Beatles

# Pagination
GET /api/scanned-files?pagination[page]=1&pagination[pageSize]=25

# Sorting
GET /api/scanned-files?sort=size:desc

# Population (include relations)
GET /api/scanned-files?populate=*
```

## Authentication

### Creating Admin User

**Before:**
- Manual database entry or config file

**After:**
- First run: visit `http://localhost:1337/admin`
- Create admin account through UI
- Manage users in admin panel

### API Authentication

For API requests, generate an API token in the admin panel:
1. Go to Settings → API Tokens
2. Create new token
3. Use in requests:

```bash
curl http://localhost:1337/api/scanned-files \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Development Workflow

### Before
1. Edit JavaScript files
2. Restart server
3. Test manually

### After
1. Edit TypeScript files
2. Auto-reload (in dev mode)
3. Types auto-generated
4. Test in admin panel or API

### Commands

**Before:**
```bash
npm run server  # Start server
npm run test    # Run tests (if any)
```

**After:**
```bash
npm run develop    # Dev mode with auto-reload
npm run start      # Production mode
npm run build      # Build admin panel
npm run strapi     # Strapi CLI commands
```

## Troubleshooting

### Port Conflicts

If you were using port 3000 for SilverFileSystem and want to keep it:

```env
# .env
PORT=3000
```

### Missing Features

If you relied on specific SilverFileSystem features not yet in Silver Media Library:

1. **CLI Commands**: Use API endpoints instead, or create custom Strapi commands
2. **Custom UIs**: Use Strapi admin panel, or create custom plugins
3. **Specific Workflows**: Customize controllers or create lifecycle hooks

## Next Steps

1. **Install** Silver Media Library (see README.md)
2. **Configure** database connection
3. **Create** admin user
4. **Scan** your directories
5. **Explore** the admin panel
6. **Customize** as needed using Strapi's plugin system

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- See [QUICK_START.md](QUICK_START.md) for getting started
- Visit [Strapi Documentation](https://docs.strapi.io) for Strapi-specific features

## Benefits of Migration

1. **Less Code to Maintain**: Strapi handles most boilerplate
2. **Better UI**: Professional admin panel out of the box
3. **Extensible**: Plugin ecosystem for new features
4. **Type Safety**: Full TypeScript support
5. **Community**: Active Strapi community and support
6. **Future-Proof**: Regular updates and security patches
7. **Standards-Based**: REST and GraphQL APIs following best practices
