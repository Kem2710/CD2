import {
  Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post,
  Query, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalysesService } from './analyses.service';

@Controller()
export class AnalysesController {
  constructor(
    private readonly svc: AnalysesService,
    private readonly config: ConfigService,
  ) {}

  private check(secret?: string) {
    if (secret !== this.config.get<string>('WEBHOOK_SECRET')) {
      throw new UnauthorizedException('Sai webhook secret');
    }
  }

  @Get('analyses')
  list(@Query('callId') callId?: string) {
    return this.svc.list(callId ? Number(callId) : undefined);
  }

  @Post('analyses/:id/result')
  result(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-webhook-secret') secret: string,
    @Body() body: Record<string, any>,
  ) {
    this.check(secret);
    return this.svc.saveResult(id, body);
  }

  @Post('analyses/:id/fail')
  fail(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-webhook-secret') secret: string,
    @Body() body: { error?: string },
  ) {
    this.check(secret);
    return this.svc.markFailed(id, body.error ?? 'Lỗi không rõ');
  }

  @Get('tickets')
  tickets() {
    return this.svc.listTickets();
  }

  @Patch('tickets/:id')
  updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status?: string; escalated?: boolean },
  ) {
    return this.svc.updateTicket(id, body);
  }

  @Get('leads')
  leads() {
    return this.svc.listLeads();
  }

  @Get('stats')
  stats() {
    return this.svc.stats();
  }
}