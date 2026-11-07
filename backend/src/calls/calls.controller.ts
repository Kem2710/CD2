import {
  BadRequestException, Body, Controller, Get, Headers, Param,
  ParseIntPipe, Post, UnauthorizedException, UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CallsService } from './calls.service';
import type { ResultPayload } from './calls.service';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly config: ConfigService,
  ) {}

  private checkSecret(secret?: string) {
    if (secret !== this.config.get('WEBHOOK_SECRET')) {
      throw new UnauthorizedException('Sai webhook secret');
    }
  }

  // Frontend upload audio
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync('uploads', { recursive: true });
          cb(null, 'uploads');
        },
        filename: (_req, file, cb) =>
          cb(null, `${Date.now()}-${randomBytes(4).toString('hex')}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { customerName?: string; phone?: string },
  ) {
    if (!file) throw new BadRequestException('Thiếu file audio (field "file")');
    return this.calls.createAndDispatch(file, body);
  }

  @Get()
  findAll() {
    return this.calls.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.calls.findOne(id);
  }

  // n8n gọi về khi xử lý xong
  @Post(':id/result')
  result(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-webhook-secret') secret: string,
    @Body() body: ResultPayload,
  ) {
    this.checkSecret(secret);
    return this.calls.saveResult(id, body);
  }

  // n8n gọi về khi xử lý lỗi
  @Post(':id/fail')
  fail(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-webhook-secret') secret: string,
    @Body() body: { error?: string },
  ) {
    this.checkSecret(secret);
    return this.calls.markFailed(id, body.error ?? 'Lỗi không rõ');
  }
}