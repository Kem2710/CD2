"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { FLOWS, uploadCall } from "@/lib/api";

export default function UploadForm({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file") as File;

    if (!file || file.size === 0) {
      setError("Vui lòng chọn file audio.");
      return;
    }
    if (data.getAll("flows").length === 0) {
      setError("Chọn ít nhất một luồng phân tích.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await uploadCall(data);
      form.reset();
      setFileName("");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Tải lên cuộc gọi mới</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="customerName" placeholder="Tên khách hàng" className={input} />
        <input name="phone" placeholder="Số điện thoại" className={input} />
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50/40">
        <UploadCloud size={22} className="text-indigo-500" />
        <span>{fileName || "Chọn file audio (mp3, wav, m4a...) tối đa 20MB"}</span>
        <input
          name="file"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Luồng phân tích</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FLOWS.map((f) => (
            <label key={f.key} className="cursor-pointer">
              <input type="checkbox" name="flows" value={f.key} defaultChecked className="peer sr-only" />
              <div className="rounded-xl border border-slate-200 p-3 transition peer-checked:border-indigo-500 peer-checked:bg-indigo-50">
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Đang tải lên..." : "Tải lên và phân tích"}
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </form>
  );
}