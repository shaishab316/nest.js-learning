import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CreateTodoInput, UpdateTodoInput } from './dto/todo.schemas';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException(`Todo not found: ${id}`);
    return todo;
  }

  create(data: CreateTodoInput) {
    return this.prisma.todo.create({
      data: {
        title: data.title,
        // status defaults to "open" from Prisma schema
      },
    });
  }

  async update(id: string, data: UpdateTodoInput) {
    // clean 404 if not found
    await this.getById(id);

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.todo.delete({ where: { id } });
    return { ok: true };
  }
}
