import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JoinSessionDto } from './dto/join-session.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { LanTransferService } from './lan-transfer.service';

@Controller('lan-transfer/sessions')
export class LanTransferController {
  constructor(private readonly lanTransferService: LanTransferService) {}

  @Post()
  createSession(@Body('clientName') clientName?: string) {
    return this.lanTransferService.createSession(clientName);
  }

  @Post('join')
  joinSession(@Body() dto: JoinSessionDto) {
    return this.lanTransferService.joinSession(dto.joinCode, dto.clientName);
  }

  @Get(':sessionId/messages')
  listMessages(
    @Param('sessionId') sessionId: string,
    @Query('clientId') clientId: string,
    @Query('cursor') cursor?: string,
  ) {
    const normalizedCursor = Number.parseInt(cursor ?? '0', 10);

    return this.lanTransferService.listMessages(
      sessionId,
      clientId,
      Number.isNaN(normalizedCursor) ? 0 : normalizedCursor,
    );
  }

  @Post(':sessionId/messages')
  postMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.lanTransferService.postMessage(
      sessionId,
      dto.clientId,
      dto.type,
      dto.payload,
    );
  }
}
