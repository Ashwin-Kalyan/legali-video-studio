import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { getProject } from "@/lib/data";
import { BrandChip } from "@/components/ui/Misc";
import { StudioTabs } from "@/components/shell/StudioTabs";
import { SubtitleEditor } from "./_components/SubtitleEditor";

export default function SubtitlesPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Light top strip */}
      <div className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 md:px-8">
          <Link
            href={`/studio/${project.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent/40 hover:text-ink"
          >
            <IconArrowLeft size={15} stroke={1.75} />
            Back
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <div className="mb-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent">
                Subtitle studio
              </div>
              <h1 className="truncate font-display text-lg font-bold leading-tight tracking-tight text-ink">
                {project.title}
              </h1>
            </div>
            <BrandChip slug={project.brandSlug} />
          </div>

          <div className="ml-auto">
            <StudioTabs projectId={project.id} />
          </div>
        </div>
      </div>

      <SubtitleEditor project={project} />
    </div>
  );
}
