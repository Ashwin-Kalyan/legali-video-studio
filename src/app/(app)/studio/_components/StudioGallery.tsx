"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconX,
  IconUpload,
  IconPlayerPlayFilled,
  IconClock,
  IconSparkles,
  IconLoader2,
  IconVideo,
  IconBrandInstagram,
} from "@tabler/icons-react";
import { PageHeader, BrandChip } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { cn, formatTimecode, shortDate } from "@/lib/utils";
import { getBrand } from "@/lib/data";
import type { BrandSlug } from "@/lib/types";
import type { LiveProject, LiveStatus } from "@/lib/studio/projectStore";

const STATUS_META: Record<
  LiveStatus,
  { tone: "warn" | "success" | "info" | "danger"; label: string }
> = {
  uploaded: { tone: "warn", label: "Queued" },
  analyzing: { tone: "warn", label: "AI editing" },
  ready: { tone: "info", label: "Cuts ready" },
  rendering: { tone: "warn", label: "Rendering" },
  rendered: { tone: "success", label: "Rendered" },
  error: { tone: "danger", label: "Failed" },
};

const IN_PROGRESS: LiveStatus[] = ["uploaded", "analyzing", "rendering"];

const UPLOAD_BRANDS: { slug: BrandSlug; label: string }[] = [
  { slug: "lea", label: "Lea" },
  { slug: "my", label: "MyLegali" },
  { slug: "team", label: "TeamLegali" },
  { slug: "learn", label: "LegaliLearn" },
];

function durationLabel(s: number): string {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  return formatTimecode(s * 1000).replace(/\.\d+$/, "");
}

export function StudioGallery({
  projects: initial,
}: {
  projects: LiveProject[];
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [projects, setProjects] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/list", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.projects)) setProjects(data.projects);
    } catch {
      /* keep current list on failure */
    }
  }, []);

  // Re-read the list whenever the user arrives / returns to this page so a
  // project they just created shows up (bypasses Next's client router cache).
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  // While anything is still processing, poll so cards flip to ready/rendered.
  useEffect(() => {
    if (!projects.some((p) => IN_PROGRESS.includes(p.status))) return;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [projects, refresh]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <PageHeader
        label="Module 2 — AI Cut Studio"
        title="Video Studio"
        subtitle="Upload raw footage — Gemini watches it and FFmpeg cuts it for you into platform-ready vertical edits."
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

      {showUpload && <UploadDropzone />}

      {/* Projects ---------------------------------------------------------- */}
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
          Projects
        </span>
        {projects.length > 0 && (
          <span className="flex items-center gap-1 font-mono text-[0.62rem] text-muted">
            <IconVideo size={13} stroke={1.75} />
            {projects.length}
          </span>
        )}
        <span className="h-px flex-1 bg-rule" />
      </div>

      {projects.length === 0 && !showUpload ? (
        <StartSomethingNew onClick={() => setShowUpload(true)} />
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AddTile onClick={() => setShowUpload(true)} />
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — one big plus.
// ---------------------------------------------------------------------------
function StartSomethingNew({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-rule bg-surface-2 py-24 text-center transition-colors hover:border-accent hover:bg-accent-soft/40"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent/30 bg-surface text-accent shadow-card transition-transform group-hover:scale-105 group-hover:border-accent">
        <IconPlus size={36} stroke={2} />
      </span>
      <span className="font-display text-2xl font-bold text-ink">
        Start something new
      </span>
      <span className="max-w-sm text-sm text-muted">
        Upload a video and the AI will cut it for you.
      </span>
    </button>
  );
}

// Add-new tile shown alongside existing projects.
function AddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-rule bg-surface-2 text-center transition-colors hover:border-accent hover:bg-accent-soft/40"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent/30 bg-surface text-accent transition-transform group-hover:scale-105">
        <IconPlus size={26} stroke={2} />
      </span>
      <span className="font-display text-base font-bold text-ink">
        Start something new
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Upload dropzone — real file picker (opens Finder), drag-drop, brand select.
// ---------------------------------------------------------------------------
function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState<BrandSlug>("lea");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file (MP4, MOV, etc.)");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("brand", brand);
      const res = await fetch("/api/studio/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.id) {
        router.push(`/studio/ai/${data.id}`);
      } else {
        setError(data.error || "Upload failed");
        setUploading(false);
      }
    } catch (e) {
      setError(String(e));
      setUploading(false);
    }
  }

  return (
    <div className="mb-7 animate-fade-up overflow-hidden rounded-2xl border border-rule bg-surface p-1.5 shadow-card">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading)
            inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !uploading) handleFile(f);
        }}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          uploading
            ? "border-accent/40 bg-accent-soft/40"
            : dragOver
              ? "border-accent bg-accent-soft"
              : "border-accent/40 bg-gradient-to-b from-accent-soft/60 to-surface hover:border-accent",
        )}
      >
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
          {uploading ? (
            <IconLoader2 size={26} stroke={1.8} className="animate-spin text-accent" />
          ) : (
            <IconUpload size={26} stroke={1.6} className="text-accent" />
          )}
        </span>
        <p className="font-display text-xl font-bold text-ink">
          {uploading ? "Uploading & starting the AI…" : "Drop your raw footage here"}
        </p>
        {uploading ? (
          <p className="mt-1.5 text-sm text-muted">
            You&apos;ll jump straight into the edit when it&apos;s ready.
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-muted">
              or{" "}
              <span className="font-medium text-accent underline-offset-2 hover:underline">
                browse files
              </span>{" "}
              — Gemini watches it and FFmpeg cuts it for you
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Tag tone="neutral">MP4</Tag>
              <Tag tone="neutral">MOV</Tag>
              <Tag tone="neutral">WEBM</Tag>
              <span className="font-mono text-[0.7rem] text-muted">up to 300MB</span>
            </div>
          </>
        )}
      </div>

      {!uploading && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3">
          <span className="font-mono text-[0.62rem] uppercase tracking-wide text-muted">
            Brand kit
          </span>
          {UPLOAD_BRANDS.map((b) => (
            <button
              key={b.slug}
              onClick={() => setBrand(b.slug)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                brand === b.slug
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-rule bg-surface text-muted hover:border-accent/40",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="px-4 pb-3 text-center text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Real project card
// ---------------------------------------------------------------------------
function ProjectCard({ project }: { project: LiveProject }) {
  const brand = getBrand((project.brandSlug as BrandSlug) ?? "lea");
  const status = STATUS_META[project.status] ?? STATUS_META.ready;
  const inProgress = IN_PROGRESS.includes(project.status);
  const title = project.filename.replace(/\.[^.]+$/, "");
  const gradient = `linear-gradient(155deg, ${brand.primaryColor}, ${brand.secondaryColor})`;

  return (
    <Link
      href={`/studio/ai/${project.id}`}
      className="group block overflow-hidden rounded-xl border border-rule bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-noise opacity-50" />
        <div className="absolute left-2.5 top-2.5 z-10">
          <Tag tone={status.tone} className="shadow-sm">
            {inProgress && (
              <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulseDot rounded-full bg-current" />
            )}
            {status.label}
          </Tag>
        </div>
        <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5">
          {project.publishedTo && project.publishedTo.length > 0 && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md text-white shadow-sm"
              style={{
                background:
                  "linear-gradient(95deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
              }}
              title={`Published to Instagram @${project.publishedTo[0].account}`}
            >
              <IconBrandInstagram size={13} stroke={2} />
            </span>
          )}
          <span className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[0.62rem] font-medium text-white backdrop-blur-sm">
            {durationLabel(project.durationS)}
          </span>
        </div>
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
                AI editing
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
        <div className="absolute bottom-2.5 right-2.5 text-lg opacity-80">
          {brand.emoji}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      <div className="p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
          {title}
        </h3>
        <div className="mt-2.5 flex items-center gap-2">
          <BrandChip slug={project.brandSlug as BrandSlug} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-rule pt-2.5">
          <span className="truncate font-mono text-[0.66rem] text-muted">
            {project.candidates?.length
              ? `${project.candidates.length} AI cuts`
              : "Processing…"}
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
