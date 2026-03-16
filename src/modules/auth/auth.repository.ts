import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { UpdateProfileDto } from './dto/auth.schemas';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
  }

  createUser(data: { email: string; password: string; name?: string }) {
    return this.prisma.user.create({ data });
  }

  emailTakenByOther(email: string, excludeUserId: string) {
    return this.prisma.user.findFirst({
      where: { email, NOT: { id: excludeUserId } },
    });
  }

  getCurrentImage(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
  }

  updateUser(userId: string, data: UpdateProfileDto & { image?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
