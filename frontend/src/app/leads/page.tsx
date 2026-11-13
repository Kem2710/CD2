"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StageBadge } from "@/components/Badges";
import { type Lead, fmtDate, getLeads } from "@/lib/api";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return getLeads()
      .then((result) => {
        setLeads(result);
        setError("");
      })
      .catch(() => {
        setError("Không kết nối được backend.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bar = (s: number) => (s >= 70 ? "bg-rose-500" : s >= 40 ? "bg-amber-500" : "bg-sky-500");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Khách tiềm năng</h1>
        <p className="text-sm text-slate-500">Xếp theo điểm giảm dần, từ luồng Lead Qualification</p>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {leads.map((l) => (
          <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{l.name ?? "Chưa rõ tên"}</p>
                <p className="text-xs text-slate-500">{l.phone ?? "Không có số điện thoại"}</p>
              </div>
              <StageBadge stage={l.stage} />
            </div>

            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-500">Điểm tiềm năng</span>
              <span className="font-semibold">{l.score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${bar(l.score)}`} style={{ width: `${l.score}%` }} />
            </div>

            {l.interest && <p className="mt-3 text-sm"><span className="text-slate-500">Quan tâm: </span>{l.interest}</p>}
            {l.notes && <p className="mt-1 text-sm"><span className="text-slate-500">Tiếp theo: </span>{l.notes}</p>}

            <p className="mt-3 text-xs text-slate-400">
              {fmtDate(l.createdAt)} ·{" "}
              <Link href={`/calls/${l.callId}`} className="text-indigo-600 hover:underline">
                Cuộc gọi #{l.callId}
              </Link>
            </p>
          </div>
        ))}
        {leads.length === 0 && !error && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
            Chưa có lead nào. Hãy upload cuộc gọi bán hàng và chọn luồng Khách tiềm năng.
          </p>
        )}
      </div>
    </div>
  );
}