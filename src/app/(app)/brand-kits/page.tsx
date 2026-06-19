import Link from "next/link";
import {
  IconPlus,
  IconShieldCheck,
  IconCheck,
  IconArrowRight,
  IconShield,
  IconPalette,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { PageHeader, ProgressBar } from "@/components/ui/Misc";
import { BRAND_KITS, BRAND_COLORS } from "@/lib/data";
import type { BrandKit } from "@/lib/types";

export default function BrandKitsPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <PageHeader
        label="Module 0 — Brand Onboarding"
        title="Brand Kits"
        subtitle="A trained brand kit is the prerequisite every other module consumes — AI cut generation, caption style, safety filters and insight framing all read from here. No kit, no on-brand output."
        actions={
          <Button variant="primary">
            <IconPlus size={16} stroke={1.9} />
            New brand kit
          </Button>
        }
      />

      {/* Admin-only callout */}
      <div className="mb-7 flex items-start gap-3 rounded-xl border border-rule bg-surface px-4 py-3.5 shadow-card">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <IconShield size={16} stroke={1.9} />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-ink">Only Admins can create or edit brand kits.</span>{" "}
          <span className="text-muted">
            Interns and viewers consume kits but can&apos;t change brand identity, voice rules
            or trauma-informed settings. You&apos;re signed in as an admin.
          </span>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2">
        {BRAND_KITS.map((brand) => (
          <BrandKitCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
}

function BrandKitCard({ brand }: { brand: BrandKit }) {
  const colors = BRAND_COLORS[brand.slug];
  const href = `/brand-kits/${brand.slug}/onboard`;
  const pct = Math.round((brand.onboardingStep / 7) * 100);

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-rule bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
    >
      {/* Tinted brand header */}
      <div
        className="relative flex items-start gap-4 px-5 pb-5 pt-5"
        style={{ background: colors.soft }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-card"
          aria-hidden
        >
          {brand.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="font-display text-xl font-bold leading-tight"
            style={{ color: colors.ink }}
          >
            {brand.brandName}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="font-medium text-secondary">{brand.companyName}</span>
            <span className="text-muted">·</span>
            <span className="font-mono text-muted">{brand.handle}</span>
          </div>
        </div>
        {brand.traumaInformed && (
          <Tag tone="success" className="shrink-0">
            <IconShieldCheck size={12} stroke={2} />
            Trauma-informed
          </Tag>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        {/* Color swatches */}
        <div className="flex items-stretch gap-2.5">
          <Swatch label="Primary" hex={brand.primaryColor} />
          <Swatch label="Secondary" hex={brand.secondaryColor} />
          <div className="flex flex-1 flex-col justify-center rounded-lg border border-rule bg-surface-2 px-3 py-2">
            <div className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted">
              <IconPalette size={12} stroke={1.9} />
              Typeface
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-ink">
              {brand.fontFamily}
            </div>
          </div>
        </div>

        {/* Tone tags */}
        <div className="flex flex-wrap gap-1.5">
          {brand.toneTags.slice(0, 4).map((t) => (
            <Tag key={t} tone="feature">
              {t}
            </Tag>
          ))}
        </div>

        {/* Onboarding status */}
        <div className="mt-auto border-t border-rule pt-4">
          {brand.onboardingComplete ? (
            <div className="flex items-center justify-between">
              <Tag tone="success" className="px-2 py-1 text-xs">
                <IconCheck size={13} stroke={2.4} />
                Trained
              </Tag>
              <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Edit brand kit
                <IconArrowRight size={13} stroke={2} />
              </span>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[0.7rem] uppercase tracking-wider text-warn">
                  Onboarding incomplete
                </span>
                <span className="font-mono text-[0.7rem] font-semibold text-secondary">
                  {brand.onboardingStep}/7 — Resume
                </span>
              </div>
              <ProgressBar value={pct} />
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-[#6d28d9]">
                Resume onboarding
                <IconArrowRight size={14} stroke={2.2} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex min-w-[92px] flex-col overflow-hidden rounded-lg border border-rule">
      <div className="h-9" style={{ background: hex }} />
      <div className="bg-surface-2 px-2.5 py-1.5">
        <div className="font-mono text-[0.55rem] uppercase tracking-wider text-muted">
          {label}
        </div>
        <div className="font-mono text-[0.72rem] font-semibold uppercase text-ink">
          {hex}
        </div>
      </div>
    </div>
  );
}
