"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SentimentBadge, StatusBadge } from "@/components/Badges";
import { API, type CallDetail, fmtDate, getCall } from "@/lib/api";

export default function CallView({ id }: { id: string }) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setCall(await getCall(id));
      setError("");
    } catch {
      setError("Không tải được cuộc gọi này.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const active = call?.status === "PENDING" || call?.status === "PROCESSING";
  useEffect(() => {
    if (!active) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [active, load]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!call) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Quay lại danh sách
      </Link>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            Cuộc gọi #{call.id} · {call.customerName ?? "Khách chưa rõ tên"}
          </h1>
          <StatusBadge status={call.status} />
          {call.summary && <SentimentBadge sentiment={call.summary.sentiment} />}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {call.phone ?? "Không có số điện thoại"} · {fmtDate(call.createdAt)}
        </p>
        <audio controls className="mt-4 w-full" src={`${API}/uploads/${call.audioFilename}`} />
      </div>

      {active && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          AI đang xử lý cuộc gọi, trang tự cập nhật khi xong...
        </p>
      )}
      {call.status === "FAILED" && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Xử lý thất bại: {call.error ?? "Lỗi không rõ"}
        </p>
      )}

      {call.summary && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">Tóm tắt</h2>
          <p className="text-sm leading-relaxed">{call.summary.summary}</p>
          {call.summary.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {call.summary.keywords.map((k) => (
                <span key={k} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">
                  {k}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {call.status === "DONE" && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">Action items</h2>
          {call.actionItems.length === 0 ? (
            <p className="text-sm text-gray-500">Không có việc cần làm.</p>
          ) : (
            <ul className="divide-y text-sm">
              {call.actionItems.map((it) => (
                <li key={it.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{it.task}</span>
                  <span className="text-gray-500">
                    {it.owner ?? "Chưa giao"}
                    {it.dueDate ? ` · hạn ${it.dueDate}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {call.transcript && (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">
            Transcript {call.transcript.language ? `(${call.transcript.language})` : ""}
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {call.transcript.content || "(Không có lời thoại)"}
          </p>
        </section>
      )}
    </div>
  );
}