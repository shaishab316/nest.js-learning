import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TodosModule } from './modules/todos/todos.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { validate } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TodosModule,
    PrismaModule,
  ],
})
export class AppModule {}
