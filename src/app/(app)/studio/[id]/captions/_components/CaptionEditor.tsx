"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconRefresh,
  IconShield,
  IconShieldCheck,
  IconDownload,
  IconCode,
  IconArrowRight,
  IconAlertTriangle,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, LANG_CAPTIONS, getBrand } from "@/lib/data";
import type { VideoProject } from "@/lib/types";

// ---------------------------------------------------------------------------
// Caption style presets (mirrors CAP_STYLES in the mockup) — each carries the
// overlay text + bg + color it applies, a mini-preview spec, and the dev
// annotation echoing the API behavior.
// ---------------------------------------------------------------------------
type StyleKey = "word-by-word" | "line" | "full" | "bounce";

interface CapStyle {
  key: StyleKey;
  label: string;
  text: string;
  bg: string;
  color: string;
  anno: string;
}

const CAP_STYLES: Record<StyleKey, CapStyle> = {
  "word-by-word": {
    key: "word-by-word",
    label: "Word by word",
    text: "You",
    bg: "rgba(219,39,119,.9)",
    color: "#ffffff",
    anno: "Style: word_by_word — Whisper word-level timestamps render each word individually. Highest engagement for hook moments. FFmpeg filter: subtitles=file.ass with per-word {\\an8} tags.",
  },
  line: {
    key: "line",
    label: "Line highlight",
    text: "You might not even…",
    bg: "rgba(61,0,38,.85)",
    color: "#ffb3d1",
    anno: "Style: line_highlight — sentence-level segments from Whisper transcript. One line displayed at a time, fades on change. Stored as caption_json[{start_ms,end_ms,text}].",
  },
  full: {
    key: "full",
    label: "Full block",
    text: "You might not\neven realize…",
    bg: "rgba(0,0,0,.6)",
    color: "#ffffff",
    anno: "Style: full_block — 2–3 lines shown simultaneously. Classic subtitle look. Best for accessibility and LinkedIn. Rendered via subtitles FFmpeg filter or Remotion Sequence.",
  },
  bounce: {
    key: "bounce",
    label: "Bounce pop",
    text: "REALIZE",
    bg: "transparent",
    color: "#c4b5fd",
    anno: "Style: bounce_pop — key word extracted by Claude from each segment, rendered with CSS keyframe scale animation in Remotion. Exported as burned-in video only. Best for TikTok.",
  },
};

const COLORS: { color: string; bg: string }[] = [
  { color: "#ffb3d1", bg: "rgba(61,0,38,.85)" },
  { color: "#ffffff", bg: "rgba(0,0,0,.7)" },
  { color: "#c4b5fd", bg: "rgba(30,10,60,.85)" },
  { color: "#86efac", bg: "rgba(5,50,20,.85)" },
  { color: "#fde68a", bg: "rgba(40,30,0,.8)" },
];

const PLAYBACK: { mode: StyleKey; label: string }[] = [
  { mode: "word-by-word", label: "Word by word" },
  { mode: "line", label: "Line" },
  { mode: "full", label: "Full block" },
];

export function CaptionEditor({ project }: { project: VideoProject }) {
  const brand = getBrand(project.brandSlug);

  const [styleKey, setStyleKey] = useState<StyleKey>("line");
  const [text, setText] = useState<string>(CAP_STYLES.line.text);
  const [bg, setBg] = useState<string>(CAP_STYLES.line.bg);
  const [color, setColor] = useState<string>(CAP_STYLES.line.color);
  const [fontSize, setFontSize] = useState(18);
  const [position, setPosition] = useState(75);
  const [lang, setLang] = useState("en");
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [anno, setAnno] = useState<string>(CAP_STYLES.line.anno);

  // --- live AI state -------------------------------------------------------
  // The full caption text that AI actions read/operate on. Starts from the
  // selected candidate caption; replaced when Regenerate / safety revision run.
  const [caption, setCaption] = useState<string>(
    project.candidates[project.selectedCandidate]?.caption ?? CAP_STYLES.line.text,
  );
  const [captionSource, setCaptionSource] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);

  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState<{
    source: string;
    passed: boolean;
    flags: { phrase: string; reason: string; suggestedReplacement: string }[];
    revisedText: string | null;
  } | null>(null);

  const [transLang, setTransLang] = useState<string | null>(null);

  // The English caption phrase shown in the overlay before translation —
  // tracks the active style/regenerate base so translations operate on it.
  const [baseText, setBaseText] = useState<string>(CAP_STYLES.line.text);

  // First non-empty line of the working caption, used as a short overlay lead-in.
  function leadIn(full: string): string {
    const first = full.split(/[\n.!?]/).map((s) => s.trim()).find(Boolean) ?? full;
    return first.length > 26 ? first.slice(0, 26).trimEnd() + "…" : first;
  }

  // --- interactions --------------------------------------------------------
  function applyStyle(key: StyleKey) {
    const s = CAP_STYLES[key];
    setStyleKey(key);
    setText(s.text);
    setBaseText(s.text);
    setBg(s.bg);
    setColor(s.color);
    setLang("en");
    setAnno(s.anno);
  }

  function applyColor(c: string, b: string) {
    setColor(c);
    setBg(b);
    setAnno(
      `API: PATCH /api/v1/projects/${project.id}/captions — {text_color:"${c}", bg_color:"${b}"}. Brand kit default colors pre-applied. User override stored per-project.`,
    );
  }

  async function applyLang(code: string) {
    setLang(code);

    // English resets the overlay to the base (style/regenerate) text.
    if (code === "en") {
      setTransLang(null);
      setText(baseText);
      setAnno(
        `Translation: original English caption restored. Overlay base text = "${baseText}".`,
      );
      return;
    }

    // Show the static placeholder immediately while the live request is in flight.
    setText(LANG_CAPTIONS[code] ?? CAP_STYLES[styleKey].text);
    setTransLang(code);
    setAnno(
      `Translation: POST /api/translate — {text, target:"${code}"}. Gemini translates the English caption phrase preserving tone. Showing static placeholder while the live translation loads…`,
    );

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: baseText, target: code }),
      });
      const data = await res.json();
      // Only apply if this language is still the active selection.
      setLang((cur) => {
        if (cur === code && typeof data?.text === "string" && data.text) {
          setText(data.text);
          setAnno(
            `Translation${data.source === "gemini" ? " ✦ Gemini" : ""}: POST /api/translate {target:"${code}"} → "${data.text}". Bilingual export (EN + ${code.toUpperCase()}) available for SRT.`,
          );
        }
        return cur;
      });
    } catch {
      setAnno(
        `Translation: POST /api/translate {target:"${code}"} failed — showing static placeholder "${LANG_CAPTIONS[code] ?? ""}".`,
      );
    } finally {
      setTransLang((cur) => (cur === code ? null : cur));
    }
  }

  function onFontSize(v: number) {
    setFontSize(v);
    setAnno(
      `API: PATCH /api/v1/projects/${project.id}/captions — {font_size:${v}}. Stored in caption_config JSONB. Applied at render time via Remotion AbsoluteFill text layer.`,
    );
  }

  function onPosition(v: number) {
    setPosition(v);
    setAnno(
      `API: PATCH /api/v1/projects/${project.id}/captions — {position_pct:${v}}. Maps to FFmpeg y=(h*${(v / 100).toFixed(2)})-(text_h/2) for burn-in, or Remotion top style prop for preview.`,
    );
  }

  async function regenerate() {
    if (regenLoading) return;
    setRegenLoading(true);
    setAnno(
      `Regenerate: POST /api/captions — re-running the caption generation with ${brand.brandName} voice context…`,
    );
    try {
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (typeof data?.caption === "string" && data.caption) {
        setCaption(data.caption);
        setCaptionSource(data.source ?? null);
        // Reset translation, set the English overlay base to a short lead-in.
        setLang("en");
        setTransLang(null);
        const lead = leadIn(data.caption);
        setBaseText(lead);
        setText(lead);
        // A fresh caption invalidates the previous safety result.
        setSafetyResult(null);
        setSafetyOpen(false);
        setAnno(
          `Regenerate${data.source === "gemini" ? " ✦ Gemini" : ""}: POST /api/captions {projectId:"${project.id}"} → "${data.caption}". Overlay lead-in = "${lead}". Safety check should re-run before export.`,
        );
      } else {
        setAnno(`Regenerate: POST /api/captions returned no caption.`);
      }
    } catch {
      setAnno(`Regenerate: POST /api/captions failed — keeping the existing caption.`);
    } finally {
      setRegenLoading(false);
    }
  }

  async function runSafety() {
    if (safetyLoading) return;
    setSafetyLoading(true);
    setSafetyOpen(true);
    setSafetyResult(null);
    const checkText = caption;
    setAnno(
      `Safety check: POST /api/safety {brandSlug:"${project.brandSlug}"} — trauma-informed pass on the current caption…`,
    );
    try {
      const res = await fetch("/api/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: checkText, brandSlug: project.brandSlug }),
      });
      const data = await res.json();
      setSafetyResult({
        source: data?.source ?? "",
        passed: Boolean(data?.passed),
        flags: Array.isArray(data?.flags) ? data.flags : [],
        revisedText: typeof data?.revisedText === "string" ? data.revisedText : null,
      });
      setAnno(
        `Safety check${data?.source === "gemini" ? " ✦ Gemini" : ""}: POST /api/safety → {passed:${Boolean(data?.passed)}, flags:${Array.isArray(data?.flags) ? data.flags.length : 0}}.`,
      );
    } catch {
      setSafetyResult(null);
      setSafetyOpen(false);
      setAnno(`Safety check: POST /api/safety failed — try again before exporting.`);
    } finally {
      setSafetyLoading(false);
    }
  }

  function applyRevision(revised: string) {
    setCaption(revised);
    const lead = leadIn(revised);
    setBaseText(lead);
    setLang("en");
    setTransLang(null);
    setText(lead);
    setSafetyResult(null);
    setSafetyOpen(false);
    setAnno(
      `Safety revision applied: caption replaced with the suggested revised text. Overlay lead-in = "${lead}". Re-run safety check to confirm.`,
    );
  }

  const overlayLines = text.split("\n");

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-5 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-rule bg-surface shadow-card">
          {/* Toolbar ------------------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-surface-2 px-4 py-3">
            <span className="font-display text-sm font-bold text-ink">
              Caption editor
            </span>
            <span className="rounded-md border border-rule bg-surface px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-muted">
              {CAP_STYLES[styleKey].label}
            </span>
            {captionSource === "gemini" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-brand-lea-soft px-2 py-0.5 font-mono text-[0.6rem] font-medium text-brand-lea">
                <IconSparkles size={11} stroke={2} />
                Gemini
              </span>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <ToolbarButton
                onClick={regenerate}
                disabled={regenLoading}
                icon={
                  regenLoading ? (
                    <IconLoader2 size={14} stroke={1.75} className="animate-spin" />
                  ) : (
                    <IconRefresh size={14} stroke={1.75} />
                  )
                }
              >
                {regenLoading ? "Regenerating…" : "Regenerate"}
              </ToolbarButton>
              <ToolbarButton
                onClick={runSafety}
                disabled={safetyLoading}
                icon={
                  safetyLoading ? (
                    <IconLoader2 size={14} stroke={1.75} className="animate-spin" />
                  ) : (
                    <IconShield size={14} stroke={1.75} />
                  )
                }
              >
                {safetyLoading ? "Checking…" : "Safety check"}
              </ToolbarButton>
              <Link
                href={`/studio/${project.id}/subtitles`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#6d28d9]"
              >
                <IconDownload size={14} stroke={1.75} />
                Export subtitles
                <IconArrowRight size={13} stroke={1.75} />
              </Link>
            </div>
          </div>

          {/* Body: dark preview | light controls -------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT — preview */}
            <div className="flex flex-col items-center justify-center gap-5 border-b border-rule bg-[#1a1225] p-8 lg:border-b-0 lg:border-r lg:border-r-white/10">
              <div className="relative flex h-[300px] w-[170px] flex-col overflow-hidden rounded-[18px] border border-white/12 bg-[#0d0a14] shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
                {/* notch */}
                <div className="absolute left-1/2 top-1.5 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15" />
                {/* video area */}
                <div
                  className="relative flex flex-1 flex-col justify-end px-3 pb-3"
                  style={{
                    background: `linear-gradient(160deg, ${brand.primaryColor} 0%, #2d0a1a 55%, #160510 100%)`,
                  }}
                >
                  {/* live caption overlay */}
                  <div
                    className="absolute left-1/2 w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-[4px] px-2 py-1 text-center font-mono leading-tight transition-all duration-300"
                    style={{
                      top: `${position}%`,
                      background: bg,
                      color,
                      fontSize: `${Math.round(fontSize * 0.5)}px`,
                      fontWeight: styleKey === "bounce" ? 700 : 500,
                    }}
                  >
                    {overlayLines.map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
                {/* progress bar */}
                <div className="h-[3px] bg-white/12">
                  <div className="h-full w-[30%] bg-pink transition-[width] duration-500" />
                </div>
              </div>

              {/* playback style buttons */}
              <div className="flex items-center gap-2">
                {PLAYBACK.map((p) => (
                  <button
                    key={p.mode}
                    onClick={() => applyStyle(p.mode)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-[0.7rem] font-medium transition-colors",
                      styleKey === p.mode
                        ? "border-accent bg-accent text-white"
                        : "border-white/15 bg-transparent text-white/60 hover:text-white",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/30">
                Caption style preview · {fontSize}px · {position}%
              </div>
            </div>

            {/* RIGHT — controls */}
            <div className="flex max-h-[640px] flex-col gap-6 overflow-y-auto p-6">
              {/* Style grid */}
              <Section title="Style">
                <div className="grid grid-cols-2 gap-2.5">
                  <StylePreview
                    active={styleKey === "word-by-word"}
                    label="Word by word"
                    onClick={() => applyStyle("word-by-word")}
                  >
                    <span className="rounded-sm bg-pink/90 px-1.5 py-0.5 text-[0.55rem] font-medium text-white">
                      You
                    </span>
                  </StylePreview>
                  <StylePreview
                    active={styleKey === "line"}
                    label="Line highlight"
                    onClick={() => applyStyle("line")}
                  >
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[0.5rem]"
                      style={{ background: "rgba(61,0,38,.85)", color: "#ffb3d1" }}
                    >
                      You might not
                    </span>
                  </StylePreview>
                  <StylePreview
                    active={styleKey === "full"}
                    label="Full block"
                    onClick={() => applyStyle("full")}
                    column
                  >
                    <span className="text-[0.5rem] text-white">You might not even</span>
                    <span className="text-[0.5rem] text-white">realize you&apos;re…</span>
                  </StylePreview>
                  <StylePreview
                    active={styleKey === "bounce"}
                    label="Bounce pop"
                    onClick={() => applyStyle("bounce")}
                  >
                    <span className="text-[0.6rem] font-bold" style={{ color: "#c4b5fd" }}>
                      REALIZE
                    </span>
                  </StylePreview>
                </div>
              </Section>

              {/* Appearance */}
              <Section title="Appearance">
                <SliderRow
                  label="Font size"
                  min={12}
                  max={28}
                  value={fontSize}
                  onChange={onFontSize}
                  display={`${fontSize}px`}
                />
                <SliderRow
                  label="Position"
                  min={10}
                  max={90}
                  value={position}
                  onChange={onPosition}
                  display={`${position}%`}
                />
              </Section>

              {/* Caption color */}
              <Section title="Caption color">
                <div className="flex items-center gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => applyColor(c.color, c.bg)}
                      aria-label={`Caption color ${c.color}`}
                      className={cn(
                        "h-6 w-6 rounded-md border-2 transition-all",
                        color === c.color
                          ? "border-ink ring-2 ring-accent/30"
                          : "border-transparent hover:border-rule",
                      )}
                      style={{ background: c.color }}
                    />
                  ))}
                </div>
              </Section>

              {/* Language / translation */}
              <Section title="Language / translation">
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => applyLang(l.code)}
                      disabled={transLang !== null && transLang !== l.code}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-[0.7rem] font-medium transition-colors disabled:opacity-50",
                        lang === l.code
                          ? "border-accent bg-brand-lea-soft text-brand-lea"
                          : "border-rule bg-surface text-secondary hover:border-accent/40",
                      )}
                    >
                      {transLang === l.code ? (
                        <IconLoader2
                          size={12}
                          stroke={2}
                          className="mr-1 animate-spin text-brand-lea"
                        />
                      ) : (
                        <span className="mr-1">{l.flag}</span>
                      )}
                      {l.label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Current caption (live-editable target for AI actions) */}
              <Section title="Current caption">
                <div className="rounded-lg border border-rule bg-surface-2 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5">
                    {captionSource === "gemini" && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-brand-lea-soft px-1.5 py-0.5 font-mono text-[0.58rem] font-medium text-brand-lea">
                        <IconSparkles size={10} stroke={2} />
                        Gemini
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-secondary">{caption}</p>
                </div>
              </Section>

              {/* Safety check status */}
              {safetyLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-rule bg-surface-2 px-3 py-2.5 text-xs font-medium text-secondary">
                  <IconLoader2 size={16} stroke={1.75} className="shrink-0 animate-spin text-accent" />
                  Running trauma-informed safety check…
                </div>
              )}

              {safetyOpen && !safetyLoading && safetyResult?.passed && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2.5 text-xs font-medium text-success-ink">
                  <IconShieldCheck size={16} stroke={1.75} className="shrink-0 text-success" />
                  Trauma-informed safety check passed — no flagged phrases detected.
                  {safetyResult.source === "gemini" && (
                    <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.58rem] text-success">
                      <IconSparkles size={10} stroke={2} />
                      Gemini
                    </span>
                  )}
                </div>
              )}

              {safetyOpen && !safetyLoading && safetyResult && !safetyResult.passed && (
                <div className="flex flex-col gap-3 rounded-lg border border-warn/40 bg-warn-soft px-3 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-warn-ink">
                    <IconAlertTriangle size={16} stroke={1.75} className="shrink-0 text-warn" />
                    Safety check flagged{" "}
                    {safetyResult.flags.length === 1
                      ? "1 phrase"
                      : `${safetyResult.flags.length} phrases`}
                    {safetyResult.source === "gemini" && (
                      <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.58rem] text-warn">
                        <IconSparkles size={10} stroke={2} />
                        Gemini
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2">
                    {safetyResult.flags.map((f, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-warn/30 bg-surface px-2.5 py-2 text-[0.7rem] leading-relaxed"
                      >
                        <div className="flex items-start gap-1.5">
                          <IconShield
                            size={13}
                            stroke={1.75}
                            className="mt-0.5 shrink-0 text-warn"
                          />
                          <div>
                            <span className="font-semibold text-ink">
                              &ldquo;{f.phrase}&rdquo;
                            </span>
                            <p className="text-secondary">{f.reason}</p>
                            {f.suggestedReplacement && (
                              <p className="mt-0.5 text-secondary">
                                Suggested:{" "}
                                <span className="font-medium text-success-ink">
                                  &ldquo;{f.suggestedReplacement}&rdquo;
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {safetyResult.revisedText && (
                    <div className="rounded-md border border-rule bg-surface px-2.5 py-2">
                      <div className="mb-1 font-mono text-[0.58rem] uppercase tracking-wide text-muted">
                        Revised text
                      </div>
                      <p className="text-[0.72rem] leading-relaxed text-secondary">
                        {safetyResult.revisedText}
                      </p>
                      <button
                        onClick={() => applyRevision(safetyResult.revisedText!)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-accent bg-accent px-2.5 py-1 text-[0.7rem] font-medium text-white transition-colors hover:bg-[#6d28d9]"
                      >
                        <IconShieldCheck size={13} stroke={1.75} />
                        Apply revision
                      </button>
                    </div>
                  )}
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
  disabled = false,
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
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function StylePreview({
  active,
  label,
  onClick,
  children,
  column = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  column?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border p-2 text-center transition-all",
        active
          ? "border-accent bg-brand-lea-soft shadow-sm"
          : "border-rule bg-surface hover:border-accent/40",
      )}
    >
      <div
        className={cn(
          "mb-1.5 flex h-8 items-center justify-center gap-0.5 rounded-md",
          column && "flex-col",
        )}
        style={{ background: "#2d0a1a" }}
      >
        {children}
      </div>
      <div
        className={cn(
          "text-[0.7rem] font-medium",
          active ? "text-brand-lea" : "text-secondary",
        )}
      >
        {label}
      </div>
    </button>
  );
}

function SliderRow({
  label,
  min,
  max,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-16 shrink-0 text-xs text-secondary">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-rule accent-accent"
      />
      <span className="w-9 shrink-0 text-right font-mono text-xs text-ink">
        {display}
      </span>
    </div>
  );
}
