"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconPlus,
  IconX,
  IconUpload,
  IconPlayerPlayFilled,
  IconAlertTriangle,
  IconMicrophone,
  IconEye,
  IconLayoutGrid,
  IconClock,
  IconSparkles,
  IconVideo,
} from "@tabler/icons-react";
import { PageHeader, BrandChip } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { cn, formatTimecode, shortDate } from "@/lib/utils";
import { VIDEO_PROJECTS, getBrand } from "@/lib/data";
import type {
  VideoProject,
  ProjectStatus,
  BrandSlug,
} from "@/lib/types";

// --- status → tag tone + label --------------------------------------------
const STATUS_META: Record<
  ProjectStatus,
  { tone: "warn" | "success" | "info"; label: string }
> = {
  uploading: { tone: "warn", label: "Uploading" },
  transcribing: { tone: "warn", label: "Transcribing" },
  analyzing: { tone: "warn", label: "Analyzing" },
  ready: { tone: "success", label: "Ready" },
  exported: { tone: "success", label: "Exported" },
};

const IN_PROGRESS: ProjectStatus[] = ["uploading", "transcribing", "analyzing"];

// --- AI Context Engine layers (PRD 5.3) ------------------------------------
const ENGINE_LAYERS = [
  {
    icon: IconMicrophone,
    label: "Speech",
    title: "Whisper v3",
    desc: "Clarity, emotion & hook potential scored per 5s segment.",
    color: "#7c3aed",
    soft: "bg-accent-soft",
    ink: "text-accent-ink",
  },
  {
    icon: IconEye,
    label: "Visual",
    title: "GPT-4V · 1fps",
    desc: "Eye contact, lighting & stability scored per frame.",
    color: "#0891b2",
    soft: "bg-cyan-soft",
    ink: "text-cyan-ink",
  },
  {
    icon: IconSparkles,
    label: "Brand Voice",
    title: "Claude align",
    desc: "Voice fit + prohibited-phrase safety on every candidate.",
    color: "#db2777",
    soft: "bg-pink-soft",
    ink: "text-pink-ink",
  },
  {
    icon: IconLayoutGrid,
    label: "Format",
    title: "Constraints",
    desc: "Duration, pacing, CTA window & 3s hook gate enforced.",
    color: "#059669",
    soft: "bg-success-soft",
    ink: "text-success-ink",
  },
];

const BRAND_FILTERS: { slug: BrandSlug | "all"; label: string }[] = [
  { slug: "all", label: "All brands" },
  { slug: "lea", label: "Lea" },
  { slug: "my", label: "MyLegali" },
  { slug: "team", label: "TeamLegali" },
  { slug: "learn", label: "LegaliLearn" },
];

function durationLabel(s: number): string {
  if (s < 60) return `${s}s`;
  return formatTimecode(s * 1000).replace(/\.\d+$/, "");
}

export function StudioGallery() {
  const [showUpload, setShowUpload] = useState(false);
  const [brand, setBrand] = useState<BrandSlug | "all">("all");

  const projects = VIDEO_PROJECTS.filter(
    (p) => brand === "all" || p.brandSlug === brand,
  );

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <PageHeader
        label="Module 2 — AI Cut Studio"
        title="Video Studio"
        subtitle="Upload raw footage, let the AI context engine score it, and ship platform-ready cuts on brand."
        actions={
          <Button
            variant={showUpload ? "outline" : "primary"}
            onClick={() => setShowUpload((v) => !v)}
          >
            {showUpload ? (
              <IconX size={16} stroke={2} />
            ) : (
              <IconPlus size={16} stroke={2} />
            )}
            {showUpload ? "Close" : "New Project"}
          </Button>
        }
      />

      {/* Upload dropzone (faux) ------------------------------------------- */}
      {showUpload && <UploadDropzone />}

      {/* AI Context Engine strip ----------------------------------------- */}
      <section className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
            AI Context Engine
          </span>
          <span className="font-mono text-[0.62rem] text-muted">
            4 layers · parallel · &lt;30s
          </span>
          <span className="h-px flex-1 bg-rule" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENGINE_LAYERS.map((layer, i) => (
            <div
              key={layer.label}
              className="group relative overflow-hidden rounded-xl border border-rule bg-surface p-4 shadow-card transition-shadow hover:shadow-card-lg"
            >
              <span
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: layer.color }}
              />
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    layer.soft,
                  )}
                >
                  <layer.icon
                    size={18}
                    stroke={1.75}
                    className={layer.ink}
                  />
                </span>
                <span className="font-mono text-[0.62rem] uppercase tracking-wide text-muted">
                  L{i + 1}
                </span>
              </div>
              <div className="mt-3 font-display text-base font-bold text-ink">
                {layer.label}
              </div>
              <div className="font-mono text-[0.62rem] uppercase tracking-wide text-accent">
                {layer.title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {layer.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Filter row ------------------------------------------------------- */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {BRAND_FILTERS.map((f) => {
            const active = brand === f.slug;
            return (
              <button
                key={f.slug}
                onClick={() => setBrand(f.slug)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-rule bg-surface text-muted hover:border-accent/40 hover:text-ink",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted">
          <IconVideo size={14} stroke={1.75} />
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Project grid ----------------------------------------------------- */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rule bg-surface-2 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">
            No projects for this brand yet
          </p>
          <p className="mt-1 text-sm text-muted">
            Upload raw footage to start a new cut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload dropzone (faux, PRD step 1)
// ---------------------------------------------------------------------------
function UploadDropzone() {
  return (
    <div className="mb-7 animate-fade-up rounded-2xl border border-rule bg-surface p-1.5 shadow-card">
      <div className="rounded-xl border-2 border-dashed border-accent/40 bg-gradient-to-b from-accent-soft/60 to-surface px-6 py-10 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
          <IconUpload size={26} stroke={1.6} className="text-accent" />
        </span>
        <p className="font-display text-xl font-bold text-ink">
          Drop your raw footage here
        </p>
        <p className="mt-1.5 text-sm text-muted">
          or{" "}
          <span className="font-medium text-accent underline-offset-2 hover:underline">
            browse files
          </span>{" "}
          — chunked upload to Supabase Storage
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Tag tone="neutral">MP4</Tag>
          <Tag tone="neutral">MOV</Tag>
          <Tag tone="neutral">HEVC</Tag>
          <span className="font-mono text-[0.7rem] text-muted">up to 4GB</span>
        </div>
        <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-lg border border-rule bg-white/70 px-3 py-2 text-xs text-muted">
          <IconSparkles size={14} stroke={1.75} className="text-accent" />
          Auto-transcription (Whisper v3) starts the moment upload completes.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project card
// ---------------------------------------------------------------------------
function ProjectCard({ project }: { project: VideoProject }) {
  const brand = getBrand(project.brandSlug);
  const status = STATUS_META[project.status];
  const inProgress = IN_PROGRESS.includes(project.status);
  const needsApproval = project.approvalStatus === "pending";

  const hue = project.thumbnailHue;
  const gradient = `linear-gradient(155deg, hsl(${hue} 70% 22%), hsl(${
    (hue + 28) % 360
  } 65% 38%) 60%, hsl(${(hue + 8) % 360} 60% 14%))`;

  return (
    <Link
      href={`/studio/${project.id}`}
      className="group block overflow-hidden rounded-xl border border-rule bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
    >
      {/* 9:16-ish thumbnail */}
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-noise opacity-60" />
        {/* status + approval tags */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap items-center gap-1.5">
          <Tag tone={status.tone} className="shadow-sm">
            {inProgress && (
              <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulseDot rounded-full bg-current" />
            )}
            {status.label}
          </Tag>
          {needsApproval && (
            <Tag tone="warn" className="shadow-sm">
              <IconAlertTriangle size={11} stroke={2} />
              Needs approval
            </Tag>
          )}
        </div>

        {/* duration chip */}
        <div className="absolute right-2.5 top-2.5 z-10 rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[0.62rem] font-medium text-white backdrop-blur-sm">
          {durationLabel(project.durationS)}
        </div>

        {/* play affordance */}
        <div className="absolute inset-0 flex items-center justify-center">
          {inProgress ? (
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
                <IconSparkles
                  size={22}
                  stroke={1.6}
                  className="animate-pulseDot text-white"
                />
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-wide text-white/70">
                Processing
              </span>
            </div>
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110">
              <IconPlayerPlayFilled
                size={22}
                className="ml-0.5 text-white drop-shadow"
              />
            </span>
          )}
        </div>

        {/* brand emoji watermark */}
        <div className="absolute bottom-2.5 right-2.5 text-lg opacity-80">
          {brand.emoji}
        </div>
        {/* bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-12 font-mono text-[0.62rem] uppercase tracking-wide text-white/70">
          {project.id}
        </div>
      </div>

      {/* meta */}
      <div className="p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
          {project.title}
        </h3>
        <div className="mt-2.5 flex items-center gap-2">
          <BrandChip slug={project.brandSlug} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-rule pt-2.5">
          <span className="truncate font-mono text-[0.66rem] text-muted">
            {project.templateName}
          </span>
          <span className="flex shrink-0 items-center gap-1 font-mono text-[0.66rem] text-muted">
            <IconClock size={11} stroke={1.75} />
            {shortDate(project.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
