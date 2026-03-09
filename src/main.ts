import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //? Enable shutdown hooks to allow graceful shutdown of the application
  app.enableShutdownHooks();

  const config = app.get(ConfigService<Env, true>);

  await app.listen(config.get('PORT', { infer: true }));

  Logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Error starting the application', err);
  process.exit(1);
});
