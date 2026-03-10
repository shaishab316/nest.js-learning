import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';
import { existsSync, unlinkSync } from 'fs';
import type { SignupDto, LoginDto, UpdateProfileDto } from './dto/auth.schemas';
import { Role } from '../../common/decorators/roles.decorator';
import { JwtPayload } from 'src/common/strategy/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, name: dto.name },
    });

    void this.mailer
      .sendMail({
        to: user.email,
        subject: 'Welcome!',
        text: `Hello, ${user.name ?? user.email}. Welcome to Todo App!`,
      })
      .then(() => console.log(`Welcome email sent to ${user.email}`))
      .catch((err) => console.error(`Failed to send welcome email:`, err));

    return this.signToken(user.id, user.email, user.role as Role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role as Role);
  }

  async getProfile(userId: string) {
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

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    if (dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (exists) throw new ConflictException('Email already in use');
    }

    if (file) {
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });
      if (current?.image) {
        const oldPath = `.${current.image}`;
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        ...(file ? { image: `/uploads/avatars/${file.filename}` } : {}),
      },
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

  private signToken(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };
    return { access_token: this.jwt.sign(payload) };
  }
}
