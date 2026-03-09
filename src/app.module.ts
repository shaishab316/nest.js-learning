import { Module } from '@nestjs/common';
import { TodosModule } from './modules/todos/todos.module';

@Module({
  imports: [TodosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
