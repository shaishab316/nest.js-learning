import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TodosModule } from './modules/todos/todos.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { validate as configValidate } from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidate,
    }),
    PrismaModule,
    AuthModule,
    TodosModule,
  ],
})
export class AppModule {}
