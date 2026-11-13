"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CheckCircle2, Flame, Gauge, PhoneCall, Ticket } from "lucide-react";
import { StatusBadge } from "@/components/Badges";
import {
  type Analysis, type Call, type Stats, fmtDate, getAnalyses, getCalls,
  getStats, overallStatus,
} from "@/lib/api";

const SENT_LABEL: Record<string, string> = {
  positive: "Tích cực",
  neutral: "Trung lập",
  negative: "Tiêu cực",
};
const SENT_COLOR: Record<string, string> = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#f43f5e",
};

function StatCard({
  icon: Icon, label, value, hint, tone,
}: {
  icon: React.ElementType; label: string; value: string | number; hint?: string; tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, c, a] = await Promise.all([getStats(), getCalls(), getAnalyses()]);
      setStats(s);
      setCalls(c);
      setAnalyses(a);
      setError("");
    } catch {
      setError("Không kết nối được backend (http://localhost:3001). Hãy kiểm tra NestJS đang chạy.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!stats) return <p className="text-slate-500">Đang tải...</p>;

  const openTickets = stats.tickets
    .filter((t) => t.status !== "RESOLVED")
    .reduce((n, t) => n + t.count, 0);
  const hotLeads = stats.leads.find((l) => l.stage === "hot")?.count ?? 0;
  const doneRate = stats.calls.total ? Math.round((stats.calls.done / stats.calls.total) * 100) : 0;

  const pie = stats.sentiment.map((s) => ({
    name: SENT_LABEL[s.sentiment] ?? s.sentiment,
    value: s.count,
    color: SENT_COLOR[s.sentiment] ?? "#94a3b8",
  }));
  const bars = stats.perDay.map((d) => ({ ngay: d.day.slice(5), "Cuộc gọi": d.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quan</h1>
          <p className="text-sm text-slate-500">Số liệu từ các luồng n8n đã xử lý</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
            Làm mới
          </button>
          <Link href="/calls" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Tải lên cuộc gọi
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={PhoneCall} label="Tổng cuộc gọi" value={stats.calls.total} tone="bg-indigo-100 text-indigo-600" />
        <StatCard icon={CheckCircle2} label="Tỷ lệ hoàn tất" value={`${doneRate}%`} hint={`${stats.calls.failed} cuộc gọi lỗi`} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={Gauge} label="Điểm chất lượng TB" value={stats.avgQuality ?? "—"} hint="Thang 100" tone="bg-sky-100 text-sky-600" />
        <StatCard icon={Ticket} label="Ticket đang mở" value={openTickets} tone="bg-amber-100 text-amber-600" />
        <StatCard icon={Flame} label="Lead nóng" value={hotLeads} tone="bg-rose-100 text-rose-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold">Cuộc gọi theo ngày</h2>
          {bars.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ngay" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="Cuộc gọi" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Cảm xúc khách hàng</h2>
          {pie.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pie.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Cuộc gọi gần đây</h2>
          <Link href="/calls" className="text-sm text-indigo-600 hover:underline">Xem tất cả</Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {calls.slice(0, 5).map((c) => (
            <li key={c.id}>
              <Link href={`/calls/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                <div>
                  <p className="font-medium">#{c.id} · {c.customerName ?? "Khách chưa rõ tên"}</p>
                  <p className="text-xs text-slate-500">{fmtDate(c.createdAt)}</p>
                </div>
                <StatusBadge status={overallStatus(c, analyses.filter((a) => a.callId === c.id))} />
              </Link>
            </li>
          ))}
          {calls.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-400">Chưa có cuộc gọi nào</li>
          )}
        </ul>
      </div>
    </div>
  );
}