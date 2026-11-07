import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Call } from '../calls/entities';
import { Analysis, Lead, Ticket } from './analysis.entities';

const FLOWS = ['quality', 'complaint', 'lead'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TICKET_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

@Injectable()
export class AnalysesService {
  constructor(
    @InjectRepository(Analysis) private repo: Repository<Analysis>,
    @InjectRepository(Ticket) private tickets: Repository<Ticket>,
    @InjectRepository(Lead) private leads: Repository<Lead>,
    private dataSource: DataSource,
    private config: ConfigService,
  ) {}

  // Tạo 1 dòng analysis cho mỗi luồng được chọn rồi gọi webhook n8n tương ứng
  async dispatch(call: Call, flows: string[]) {
    const base = this.config.get<string>('PUBLIC_BACKEND_URL');
    const selected = [...new Set(flows)].filter((f) => FLOWS.includes(f));

    for (const flow of selected) {
      const a = await this.repo.save(
        this.repo.create({ callId: call.id, flow, status: 'PROCESSING' }),
      );
      const key = `N8N_WEBHOOK_${flow.toUpperCase()}`;
      try {
        const url = this.config.get<string>(key);
        if (!url) throw new Error(`Thiếu biến ${key} trong .env`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': this.config.get<string>('WEBHOOK_SECRET')!,
          },
          body: JSON.stringify({
            callId: call.id,
            analysisId: a.id,
            flow,
            audioUrl: `${base}/uploads/${call.audioFilename}`,
            callbackUrl: `${base}/analyses/${a.id}/result`,
            failUrl: `${base}/analyses/${a.id}/fail`,
            customerName: call.customerName,
            phone: call.phone,
          }),
        });
        if (!res.ok) throw new Error(`n8n trả về HTTP ${res.status}`);
      } catch (e) {
        a.status = 'FAILED';
        a.error = `Không gọi được n8n: ${(e as Error).message}`;
        await this.repo.save(a);
      }
    }
  }

  // n8n gọi về khi xong: lưu JSON và ghi thêm vào bảng riêng (ticket, lead)
  async saveResult(id: number, p: Record<string, any>) {
    const a = await this.repo.findOneBy({ id });
    if (!a) throw new NotFoundException(`Không có analysis #${id}`);

    await this.dataSource.transaction(async (m) => {
      await m.update(Analysis, id, {
        status: 'DONE',
        result: p as any,
        error: null,
      });

      if (a.flow === 'complaint') {
        await m.delete(Ticket, { callId: a.callId });
        if (p.is_complaint) {
          await m.save(Ticket, {
            callId: a.callId,
            title: String(p.title ?? 'Khiếu nại từ cuộc gọi').slice(0, 200),
            category: p.category ?? null,
            priority: PRIORITIES.includes(p.priority) ? p.priority : 'medium',
            escalated: p.escalate === true,
            description: p.description ?? null,
          });
        }
      }

      if (a.flow === 'lead') {
        await m.delete(Lead, { callId: a.callId });
        const score = Math.max(0, Math.min(100, Math.round(Number(p.score) || 0)));
        await m.save(Lead, {
          callId: a.callId,
          name: p.name ?? null,
          phone: p.phone ?? null,
          score,
          stage: score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold',
          interest: p.interest ?? null,
          notes: p.notes ?? null,
        });
      }
    });
    return { ok: true };
  }

  async markFailed(id: number, error: string) {
    await this.repo.update(id, { status: 'FAILED', error });
    return { ok: true };
  }

  list(callId?: number) {
    return this.repo.find({
      where: callId ? { callId } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  listTickets() {
    return this.tickets.find({ order: { createdAt: 'DESC' } });
  }

  async updateTicket(id: number, b: { status?: string; escalated?: boolean }) {
    const patch: Partial<Ticket> = {};
    if (b.status && TICKET_STATUS.includes(b.status)) patch.status = b.status;
    if (typeof b.escalated === 'boolean') patch.escalated = b.escalated;
    await this.tickets.update(id, patch);
    return this.tickets.findOneBy({ id });
  }

  listLeads() {
    return this.leads.find({ order: { score: 'DESC', createdAt: 'DESC' } });
  }

  // Số liệu cho dashboard
  async stats() {
    const [calls] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status='DONE')::int AS done,
              COUNT(*) FILTER (WHERE status='FAILED')::int AS failed
       FROM calls`,
    );
    const sentiment = await this.dataSource.query(
      `SELECT sentiment, COUNT(*)::int AS count FROM summaries GROUP BY sentiment`,
    );
    const [quality] = await this.dataSource.query(
      `SELECT ROUND(AVG((result->>'score_total')::numeric), 1) AS avg
       FROM analyses
       WHERE flow='quality' AND status='DONE'
         AND (result->>'score_total') ~ '^[0-9.]+$'`,
    );
    const tickets = await this.dataSource.query(
      `SELECT status, COUNT(*)::int AS count FROM tickets GROUP BY status`,
    );
    const leads = await this.dataSource.query(
      `SELECT stage, COUNT(*)::int AS count FROM leads GROUP BY stage`,
    );
    const perDay = await this.dataSource.query(
      `SELECT to_char("createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS count
       FROM calls GROUP BY 1 ORDER BY 1 DESC LIMIT 14`,
    );
    return {
      calls,
      sentiment,
      avgQuality: quality?.avg ? Number(quality.avg) : null,
      tickets,
      leads,
      perDay: perDay.reverse(),
    };
  }
}