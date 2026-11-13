const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const STATUS: Record<string, [string, string]> = {
  PENDING: ["Chờ xử lý", "bg-slate-100 text-slate-700"],
  PROCESSING: ["Đang xử lý", "bg-amber-100 text-amber-800"],
  DONE: ["Hoàn tất", "bg-emerald-100 text-emerald-800"],
  FAILED: ["Lỗi", "bg-rose-100 text-rose-800"],
};

const SENTIMENT: Record<string, [string, string]> = {
  positive: ["Tích cực", "bg-emerald-100 text-emerald-800"],
  neutral: ["Trung lập", "bg-slate-100 text-slate-700"],
  negative: ["Tiêu cực", "bg-rose-100 text-rose-800"],
};

const PRIORITY: Record<string, [string, string]> = {
  low: ["Thấp", "bg-slate-100 text-slate-700"],
  medium: ["Trung bình", "bg-sky-100 text-sky-800"],
  high: ["Cao", "bg-amber-100 text-amber-800"],
  urgent: ["Khẩn cấp", "bg-rose-100 text-rose-800"],
};

const STAGE: Record<string, [string, string]> = {
  hot: ["Nóng", "bg-rose-100 text-rose-800"],
  warm: ["Ấm", "bg-amber-100 text-amber-800"],
  cold: ["Lạnh", "bg-sky-100 text-sky-800"],
};

function Badge({ map, value }: { map: Record<string, [string, string]>; value: string }) {
  const [label, cls] = map[value] ?? [value, "bg-slate-100 text-slate-700"];
  return <span className={`${pill} ${cls}`}>{label}</span>;
}

export const StatusBadge = ({ status }: { status: string }) => <Badge map={STATUS} value={status} />;
export const SentimentBadge = ({ sentiment }: { sentiment: string }) => (
  <Badge map={SENTIMENT} value={sentiment} />
);
export const PriorityBadge = ({ priority }: { priority: string }) => (
  <Badge map={PRIORITY} value={priority} />
);
export const StageBadge = ({ stage }: { stage: string }) => <Badge map={STAGE} value={stage} />;

const FLOW_DOT: Record<string, string> = {
  DONE: "bg-emerald-500",
  PROCESSING: "bg-amber-500 animate-pulse",
  FAILED: "bg-rose-500",
};

export function FlowChip({ label, status }: { label: string; status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
      <span className={`h-1.5 w-1.5 rounded-full ${FLOW_DOT[status] ?? "bg-slate-400"}`} />
      {label}
    </span>
  );
}