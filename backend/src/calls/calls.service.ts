import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ActionItem, Call, Summary, Transcript } from './entities';

export interface ResultPayload {
  transcript: string;
  language?: string;
  summary: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
  action_items?: { task: string; owner?: string; due_date?: string }[];
}

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call) private callRepo: Repository<Call>,
    @InjectRepository(Transcript) private trRepo: Repository<Transcript>,
    @InjectRepository(Summary) private sumRepo: Repository<Summary>,
    @InjectRepository(ActionItem) private itemRepo: Repository<ActionItem>,
    private dataSource: DataSource,
    private config: ConfigService,
  ) {}

  // Lưu record rồi gọi webhook n8n
  async createAndDispatch(
    file: Express.Multer.File,
    body: { customerName?: string; phone?: string },
  ) {
    const call = await this.callRepo.save(
      this.callRepo.create({
        customerName: body.customerName || null,
        phone: body.phone || null,
        audioFilename: file.filename,
        status: 'PENDING',
      }),
    );

    const base = this.config.get<string>('PUBLIC_BACKEND_URL');
    try {
      const res = await fetch(this.config.get<string>('N8N_WEBHOOK_URL')!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': this.config.get<string>('WEBHOOK_SECRET')!,
        },
        body: JSON.stringify({
          callId: call.id,
          audioUrl: `${base}/uploads/${file.filename}`,
          callbackUrl: `${base}/calls/${call.id}/result`,
          customerName: call.customerName,
          phone: call.phone,
        }),
      });
      if (!res.ok) throw new Error(`n8n trả về HTTP ${res.status}`);
      call.status = 'PROCESSING';
    } catch (e) {
      call.status = 'FAILED';
      call.error = `Không gọi được n8n: ${(e as Error).message}`;
    }
    return this.callRepo.save(call);
  }

  // n8n gọi ngược về để lưu kết quả
  async saveResult(id: number, p: ResultPayload) {
    const call = await this.callRepo.findOneBy({ id });
    if (!call) throw new NotFoundException(`Không có cuộc gọi #${id}`);

    const sentiments = ['positive', 'neutral', 'negative'];
    const sentiment = sentiments.includes(p.sentiment ?? '')
      ? p.sentiment!
      : 'neutral';

    await this.dataSource.transaction(async (m) => {
      // xóa kết quả cũ để chạy lại không bị trùng
      await m.delete(Transcript, { callId: id });
      await m.delete(Summary, { callId: id });
      await m.delete(ActionItem, { callId: id });

      await m.save(Transcript, {
        callId: id,
        content: p.transcript ?? '',
        language: p.language ?? null,
      });
      await m.save(Summary, {
        callId: id,
        summary: p.summary ?? '',
        sentiment,
        keywords: Array.isArray(p.keywords) ? p.keywords : [],
      });
      for (const it of p.action_items ?? []) {
        const due = /^\d{4}-\d{2}-\d{2}$/.test(it.due_date ?? '')
          ? it.due_date!
          : null;
        await m.save(ActionItem, {
          callId: id,
          task: it.task,
          owner: it.owner ?? null,
          dueDate: due,
        });
      }
      await m.update(Call, id, { status: 'DONE', error: null });
    });
    return { ok: true };
  }

  async markFailed(id: number, error: string) {
    await this.callRepo.update(id, { status: 'FAILED', error });
    return { ok: true };
  }

  findAll() {
    return this.callRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const call = await this.callRepo.findOneBy({ id });
    if (!call) throw new NotFoundException(`Không có cuộc gọi #${id}`);
    const [transcript, summary, actionItems] = await Promise.all([
      this.trRepo.findOneBy({ callId: id }),
      this.sumRepo.findOneBy({ callId: id }),
      this.itemRepo.find({ where: { callId: id }, order: { id: 'ASC' } }),
    ]);
    return { ...call, transcript, summary, actionItems };
  }
}