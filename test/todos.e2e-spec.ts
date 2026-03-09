/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supertest = require('supertest') as (
  app: unknown,
) => import('supertest').SuperTest<import('supertest').Test>;

interface TodoResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const mockTodo: TodoResponse = {
  id: 'cuid_123',
  title: 'Buy milk',
  status: 'open',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPrisma = {
  todo: {
    findMany: jest.fn().mockResolvedValue([mockTodo]),
    findUnique: jest.fn().mockResolvedValue(mockTodo),
    create: jest.fn().mockResolvedValue(mockTodo),
    update: jest.fn().mockResolvedValue({ ...mockTodo, status: 'done' }),
    delete: jest.fn().mockResolvedValue(mockTodo),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

describe('Todos E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.todo.findMany.mockResolvedValue([mockTodo]);
    mockPrisma.todo.findUnique.mockResolvedValue(mockTodo);
    mockPrisma.todo.create.mockResolvedValue(mockTodo);
    mockPrisma.todo.update.mockResolvedValue({ ...mockTodo, status: 'done' });
    mockPrisma.todo.delete.mockResolvedValue(mockTodo);
  });

  const req = () => supertest(app.getHttpServer());

  // ───────────────────────────── GET /todos ───────────────────────
  describe('GET /todos', () => {
    it('should return 200 with array of todos', async () => {
      const res = await req().get('/todos');
      const body = res.body as TodoResponse[];

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('title');
    });
  });

  // ───────────────────────────── GET /todos/:id ───────────────────
  describe('GET /todos/:id', () => {
    it('should return 200 with the todo', async () => {
      const res = await req().get('/todos/cuid_123');
      const body = res.body as TodoResponse;

      expect(res.status).toBe(200);
      expect(body.id).toBe('cuid_123');
    });

    it('should return 404 when todo not found', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(null);
      const res = await req().get('/todos/bad_id');
      expect(res.status).toBe(404);
    });
  });

  // ───────────────────────────── POST /todos ──────────────────────
  describe('POST /todos', () => {
    it('should return 201 and the created todo', async () => {
      const res = await req().post('/todos').send({ title: 'Buy milk' });
      const body = res.body as TodoResponse;

      expect(res.status).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body.title).toBe('Buy milk');
    });

    it('should return 400 when title is missing', async () => {
      const res = await req().post('/todos').send({});
      expect(res.status).toBe(400);
    });
  });

  // ───────────────────────────── PATCH /todos/:id ─────────────────
  describe('PATCH /todos/:id', () => {
    it('should return 200 with updated todo', async () => {
      const res = await req().patch('/todos/cuid_123').send({ status: 'done' });
      const body = res.body as TodoResponse;

      expect(res.status).toBe(200);
      expect(body.status).toBe('done');
    });

    it('should return 404 when todo not found', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(null);
      const res = await req().patch('/todos/bad_id').send({ status: 'done' });
      expect(res.status).toBe(404);
    });
  });

  // ───────────────────────────── DELETE /todos/:id ────────────────
  describe('DELETE /todos/:id', () => {
    it('should return 200 with { ok: true }', async () => {
      const res = await req().delete('/todos/cuid_123');
      expect(res.status).toBe(200);
      expect(res.body as { ok: boolean }).toEqual({ ok: true });
    });

    it('should return 404 when todo not found', async () => {
      mockPrisma.todo.findUnique.mockResolvedValue(null);
      const res = await req().delete('/todos/bad_id');
      expect(res.status).toBe(404);
    });
  });
});
