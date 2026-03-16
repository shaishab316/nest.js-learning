import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcryptjs';
import { existsSync, unlinkSync } from 'fs';
import type { SignupDto, LoginDto, UpdateProfileDto } from './dto/auth.schemas';
import { Role } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../common/strategy/jwt.strategy';
import { MAIL_QUEUE, MailJobs } from '../../common/mail/mail.constants';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwt: JwtService,
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.authRepo.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.authRepo.createUser({
      email: dto.email,
      name: dto.name,
      password,
    });

    await this.mailQueue.add(
      MailJobs.WELCOME,
      { email: user.email, name: user.name },
      {
        delay: 60_000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
        removeOnFail: { count: 500 },
      },
    );

    return this.signToken(user.id, user.email, user.role as Role);
  }

  async login(dto: LoginDto) {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role as Role);
  }

  getProfile(userId: string) {
    return this.authRepo.findById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    if (dto.email) {
      const taken = await this.authRepo.emailTakenByOther(dto.email, userId);
      if (taken) throw new ConflictException('Email already in use');
    }

    if (file) {
      const current = await this.authRepo.getCurrentImage(userId);
      if (current?.image) {
        const oldPath = `.${current.image}`;
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
    }

    return this.authRepo.updateUser(userId, {
      ...dto,
      ...(file ? { image: `/uploads/avatars/${file.filename}` } : {}),
    });
  }

  private signToken(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };
    return { access_token: this.jwt.sign(payload) };
  }
}
