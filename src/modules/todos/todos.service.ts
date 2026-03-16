import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CacheService } from '../../infra/cache/cache.service';
import type { CreateTodoInput, UpdateTodoInput } from './dto/todo.schemas';

@Injectable()
export class TodosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list() {
    const key = 'todos:all';

    const cached = await this.cache.get<any[]>(key);
    if (cached) return { __cache: 'HIT', data: cached };

    const todos = await this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });

    await this.cache.set(key, todos);
    return { __cache: 'MISS', data: todos };
  }

  async getById(id: string) {
    const key = `todos:${id}`;

    const cached = await this.cache.get<any>(key);
    if (cached) return { __cache: 'HIT', data: cached };

    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) throw new NotFoundException(`Todo not found: ${id}`);

    await this.cache.set(key, todo);
    return { __cache: 'MISS', data: todo };
  }

  async create(data: CreateTodoInput) {
    const todo = await this.prisma.todo.create({
      data: { title: data.title },
    });

    await this.cache.del('todos:all');
    return todo;
  }

  async update(id: string, data: UpdateTodoInput) {
    await this.getById(id);

    const todo = await this.prisma.todo.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    await this.cache.del(`todos:${id}`);
    await this.cache.del('todos:all');
    return todo;
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.todo.delete({ where: { id } });

    await this.cache.del(`todos:${id}`);
    await this.cache.del('todos:all');
    return { ok: true };
  }
}
