"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconClock,
  IconLanguage,
  IconEdit,
  IconFileText,
  IconVideo,
  IconDownload,
  IconCircleCheck,
  IconCode,
  IconArrowLeft,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react";
import { cn, formatTimecode, formatSrtTime } from "@/lib/utils";
import { LEA_TRANSCRIPT } from "@/lib/data";
import type { VideoProject, TranscriptSegment, SubtitleFormat } from "@/lib/types";

// ---------------------------------------------------------------------------
// Export format options (mirrors #exp-formats in the mockup)
// ---------------------------------------------------------------------------
const FORMATS: {
  key: SubtitleFormat;
  ext: string;
  label: string;
  burn?: boolean;
}[] = [
  { key: "SRT", ext: ".srt", label: "SubRip (universal)" },
  { key: "VTT", ext: ".vtt", label: "WebVTT (web/YouTube)" },
  { key: "ASS", ext: ".ass", label: "Styled (custom fonts)" },
  { key: "BURN", ext: "burn", label: "Burn into video (hardcoded)", burn: true },
];

const FORMAT_ANNO: Record<SubtitleFormat, string> = {
  SRT: "SRT export: POST /api/v1/projects/{id}/subtitles/export — {format:\"srt\"}. SubtitleWorker generates a standard SubRip file. Compatible with Instagram, TikTok, YouTube, VLC. Supports multilingual (one file per language).",
  VTT: "VTT export: {format:\"vtt\"}. WebVTT supports styling cues (::cue) and chapter markers. Native format for YouTube auto-captions and the HTML5 <track> element.",
  ASS: "ASS export: Advanced SubStation Alpha — preserves custom fonts (Quicksand), colors (#ffb3d1), and position. Required for Lea brand-styled subtitles. FFmpeg renders via ass=file.ass. Heavier file size (~3× SRT).",
  BURN: "Burn-in: {format:\"burn_in\", aspect_ratios:[\"9:16\",\"1:1\"]}. RenderWorker re-encodes with the FFmpeg subtitles filter. Hardcoded into pixel data — required for Stories/Reels (no external subtitle support).",
};

const BURN_OPTS = [
  { id: "reels", label: "9:16 Reels", on: false },
  { id: "tiktok", label: "9:16 TikTok", on: true },
  { id: "feed", label: "1:1 Feed", on: false },
  { id: "linkedin", label: "16:9 LinkedIn", on: false },
];

const DEFAULT_ANNO =
  "Subtitle generation: Whisper v3 word-level timestamps → stored in video_projects.transcript_json. POST /api/v1/projects/{id}/subtitles/export renders the file via SubtitleWorker, uploads to R2, returns a signed download URL.";

export function SubtitleEditor({ project }: { project: VideoProject }) {
  const segments: TranscriptSegment[] =
    project.transcript.length > 0 ? project.transcript : LEA_TRANSCRIPT;

  const [activeSeg, setActiveSeg] = useState<number>(-1);
  const [format, setFormat] = useState<SubtitleFormat>("SRT");
  const [translated, setTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedSegments, setTranslatedSegments] = useState<string[]>([]);
  const [translateSource, setTranslateSource] = useState<
    "gemini" | "sample" | "error" | null
  >(null);
  const [exported, setExported] = useState(false);
  const [burn, setBurn] = useState<Record<string, boolean>>(
    Object.fromEntries(BURN_OPTS.map((b) => [b.id, b.on])),
  );
  const [anno, setAnno] = useState<string>(DEFAULT_ANNO);

  const projectNum = project.id.replace(/[^0-9]/g, "") || "0000";

  // --- interactions --------------------------------------------------------
  function selectSeg(i: number) {
    setActiveSeg(i);
    setExported(false);
    setAnno(
      `Segment selected: PATCH /api/v1/projects/${project.id}/transcript/segments/${i} — inline edit updates transcript_json[${i}].text. Timing auto-recalculated via Whisper word-level alignment. Changes propagate to SRT/VTT export and the caption overlay.`,
    );
  }

  function splitSeg(e: React.MouseEvent, i: number) {
    e.stopPropagation();
    setAnno(
      `Split segment: POST /api/v1/projects/${project.id}/transcript/segments/${i}/split — splits at the playhead position. Whisper re-aligns timing on both halves. Creates two rows in transcript_json.`,
    );
  }

  function pickFormat(key: SubtitleFormat) {
    setFormat(key);
    setExported(false);
    setAnno(FORMAT_ANNO[key]);
  }

  function toggleBurn(id: string) {
    setBurn((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function autoSync() {
    setAnno(
      `Auto-sync: POST /api/v1/projects/${project.id}/transcript/sync — re-aligns all segment timestamps against the audio waveform using Whisper forced alignment. Useful after manual text edits that shift timing. ~10s for a 60s video.`,
    );
  }

  async function autoTranslate() {
    if (translating) return;
    setTranslating(true);
    setAnno(
      `Auto-translate: POST /api/translate — {target:"id"}. Gemini translates each segment preserving line breaks and timing. Returns a parallel array (same length & order) for the Indonesian caption track. Bilingual SRT packs both languages in one file.`,
    );
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: segments.map((s) => s.text),
          target: "id",
        }),
      });
      const data: {
        source: "gemini" | "sample" | "error";
        segments: string[];
      } = await res.json();
      setTranslatedSegments(data.segments ?? []);
      setTranslateSource(data.source ?? "error");
      setTranslated(true);
      setAnno(
        `Auto-translate complete (source: ${data.source}): ${data.segments?.length ?? 0} segments translated to Indonesian (id). Original English is preserved; the ID track is rendered beneath each segment and in the bilingual SRT preview.`,
      );
    } catch {
      setTranslateSource("error");
      setAnno(
        "Auto-translate failed: POST /api/translate did not return a valid response. The English track is unchanged — retry to regenerate the Indonesian captions.",
      );
    } finally {
      setTranslating(false);
    }
  }

  function doExport() {
    setExported(true);
    setAnno(
      `Export complete: file uploaded to R2, signed URL returned. video_projects.subtitle_urls updated with {format:"${format}", url:"…", languages:[${
        translated ? '"en","id"' : '"en"'
      }]}. If scheduling is active, the SRT is auto-attached to the scheduled_posts upload payload.`,
    );
  }

  const exportLabel =
    format === "BURN"
      ? "Rendering burned-in video…"
      : `Exported project-${projectNum}${FORMATS.find((f) => f.key === format)!.ext}`;

  // First ~3 segments for the SRT preview
  const clip = (t: string) => (t.length > 50 ? t.slice(0, 50) + "…" : t);
  const srtPreview = segments
    .slice(0, 3)
    .map((s, i) => {
      const id = translated ? translatedSegments[i] : undefined;
      const body = id ? `${clip(s.text)}\n${clip(id)}` : clip(s.text);
      return `${i + 1}\n${formatSrtTime(s.startMs)} --> ${formatSrtTime(
        s.endMs,
      )}\n${body}`;
    })
    .join("\n\n");

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-5 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-rule bg-surface shadow-card">
          {/* Toolbar ------------------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-surface-2 px-4 py-3">
            <span className="font-display text-sm font-bold text-ink">
              Transcript &amp; subtitle editor
            </span>
            <span className="rounded-md border border-rule bg-surface px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-muted">
              {segments.length} segments
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <ToolbarButton onClick={autoSync} icon={<IconClock size={14} stroke={1.75} />}>
                Auto-sync timing
              </ToolbarButton>
              <ToolbarButton
                onClick={autoTranslate}
                disabled={translating}
                icon={
                  translating ? (
                    <IconLoader2 size={14} stroke={1.75} className="animate-spin" />
                  ) : (
                    <IconLanguage size={14} stroke={1.75} />
                  )
                }
              >
                {translating ? "Translating…" : "Auto-translate"}
              </ToolbarButton>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-success-soft px-2 py-1 font-mono text-[0.62rem] font-medium uppercase text-success-ink">
                  EN
                </span>
                {translated && (
                  <span className="rounded-md bg-cyan-soft px-2 py-1 font-mono text-[0.62rem] font-medium uppercase text-cyan-ink">
                    ID
                  </span>
                )}
                {translateSource === "gemini" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-lea-soft px-2 py-1 font-mono text-[0.62rem] font-medium text-brand-lea">
                    <IconSparkles size={11} stroke={1.75} />
                    Gemini
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body: segment list | side panel ------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            {/* LEFT — transcript segments */}
            <div className="flex max-h-[560px] flex-col gap-1 overflow-y-auto p-4 lg:border-r lg:border-rule">
              {segments.map((s, i) => {
                const active = i === activeSeg;
                return (
                  <div
                    key={s.segmentId}
                    onClick={() => selectSeg(i)}
                    className={cn(
                      "grid cursor-pointer grid-cols-[58px_1fr_auto] items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      active
                        ? "border-[#AFA9EC] bg-brand-lea-soft"
                        : "border-transparent hover:bg-surface-2",
                    )}
                  >
                    <div className="pt-0.5 font-mono text-[0.65rem] text-muted">
                      {formatTimecode(s.startMs)}
                    </div>
                    <div className="min-w-0">
                      <div
                        contentEditable={active}
                        suppressContentEditableWarning
                        className={cn(
                          "text-sm leading-relaxed outline-none",
                          active
                            ? "border-b border-accent text-ink"
                            : "text-secondary",
                        )}
                      >
                        {s.text}
                      </div>
                      {translated && translatedSegments[i] && (
                        <div className="mt-1 flex items-start gap-1.5">
                          <span className="mt-0.5 rounded bg-cyan-soft px-1 py-0.5 font-mono text-[0.55rem] font-medium uppercase leading-none text-cyan-ink">
                            ID
                          </span>
                          <span className="text-sm leading-relaxed text-cyan-ink">
                            {translatedSegments[i]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectSeg(i);
                        }}
                        className="rounded-[5px] border border-rule bg-surface px-1.5 py-1 text-muted transition-colors hover:border-accent hover:text-accent"
                        aria-label="Edit segment"
                      >
                        <IconEdit size={13} stroke={1.75} />
                      </button>
                      <button
                        onClick={(e) => splitSeg(e, i)}
                        className="rounded-[5px] border border-rule bg-surface px-2 py-1 font-mono text-[0.62rem] text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        split
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT — side panel */}
            <div className="flex flex-col gap-5 p-5">
              {/* SRT preview */}
              <Section title="SRT preview">
                <pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-mono text-[0.66rem] leading-relaxed text-secondary">
                  {srtPreview}
                </pre>
              </Section>

              {/* Export format */}
              <Section title="Export format">
                <div className="flex flex-col gap-1.5">
                  {FORMATS.map((f) => {
                    const on = format === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => pickFormat(f.key)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                          on
                            ? "border-accent bg-brand-lea-soft text-brand-lea"
                            : "border-rule bg-surface text-secondary hover:border-accent/40",
                        )}
                      >
                        {f.burn ? (
                          <IconVideo size={15} stroke={1.75} className="shrink-0" />
                        ) : (
                          <IconFileText size={15} stroke={1.75} className="shrink-0" />
                        )}
                        <span className="font-mono font-medium">
                          {f.burn ? "" : f.ext + " — "}
                        </span>
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Burn-in options */}
              <Section title="Burn-in options">
                <div className="grid grid-cols-2 gap-2">
                  {BURN_OPTS.map((o) => {
                    const on = burn[o.id];
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggleBurn(o.id)}
                        className={cn(
                          "rounded-lg border px-2.5 py-2 text-[0.7rem] font-medium transition-colors",
                          on
                            ? "border-accent bg-brand-lea-soft text-brand-lea"
                            : "border-rule bg-surface text-secondary hover:border-accent/40",
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Primary export button */}
              <button
                onClick={doExport}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#6d28d9]"
              >
                <IconDownload size={16} stroke={1.75} />
                Export subtitles
              </button>

              {exported && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2.5 text-xs font-medium text-success-ink">
                  <IconCircleCheck size={16} stroke={1.75} className="shrink-0 text-success" />
                  {exportLabel}
                </div>
              )}
            </div>
          </div>

          {/* Dev annotation footer ---------------------------------------- */}
          <div className="flex items-start gap-2.5 border-t border-cyan/20 bg-cyan-soft px-4 py-3">
            <IconCode size={15} stroke={1.75} className="mt-0.5 shrink-0 text-cyan-ink" />
            <p className="font-mono text-[0.68rem] leading-relaxed text-cyan-ink">
              {anno}
            </p>
          </div>
        </div>

        {/* Footer nav back to captions */}
        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/studio/${project.id}/captions`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent/40 hover:text-ink"
          >
            <IconArrowLeft size={14} stroke={1.75} />
            Captions
          </Link>
          <span className="text-xs text-muted">
            Click segments to edit · auto-sync timing · translate · choose format · export
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------
function ToolbarButton({
  children,
  icon,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-accent/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-rule disabled:hover:text-secondary"
    >
      {icon}
      {children}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}
