"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconSparkles,
  IconScissors,
  IconDownload,
  IconAlertTriangle,
  IconLoader2,
  IconRefresh,
  IconPlayerPlayFilled,
  IconWand,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { BrandChip } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import type { BrandSlug } from "@/lib/types";
import type { LiveProject, LiveCandidate } from "@/lib/studio/projectStore";

const ANALYZE_STEPS = [
  "Uploading your video to Gemini…",
  "Watching the footage frame by frame…",
  "Transcribing speech with timestamps…",
  "Scoring hooks, pacing & brand fit…",
  "Designing 3 candidate cuts…",
];

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function LiveEditor({ initial }: { initial: LiveProject }) {
  const [meta, setMeta] = useState<LiveProject>(initial);
  const [selected, setSelected] = useState(initial.selected ?? 0);
  const [stepIdx, setStepIdx] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(
    initial.status === "rendered" && initial.outputs?.length
      ? `/api/studio/${initial.id}/file?type=output&c=${initial.selected ?? 0}`
      : null,
  );
  const started = useRef(false);

  // Kick off analysis once when the project is freshly uploaded.
  useEffect(() => {
    if (started.current) return;
    if (meta.status === "uploaded") {
      started.current = true;
      void analyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotate the "analyzing" step labels.
  useEffect(() => {
    if (meta.status !== "analyzing" && meta.status !== "uploaded") return;
    const t = setInterval(
      () => setStepIdx((i) => (i + 1) % ANALYZE_STEPS.length),
      2600,
    );
    return () => clearInterval(t);
  }, [meta.status]);

  async function analyze() {
    setMeta((m) => ({ ...m, status: "analyzing" }));
    try {
      const res = await fetch(`/api/studio/${meta.id}/analyze`, { method: "POST" });
      const data = (await res.json()) as LiveProject;
      setMeta(data);
      setSelected(data.selected ?? 0);
    } catch (e) {
      setMeta((m) => ({ ...m, status: "error", error: String(e) }));
    }
  }

  async function render(idx: number) {
    setRendering(true);
    setOutputUrl(null);
    try {
      const res = await fetch(`/api/studio/${meta.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIndex: idx }),
      });
      const data = await res.json();
      if (data.ok) {
        setMeta(data.meta);
        setOutputUrl(`${data.url}&t=${Date.now()}`);
      } else {
        setMeta((m) => ({ ...m, error: data.error }));
      }
    } catch (e) {
      setMeta((m) => ({ ...m, error: String(e) }));
    } finally {
      setRendering(false);
    }
  }

  const analyzing = meta.status === "analyzing" || meta.status === "uploaded";
  const candidates = meta.candidates ?? [];
  const active = candidates[selected];

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-rule bg-surface/90 px-6 py-3 backdrop-blur">
        <Link
          href="/studio"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <IconArrowLeft size={16} stroke={2} /> Projects
        </Link>
        <div className="mx-1 h-5 w-px bg-rule" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">
            {meta.filename}
          </div>
        </div>
        <BrandChip slug={meta.brandSlug as BrandSlug} />
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-accent-ink">
          <IconSparkles size={12} stroke={2} /> Gemini · AI cut
        </span>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-6 md:px-8">
        {analyzing && <AnalyzingView step={ANALYZE_STEPS[stepIdx]} />}

        {meta.status === "error" && (
          <div className="rounded-xl border border-amber-200 bg-warn-soft p-5">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[#92400e]">
              <IconAlertTriangle size={18} stroke={2} /> Analysis failed
            </div>
            <p className="mb-3 break-words font-mono text-xs text-[#92400e]/80">
              {meta.error}
            </p>
            <Button variant="outline" onClick={() => analyze()}>
              <IconRefresh size={15} stroke={2} /> Try again
            </Button>
          </div>
        )}

        {!analyzing && meta.status !== "error" && candidates.length > 0 && active && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            {/* LEFT — source + AI summary */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-[#2d2040] bg-[#0d0a14] p-3">
                <div className="mb-2 font-mono text-[0.6rem] uppercase tracking-wide text-white/40">
                  Your upload
                </div>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={`/api/studio/${meta.id}/file?type=source`}
                  controls
                  className="aspect-[9/16] w-full rounded-lg bg-black object-contain"
                />
                <div className="mt-2 flex items-center justify-between font-mono text-[0.62rem] text-white/45">
                  <span>{meta.durationS ? fmt(meta.durationS) : "—"}</span>
                  <span>{meta.ext.toUpperCase()}</span>
                </div>
              </div>

              {meta.summary && (
                <div className="rounded-xl border border-rule bg-surface p-4 shadow-card">
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-accent">
                    <IconWand size={12} stroke={2} /> What the AI saw
                  </div>
                  <p className="text-xs leading-relaxed text-secondary">
                    {meta.summary}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT — candidates + render */}
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  The AI designed {candidates.length} cuts for you
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Pick one and render it — Gemini chose the segments, FFmpeg does
                  the editing.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {candidates.map((c, i) => (
                  <CandidateCard
                    key={i}
                    c={c}
                    active={i === selected}
                    onSelect={() => setSelected(i)}
                  />
                ))}
              </div>

              {/* selected detail + render */}
              <div className="rounded-2xl border border-rule bg-surface p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[0.6rem] uppercase tracking-wide text-accent">
                      Cut #{selected + 1} · {fmt(active.durationS)} · score{" "}
                      {active.score.toFixed(1)}
                    </div>
                    <div className="mt-0.5 font-display text-lg font-bold text-ink">
                      {active.hook}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => render(selected)}
                    disabled={rendering}
                  >
                    {rendering ? (
                      <IconLoader2 size={16} stroke={2} className="animate-spin" />
                    ) : (
                      <IconScissors size={16} stroke={2} />
                    )}
                    {rendering ? "Rendering…" : "Render this cut"}
                  </Button>
                </div>

                {/* kept-segments timeline */}
                <SegmentTimeline c={active} total={meta.durationS} />

                <div className="mt-4 rounded-lg border border-rule bg-surface-2 p-3">
                  <div className="mb-1 font-mono text-[0.58rem] uppercase tracking-wide text-muted">
                    Caption
                  </div>
                  <p className="text-sm text-ink">{active.caption}</p>
                  {active.cta && (
                    <p className="mt-1.5 font-mono text-[0.7rem] text-accent">
                      ↳ {active.cta}
                    </p>
                  )}
                </div>

                {/* rendered output */}
                {rendering && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2.5 text-sm text-accent-ink">
                    <IconLoader2 size={16} stroke={2} className="animate-spin" />
                    FFmpeg is cutting & re-encoding your video…
                  </div>
                )}
                {outputUrl && !rendering && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-mono text-[0.6rem] uppercase tracking-wide text-success-ink">
                        ✓ Your edited cut (9:16)
                      </div>
                      <a
                        href={outputUrl}
                        download={`legali-cut-${meta.id}.mp4`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-[#211c26]"
                      >
                        <IconDownload size={14} stroke={2} /> Download MP4
                      </a>
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={outputUrl}
                      controls
                      autoPlay
                      className="mx-auto aspect-[9/16] max-h-[60vh] rounded-xl bg-black object-contain"
                    />
                  </div>
                )}
              </div>

              {/* transcript */}
              {meta.transcript && meta.transcript.length > 0 && (
                <details className="rounded-xl border border-rule bg-surface p-4 shadow-card">
                  <summary className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-wide text-muted">
                    Transcript ({meta.transcript.length} lines)
                  </summary>
                  <div className="mt-3 space-y-1.5">
                    {meta.transcript.map((t, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="shrink-0 font-mono text-[0.66rem] text-muted">
                          {fmt(t.startSec)}
                        </span>
                        <span className="text-secondary">{t.text}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function AnalyzingView({ step }: { step: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{ background: "linear-gradient(135deg,#1e0a3c,#2d1458)" }}
      >
        <div className="absolute inset-0 animate-pulseDot rounded-3xl bg-accent/20 blur-xl" />
        <IconSparkles size={40} stroke={1.5} className="relative text-[#c4b5fd]" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-ink">
        The AI is editing your video
      </h2>
      <p className="mt-2 flex items-center gap-2 font-mono text-sm text-muted">
        <IconLoader2 size={15} stroke={2} className="animate-spin text-accent" />
        {step}
      </p>
      <p className="mt-6 max-w-sm text-center text-xs text-muted/70">
        Gemini is watching the footage and writing the edit; this takes ~15–40s
        for short clips.
      </p>
    </div>
  );
}

function CandidateCard({
  c,
  active,
  onSelect,
}: {
  c: LiveCandidate;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3 text-left transition-all",
        active
          ? "border-accent bg-accent-soft shadow-card-lg"
          : "border-rule bg-surface hover:border-accent/40 hover:shadow-card",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.58rem] uppercase tracking-wide text-muted">
          Cut #{c.rank}
        </span>
        <span className="font-display text-base font-bold text-ink">
          {c.score.toFixed(1)}
        </span>
      </div>
      <div className="mt-1 line-clamp-2 min-h-[2.4rem] text-xs font-semibold leading-snug text-ink">
        {c.hook}
      </div>
      <div className="mt-2 flex items-center gap-2 font-mono text-[0.6rem] text-muted">
        <IconPlayerPlayFilled size={10} /> {fmt(c.durationS)} ·{" "}
        {c.segments.length} clips
      </div>
    </button>
  );
}

function SegmentTimeline({ c, total }: { c: LiveCandidate; total: number }) {
  const span = total > 0 ? total : Math.max(...c.segments.map((s) => s.endSec), 1);
  return (
    <div className="mt-4">
      <div className="mb-1 flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-wide text-muted">
        <span>Kept segments</span>
        <span>{fmt(span)} source</span>
      </div>
      <div className="relative h-7 overflow-hidden rounded-md bg-surface-2">
        {c.segments.map((s, i) => {
          const left = (Math.max(0, s.startSec) / span) * 100;
          const width = ((s.endSec - s.startSec) / span) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 flex h-full items-center justify-center rounded-[3px] bg-gradient-to-r from-accent to-pink"
              style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
              title={`${fmt(s.startSec)}–${fmt(s.endSec)}${s.reason ? ` · ${s.reason}` : ""}`}
            >
              <span className="font-mono text-[0.5rem] text-white/90">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
