"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  PriorityBadge, SentimentBadge, StageBadge, StatusBadge,
} from "@/components/Badges";
import {
  API, type Analysis, type CallDetail, asObj, fmtDate, getAnalyses, getCall,
  latestByFlow, overallStatus,
} from "@/lib/api";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function AnalysisCard({ a }: { a: Analysis }) {
  const r = asObj(a.result);

  if (a.status === "FAILED")
    return (
      <section className={card}>
        <h2 className="mb-2 font-semibold">Luồng {a.flow}: thất bại</h2>
        <p className="text-sm text-rose-600">{a.error ?? "Lỗi không rõ"}</p>
      </section>
    );
  if (a.status !== "DONE")
    return (
      <section className={card}>
        <h2 className="mb-2 font-semibold">Luồng {a.flow}</h2>
        <p className="text-sm text-amber-700">Đang xử lý...</p>
      </section>
    );

  if (a.flow === "quality") {
    const total = Number(r.score_total) || 0;
    const criteria: { name: string; score: number; comment?: string }[] = r.criteria ?? [];
    const bad: string[] = r.forbidden_words_found ?? [];
    return (
      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Chất lượng cuộc gọi</h2>
          <span className="text-2xl font-semibold">{total}<span className="text-sm text-slate-400">/100</span></span>
        </div>
        <ScoreBar value={total} max={100} />
        <ul className="mt-4 space-y-3">
          {criteria.map((c) => (
            <li key={c.name}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-slate-500">{c.score}/20</span>
              </div>
              <ScoreBar value={c.score} max={20} />
              {c.comment && <p className="mt-1 text-xs text-slate-500">{c.comment}</p>}
            </li>
          ))}
        </ul>
        {bad.length > 0 && (
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            Từ không phù hợp: {bad.join(", ")}
          </p>
        )}
        {r.summary && <p className="mt-4 text-sm text-slate-700">{r.summary}</p>}
      </section>
    );
  }

  if (a.flow === "complaint") {
    return (
      <section className={card}>
        <h2 className="mb-3 font-semibold">Khiếu nại</h2>
        {r.is_complaint ? (
          <div className="space-y-2 text-sm">
            <p className="text-base font-medium">{r.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={r.priority ?? "medium"} />
              {r.category && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">{r.category}</span>}
              {r.escalate && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">Cần escalate</span>}
            </div>
            <p className="text-slate-700">{r.description}</p>
            <Link href="/tickets" className="inline-block text-indigo-600 hover:underline">Xem trong danh sách ticket</Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không phải cuộc gọi khiếu nại. {r.description}</p>
        )}
      </section>
    );
  }

  if (a.flow === "lead") {
    const score = Number(r.score) || 0;
    const stage = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
    return (
      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Khách tiềm năng</h2>
          <StageBadge stage={stage} />
        </div>
        <div className="mb-1 flex justify-between text-sm">
          <span>Điểm tiềm năng</span>
          <span className="font-medium">{score}/100</span>
        </div>
        <ScoreBar value={score} max={100} />
        <dl className="mt-4 space-y-2 text-sm">
          {r.interest && <div><dt className="text-slate-500">Quan tâm</dt><dd>{r.interest}</dd></div>}
          {r.notes && <div><dt className="text-slate-500">Bước tiếp theo</dt><dd>{r.notes}</dd></div>}
        </dl>
      </section>
    );
  }

  return null;
}

export default function CallView({ id }: { id: string }) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([getCall(id), getAnalyses(Number(id))]);
      setCall(c);
      setAnalyses(a);
      setError("");
    } catch {
      setError("Không tải được cuộc gọi này.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const status = call ? overallStatus(call, analyses) : "PENDING";
  const active = status === "PROCESSING" || status === "PENDING";
  useEffect(() => {
    if (!active) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [active, load]);

  if (error) return <p className="text-rose-600">{error}</p>;
  if (!call) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <Link href="/calls" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <ArrowLeft size={14} /> Quay lại danh sách
      </Link>

      <div className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            Cuộc gọi #{call.id} · {call.customerName ?? "Khách chưa rõ tên"}
          </h1>
          <StatusBadge status={status} />
          {call.summary && <SentimentBadge sentiment={call.summary.sentiment} />}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {call.phone ?? "Không có số điện thoại"} · {fmtDate(call.createdAt)}
        </p>
        <audio controls className="mt-4 w-full" src={`${API}/uploads/${call.audioFilename}`} />
      </div>

      {active && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          AI đang xử lý cuộc gọi, trang tự cập nhật khi xong...
        </p>
      )}
      {call.status === "FAILED" && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          Luồng tóm tắt thất bại: {call.error ?? "Lỗi không rõ"}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {call.summary && (
          <section className={card}>
            <h2 className="mb-2 font-semibold">Tóm tắt</h2>
            <p className="text-sm leading-relaxed">{call.summary.summary}</p>
            {call.summary.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {call.summary.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">{k}</span>
                ))}
              </div>
            )}
          </section>
        )}

        {call.summary && (
          <section className={card}>
            <h2 className="mb-2 font-semibold">Action items</h2>
            {call.actionItems.length === 0 ? (
              <p className="text-sm text-slate-500">Không có việc cần làm.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {call.actionItems.map((it) => (
                  <li key={it.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>{it.task}</span>
                    <span className="text-slate-500">
                      {it.owner ?? "Chưa giao"}
                      {it.dueDate ? ` · hạn ${it.dueDate}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {latestByFlow(analyses).map((a) => (
          <AnalysisCard key={a.flow} a={a} />
        ))}
      </div>

      {call.transcript && (
        <section className={card}>
          <h2 className="mb-2 font-semibold">
            Transcript {call.transcript.language ? `(${call.transcript.language})` : ""}
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {call.transcript.content || "(Không có lời thoại)"}
          </p>
        </section>
      )}
    </div>
  );
}