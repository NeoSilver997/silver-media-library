import { parseFile } from 'music-metadata';
import sharp from 'sharp';
import { exiftool } from 'exiftool-vendored';
import path from 'path';

/**
 * Media Metadata Extractor
 * Extracts detailed information from photos, music, and video files
 */
export class MediaMetadataExtractor {
  private imageExtensions: string[];
  private audioExtensions: string[];
  private videoExtensions: string[];

  constructor() {
    this.imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heic', 'heif'];
    this.audioExtensions = ['mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'wma', 'opus'];
    this.videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpeg', 'mpg'];
  }

  /**
   * Get file extension
   */
  private getExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return ext;
  }

  /**
   * Check if file is an image
   */
  isImage(filename: string): boolean {
    const ext = this.getExtension(filename);
    return this.imageExtensions.includes(ext);
  }

  /**
   * Check if file is audio
   */
  isAudio(filename: string): boolean {
    const ext = this.getExtension(filename);
    return this.audioExtensions.includes(ext);
  }

  /**
   * Check if file is video
   */
  isVideo(filename: string): boolean {
    const ext = this.getExtension(filename);
    return this.videoExtensions.includes(ext);
  }

  /**
   * Extract photo metadata
   */
  async extractPhotoMetadata(filePath: string): Promise<any> {
    try {
      const metadata: any = {};

      // Use sharp for image dimensions and basic info
      const image = sharp(filePath);
      const imageMetadata = await image.metadata();

      metadata.width = imageMetadata.width;
      metadata.height = imageMetadata.height;

      // Use exiftool for EXIF data
      try {
        const exif = await exiftool.read(filePath);
        
        metadata.cameraMake = exif.Make;
        metadata.cameraModel = exif.Model;
        metadata.lens = exif.LensModel;
        metadata.iso = exif.ISO;
        metadata.aperture = exif.FNumber || exif.ApertureValue;
        metadata.shutterSpeed = exif.ExposureTime || exif.ShutterSpeedValue;
        metadata.focalLength = exif.FocalLength;
        metadata.flash = Boolean((exif as any).Flash);
        metadata.dateTaken = exif.DateTimeOriginal || exif.CreateDate;
        metadata.latitude = exif.GPSLatitude;
        metadata.longitude = exif.GPSLongitude;
        metadata.altitude = exif.GPSAltitude;
        metadata.software = exif.Software;
        metadata.artist = exif.Artist;
        metadata.copyright = exif.Copyright;
      } catch (err: any) {
        // EXIF data might not be available
        console.warn(`Could not read EXIF for ${filePath}: ${err.message}`);
      }

      return metadata;
    } catch (err: any) {
      console.warn(`Error extracting photo metadata from ${filePath}: ${err.message}`);
      return null;
    }
  }

  /**
   * Extract music metadata
   */
  async extractMusicMetadata(filePath: string): Promise<any> {
    try {
      const metadata = await parseFile(filePath);
      
      return {
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        albumArtist: metadata.common.albumartist,
        year: metadata.common.year,
        genre: metadata.common.genre?.[0],
        trackNumber: metadata.common.track?.no,
        diskNumber: metadata.common.disk?.no,
        duration: metadata.format.duration,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        codec: metadata.format.codec,
        composer: metadata.common.composer?.[0],
        isrc: metadata.common.isrc?.[0],
        hasAlbumArt: metadata.common.picture && metadata.common.picture.length > 0,
      };
    } catch (err: any) {
      console.warn(`Error extracting music metadata from ${filePath}: ${err.message}`);
      return null;
    }
  }

  /**
   * Extract video metadata
   */
  async extractVideoMetadata(filePath: string): Promise<any> {
    try {
      const exif = await exiftool.read(filePath);

      return {
        duration: exif.Duration,
        width: exif.ImageWidth,
        height: exif.ImageHeight,
        frameRate: exif.VideoFrameRate || exif.FrameRate,
        videoCodec: exif.VideoCodec || exif.CompressorID,
        videoBitrate: (exif as any).VideoBitrate,
        audioCodec: exif.AudioCodec,
        audioSampleRate: exif.AudioSampleRate,
        audioChannels: exif.AudioChannels,
        audioBitrate: (exif as any).AudioBitrate,
        title: exif.Title,
        description: exif.Description,
        genre: (exif as any).Genre,
        artist: exif.Artist,
        year: (exif as any).Year,
        creationDate: exif.CreateDate,
        latitude: exif.GPSLatitude,
        longitude: exif.GPSLongitude,
        software: exif.Software,
      };
    } catch (err: any) {
      console.warn(`Error extracting video metadata from ${filePath}: ${err.message}`);
      return null;
    }
  }

  /**
   * Extract metadata based on file type
   */
  async extractMetadata(filePath: string): Promise<{ type: string; metadata: any } | null> {
    const filename = path.basename(filePath);

    if (this.isImage(filename)) {
      return {
        type: 'photo',
        metadata: await this.extractPhotoMetadata(filePath),
      };
    } else if (this.isAudio(filename)) {
      return {
        type: 'music',
        metadata: await this.extractMusicMetadata(filePath),
      };
    } else if (this.isVideo(filename)) {
      return {
        type: 'video',
        metadata: await this.extractVideoMetadata(filePath),
      };
    }

    return null;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await exiftool.end();
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

export default MediaMetadataExtractor;
