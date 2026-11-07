const STATUS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-amber-100 text-amber-800",
  DONE: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  DONE: "Hoàn tất",
  FAILED: "Lỗi",
};

const SENTIMENT: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-700",
  negative: "bg-red-100 text-red-800",
};

const SENTIMENT_LABEL: Record<string, string> = {
  positive: "Tích cực",
  neutral: "Trung lập",
  negative: "Tiêu cực",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[status] ?? STATUS.PENDING}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SENTIMENT[sentiment] ?? SENTIMENT.neutral}`}>
      {SENTIMENT_LABEL[sentiment] ?? sentiment}
    </span>
  );
}