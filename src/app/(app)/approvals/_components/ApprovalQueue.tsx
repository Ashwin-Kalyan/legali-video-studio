"use client";

import { useState } from "react";
import {
  IconShield,
  IconShieldCheck,
  IconShieldX,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconLock,
  IconUser,
  IconClock,
  IconSparkles,
  IconArrowRight,
  IconRobot,
} from "@tabler/icons-react";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { PageHeader, BrandChip } from "@/components/ui/Misc";
import { shortDate } from "@/lib/utils";
import { VIDEO_PROJECTS } from "@/lib/data/projects";
import { CURRENT_USER } from "@/lib/data/brands";
import type { VideoProject } from "@/lib/types";

type Decision = "pending" | "approved" | "rejected";

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconUser;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-rule bg-surface-2 px-3 py-2">
      <Icon size={15} stroke={1.9} className="flex-shrink-0 text-muted" />
      <div className="min-w-0">
        <div className="font-mono text-[0.58rem] uppercase tracking-wide text-muted">
          {label}
        </div>
        <div className="truncate text-xs font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}

function ReviewCard({ project }: { project: VideoProject }) {
  const [decision, setDecision] = useState<Decision>("pending");
  const safety = project.safetyCheck;
  const flag = safety.flags[0];

  if (decision === "approved") {
    return (
      <Card accent="green" className="animate-fade-up p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <IconShieldCheck size={20} stroke={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">{project.title}</span>
              <Tag tone="success">Approved</Tag>
            </div>
            <p className="mt-1 text-sm text-secondary">
              Export approved by{" "}
              <span className="font-medium text-ink">{CURRENT_USER.name}</span>.
              The{" "}
              <span className="font-mono text-xs text-ink">
                /export
              </span>{" "}
              and{" "}
              <span className="font-mono text-xs text-ink">/publish</span>{" "}
              endpoints are now unlocked for{" "}
              <span className="font-medium text-ink">{project.createdBy}</span>.
            </p>
          </div>
          <button
            onClick={() => setDecision("pending")}
            className="font-mono text-[0.66rem] uppercase tracking-wide text-muted hover:text-ink"
          >
            Undo
          </button>
        </div>
      </Card>
    );
  }

  if (decision === "rejected") {
    return (
      <Card accent="pink" className="animate-fade-up p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <IconShieldX size={20} stroke={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">{project.title}</span>
              <Tag tone="danger">Changes requested</Tag>
            </div>
            <p className="mt-1 text-sm text-secondary">
              Sent back to{" "}
              <span className="font-medium text-ink">{project.createdBy}</span>{" "}
              with the safety note. Export stays{" "}
              <span className="font-medium text-ink">hard-blocked</span> until
              the flagged phrasing is revised and re-submitted.
            </p>
          </div>
          <button
            onClick={() => setDecision("pending")}
            className="font-mono text-[0.66rem] uppercase tracking-wide text-muted hover:text-ink"
          >
            Undo
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card accent="pink" className="overflow-visible">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BrandChip slug={project.brandSlug} />
            <Tag tone="warn" className="uppercase">
              <IconClock size={11} stroke={2.2} className="mr-0.5" />
              Awaiting approval
            </Tag>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">
            {project.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-danger/20 bg-danger-soft px-2.5 py-1.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wide text-danger-ink">
          <IconLock size={12} stroke={2.2} />
          Export locked
        </div>
      </div>

      {/* meta grid */}
      <div className="grid grid-cols-2 gap-2.5 px-5 py-4 md:grid-cols-4">
        <MetaCell icon={IconUser} label="Created by" value={project.createdBy} />
        <MetaCell icon={IconRobot} label="Template" value={project.templateName} />
        <MetaCell
          icon={IconClock}
          label="Duration"
          value={fmtDuration(project.durationS)}
        />
        <MetaCell
          icon={IconSparkles}
          label="Submitted"
          value={shortDate(project.createdAt)}
        />
      </div>

      {/* safety block */}
      {flag && (
        <div className="mx-5 mb-4 overflow-hidden rounded-xl border border-danger/30 bg-danger-soft/60">
          <div className="flex items-center gap-2 border-b border-danger/20 bg-danger-soft px-4 py-2.5">
            <IconAlertTriangle size={16} stroke={2.2} className="text-danger" />
            <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wide text-danger-ink">
              AI safety check failed · trauma-informed review required
            </span>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-wide text-danger">
                Flagged phrase
              </div>
              <div className="mt-1 rounded-md border border-danger/30 bg-surface px-3 py-2 font-mono text-sm text-danger-ink line-through decoration-danger/60">
                &ldquo;{flag.phrase}&rdquo;
              </div>
            </div>

            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-wide text-danger">
                Why it was flagged
              </div>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                {flag.reason}
              </p>
            </div>

            <div className="flex items-center gap-2 text-success-ink">
              <IconArrowRight size={15} stroke={2.2} className="flex-shrink-0" />
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-wide text-success">
                  Suggested replacement
                </div>
                <div className="mt-0.5 text-sm font-medium">
                  {flag.suggestedReplacement}
                </div>
              </div>
            </div>

            {safety.revisedText && (
              <div className="rounded-md border border-success/25 bg-success-soft/70 px-3 py-2.5">
                <div className="font-mono text-[0.6rem] uppercase tracking-wide text-success-ink">
                  AI-revised text
                </div>
                <p className="mt-1 text-sm italic text-success-ink">
                  &ldquo;{safety.revisedText}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-surface-2/60 px-5 py-4">
        <p className="font-mono text-[0.66rem] text-muted">
          Decision is logged · POST /api/v1/projects/
          {project.id.replace("project-", "")}/approve
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDecision("rejected")}
          >
            <IconX size={15} stroke={2.2} />
            Request changes
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDecision("approved")}
          >
            <IconShieldCheck size={15} stroke={2.2} />
            Approve export
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ApprovalQueue() {
  const pending = VIDEO_PROJECTS.filter(
    (p) => p.approvalStatus === "pending",
  );
  const recentlyApproved = VIDEO_PROJECTS.filter(
    (p) =>
      p.brandSlug === "lea" &&
      (p.approvalStatus === "approved" ||
        p.approvalStatus === "not-required"),
  );

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <PageHeader
        label="Lea Content Governance"
        title="Approvals"
        subtitle="Lea-brand exports created by interns are hard-blocked until an Admin approves. Every export passes a trauma-informed AI safety check first."
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg border border-rule bg-surface px-3 py-2 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-sm">
              {CURRENT_USER.emoji}
            </span>
            <span className="font-mono uppercase tracking-wide text-muted">
              Approver · {CURRENT_USER.name}
            </span>
          </span>
        }
      />

      {/* policy callout */}
      <div className="mb-7 overflow-hidden rounded-xl border border-pink/30 bg-pink-soft">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-pink text-white shadow-sm">
            <IconShield size={22} stroke={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-pink-ink">
              Intern Lea exports require Ira&apos;s approval
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-secondary">
              Lea is a trauma-informed brand for domestic-violence survivors.
              Any Lea-brand export created by an intern is{" "}
              <span className="font-semibold text-pink-ink">
                blocked at the API level
              </span>{" "}
              — the{" "}
              <span className="font-mono text-xs text-pink-ink">/export</span>{" "}
              and{" "}
              <span className="font-mono text-xs text-pink-ink">/publish</span>{" "}
              endpoints stay locked until{" "}
              <span className="font-mono text-xs text-pink-ink">
                approval_status = &lsquo;approved&rsquo;
              </span>
              . The two-pass safety check (Claude + keyword blocklist) must pass.
              There is no UI bypass.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-mono text-[0.64rem] font-medium text-pink-ink ring-1 ring-pink/20">
                <IconLock size={12} stroke={2.2} />
                Hard-blocked at API
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-mono text-[0.64rem] font-medium text-pink-ink ring-1 ring-pink/20">
                <IconShieldCheck size={12} stroke={2.2} />
                Safety check must pass
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-mono text-[0.64rem] font-medium text-pink-ink ring-1 ring-pink/20">
                <IconUser size={12} stroke={2.2} />
                Admin-only approval
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* pending queue */}
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>
          Pending review · {pending.length}
        </SectionLabel>
      </div>
      {pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((p) => (
            <ReviewCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">
          No exports awaiting approval.
        </Card>
      )}

      {/* recently approved — calm contrast */}
      <div className="mt-9">
        <SectionLabel>Recently approved · Lea</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentlyApproved.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-xl border border-rule bg-surface px-4 py-3.5 shadow-card"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <IconCheck size={18} stroke={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">
                  {p.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <BrandChip slug={p.brandSlug} />
                  <span className="font-mono text-[0.64rem] text-muted">
                    {p.createdBy}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-[0.58rem] uppercase tracking-wide text-success-ink">
                  {p.approvalStatus === "not-required"
                    ? "Admin-created"
                    : "Approved"}
                </div>
                <div className="mt-0.5 font-mono text-[0.6rem] text-muted">
                  {shortDate(p.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.66rem] text-muted">
          Admin-created Lea content skips the gate (
          <span className="text-secondary">approval_status = not-required</span>
          ). Intern submissions always pass through review.
        </p>
      </div>
    </div>
  );
}
