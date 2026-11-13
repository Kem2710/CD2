"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FlowChip, StatusBadge } from "@/components/Badges";
import UploadForm from "@/components/UploadForm";
import {
  type Analysis, type Call, fmtDate, flowLabel, getAnalyses, getCalls,
  latestByFlow, overallStatus,
} from "@/lib/api";

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return Promise.all([getCalls(), getAnalyses()])
      .then(([c, a]) => {
        setCalls(c);
        setAnalyses(a);
        setError("");
      })
      .catch(() => {
        setError("Không kết nối được backend (http://localhost:3001). Hãy kiểm tra NestJS đang chạy.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = calls.some((c) => overallStatus(c, analyses.filter((a) => a.callId === c.id)) === "PROCESSING");
  useEffect(() => {
    if (!active) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [active, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cuộc gọi</h1>
        <p className="text-sm text-slate-500">Tải file ghi âm lên, chọn luồng AI cần chạy</p>
      </div>

      <UploadForm onDone={load} />

      {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Các luồng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => {
              const mine = analyses.filter((a) => a.callId === c.id);
              return (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{c.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.customerName ?? "—"}</p>
                    <p className="text-xs text-slate-500">{c.phone ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {latestByFlow(mine).map((a) => (
                        <FlowChip key={a.flow} label={flowLabel(a.flow)} status={a.status} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={overallStatus(c, mine)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/calls/${c.id}`} className="text-indigo-600 hover:underline">Chi tiết</Link>
                  </td>
                </tr>
              );
            })}
            {calls.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Chưa có cuộc gọi nào. Hãy tải lên file audio đầu tiên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}