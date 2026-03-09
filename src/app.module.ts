import { Module } from '@nestjs/common';
import { TodosModule } from './modules/todos/todos.module';
import { PrismaModule } from './infra/prisma/prisma.module';

@Module({
  imports: [TodosModule, PrismaModule],
})
export class AppModule {}
