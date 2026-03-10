/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, GetMessagesDto } from './dto/chat.schemas';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats for current user' })
  getChats(@CurrentUser() user: JwtPayload & { id: string }) {
    return this.chatService.getChats(user.id);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get messages with a specific user (paginated)' })
  getMessages(
    @CurrentUser() user: JwtPayload & { id: string },
    @Query() query: GetMessagesDto,
  ) {
    return this.chatService.getMessages(user.id, query);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  sendMessage(
    @CurrentUser() user: JwtPayload & { id: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, dto);
  }
}
