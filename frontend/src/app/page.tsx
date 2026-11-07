"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/Badges";
import { type Call, fmtDate, getCalls, uploadCall } from "@/lib/api";

export default function Home() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      setCalls(await getCalls());
      setLoadError("");
    } catch {
      setLoadError("Không kết nối được backend (http://localhost:3001). Hãy kiểm tra NestJS đang chạy.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tự làm mới 3 giây/lần khi còn cuộc gọi đang xử lý
  const hasActive = calls.some((c) => c.status === "PENDING" || c.status === "PROCESSING");
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [hasActive, load]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file") as File;
    if (!file || file.size === 0) {
      setFormError("Vui lòng chọn file audio.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      await uploadCall(data);
      form.reset();
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Tải lên cuộc gọi mới</h2>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <input
            name="customerName"
            placeholder="Tên khách hàng"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="phone"
            placeholder="Số điện thoại"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="file"
            type="file"
            accept="audio/*"
            className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? "Đang tải lên..." : "Tải lên và phân tích"}
            </button>
            {formError && <span className="text-sm text-red-600">{formError}</span>}
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Danh sách cuộc gọi ({calls.length})</h2>
          <button onClick={load} className="text-sm text-indigo-600 hover:underline">
            Làm mới
          </button>
        </div>

        {loadError && (
          <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>
        )}

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Khách hàng</th>
                <th className="px-4 py-2">Số điện thoại</th>
                <th className="px-4 py-2">Thời gian</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{c.id}</td>
                  <td className="px-4 py-2">{c.customerName ?? "—"}</td>
                  <td className="px-4 py-2">{c.phone ?? "—"}</td>
                  <td className="px-4 py-2">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/calls/${c.id}`} className="text-indigo-600 hover:underline">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && !loadError && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Chưa có cuộc gọi nào. Hãy tải lên file audio đầu tiên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}