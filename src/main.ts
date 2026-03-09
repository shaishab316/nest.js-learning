import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/app.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());

  const config = app.get(ConfigService<Env, true>);

  //? Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription(
      `This API allows you to manage your todo items. You can create, read, update, and delete todos. Each todo has a title, description, and a completed status.`,
    )
    .setVersion(process.env.npm_package_version ?? '1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, document, {
    swaggerUiEnabled: false, //? Disable Swagger UI since we're using Scalar UI
  });

  // Scalar UI at /docs
  app.use(
    '/docs',
    apiReference({
      content: document,
      layout: 'modern',
      theme: 'kepler',
      hideClientButton: true,
      showOperationId: true,
      showSidebar: true,
      showDeveloperTools: 'never',
      showToolbar: 'localhost',
      operationTitleSource: 'summary',
      persistAuth: true,
      telemetry: true,
      isEditable: false,
      isLoading: false,
      documentDownloadType: 'both',
      hideSearch: false,
      withDefaultFonts: true,
      defaultOpenFirstTag: true,
      defaultOpenAllTags: true,
      expandAllModelSections: false,
      expandAllResponses: false,
      orderSchemaPropertiesBy: 'alpha',
      orderRequiredPropertiesFirst: true,
      _integration: 'nestjs',
      default: false,
    }),
  );

  //? Enable shutdown hooks to allow graceful shutdown of the application
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));

  Logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Error starting the application', err);
  process.exit(1);
});
