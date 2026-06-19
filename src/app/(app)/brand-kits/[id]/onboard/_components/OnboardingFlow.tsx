"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCheck,
  IconSend,
  IconSparkles,
  IconShieldCheck,
  IconAlertTriangle,
  IconPlus,
  IconX,
  IconPalette,
  IconWand,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ProgressBar } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";
import { ONBOARDING_QUESTIONS, BRAND_COLORS } from "@/lib/data";
import type {
  BrandKit,
  LogoPosition,
  TransitionStyle,
  CaptionStyle,
  MusicMood,
} from "@/lib/types";

// Short label per step (sidebar tracker)
const STEP_LABELS = [
  "Company",
  "Industry",
  "Products",
  "Customers",
  "Pain points",
  "Differentiators",
  "Brand voice",
];

// Map each question's target field -> the answer text stored on the brand.
function answerFor(brand: BrandKit, field: string): string {
  switch (field) {
    case "companyName":
      return brand.companyName;
    case "industry":
      return brand.industry;
    case "productDescription":
      return brand.productDescription;
    case "targetAudience":
      return brand.targetAudience;
    case "painPoint":
      return brand.painPoint;
    case "differentiators":
      return brand.differentiators.join(", ");
    case "voiceDescription":
      return brand.toneTags.slice(0, 2).join(" & ");
    default:
      return "";
  }
}

type ChatTurn =
  | { kind: "assistant"; text: string }
  | { kind: "user"; text: string };

export function OnboardingFlow({ brand }: { brand: BrandKit }) {
  const colors = BRAND_COLORS[brand.slug];
  const firstName = "Ira"; // Irawati Puteri — current admin

  // Canonical answers from the brand object (used to seed + as defaults).
  const canonicalAnswers = useMemo(
    () => ONBOARDING_QUESTIONS.map((q) => answerFor(brand, String(q.field))),
    [brand],
  );

  // Number of questions already answered when the user arrives.
  const initialDone = Math.min(brand.onboardingStep, 7);

  // Per-step recorded answer. Pre-fill completed steps from the brand object.
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    ONBOARDING_QUESTIONS.map((_, i) =>
      i < initialDone ? canonicalAnswers[i] : null,
    ),
  );
  // Index of the current (active) question. 7 === all answered -> visual config.
  const [step, setStep] = useState(initialDone);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"chat" | "config">(
    initialDone >= 7 ? "config" : "chat",
  );

  const answeredCount = answers.filter((a) => a !== null).length;
  const chatPct = Math.round((answeredCount / 7) * 100);

  // Build the conversation transcript from greeting + answered Q&A + current Q.
  const turns: ChatTurn[] = useMemo(() => {
    const out: ChatTurn[] = [
      {
        kind: "assistant",
        text: `Hey ${firstName}, let's train your brand.`,
      },
      {
        kind: "assistant",
        text: "I'll ask seven quick questions. Tap a suggestion or type your own — everything you tell me shapes how Lea writes captions, hooks and keeps your content on-brand.",
      },
    ];
    for (let i = 0; i < ONBOARDING_QUESTIONS.length; i++) {
      const a = answers[i];
      if (a === null) break;
      out.push({ kind: "assistant", text: ONBOARDING_QUESTIONS[i].prompt });
      out.push({ kind: "user", text: a });
    }
    if (step < ONBOARDING_QUESTIONS.length) {
      out.push({ kind: "assistant", text: ONBOARDING_QUESTIONS[step].prompt });
    }
    return out;
  }, [answers, step]);

  function record(value: string) {
    const v = value.trim();
    if (!v || step >= 7) return;
    const next = [...answers];
    next[step] = v;
    setAnswers(next);
    setDraft("");
    const newStep = step + 1;
    setStep(newStep);
    if (newStep >= 7) {
      // brief beat then reveal config
      setPhase("config");
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-screen flex-col bg-paper">
      {/* Light top strip */}
      <div className="flex items-center justify-between gap-4 border-b border-rule bg-surface px-6 py-3.5 md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/brand-kits"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-surface-2"
          >
            <IconArrowLeft size={15} stroke={1.9} />
            Brand Kits
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-lg">{brand.emoji}</span>
            <span className="font-display text-base font-bold text-ink">
              {brand.brandName}
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-accent">
              Module 0 — Onboarding
            </span>
          </div>
        </div>
        <div className="font-mono text-[0.7rem] text-muted">
          studio.legali.ai / brand / {brand.slug} /{" "}
          {phase === "config" ? "identity" : "onboard"}
        </div>
      </div>

      {/* Split screen */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
        <TrackerSidebar
          brand={brand}
          colors={colors}
          answers={answers}
          step={step}
          answeredCount={answeredCount}
        />
        <div className="min-h-0 bg-paper">
          {phase === "chat" ? (
            <ChatPanel
              brand={brand}
              turns={turns}
              step={step}
              draft={draft}
              setDraft={setDraft}
              onSubmit={() => record(draft)}
              onChip={(c) => record(c)}
              chatPct={chatPct}
            />
          ) : (
            <VisualIdentityPanel brand={brand} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* LEFT — step tracker                                                      */
/* ----------------------------------------------------------------------- */
function TrackerSidebar({
  brand,
  colors,
  answers,
  step,
  answeredCount,
}: {
  brand: BrandKit;
  colors: { soft: string; ink: string; tw: string };
  answers: (string | null)[];
  step: number;
  answeredCount: number;
}) {
  return (
    <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-r border-rule bg-surface px-6 py-7">
      <div>
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
          Brand profile
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-ink">
          {brand.brandName}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Filling in as we train your brand.
        </p>
      </div>

      <div>
        <ProgressBar value={Math.round((answeredCount / 7) * 100)} />
        <div className="mt-2 flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-wide text-muted">
          <span>Answers saved</span>
          <span className="font-semibold text-secondary">{answeredCount}/7</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {STEP_LABELS.map((label, i) => {
          const done = answers[i] !== null;
          const active = i === step;
          return (
            <div
              key={label}
              className={cn(
                "flex items-start gap-3 rounded-lg px-2 py-2 transition-colors",
                active && "bg-accent-soft",
              )}
            >
              {/* status dot */}
              <div className="mt-0.5 shrink-0">
                {done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                    <IconCheck size={12} stroke={2.6} />
                  </span>
                ) : active ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-accent">
                    <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-accent" />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-rule bg-surface-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rule" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    done || active ? "text-ink" : "text-muted",
                  )}
                >
                  {label}
                </div>
                <div
                  className={cn(
                    "truncate text-xs",
                    done
                      ? "text-secondary"
                      : active
                        ? "text-accent"
                        : "text-muted/70",
                  )}
                >
                  {done
                    ? answers[i]
                    : active
                      ? "Waiting for answer"
                      : "Not started"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto rounded-xl border border-rule bg-surface-2 px-3.5 py-3">
        <div className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted">
          <IconSparkles size={12} stroke={1.9} className="text-accent" />
          Why this matters
        </div>
        <p className="mt-1 text-xs leading-relaxed text-secondary">
          Module 0 is the prerequisite for everything. AI cuts, captions and
          safety filters all read from this trained kit.
        </p>
      </div>
    </aside>
  );
}

/* ----------------------------------------------------------------------- */
/* RIGHT — chat panel                                                       */
/* ----------------------------------------------------------------------- */
function ChatPanel({
  brand,
  turns,
  step,
  draft,
  setDraft,
  onSubmit,
  onChip,
  chatPct,
}: {
  brand: BrandKit;
  turns: ChatTurn[];
  step: number;
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
  onChip: (c: string) => void;
  chatPct: number;
}) {
  const avatar = brand.slug === "lea" ? "🐰" : brand.emoji;
  const assistantName = brand.slug === "lea" ? "Lea" : brand.brandName;
  const currentQ =
    step < ONBOARDING_QUESTIONS.length ? ONBOARDING_QUESTIONS[step] : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* progress strip */}
      <div className="flex items-center gap-3 border-b border-rule bg-surface px-6 py-3">
        <div className="flex-1">
          <ProgressBar value={chatPct} />
        </div>
        <span className="font-display text-base font-bold tabular-nums text-ink">
          {chatPct}%
        </span>
      </div>

      {/* conversation */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {turns.map((t, i) =>
            t.kind === "assistant" ? (
              <div key={i} className="flex items-start gap-3 animate-fade-up">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule bg-surface text-lg shadow-card">
                  {avatar}
                </div>
                <div className="min-w-0">
                  <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-accent">
                    {assistantName}
                  </div>
                  <div className="inline-block rounded-2xl rounded-tl-sm border border-rule bg-surface px-4 py-2.5 text-sm leading-relaxed text-ink shadow-card">
                    {t.text}
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end animate-fade-up">
                <div className="inline-block max-w-[80%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm font-medium leading-relaxed text-white shadow-sm">
                  {t.text}
                </div>
              </div>
            ),
          )}

          {/* quick-select chips for the current question */}
          {currentQ && currentQ.chips.length > 0 && (
            <div className="ml-12 flex flex-wrap gap-2">
              {currentQ.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChip(chip)}
                  className="rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1.5 text-xs font-medium text-accent-ink transition-all hover:-translate-y-px hover:border-accent hover:shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* input row */}
      <div className="border-t border-rule bg-surface px-6 py-4 md:px-10">
        <form
          className="mx-auto flex max-w-2xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={currentQ?.placeholder ?? "Type your answer…"}
            className="flex-1 rounded-xl border border-rule bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm transition-colors hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send answer"
          >
            <IconSend size={18} stroke={1.9} />
          </button>
        </form>
        <div className="mx-auto mt-2 max-w-2xl text-center font-mono text-[0.62rem] text-muted">
          Used by:{" "}
          <span className="text-secondary">
            {currentQ?.usedBy ?? "All downstream AI generation"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* VISUAL IDENTITY CONFIG (PRD 3.3)                                         */
/* ----------------------------------------------------------------------- */
const LOGO_OPTIONS: { value: LogoPosition; label: string }[] = [
  { value: "top-left", label: "Top-left" },
  { value: "bottom-left", label: "Bottom-left" },
  { value: "bottom-right", label: "Bottom-right" },
];
const TRANSITION_OPTIONS: { value: TransitionStyle; label: string }[] = [
  { value: "soft-fade", label: "Soft Fade" },
  { value: "clean-cut", label: "Clean Cut" },
  { value: "snap", label: "Snap" },
  { value: "bounce", label: "Bounce" },
];
const CAPTION_OPTIONS: { value: CaptionStyle; label: string }[] = [
  { value: "word-by-word", label: "Word-by-word" },
  { value: "line-by-line", label: "Line-by-line" },
  { value: "highlight", label: "Highlight key terms" },
];
const MUSIC_OPTIONS: { value: MusicMood; label: string }[] = [
  { value: "soft-emotional", label: "Soft Emotional" },
  { value: "confident", label: "Confident" },
  { value: "playful", label: "Playful" },
  { value: "corporate", label: "Corporate" },
  { value: "none", label: "None" },
];

function VisualIdentityPanel({ brand }: { brand: BrandKit }) {
  const colors = BRAND_COLORS[brand.slug];
  const [primary, setPrimary] = useState(brand.primaryColor);
  const [secondary, setSecondary] = useState(brand.secondaryColor);
  const [font, setFont] = useState(brand.fontFamily);
  const [logoPos, setLogoPos] = useState<LogoPosition>(brand.logoPosition);
  const [transition, setTransition] = useState<TransitionStyle>(
    brand.transitionStyle,
  );
  const [caption, setCaption] = useState<CaptionStyle>(brand.captionStyle);
  const [trauma, setTrauma] = useState(brand.traumaInformed);
  const [music, setMusic] = useState<MusicMood>(brand.musicMood);
  const [cta, setCta] = useState(brand.ctaTemplate);
  const [prohibited, setProhibited] = useState<string[]>(
    brand.prohibitedPhrases,
  );
  const [hashtags, setHashtags] = useState<string[]>(brand.hashtagLibrary);
  const [traumaWarning, setTraumaWarning] = useState(false);
  const [saved, setSaved] = useState(false);

  const isLea = brand.slug === "lea";

  function toggleTrauma() {
    if (trauma && isLea) {
      // Lea: warn before allowing the user to disable trauma-informed mode.
      setTraumaWarning(true);
      setTrauma(false);
      return;
    }
    setTraumaWarning(false);
    setTrauma((v) => !v);
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-paper px-6 py-7 md:px-10">
      <div className="mx-auto max-w-3xl">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent">
              <IconPalette size={13} stroke={1.9} />
              Step 8 — Visual identity
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight text-ink">
              Configure {brand.brandName}&apos;s visual layer
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              The seven questions are trained. Now lock the visual rules every
              exported video inherits. Lea defaults are pre-loaded.
            </p>
          </div>
          <Tag tone="success">
            <IconCheck size={12} stroke={2.2} />7 / 7 answered
          </Tag>
        </div>

        {/* Live identity preview */}
        <div
          className="mb-6 overflow-hidden rounded-xl border border-rule shadow-card"
          style={{ background: colors.soft }}
        >
          <div className="relative flex aspect-[2/1] items-center justify-center">
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              <span className="text-3xl">{brand.emoji}</span>
              <span
                className="font-display text-2xl font-bold text-white"
                style={{ fontFamily: font }}
              >
                {brand.brandName}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {cta}
              </span>
            </div>
            {/* logo placement marker */}
            <span
              className={cn(
                "absolute flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-sm shadow-sm",
                logoPos === "top-left" && "left-3 top-3",
                logoPos === "bottom-left" && "bottom-3 left-3",
                logoPos === "bottom-right" && "bottom-3 right-3",
              )}
            >
              {brand.emoji}
            </span>
          </div>
        </div>

        <div className="space-y-6 pb-12">
          {/* Colors + Font */}
          <ConfigCard title="Palette & type" icon="palette">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField label="Primary color" value={primary} onChange={setPrimary} />
              <ColorField
                label="Secondary color"
                value={secondary}
                onChange={setSecondary}
              />
            </div>
            <Field label="Font family">
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className={selectCls}
              >
                {[
                  "Quicksand",
                  "DM Sans",
                  "Inter",
                  "Poppins",
                  "Playfair Display",
                  "Montserrat",
                ].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </ConfigCard>

          {/* Layout & motion */}
          <ConfigCard title="Layout & motion" icon="wand">
            <Field label="Logo placement">
              <SegmentedControl
                options={LOGO_OPTIONS}
                value={logoPos}
                onChange={setLogoPos}
              />
            </Field>
            <Field label="Transition style">
              <SegmentedControl
                options={TRANSITION_OPTIONS}
                value={transition}
                onChange={setTransition}
              />
            </Field>
            <Field label="Caption style">
              <SegmentedControl
                options={CAPTION_OPTIONS}
                value={caption}
                onChange={setCaption}
              />
            </Field>
          </ConfigCard>

          {/* Safety & sound */}
          <ConfigCard title="Safety & sound" icon="shield">
            {/* trauma-informed toggle */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-rule bg-surface-2 px-3.5 py-3">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <IconShieldCheck size={15} stroke={1.9} className="text-success" />
                  Trauma-informed mode
                </div>
                <p className="mt-0.5 max-w-md text-xs text-muted">
                  Enforces survivor-safe language and gentle pacing across every
                  generation.{" "}
                  {isLea && (
                    <span className="font-medium text-secondary">
                      Strongly recommended for Lea.
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={trauma}
                onClick={toggleTrauma}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  trauma ? "bg-success" : "bg-rule",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    trauma ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
            {traumaWarning && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-warn-soft px-3.5 py-3 text-sm">
                <IconAlertTriangle
                  size={16}
                  stroke={1.9}
                  className="mt-0.5 shrink-0 text-warn"
                />
                <div className="text-[#92400e]">
                  <span className="font-semibold">
                    Are you sure you want to disable trauma-informed mode for Lea?
                  </span>{" "}
                  Lea&apos;s audience are domestic-violence survivors. Turning
                  this off removes survivor-safe language guards from every AI
                  generation. We strongly recommend keeping it on.
                  <button
                    type="button"
                    onClick={() => {
                      setTrauma(true);
                      setTraumaWarning(false);
                    }}
                    className="ml-1 font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    Re-enable
                  </button>
                </div>
              </div>
            )}

            <Field label="Music mood">
              <select
                value={music}
                onChange={(e) => setMusic(e.target.value as MusicMood)}
                className={selectCls}
              >
                {MUSIC_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </ConfigCard>

          {/* Copy & tags */}
          <ConfigCard title="Copy & tags" icon="sparkles">
            <Field label="CTA template text">
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field
              label="Prohibited phrases"
              hint="Injected into every AI prompt as hard exclusions"
            >
              <TagInput
                values={prohibited}
                onChange={setProhibited}
                placeholder="Add a banned phrase…"
                tone="danger"
              />
            </Field>
            <Field
              label="Hashtag library"
              hint="Auto-appended to exported captions per platform"
            >
              <TagInput
                values={hashtags}
                onChange={setHashtags}
                placeholder="#addhashtag"
                tone="feature"
              />
            </Field>
          </ConfigCard>

          {/* footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
            <p className="text-xs text-muted">
              {saved
                ? "Brand kit saved — every module now reads these defaults."
                : "This config is a required Module 0 deliverable."}
            </p>
            <div className="flex items-center gap-2">
              {saved && (
                <Tag tone="success">
                  <IconCheck size={12} stroke={2.2} />
                  Saved
                </Tag>
              )}
              <Button variant="outline" size="md" onClick={() => setSaved(false)}>
                Save draft
              </Button>
              <Button variant="primary" size="md" onClick={() => setSaved(true)}>
                <IconCheck size={16} stroke={2} />
                Finish &amp; save brand kit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- config helpers ---- */
const inputCls =
  "w-full rounded-lg border border-rule bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15";
const selectCls = inputCls + " appearance-none cursor-pointer";

function ConfigCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: "palette" | "wand" | "shield" | "sparkles";
  children: React.ReactNode;
}) {
  const Icon =
    icon === "palette"
      ? IconPalette
      : icon === "wand"
        ? IconWand
        : icon === "shield"
          ? IconShieldCheck
          : IconSparkles;
  return (
    <section className="rounded-xl border border-rule bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">
        <Icon size={14} stroke={1.9} />
        {title}
        <span className="h-px flex-1 bg-rule" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-secondary">
          {label}
        </label>
        {hint && <span className="text-[0.68rem] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-lg border border-rule bg-surface px-2.5 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-rule bg-transparent"
          aria-label={`${label} swatch`}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-sm font-semibold uppercase text-ink focus:outline-none"
        />
      </div>
    </Field>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-accent bg-accent text-white shadow-sm"
                : "border-rule bg-surface text-secondary hover:border-accent/40 hover:bg-surface-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  values,
  onChange,
  placeholder,
  tone,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  tone: "danger" | "feature";
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }
  return (
    <div className="rounded-lg border border-rule bg-surface p-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[0.7rem] font-medium",
              tone === "danger"
                ? "bg-danger-soft text-danger-ink border border-red-200"
                : "bg-accent-soft text-accent-ink border border-violet-200",
            )}
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="opacity-60 hover:opacity-100"
              aria-label={`Remove ${v}`}
            >
              <IconX size={11} stroke={2.2} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-rule bg-surface-2 px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-rule bg-surface text-secondary transition-colors hover:bg-surface-2"
          aria-label="Add"
        >
          <IconPlus size={14} stroke={2} />
        </button>
      </div>
    </div>
  );
}
