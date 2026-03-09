import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //? Enable shutdown hooks to allow graceful shutdown of the application
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);

  Logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Error starting the application', err);
  process.exit(1);
});
