/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { MAIL_QUEUE } from '../../common/mail/mail.constants';

// ── mocks ────────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockMailQueue = {
  add: jest.fn().mockResolvedValue({}),
};

// ── test suite ───────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: getQueueToken(MAIL_QUEUE), useValue: mockMailQueue },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // reset all mocks before each test
    jest.clearAllMocks();
  });

  // ── signup ─────────────────────────────────────────────────────
  describe('signup', () => {
    it('should create user and return access_token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // no existing user
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'user',
      });

      const result = await service.signup({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test',
      });

      expect(result).toEqual({ access_token: 'mock.jwt.token' });
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockMailQueue.add).toHaveBeenCalledTimes(1); // email queued
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signup({ email: 'taken@test.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ── login ──────────────────────────────────────────────────────
  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: hashed,
        role: 'user',
      });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password wrong', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: hashed,
        role: 'user',
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── getProfile ─────────────────────────────────────────────────
  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        image: null,
        role: 'user',
        createdAt: new Date(),
      };
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.any(Object),
      });
    });
  });
});
