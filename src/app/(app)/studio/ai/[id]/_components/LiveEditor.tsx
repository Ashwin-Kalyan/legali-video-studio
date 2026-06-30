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
  IconSend,
  IconMusic,
  IconColorSwatch,
  IconMovie,
  IconListCheck,
  IconBrandInstagram,
  IconExternalLink,
  IconCheck,
  IconX,
  IconUser,
  IconKey,
  IconWorld,
  IconInfoCircle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { BrandChip } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { getBrand } from "@/lib/data";
import type { BrandSlug } from "@/lib/types";
import type { LiveProject, LiveCandidate } from "@/lib/studio/projectStore";

const ANALYZE_STEPS = [
  "Uploading your video to Gemini…",
  "Watching the footage frame by frame…",
  "Transcribing speech with timestamps…",
  "Scoring hooks, pacing & brand fit…",
  "Designing 3 marketing cuts…",
];

interface Effects {
  fades: boolean;
  brandBar: boolean;
  music: boolean;
}

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
  const [bust, setBust] = useState(0);
  const [fx, setFx] = useState<Effects>({ fades: true, brandBar: true, music: true });
  const [instruction, setInstruction] = useState("");
  const [revising, setRevising] = useState(false);
  const [reviseError, setReviseError] = useState<string | null>(null);
  const [igOpen, setIgOpen] = useState(false);
  const started = useRef(false);

  const brand = getBrand((meta.brandSlug as BrandSlug) ?? "lea");

  // Kick off analysis once when the project is freshly uploaded.
  useEffect(() => {
    if (started.current) return;
    if (meta.status === "uploaded" && !meta.candidates?.length) {
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
    try {
      const res = await fetch(`/api/studio/${meta.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIndex: idx, effects: fx }),
      });
      const data = await res.json();
      if (data.ok) {
        setMeta(data.meta);
        setSelected(idx);
        setBust(Date.now());
      } else {
        setMeta((m) => ({ ...m, error: data.error }));
      }
    } catch (e) {
      setMeta((m) => ({ ...m, error: String(e) }));
    } finally {
      setRendering(false);
    }
  }

  async function revise() {
    const text = instruction.trim();
    if (!text || revising) return;
    setRevising(true);
    setReviseError(null);
    try {
      const res = await fetch(`/api/studio/${meta.id}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });
      const data = await res.json();
      if (data.error || !data.candidates) {
        setReviseError(data.error || "The AI did not return any cuts.");
      } else {
        setMeta(data as LiveProject);
        setSelected(0);
        setInstruction("");
      }
    } catch (e) {
      setReviseError(String(e));
    } finally {
      setRevising(false);
    }
  }

  const candidates = meta.candidates ?? [];
  // Only show the "analyzing" screen while there are no cuts yet — a returning
  // project that already has cuts opens straight into the editor.
  const analyzing =
    (meta.status === "analyzing" || meta.status === "uploaded") &&
    candidates.length === 0;
  const active = candidates[selected];
  const renderedOutput = meta.outputs?.find((o) => o.candidateIndex === selected);
  const outputUrl = renderedOutput
    ? `/api/studio/${meta.id}/file?type=output&c=${selected}&t=${
        bust || Date.parse(renderedOutput.createdAt) || 1
      }`
    : null;
  const published = meta.publishedTo?.find((p) => p.candidateIndex === selected);

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
          <IconSparkles size={12} stroke={2} /> Gemini · marketing cut
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

              {/* direct-the-AI prompt */}
              <RevisePrompt
                value={instruction}
                onChange={setInstruction}
                onSubmit={revise}
                busy={revising}
                error={reviseError}
                brandName={brand.brandName}
              />
            </div>

            {/* RIGHT — candidates + render */}
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  The AI designed {candidates.length} marketing cuts for {brand.brandName}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Each is a promo reel: hook → value → CTA. Pick one, choose your
                  effects, and render — Gemini directs, FFmpeg cuts.
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

                {/* marketing effects */}
                <EffectsToggles fx={fx} setFx={setFx} brand={brand} />

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
                    FFmpeg is cutting, adding effects & music…
                  </div>
                )}
                {outputUrl && !rendering && (
                  <div className="mt-4">
                    <div className="mb-2 font-mono text-[0.6rem] uppercase tracking-wide text-success-ink">
                      ✓ Your marketing cut (9:16)
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      key={outputUrl}
                      src={outputUrl}
                      controls
                      className="mx-auto aspect-[9/16] max-h-[60vh] rounded-xl bg-black object-contain"
                    />
                    <ExportBar
                      downloadUrl={outputUrl}
                      filename={`legali-${brand.slug}-cut-${meta.id}.mp4`}
                      onPublish={() => setIgOpen(true)}
                      published={published}
                    />
                  </div>
                )}
              </div>

              {/* everything the AI changed */}
              <EditLog
                c={active}
                total={meta.durationS}
                appliedEffects={renderedOutput?.appliedEffects}
              />

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

      {igOpen && active && (
        <InstagramModal
          projectId={meta.id}
          candidateIndex={selected}
          defaultCaption={[active.caption, brand.hashtagLibrary.join(" ")]
            .filter(Boolean)
            .join("\n\n")}
          onClose={() => setIgOpen(false)}
          onPublished={(m) => setMeta(m)}
        />
      )}
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

// ---------------------------------------------------------------------------
// Marketing-effects toggles — these are really baked into the FFmpeg render.
// ---------------------------------------------------------------------------
function EffectsToggles({
  fx,
  setFx,
  brand,
}: {
  fx: Effects;
  setFx: (f: Effects) => void;
  brand: ReturnType<typeof getBrand>;
}) {
  const items: { key: keyof Effects; label: string; icon: typeof IconMusic }[] = [
    { key: "fades", label: "Cinematic fades", icon: IconMovie },
    { key: "brandBar", label: "Brand accent bar", icon: IconColorSwatch },
    { key: "music", label: `${brand.musicMood} music`, icon: IconMusic },
  ];
  return (
    <div className="mt-4">
      <div className="mb-1.5 font-mono text-[0.58rem] uppercase tracking-wide text-muted">
        Marketing effects
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label, icon: Icon }) => {
          const on = fx[key];
          return (
            <button
              key={key}
              onClick={() => setFx({ ...fx, [key]: !on })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                on
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-rule bg-surface text-muted hover:border-accent/40",
              )}
            >
              <Icon size={13} stroke={2} />
              {label}
              {on && <IconCheck size={12} stroke={2.5} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Direct-the-AI prompt — natural-language re-edit from the saved transcript.
// ---------------------------------------------------------------------------
function RevisePrompt({
  value,
  onChange,
  onSubmit,
  busy,
  error,
  brandName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  brandName: string;
}) {
  const ideas = [
    "Make it punchier and under 20s",
    "Lead with the most emotional moment",
    "Cut the intro, get to the point faster",
  ];
  return (
    <div className="rounded-xl border border-accent/30 bg-gradient-to-b from-accent-soft/50 to-surface p-4 shadow-card">
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-accent">
        <IconWand size={12} stroke={2} /> Direct the AI
      </div>
      <p className="mb-2 text-xs leading-relaxed text-secondary">
        Tell the AI any change to make and it re-cuts all 3 marketing edits for{" "}
        {brandName}.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit();
        }}
        rows={3}
        placeholder="e.g. Make it more emotional and end on a stronger call to action…"
        disabled={busy}
        className="w-full resize-none rounded-lg border border-rule bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ideas.map((i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            disabled={busy}
            className="rounded-full border border-rule bg-surface px-2 py-0.5 text-[0.66rem] text-muted hover:border-accent/40 hover:text-accent-ink disabled:opacity-60"
          >
            {i}
          </button>
        ))}
      </div>
      <Button
        variant="primary"
        size="sm"
        className="mt-3 w-full"
        onClick={onSubmit}
        disabled={busy || !value.trim()}
      >
        {busy ? (
          <IconLoader2 size={14} stroke={2} className="animate-spin" />
        ) : (
          <IconSend size={14} stroke={2} />
        )}
        {busy ? "Re-cutting…" : "Apply edit"}
      </Button>
      {error && (
        <p className="mt-2 text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Everything the AI changed — the edit changelog for the active cut.
// ---------------------------------------------------------------------------
function EditLog({
  c,
  total,
  appliedEffects,
}: {
  c: LiveCandidate;
  total: number;
  appliedEffects?: string[];
}) {
  const kept = c.segments.reduce(
    (sum, s) => sum + Math.max(0, s.endSec - s.startSec),
    0,
  );
  const trimmed = total > 0 ? Math.max(0, total - kept) : 0;
  const log = c.editLog ?? [];

  return (
    <div className="rounded-2xl border border-rule bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-accent">
        <IconListCheck size={13} stroke={2} /> Everything the AI changed
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Source" value={total ? fmt(total) : "—"} />
        <Stat label="Final cut" value={fmt(kept)} />
        <Stat label="Trimmed out" value={trimmed ? `-${fmt(trimmed)}` : "—"} />
      </div>

      {log.length > 0 ? (
        <ol className="space-y-2">
          {log.map((line, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-secondary">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[0.58rem] font-bold text-accent-ink">
                {i + 1}
              </span>
              <span className="leading-snug">{line}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">
          Kept {c.segments.length} segment{c.segments.length === 1 ? "" : "s"} and
          dropped the rest. Re-run the analysis for a detailed edit log.
        </p>
      )}

      {c.textOverlays && c.textOverlays.length > 0 && (
        <div className="mt-4 border-t border-rule pt-3">
          <div className="mb-1.5 font-mono text-[0.56rem] uppercase tracking-wide text-muted">
            Suggested on-screen text
          </div>
          <div className="flex flex-wrap gap-1.5">
            {c.textOverlays.map((t, i) => (
              <span
                key={i}
                className="rounded-md border border-rule bg-surface-2 px-2 py-0.5 text-xs text-secondary"
              >
                “{t}”
              </span>
            ))}
          </div>
        </div>
      )}

      {appliedEffects && appliedEffects.length > 0 && (
        <div className="mt-4 border-t border-rule pt-3">
          <div className="mb-1.5 font-mono text-[0.56rem] uppercase tracking-wide text-success-ink">
            Baked into the render
          </div>
          <ul className="space-y-1">
            {appliedEffects.map((e, i) => (
              <li
                key={i}
                className="flex items-center gap-1.5 text-xs text-secondary"
              >
                <IconCheck size={13} stroke={2.5} className="text-success-ink" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-rule bg-surface-2 px-2.5 py-2 text-center">
      <div className="font-display text-base font-bold text-ink">{value}</div>
      <div className="font-mono text-[0.54rem] uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export + publish bar
// ---------------------------------------------------------------------------
function ExportBar({
  downloadUrl,
  filename,
  onPublish,
  published,
}: {
  downloadUrl: string;
  filename: string;
  onPublish: () => void;
  published?: { account: string; permalink: string };
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        href={downloadUrl}
        download={filename}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-paper transition-colors hover:bg-[#211c26]"
      >
        <IconDownload size={15} stroke={2} /> Export · download MP4
      </a>
      <button
        onClick={onPublish}
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{
          background:
            "linear-gradient(95deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
        }}
      >
        <IconBrandInstagram size={16} stroke={2} /> Upload to Instagram
      </button>
      {published && (
        <a
          href={published.permalink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-success/40 bg-success-soft px-2.5 py-1.5 text-xs font-medium text-success-ink hover:underline"
        >
          <IconCheck size={13} stroke={2.5} /> Live @{published.account}
          <IconExternalLink size={12} stroke={2} />
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Instagram publish modal — real Graph API publish (token + Business account)
// with a "simulate" fallback so the library flow works without credentials.
// ---------------------------------------------------------------------------
interface IgStatus {
  configured: boolean;
  hasPublicUrl: boolean;
}

function InstagramModal({
  projectId,
  candidateIndex,
  defaultCaption,
  onClose,
  onPublished,
}: {
  projectId: string;
  candidateIndex: number;
  defaultCaption: string;
  onClose: () => void;
  onPublished: (m: LiveProject) => void;
}) {
  const [status, setStatus] = useState<IgStatus | null>(null);
  const [caption, setCaption] = useState(defaultCaption);
  const [token, setToken] = useState("");
  const [bizId, setBizId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [step, setStep] = useState<"form" | "working" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    permalink: string;
    account: string;
    simulated: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/studio/instagram/status")
      .then((r) => r.json())
      .then((d) => setStatus({ configured: !!d.configured, hasPublicUrl: !!d.hasPublicUrl }))
      .catch(() => setStatus({ configured: false, hasPublicUrl: false }));
  }, []);

  const canPublishLive = Boolean(status?.configured || (token.trim() && bizId.trim()));

  async function publish(mode: "live" | "simulate") {
    setError(null);
    setStep("working");
    try {
      const res = await fetch(`/api/studio/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIndex,
          caption,
          mode,
          accessToken: token.trim() || undefined,
          businessId: bizId.trim() || undefined,
          publicBaseUrl: baseUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({
          permalink: data.record.permalink,
          account: data.record.account,
          simulated: !!data.simulated,
        });
        setStep("done");
        onPublished(data.meta as LiveProject);
      } else {
        setError(data.error || "Publish failed.");
        setStep("form");
        if (data.needsConfig) setShowAdvanced(true);
      }
    } catch (e) {
      setError(String(e));
      setStep("form");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-rule bg-surface shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 text-white"
          style={{
            background:
              "linear-gradient(95deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
          }}
        >
          <div className="flex items-center gap-2 font-display font-bold">
            <IconBrandInstagram size={20} stroke={2} /> Upload to Instagram
          </div>
          <button onClick={onClose} className="opacity-90 hover:opacity-100">
            <IconX size={18} stroke={2} />
          </button>
        </div>

        <div className="p-5">
          {step === "done" && result ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-ink">
                <IconCheck size={28} stroke={2.5} />
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">
                {result.simulated ? "Saved to library" : `Published to @${result.account}`}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {result.simulated
                  ? "Recorded as a publish in your library (demo — not posted to Instagram)."
                  : "Your reel is live on Instagram and saved to the project library."}
              </p>
              {!result.simulated && (
                <a
                  href={result.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  View on Instagram <IconExternalLink size={14} stroke={2} />
                </a>
              )}
              <Button variant="outline" className="mt-4" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : step === "working" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <IconLoader2 size={32} stroke={2} className="animate-spin text-accent" />
              <p className="mt-3 font-medium text-ink">Publishing to Instagram…</p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                Instagram is fetching and processing your reel — this can take up
                to a minute.
              </p>
            </div>
          ) : (
            <>
              <label className="mb-1 block font-mono text-[0.58rem] uppercase tracking-wide text-muted">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="mb-3 w-full resize-none rounded-lg border border-rule bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />

              {/* connection status */}
              {status === null ? (
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <IconLoader2 size={13} stroke={2} className="animate-spin" />
                  Checking Instagram connection…
                </p>
              ) : status.configured ? (
                <div className="rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-xs text-success-ink">
                  <span className="flex items-center gap-1.5 font-medium">
                    <IconCheck size={13} stroke={2.5} /> Instagram Graph API
                    connected
                  </span>
                  {!status.hasPublicUrl && (
                    <span className="mt-1 flex items-start gap-1.5 text-[0.7rem] text-[#92400e]">
                      <IconAlertTriangle size={12} stroke={2} className="mt-0.5 shrink-0" />
                      Set PUBLIC_BASE_URL to a public https tunnel (e.g. ngrok) so
                      Instagram can fetch the video.
                    </span>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-accent/30 bg-accent-soft/50 px-3 py-2 text-xs text-secondary">
                  <span className="flex items-center gap-1.5 font-medium text-accent-ink">
                    <IconInfoCircle size={13} stroke={2} /> Connect the Instagram
                    Graph API to post for real
                  </span>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                    Real publishing uses a token + Business account (not a
                    password). Set IG_ACCESS_TOKEN / IG_BUSINESS_ID on the server,
                    or paste them below. Or simulate to just save it to the
                    library.
                  </p>
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="mt-1.5 font-medium text-accent hover:underline"
                  >
                    {showAdvanced ? "Hide credentials" : "Enter credentials"}
                  </button>
                </div>
              )}

              {(showAdvanced || (status && !status.configured && showAdvanced)) && (
                <div className="mt-3 space-y-2">
                  <Field icon={IconKey} value={token} onChange={setToken} placeholder="Access token" type="password" />
                  <Field icon={IconUser} value={bizId} onChange={setBizId} placeholder="Instagram Business account id" />
                  <Field icon={IconWorld} value={baseUrl} onChange={setBaseUrl} placeholder="Public base URL (https tunnel, optional)" />
                </div>
              )}

              {error && (
                <p className="mt-2 text-xs font-medium text-danger">{error}</p>
              )}

              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => publish("live")}
                disabled={!canPublishLive}
              >
                <IconBrandInstagram size={16} stroke={2} /> Publish to Instagram
              </Button>
              <button
                onClick={() => publish("simulate")}
                className="mt-2 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-xs font-medium text-muted hover:border-accent/40 hover:text-accent-ink"
              >
                Simulate — just save it to the library
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type,
}: {
  icon: typeof IconKey;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rule bg-surface-2 px-3">
      <Icon size={15} stroke={2} className="shrink-0 text-muted" />
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
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
