export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Call = {
  id: number;
  customerName: string | null;
  phone: string | null;
  audioFilename: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  error: string | null;
  createdAt: string;
};

export type CallDetail = Call & {
  transcript: { content: string; language: string | null } | null;
  summary: { summary: string; sentiment: string; keywords: string[] } | null;
  actionItems: {
    id: number;
    task: string;
    owner: string | null;
    dueDate: string | null;
    status: string;
  }[];
};

export async function getCalls(): Promise<Call[]> {
  const res = await fetch(`${API}/calls`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getCall(id: string): Promise<CallDetail> {
  const res = await fetch(`${API}/calls/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function uploadCall(form: FormData): Promise<Call> {
  const res = await fetch(`${API}/calls`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload lỗi: HTTP ${res.status}`);
  return res.json();
}

export const fmtDate = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });