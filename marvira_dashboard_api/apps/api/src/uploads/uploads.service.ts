import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOADS_DIR } from '../common/uploads-dir';
import { S3StorageService } from './s3-storage.service';
import {
  normalizeUploadImage,
  withJpegExtension,
} from './normalize-upload-image';

@Injectable()
export class UploadsService {
  private readonly uploadDir = UPLOADS_DIR;

  constructor(private readonly s3Storage: S3StorageService) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    let normalized;
    try {
      normalized = await normalizeUploadImage(file.buffer);
    } catch {
      throw new BadRequestException('Invalid or unsupported image file');
    }

    const originalName = withJpegExtension(file.originalname || 'image.jpg');

    if (this.s3Storage.isEnabled()) {
      const { key, url } = await this.s3Storage.upload(
        normalized.buffer,
        originalName,
        normalized.contentType,
      );
      return { filename: key, url };
    }

    const filename = `${uuidv4()}-${originalName}`;
    writeFileSync(join(this.uploadDir, filename), normalized.buffer);
    return {
      filename,
      url: `/uploads/${filename}`,
    };
  }

  resolvePublicUrl(filename: string): string {
    if (filename.startsWith('http')) {
      return filename;
    }
    if (filename.startsWith('uploads/') && this.s3Storage.isEnabled()) {
      const cdn = process.env.CDN_URL?.replace(/\/$/, '');
      if (cdn) {
        return `${cdn}/${filename}`;
      }
    }
    return `/uploads/${filename}`;
  }
}
