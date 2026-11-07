import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from '../calls/entities';
import { AnalysesController } from './analyses.controller';
import { AnalysesService } from './analyses.service';
import { Analysis, Lead, Ticket } from './analysis.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Call, Analysis, Ticket, Lead])],
  controllers: [AnalysesController],
  providers: [AnalysesService],
  exports: [AnalysesService],
})
export class AnalysesModule {}