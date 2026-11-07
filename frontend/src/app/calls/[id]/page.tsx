import { Suspense } from "react";
import CallView from "./CallView";

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CallView id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-gray-500">Đang tải...</p>}>
      <Loader params={params} />
    </Suspense>
  );
}