import { Suspense } from "react";
import CallView from "./CallView";

async function CallPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CallView id={id} />;
}

export default function CallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-slate-500">Đang tải cuộc gọi...</p>}>
      <CallPageContent params={params} />
    </Suspense>
  );
}
