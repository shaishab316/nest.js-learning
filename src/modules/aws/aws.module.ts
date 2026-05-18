import { Module } from '@nestjs/common';
import { S3Controller } from './controller/s3.controller';
import { SesController } from './controller/ses.controller';

@Module({
  controllers: [S3Controller, SesController],
})
export class AwsModule {}
