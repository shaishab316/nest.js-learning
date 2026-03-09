import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.schemas';
import { TodosService } from './todos.service';

@ApiTags('Todos')
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  list() {
    return this.todosService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo by ID' })
  @ApiParam({ name: 'id', example: 'cm1abc123' })
  @ApiResponse({ status: 404, description: 'Not found' })
  get(@Param('id') id: string) {
    return this.todosService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create todo' })
  create(@Body() body: CreateTodoDto) {
    return this.todosService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update todo' })
  @ApiParam({ name: 'id', example: 'cm1abc123' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() body: UpdateTodoDto) {
    return this.todosService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete todo' })
  @ApiParam({ name: 'id', example: 'cm1abc123' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }
}
