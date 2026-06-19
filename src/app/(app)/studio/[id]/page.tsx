import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { StudioTabs } from "@/components/shell/StudioTabs";
import { StudioEditor } from "./_components/StudioEditor";

export default function StudioEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const project = getProject(params.id);
  if (!project) notFound();

  return (
    <StudioEditor
      project={project}
      tabs={<StudioTabs projectId={params.id} />}
    />
  );
}
