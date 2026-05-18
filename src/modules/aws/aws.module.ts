import { Module } from '@nestjs/common';
import { S3Controller } from './controller/s3.controller';

@Module({
  controllers: [S3Controller],
})
export class AwsModule {}
