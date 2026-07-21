import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { S3StorageService } from './s3-storage.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, S3StorageService],
  exports: [UploadsService],
})
export class UploadsModule {}
