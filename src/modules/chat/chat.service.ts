/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { SendMessageDto, GetMessagesDto } from './dto/chat.schemas';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateChat(userAId: string, userBId: string) {
    const [a, b] = [userAId, userBId].sort();

    const existing = await this.prisma.chat.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });

    if (existing) return existing;

    return this.prisma.chat.create({
      data: { userAId: a, userBId: b },
    });
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const chat = await this.getOrCreateChat(senderId, dto.receiverId);

    return this.prisma.message.create({
      data: {
        chatId: chat.id,
        senderId,
        receiverId: dto.receiverId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async getMessages(userId: string, dto: GetMessagesDto) {
    const chat = await this.getOrCreateChat(userId, dto.receiverId);
    const skip = (dto.page - 1) * dto.limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: dto.limit,
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      }),
      this.prisma.message.count({ where: { chatId: chat.id } }),
    ]);

    await this.prisma.message.updateMany({
      where: { chatId: chat.id, receiverId: userId, read: false },
      data: { read: true },
    });

    return {
      messages: messages.reverse(),
      total,
      page: dto.page,
      limit: dto.limit,
    };
  }

  getChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, name: true, image: true } },
        userB: { select: { id: true, name: true, image: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
