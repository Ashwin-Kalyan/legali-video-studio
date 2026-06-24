"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconPlayerPlayFilled,
  IconMicrophone,
  IconRobot,
  IconBooks,
  IconShieldCheck,
  IconShieldX,
  IconCheck,
  IconStarFilled,
  IconSparkles,
  IconBolt,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { BrandChip } from "@/components/ui/Misc";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";
import { getBrand } from "@/lib/data";
import type { VideoProject, CandidateEdit, VoiceType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Voice + export option config
// ---------------------------------------------------------------------------
const VOICE_OPTIONS: {
  type: VoiceType;
  label: string;
  icon: typeof IconMicrophone;
}[] = [
  { type: "recorded", label: "Record", icon: IconMicrophone },
  { type: "ai-clone", label: "AI Clone", icon: IconRobot },
  { type: "library", label: "Library", icon: IconBooks },
];

const EXPORT_OPTIONS: { id: string; label: string; sub: string }[] = [
  { id: "9:16", label: "9:16", sub: "Reels / TikTok / Shorts" },
  { id: "1:1", label: "1:1", sub: "Feed square" },
  { id: "4:5", label: "4:5", sub: "Portrait feed" },
];

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------
export function StudioEditor({
  project,
  tabs,
}: {
  project: VideoProject;
  tabs: ReactNode;
}) {
  const brand = getBrand(project.brandSlug);

  // live candidates (start from project; may be replaced by regenerate)
  const [candidates, setCandidates] = useState(project.candidates);
  const hasCandidates = candidates.length > 0;

  // regenerate state
  const [regenerating, setRegenerating] = useState(false);
  const [source, setSource] = useState<"gemini" | "sample" | "error" | null>(
    null,
  );

  // selected candidate (index into candidates)
  const initialSel =
    project.selectedCandidate < project.candidates.length
      ? project.selectedCandidate
      : 0;
  const [selected, setSelected] = useState(initialSel);

  async function handleRegenerate() {
    if (regenerating || !hasCandidates) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/cuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
        setCandidates(data.candidates);
        setSelected(0);
      }
      if (data?.source) setSource(data.source);
    } catch {
      setSource("error");
    } finally {
      setRegenerating(false);
    }
  }
  const [voice, setVoice] = useState<VoiceType>(
    project.voiceType === "none" ? "recorded" : project.voiceType,
  );
  const [exports, setExports] = useState<Record<string, boolean>>(() => {
    const base: Record<string, boolean> = { "9:16": false, "1:1": false, "4:5": false };
    project.exportFormats.forEach((f) => {
      if (f in base) base[f] = true;
    });
    if (!project.exportFormats.length) base["9:16"] = true;
    return base;
  });

  const candidate = hasCandidates
    ? candidates[Math.min(selected, candidates.length - 1)]
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* === LIGHT TOP STRIP ============================================= */}
      <header className="sticky top-0 z-30 border-b border-rule bg-surface/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 md:px-7">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <IconArrowLeft size={16} stroke={2} />
            Projects
          </Link>

          <span className="hidden h-5 w-px bg-rule sm:block" />

          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate font-display text-base font-bold text-ink md:text-lg">
              {project.title}
            </h1>
            <BrandChip slug={project.brandSlug} className="shrink-0" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">{tabs}</div>
          </div>
        </div>

        {/* secondary action row */}
        <div className="flex items-center gap-2 border-t border-rule px-5 py-2 md:px-7">
          <div className="md:hidden">{tabs}</div>
          <Button variant="ghost" size="sm" disabled>
            <IconArrowLeft size={14} stroke={1.75} />
            Undo
          </Button>
          <Button variant="ghost" size="sm">
            <IconArrowRight size={14} stroke={1.75} />
            Redo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={!hasCandidates || regenerating}
          >
            {regenerating ? (
              <IconLoader2 size={14} stroke={1.75} className="animate-spin" />
            ) : (
              <IconRefresh size={14} stroke={1.75} />
            )}
            {regenerating ? "Generating…" : "Regenerate"}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 font-mono text-[0.66rem] text-muted sm:flex">
              {project.safetyCheck.passed ? (
                <IconShieldCheck size={14} stroke={1.75} className="text-success" />
              ) : (
                <IconShieldX size={14} stroke={1.75} className="text-danger" />
              )}
              {project.safetyCheck.passed ? "Safety passed" : "Safety flag"}
            </span>
            <Button variant="primary" size="sm" disabled={!hasCandidates}>
              Export
              <IconArrowRight size={15} stroke={2} />
            </Button>
          </div>
        </div>
      </header>

      {/* === DARK EDITOR BODY =========================================== */}
      <div className="flex-1 p-4 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-[#2d2040] bg-[#0d0a14] text-white shadow-card-lg">
          {hasCandidates && candidate ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
                {/* --- canvas (preview + candidate strip) --- */}
                <CanvasArea
                  project={project}
                  candidates={candidates}
                  candidate={candidate}
                  selected={selected}
                  onSelect={setSelected}
                  source={source}
                  brandPrimary={brand.primaryColor}
                  brandSecondary={brand.secondaryColor}
                />
                {/* --- right control panel --- */}
                <RightPanel
                  project={project}
                  candidate={candidate}
                  brandName={brand.brandName}
                  voice={voice}
                  onVoice={setVoice}
                  exports={exports}
                  onToggleExport={(id) =>
                    setExports((e) => ({ ...e, [id]: !e[id] }))
                  }
                />
              </div>
              {/* --- timeline --- */}
              <Timeline project={project} />
            </>
          ) : (
            <AnalysisInProgress project={project} brandPrimary={brand.primaryColor} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas: 9:16 preview + vertical candidate strip
// ---------------------------------------------------------------------------
function CanvasArea({
  project,
  candidates,
  candidate,
  selected,
  onSelect,
  source,
  brandPrimary,
  brandSecondary,
}: {
  project: VideoProject;
  candidates: CandidateEdit[];
  candidate: CandidateEdit;
  selected: number;
  onSelect: (i: number) => void;
  source: "gemini" | "sample" | "error" | null;
  brandPrimary: string;
  brandSecondary: string;
}) {
  const gradient = `linear-gradient(165deg, ${brandPrimary}, hsl(${project.thumbnailHue} 60% 30%) 55%, #0d0a14)`;

  return (
    <div className="flex gap-4 border-b border-[#2d2040] bg-[#0a0812] p-5 md:p-6 lg:border-b-0 lg:border-r">
      {/* preview */}
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div
          className="relative aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-xl border border-white/10 shadow-2xl"
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 bg-noise opacity-40" />

          {/* AI cut badge */}
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-black/45 px-2 py-1 backdrop-blur-sm">
            <IconSparkles size={12} stroke={2} style={{ color: brandSecondary }} />
            <span className="font-mono text-[0.62rem] font-medium text-white">
              AI Cut #{candidate.rank}
            </span>
          </div>

          {/* score badge */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 backdrop-blur-sm">
            <IconStarFilled size={11} style={{ color: brandSecondary }} />
            <span className="font-mono text-[0.62rem] font-semibold text-white">
              {candidate.score.toFixed(1)}
            </span>
          </div>

          {/* play */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm transition-transform hover:scale-110"
              aria-label="Play preview"
            >
              <IconPlayerPlayFilled size={26} className="ml-1 text-white drop-shadow" />
            </button>
          </div>

          {/* caption overlay (hook) */}
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-5 px-4 text-center">
              <span
                className="inline rounded bg-black/45 px-1.5 py-1 font-display text-lg font-bold leading-snug text-white shadow-lg"
                style={{ boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
              >
                {candidate.hook}
              </span>
            </div>
          </div>

          {/* watermark */}
          <div className="absolute bottom-3 left-3 z-10 font-mono text-[0.58rem] uppercase tracking-wide text-white/50">
            {getBrand(project.brandSlug).handle}
          </div>
        </div>
      </div>

      {/* candidate strip */}
      <div className="flex w-[78px] shrink-0 flex-col items-center gap-2">
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/35">
          Cuts
        </span>
        {source === "gemini" && (
          <span className="flex items-center gap-1 rounded-full border border-[#7c3aed]/40 bg-[#7c3aed]/15 px-1.5 py-0.5 font-mono text-[0.5rem] font-medium tracking-wide text-[#c4b5fd]">
            <IconSparkles size={8} stroke={2.5} />
            Gemini
          </span>
        )}
        {candidates.map((c, i) => {
          const active = i === selected;
          return (
            <button
              key={c.rank}
              onClick={() => onSelect(i)}
              className={cn(
                "relative aspect-[9/16] w-full overflow-hidden rounded-lg border text-center transition-all",
                active
                  ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/40"
                  : "border-white/10 opacity-70 hover:opacity-100",
              )}
              style={{
                background: `linear-gradient(160deg, ${brandPrimary}, hsl(${
                  (project.thumbnailHue + i * 14) % 360
                } 55% 24%))`,
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-0.5 bg-black/25">
                <span className="font-mono text-[0.58rem] text-white/70">Cut</span>
                <span className="font-display text-base font-bold leading-none text-white">
                  #{c.rank}
                </span>
                <span className="mt-1 flex items-center gap-0.5 font-mono text-[0.58rem] font-semibold text-white">
                  {i === 0 && <IconStarFilled size={9} style={{ color: brandSecondary }} />}
                  {c.score.toFixed(1)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right control panel
// ---------------------------------------------------------------------------
function PanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#2d2040] px-4 py-4 last:border-b-0">
      <div className="mb-2.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      {children}
    </div>
  );
}

function PanelRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-[0.78rem]">
      <span className="text-white/55">{label}</span>
      <span className="font-medium text-white/90">{children}</span>
    </div>
  );
}

function RightPanel({
  project,
  candidate,
  brandName,
  voice,
  onVoice,
  exports,
  onToggleExport,
}: {
  project: VideoProject;
  candidate: CandidateEdit;
  brandName: string;
  voice: VoiceType;
  onVoice: (v: VoiceType) => void;
  exports: Record<string, boolean>;
  onToggleExport: (id: string) => void;
}) {
  const scorePct = Math.round((candidate.score / 10) * 100);
  const safe = project.safetyCheck.passed;

  return (
    <aside className="bg-[#120f1d]">
      {/* Engagement score */}
      <PanelSection label="Engagement score">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-semibold text-[#c4b5fd]">
            {candidate.score.toFixed(1)}
          </span>
          <span className="font-mono text-sm text-white/40">/ 10</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#db2777] transition-[width] duration-500"
            style={{ width: `${scorePct}%` }}
          />
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {[
            { k: "Hook", v: candidate.breakdown.hook },
            { k: "Pacing", v: candidate.breakdown.pacing },
            { k: "Brand fit", v: candidate.breakdown.brandFit },
          ].map((b) => (
            <div
              key={b.k}
              className="rounded-md border border-[#2d2040] bg-white/[0.03] px-1.5 py-1.5 text-center"
            >
              <div className="font-mono text-sm font-semibold text-white/90">
                {b.v.toFixed(1)}
              </div>
              <div className="font-mono text-[0.55rem] uppercase tracking-wide text-white/40">
                {b.k}
              </div>
            </div>
          ))}
        </div>
      </PanelSection>

      {/* Brand kit */}
      <PanelSection label="Brand kit">
        <PanelRow label="Brand">{brandName}</PanelRow>
        <PanelRow label="Format">{project.templateName}</PanelRow>
        <PanelRow label="Duration">{candidate.durationS}s</PanelRow>
        <PanelRow label="Aspect">9:16</PanelRow>
        <div className="flex items-center justify-between py-1 text-[0.78rem]">
          <span className="text-white/55">Safety</span>
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              safe ? "text-[#86efac]" : "text-[#fca5a5]",
            )}
          >
            {safe ? (
              <IconShieldCheck size={13} stroke={2} />
            ) : (
              <IconShieldX size={13} stroke={2} />
            )}
            {safe ? "Passed" : "Flagged"}
          </span>
        </div>
      </PanelSection>

      {/* Voice */}
      <PanelSection label="Voice">
        <div className="grid grid-cols-3 gap-1.5">
          {VOICE_OPTIONS.map((opt) => {
            const active = voice === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => onVoice(opt.type)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[0.62rem] font-medium transition-colors",
                  active
                    ? "border-[#7c3aed] bg-[#7c3aed]/20 text-white"
                    : "border-[#2d2040] bg-white/[0.02] text-white/50 hover:text-white/80",
                )}
              >
                <opt.icon size={16} stroke={1.75} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </PanelSection>

      {/* Caption */}
      <PanelSection label="Caption">
        <p className="rounded-lg border border-[#2d2040] bg-white/[0.04] px-3 py-2.5 text-[0.74rem] leading-relaxed text-white/65">
          {candidate.caption}
        </p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[0.6rem] text-[#c4b5fd]">
          <IconBolt size={11} stroke={2} />
          CTA · {candidate.cta}
        </div>
      </PanelSection>

      {/* Export */}
      <PanelSection label="Export">
        <div className="space-y-1.5">
          {EXPORT_OPTIONS.map((opt) => {
            const on = exports[opt.id];
            return (
              <button
                key={opt.id}
                onClick={() => onToggleExport(opt.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors",
                  on
                    ? "border-[#7c3aed]/60 bg-[#7c3aed]/12"
                    : "border-[#2d2040] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span>
                  <span className="font-mono text-[0.78rem] font-semibold text-white/90">
                    {opt.label}
                  </span>
                  <span className="ml-2 text-[0.62rem] text-white/40">
                    {opt.sub}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    on
                      ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                      : "border-white/20 text-transparent",
                  )}
                >
                  {on ? <IconCheck size={11} stroke={3} /> : <span>—</span>}
                </span>
              </button>
            );
          })}
        </div>
      </PanelSection>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Timeline tracks
// ---------------------------------------------------------------------------
const TIMELINE: {
  track: string;
  color: string;
  opacity?: number;
  clips: { label: string; flex: number }[];
}[] = [
  {
    track: "VIDEO",
    color: "#4c1d95",
    clips: [
      { label: "Clip 1 · 0:00–0:08", flex: 3 },
      { label: "Clip 2 · 0:09–0:18", flex: 2 },
      { label: "Clip 3", flex: 1.5 },
    ],
  },
  {
    track: "VOICE",
    color: "#1e3a5f",
    clips: [{ label: "Narration · 0:00–0:26", flex: 6.5 }],
  },
  {
    track: "MUSIC",
    color: "#1a2e1a",
    opacity: 0.7,
    clips: [{ label: "Soft ambient · full", flex: 7 }],
  },
];

function Timeline({ project }: { project: VideoProject }) {
  return (
    <div className="border-t border-[#2d2040] bg-[#0a0812] px-5 py-4 md:px-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/35">
          Timeline
        </span>
        <span className="font-mono text-[0.6rem] text-white/35">
          0:00 — 0:{String(project.durationS).padStart(2, "0")}
        </span>
      </div>
      <div className="space-y-2">
        {TIMELINE.map((row) => (
          <div key={row.track} className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-mono text-[0.6rem] uppercase tracking-wide text-white/40">
              {row.track}
            </span>
            <div className="flex flex-1 gap-1">
              {row.clips.map((clip, i) => (
                <div
                  key={i}
                  className="flex h-9 items-center overflow-hidden rounded-md px-2.5"
                  style={{
                    flex: clip.flex,
                    background: row.color,
                    opacity: row.opacity ?? 1,
                  }}
                >
                  <span className="truncate font-mono text-[0.6rem] text-white/80">
                    {clip.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty / analyzing state
// ---------------------------------------------------------------------------
const ANALYSIS_STEPS = [
  { label: "Whisper v3 transcript", done: true },
  { label: "Speech layer scoring", done: true },
  { label: "Visual frame sampling (GPT-4V)", done: false, active: true },
  { label: "Brand voice alignment", done: false },
  { label: "Format constraint solve → 3 candidates", done: false },
];

function AnalysisInProgress({
  project,
  brandPrimary,
}: {
  project: VideoProject;
  brandPrimary: string;
}) {
  const label =
    project.status === "transcribing"
      ? "Transcribing audio"
      : project.status === "uploading"
        ? "Uploading footage"
        : "Analyzing footage";

  return (
    <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-[300px_1fr] md:p-12">
      {/* preview shimmer */}
      <div
        className="relative mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-xl border border-white/10"
        style={{
          background: `linear-gradient(165deg, ${brandPrimary}, hsl(${project.thumbnailHue} 55% 22%), #0d0a14)`,
        }}
      >
        <div className="absolute inset-0 bg-noise opacity-40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
            <IconSparkles size={24} stroke={1.6} className="animate-pulseDot text-white" />
          </span>
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/60">
            {project.status}
          </span>
        </div>
      </div>

      {/* status list */}
      <div className="flex flex-col justify-center">
        <Tag tone="warn" className="w-fit">
          <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulseDot rounded-full bg-current" />
          {label}
        </Tag>
        <h2 className="mt-3 font-display text-2xl font-bold text-white">
          Analysis in progress
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-white/55">
          The 4-layer context engine is scoring your footage. Three ranked
          candidate cuts will appear here in under 30 seconds.
        </p>

        <div className="mt-6 space-y-2.5">
          {ANALYSIS_STEPS.map((step) => (
            <div
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                step.active
                  ? "border-[#7c3aed]/60 bg-[#7c3aed]/10"
                  : "border-[#2d2040] bg-white/[0.02]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-success bg-success/20 text-[#86efac]"
                    : step.active
                      ? "border-[#7c3aed] text-[#c4b5fd]"
                      : "border-white/15 text-white/30",
                )}
              >
                {step.done ? (
                  <IconCheck size={12} stroke={3} />
                ) : step.active ? (
                  <IconSparkles size={11} stroke={2} className="animate-pulseDot" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  step.done
                    ? "text-white/70"
                    : step.active
                      ? "font-medium text-white"
                      : "text-white/40",
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
