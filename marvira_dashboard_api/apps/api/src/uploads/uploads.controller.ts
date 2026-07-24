import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { UploadsService } from './uploads.service';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { UPLOADS_DIR } from '../common/uploads-dir';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Public()
  @Get(':filename')
  @ApiOperation({ summary: 'Serve uploaded image (public)' })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new NotFoundException('File not found');
    }
    const filePath = join(UPLOADS_DIR, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(filePath);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload image file (jpeg/png/webp, max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowed.includes(file.mimetype) && !file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only jpeg, png, or webp images allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required');
    const data = await this.uploadsService.saveFile(file);
    return { success: true, data };
  }
}
