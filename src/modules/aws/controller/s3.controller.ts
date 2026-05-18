import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3 } from '../aws.config';

@Controller('aws/s3')
export class S3Controller {
  private bucket = 'my-bucket';

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('prefix') prefix = 'uploads',
  ) {
    const key = `${prefix}/${uuidv4()}-${file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
    return { key, url };
  }

  @Get('presign')
  async presign(@Query('key') key: string) {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
    return { url };
  }

  @Get('list')
  async list(@Query('prefix') prefix = 'uploads') {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      }),
    );
    return res.Contents ?? [];
  }

  @Delete('delete')
  async delete(@Query('key') key: string) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return { deleted: key };
  }
}
