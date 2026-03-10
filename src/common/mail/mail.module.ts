import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE } from './mail.constants';
import type { Env } from '../../config/app.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        transport: {
          host: config.get('MAIL_HOST', { infer: true }),
          port: config.get('MAIL_PORT', { infer: true }),
          auth: {
            user: config.get('MAIL_USER', { infer: true }),
            pass: config.get('MAIL_PASS', { infer: true }),
          },
        },
        defaults: {
          from: '"Todo App" <noreply@todoapp.com>',
        },
      }),
    }),

    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
  providers: [MailProcessor],
  exports: [BullModule],
})
export class MailModule {}
