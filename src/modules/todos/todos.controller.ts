import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateTodoSchema,
  UpdateTodoSchema,
  type CreateTodoInput,
  type UpdateTodoInput,
} from './dto/todo.schemas';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  list() {
    return this.todosService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.todosService.getById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTodoSchema))
  create(@Body() body: CreateTodoInput) {
    return this.todosService.create(body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateTodoSchema))
  update(@Param('id') id: string, @Body() body: UpdateTodoInput) {
    return this.todosService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }
}
