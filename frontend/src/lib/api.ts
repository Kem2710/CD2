export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = Record<string, any>;

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

export type Analysis = {
  id: number;
  callId: number;
  flow: string;
  status: string;
  result: Json | null;
  error: string | null;
  createdAt: string;
};

export type Ticket = {
  id: number;
  callId: number;
  title: string;
  category: string | null;
  priority: string;
  status: string;
  escalated: boolean;
  description: string | null;
  createdAt: string;
};

export type Lead = {
  id: number;
  callId: number;
  name: string | null;
  phone: string | null;
  score: number;
  stage: string;
  interest: string | null;
  notes: string | null;
  createdAt: string;
};

export type Stats = {
  calls: { total: number; done: number; failed: number };
  sentiment: { sentiment: string; count: number }[];
  avgQuality: number | null;
  tickets: { status: string; count: number }[];
  leads: { stage: string; count: number }[];
  perDay: { day: string; count: number }[];
};

export const FLOWS = [
  { key: "summary", label: "Tóm tắt", desc: "Tóm tắt, sentiment, action items" },
  { key: "quality", label: "Chất lượng", desc: "Chấm điểm nhân viên" },
  { key: "complaint", label: "Khiếu nại", desc: "Tạo ticket, mức ưu tiên" },
  { key: "lead", label: "Khách tiềm năng", desc: "Chấm điểm lead" },
] as const;

export const flowLabel = (k: string) => FLOWS.find((f) => f.key === k)?.label ?? k;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getCalls = () => http<Call[]>("/calls");
export const getCall = (id: string) => http<CallDetail>(`/calls/${id}`);
export const getAnalyses = (callId?: number) =>
  http<Analysis[]>(callId ? `/analyses?callId=${callId}` : "/analyses");
export const getTickets = () => http<Ticket[]>("/tickets");
export const getLeads = () => http<Lead[]>("/leads");
export const getStats = () => http<Stats>("/stats");
export const updateTicket = (id: number, body: { status?: string; escalated?: boolean }) =>
  http<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export async function uploadCall(form: FormData): Promise<Call> {
  const res = await fetch(`${API}/calls`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload lỗi: HTTP ${res.status}`);
  return res.json();
}

// Mỗi luồng có thể chạy nhiều lần, chỉ lấy lần mới nhất
export function latestByFlow(list: Analysis[]): Analysis[] {
  const seen = new Map<string, Analysis>();
  const sorted = [...list].sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt));
  for (const a of sorted) if (!seen.has(a.flow)) seen.set(a.flow, a);
  return [...seen.values()];
}

// Trạng thái tổng hợp của một cuộc gọi (gộp cả các luồng phân tích)
export function overallStatus(call: Call, list: Analysis[]): Call["status"] {
  const latest = latestByFlow(list);
  if (call.status === "FAILED" || latest.some((a) => a.status === "FAILED")) return "FAILED";
  if (
    call.status === "PENDING" ||
    call.status === "PROCESSING" ||
    latest.some((a) => a.status === "PROCESSING")
  )
    return "PROCESSING";
  return "DONE";
}

export const asObj = (x: unknown): Json =>
  ((Array.isArray(x) ? x[0] : x) as Json | undefined) ?? {};

export const fmtDate = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });