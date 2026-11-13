"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PriorityBadge } from "@/components/Badges";
import { type Ticket, fmtDate, getTickets, updateTicket } from "@/lib/api";

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "OPEN", label: "Mới" },
  { key: "IN_PROGRESS", label: "Đang xử lý" },
  { key: "RESOLVED", label: "Đã xong" },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTickets(await getTickets());
      setError("");
    } catch {
      setError("Không kết nối được backend.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function change(id: number, body: { status?: string; escalated?: boolean }) {
    await updateTicket(id, body);
    await load();
  }

  const shown = tab === "ALL" ? tickets : tickets.filter((t) => t.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Khiếu nại</h1>
        <p className="text-sm text-slate-500">Ticket được tạo tự động từ luồng Complaint</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === t.key ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={t.priority} />
              {t.category && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">{t.category}</span>}
              {t.escalated && (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">Escalated</span>
              )}
            </div>
            <h3 className="font-medium">{t.title}</h3>
            {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
            <p className="mt-2 text-xs text-slate-400">
              {fmtDate(t.createdAt)} ·{" "}
              <Link href={`/calls/${t.callId}`} className="text-indigo-600 hover:underline">
                Cuộc gọi #{t.callId}
              </Link>
            </p>
            <div className="mt-4 flex items-center gap-2">
              <select
                value={t.status}
                onChange={(e) => change(t.id, { status: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="OPEN">Mới</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="RESOLVED">Đã xong</option>
              </select>
              <button
                onClick={() => change(t.id, { escalated: !t.escalated })}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                {t.escalated ? "Bỏ escalate" : "Escalate"}
              </button>
            </div>
          </div>
        ))}
        {shown.length === 0 && !error && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
            Chưa có ticket nào. Ticket chỉ được tạo khi AI nhận ra cuộc gọi là khiếu nại.
          </p>
        )}
      </div>
    </div>
  );
}