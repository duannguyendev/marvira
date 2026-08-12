import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_CACHE_CONTROL } from '../common/upload-cache';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly cdnUrl: string | undefined;

  constructor() {
    this.bucket = process.env.S3_BUCKET || undefined;
    const region = process.env.S3_REGION || 'us-east-1';
    const endpoint = process.env.S3_ENDPOINT || undefined;

    if (this.bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.client = new S3Client({
        region,
        endpoint,
        forcePathStyle: !!endpoint,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.cdnUrl = process.env.CDN_URL?.replace(/\/$/, '');
      this.logger.log(`S3 storage enabled (bucket: ${this.bucket})`);
    } else {
      this.client = null;
      this.cdnUrl = undefined;
    }
  }

  isEnabled(): boolean {
    return !!this.client && !!this.bucket;
  }

  async upload(
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    if (!this.client || !this.bucket) {
      throw new Error('S3 storage is not configured');
    }

    // Random key only — never reuse client filenames (commas/spaces break RN image loaders).
    const key = `uploads/${uuidv4()}.jpg`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: UPLOAD_CACHE_CONTROL,
      }),
    );

    const url = this.cdnUrl ? `${this.cdnUrl}/${key}` : this.publicUrl(key);
    return { key, url };
  }

  private publicUrl(key: string): string {
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    if (endpoint) {
      return `${endpoint}/${this.bucket}/${key}`;
    }
    const region = process.env.S3_REGION || 'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
