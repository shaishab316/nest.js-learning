import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
          from: '"Todo App" <shaishab316@gmail.com>',
        },
      }),
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}
