import { notFound } from "next/navigation";
import { loadMeta } from "@/lib/studio/projectStore";
import { LiveEditor } from "./_components/LiveEditor";

export const dynamic = "force-dynamic";

export default function LiveProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const meta = loadMeta(params.id);
  if (!meta) notFound();
  return <LiveEditor initial={meta} />;
}
