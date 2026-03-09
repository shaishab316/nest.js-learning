import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TodosService } from './todos.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

// Mock PrismaService — no real DB needed
const mockPrisma = {
  todo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockTodo = {
  id: 'cuid_123',
  title: 'Buy milk',
  status: 'open',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TodosService', () => {
  let service: TodosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);

    // reset all mocks before each test
    jest.clearAllMocks();
  });

  // ───────────────────────────── list ─────────────────────────────
  describe('list()', () => {
    it('should return all todos ordered by createdAt desc', async () => {
      mockPrisma.todo.findMany.mockResolvedValue([mockTodo]);

      const result = await service.list();

      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockTodo]);
    });

    it('should return empty array when no todos', async () => {
      mockPrisma.todo.findMany.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });

  // ───────────────────────────── getById ──────────────────────────
  describe('getById()', () => {
    it('should return a todo by id', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(mockTodo);

      const result = await service.getById('cuid_123');

      expect(mockPrisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: 'cuid_123' },
      });
      expect(result).toEqual(mockTodo);
    });

    it('should throw NotFoundException if todo not found', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(null);

      await expect(service.getById('bad_id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ───────────────────────────── create ───────────────────────────
  describe('create()', () => {
    it('should create a todo with given title', async () => {
      mockPrisma.todo.create.mockResolvedValue(mockTodo);

      const result = await service.create({ title: 'Buy milk' });

      expect(mockPrisma.todo.create).toHaveBeenCalledWith({
        data: { title: 'Buy milk' },
      });
      expect(result).toEqual(mockTodo);
    });
  });

  // ───────────────────────────── update ───────────────────────────
  describe('update()', () => {
    it('should update title of an existing todo', async () => {
      const updated = { ...mockTodo, title: 'Buy oat milk' };
      mockPrisma.todo.findUnique.mockResolvedValue(mockTodo); // for getById check
      mockPrisma.todo.update.mockResolvedValue(updated);

      const result = await service.update('cuid_123', {
        title: 'Buy oat milk',
      });

      expect(mockPrisma.todo.update).toHaveBeenCalledWith({
        where: { id: 'cuid_123' },
        data: { title: 'Buy oat milk' },
      });
      expect(result.title).toBe('Buy oat milk');
    });

    it('should update status of an existing todo', async () => {
      const updated = { ...mockTodo, status: 'done' };
      mockPrisma.todo.findUnique.mockResolvedValue(mockTodo);
      mockPrisma.todo.update.mockResolvedValue(updated);

      const result = await service.update('cuid_123', { status: 'done' });

      expect(result.status).toBe('done');
    });

    it('should throw NotFoundException when updating non-existent todo', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(null);

      await expect(service.update('bad_id', { title: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ───────────────────────────── remove ───────────────────────────
  describe('remove()', () => {
    it('should delete a todo and return { ok: true }', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(mockTodo);
      mockPrisma.todo.delete.mockResolvedValue(mockTodo);

      const result = await service.remove('cuid_123');

      expect(mockPrisma.todo.delete).toHaveBeenCalledWith({
        where: { id: 'cuid_123' },
      });
      expect(result).toEqual({ ok: true });
    });

    it('should throw NotFoundException when deleting non-existent todo', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(null);

      await expect(service.remove('bad_id')).rejects.toThrow(NotFoundException);
    });
  });
});
