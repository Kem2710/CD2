import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { ActionItem, Call, Summary, Transcript } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Call, Transcript, Summary, ActionItem])],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}