# Data Migration from SilverFileSystem

This guide explains how to migrate your existing data from SilverFileSystem MySQL database to the new Strapi-based silver-media-library system.

## Prerequisites

- Access to your SilverFileSystem MySQL database
- Strapi server running (for actual migration)
- Node.js and npm installed
- TypeScript (`ts-node`) installed globally or locally

## Migration Options

### Option 1: Automated Migration Script (Recommended for Large Datasets)

Use the provided migration script to automatically transfer data from your SilverFileSystem database.

#### Step 1: Configure Source Database

Create a `.env.migration` file with your SilverFileSystem database credentials:

```bash
# Source Database (SilverFileSystem)
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=3306
SOURCE_DB_USER=root
SOURCE_DB_PASSWORD=your_password
SOURCE_DB_NAME=silverfilesystem

# Target Strapi URL (if different from default)
STRAPI_URL=http://localhost:1337
```

#### Step 2: Test Migration (Dry Run)

First, run a dry-run to see what will be migrated without actually importing data:

```bash
# Load environment variables
source .env.migration

# Run dry-run migration (default behavior)
npx ts-node scripts/migrate-from-silverfilesystem.ts

# Or test with a limited number of files
npx ts-node scripts/migrate-from-silverfilesystem.ts --limit 100
```

The dry-run will show:
- Number of scan sessions found
- Number of files to migrate
- Breakdown by media type (photos, music, videos)
- Metadata statistics

#### Step 3: Run Actual Migration

Once you've verified the dry-run output, run the actual migration:

```bash
# Make sure Strapi is running first
npm run develop

# In another terminal, run the migration
source .env.migration
npx ts-node scripts/migrate-from-silverfilesystem.ts --no-dry-run
```

#### Migration Progress

The script will:
1. Connect to source SilverFileSystem database
2. Fetch all scan sessions, files, and metadata
3. Import scan sessions to Strapi
4. Import files with their metadata
5. Show progress every 100 files
6. Display summary statistics

### Option 2: Manual Migration (Good for Small Datasets)

For smaller datasets or if you want more control, you can manually migrate data using the Strapi admin panel and API.

#### Step 1: Export Data from SilverFileSystem

Use MySQL tools to export your data:

```bash
# Export scanned files
mysql -u root -p silverfilesystem -e "SELECT * FROM scanned_files" > files.csv

# Export photo metadata
mysql -u root -p silverfilesystem -e "SELECT * FROM photo_metadata" > photos.csv

# Export music metadata
mysql -u root -p silverfilesystem -e "SELECT * FROM music_metadata" > music.csv

# Export video metadata
mysql -u root -p silverfilesystem -e "SELECT * FROM video_metadata" > videos.csv
```

#### Step 2: Import via Strapi API

Use the Strapi REST API to import data:

```bash
# Example: Import a file
curl -X POST http://localhost:1337/api/scanned-files \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "path": "/path/to/file.jpg",
      "filename": "file.jpg",
      "size": "123456",
      "extension": "jpg",
      "mediaType": "photo"
    }
  }'
```

### Option 3: Re-scan Directories

The simplest approach is to re-scan your directories using the new system:

```bash
# Start Strapi
npm run develop

# In another terminal, scan your directories
curl -X POST http://localhost:1337/api/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{
    "scanPath": "/path/to/your/media",
    "extractMetadata": true
  }'
```

**Advantages:**
- Fresh metadata extraction with latest tools
- Validates all files still exist
- No database compatibility issues
- Simplest approach

**Disadvantages:**
- Loses scan history
- Takes time to re-scan large collections
- Need to recalculate hashes for duplicate detection

## Data Mapping

### SilverFileSystem → Strapi Content Types

| SilverFileSystem Table | Strapi Content Type | Notes |
|------------------------|---------------------|-------|
| `scanned_files` | `scanned-file` | Direct mapping |
| `scan_sessions` | `scan-session` | Direct mapping |
| `photo_metadata` | `photo-metadata` | Linked via file_id |
| `music_metadata` | `music-metadata` | Linked via file_id |
| `video_metadata` | `video-metadata` | Linked via file_id |
| `duplicate_groups` | `duplicate-group` | Hash-based grouping |

### Field Mappings

#### Scanned Files
```
SilverFileSystem          → Strapi
-------------------------------------------
id                        → id
path                      → path
name                      → filename
size                      → size (as string)
hash                      → hash
extension                 → extension
mtime                     → modifiedTime
ctime                     → createdTime
scan_id                   → scanSession (relation)
```

#### Photo Metadata
```
SilverFileSystem          → Strapi
-------------------------------------------
file_id                   → file (relation)
width                     → width
height                    → height
camera_make               → cameraMake
camera_model              → cameraModel
lens_model                → lens
iso                       → iso
aperture                  → aperture
shutter_speed             → shutterSpeed
focal_length              → focalLength
flash                     → flash
date_taken                → dateTaken
latitude                  → latitude
longitude                 → longitude
altitude                  → altitude
software                  → software
artist                    → artist
copyright                 → copyright
```

#### Music Metadata
```
SilverFileSystem          → Strapi
-------------------------------------------
file_id                   → file (relation)
title                     → title
artist                    → artist
album                     → album
album_artist              → albumArtist
year                      → year
genre                     → genre
track_number              → trackNumber
disk_number               → diskNumber
duration                  → duration
bitrate                   → bitrate
sample_rate               → sampleRate
channels                  → channels
codec                     → codec
composer                  → composer
isrc                      → isrc
has_album_art             → hasAlbumArt
```

#### Video Metadata
```
SilverFileSystem          → Strapi
-------------------------------------------
file_id                   → file (relation)
duration                  → duration
width                     → width
height                    → height
frame_rate                → frameRate
video_codec               → videoCodec
video_bitrate             → videoBitrate
audio_codec               → audioCodec
audio_sample_rate         → audioSampleRate
audio_channels            → audioChannels
audio_bitrate             → audioBitrate
title                     → title
description               → description
genre                     → genre
artist                    → artist
year                      → year
creation_date             → creationDate
latitude                  → latitude
longitude                 → longitude
software                  → software
```

## Post-Migration Tasks

### 1. Verify Data

After migration, verify your data in the Strapi admin panel:

1. Navigate to `http://localhost:1337/admin`
2. Check each content type:
   - **Scanned Files** - Verify file counts and paths
   - **Scan Sessions** - Check session statistics
   - **Photo/Music/Video Metadata** - Verify metadata loaded correctly

### 2. Test Media UIs

Access the media UIs to ensure everything displays correctly:

- Photos: `http://localhost:1337/api/media-ui/photos`
- Music: `http://localhost:1337/api/media-ui/music`
- Videos: `http://localhost:1337/api/media-ui/videos`

### 3. Run Duplicate Detection

If you migrated file hashes, run duplicate detection:

```bash
curl -X POST http://localhost:1337/api/scanner/find-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 0,
    "calculateHashes": false
  }'
```

### 4. Update File Hashes (If Needed)

If you didn't migrate hashes or want to recalculate:

```bash
curl -X POST http://localhost:1337/api/scanner/find-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 0,
    "calculateHashes": true
  }'
```

## Troubleshooting

### Migration Script Errors

**Error: "Cannot connect to source database"**
- Check your database credentials in `.env.migration`
- Ensure MySQL is running and accessible
- Verify database name exists

**Error: "Table doesn't exist"**
- Your SilverFileSystem database might have a different schema
- Check table names in your database
- You may need to modify the migration script

### Data Issues

**Missing Metadata**
- Some files may not have metadata in source database
- This is normal - not all files have EXIF/ID3 data
- You can re-extract metadata after migration

**File Paths Not Working**
- Verify files still exist at original paths
- Update paths in database if files were moved
- Consider re-scanning with new paths

**Duplicate Detection Not Working**
- Ensure file hashes were migrated or recalculated
- Run duplicate detection after migration
- Check that file sizes match

## Performance Tips

1. **Large Datasets**: Use `--limit` flag for testing before full migration
2. **Batch Import**: The script imports in batches for efficiency
3. **Database Performance**: Ensure good connection to both databases
4. **Memory**: Large migrations may require increasing Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx ts-node scripts/migrate-from-silverfilesystem.ts
   ```

## Need Help?

If you encounter issues during migration:

1. Check the migration script output for errors
2. Verify your database credentials
3. Ensure Strapi is running during actual migration
4. Check Strapi logs for API errors
5. Consider re-scanning as an alternative

## Migration Checklist

- [ ] Backup SilverFileSystem database
- [ ] Configure `.env.migration` with source database credentials
- [ ] Run dry-run migration to test
- [ ] Review dry-run output and statistics
- [ ] Start Strapi server
- [ ] Run actual migration with `--no-dry-run`
- [ ] Verify data in Strapi admin panel
- [ ] Test media UIs with migrated data
- [ ] Run duplicate detection if needed
- [ ] Update documentation with new system details

## Summary

The migration process is designed to be safe and reversible. Always start with a dry-run, and consider keeping your SilverFileSystem database as a backup until you've verified the migration was successful.

For most users, **re-scanning directories** is the simplest and most reliable approach, though it takes longer for large collections.
