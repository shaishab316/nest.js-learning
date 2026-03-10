/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import type { SendMessageDto } from './dto/chat.schemas';
import type { JwtPayload } from '../auth/jwt.strategy';

// typed socket data
interface SocketData {
  userId: string;
  email: string;
}

type AuthSocket = Socket & { data: SocketData };

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server; // ✅ ! tells TS it will be assigned by NestJS

  private logger = new Logger('ChatGateway');
  private onlineUsers = new Map<string, string>(); // userId → socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // ── connection ──────────────────────────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth['token'] ??
        client.handshake.headers?.authorization?.replace(
          'Bearer ',
          '',
        )) as string;
      const payload = this.jwtService.verify<JwtPayload>(token);

      (client as AuthSocket).data.userId = payload.sub;
      (client as AuthSocket).data.email = payload.email;

      this.onlineUsers.set(payload.sub, client.id);
      this.logger.log(`Connected: ${payload.email} (${client.id})`);

      await client.join(`user:${payload.sub}`);
      client.broadcast.emit('user:online', { userId: payload.sub });
    } catch {
      this.logger.warn(`Unauthorized — disconnecting ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    const { userId } = client.data;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.logger.log(`Disconnected: ${userId}`);
      client.broadcast.emit('user:offline', { userId });
    }
  }

  // ── send message ────────────────────────────────────────────────
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(client.data.userId, dto);

    client.emit('message:new', message);
    this.server.to(`user:${dto.receiverId}`).emit('message:new', message);

    return message;
  }

  // ── typing indicators ───────────────────────────────────────────
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    this.server
      .to(`user:${data.receiverId}`)
      .emit('typing:start', { userId: client.data.userId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    this.server
      .to(`user:${data.receiverId}`)
      .emit('typing:stop', { userId: client.data.userId });
  }

  // ── online status ───────────────────────────────────────────────
  @SubscribeMessage('user:status')
  handleUserStatus(@MessageBody() data: { userId: string }) {
    return { userId: data.userId, online: this.onlineUsers.has(data.userId) };
  }
}
