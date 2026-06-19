# Legali Video Studio

An internal, AI-powered video platform for Legali AI — built from the v2 PRD and the scheduling/captions/subtitles mockups in [`/instructions`](./instructions).

It unifies three sequentially-unlocking modules plus the publishing toolchain:

| Module | Route | What it does |
| --- | --- | --- |
| **0 · Brand Onboarding** | `/brand-kits`, `/brand-kits/[slug]/onboard` | Conversational 7-question brand training → a structured brand kit (voice, palette, prohibited phrases, CTA, hashtags). Prerequisite for everything. |
| **1 · Video Analytics** | `/analytics` | Cross-platform dashboard (Instagram + TikTok + LinkedIn) with AI weekly insight digest, brand-health scorecards, content-type attribution, and Lea waitlist funnel. |
| **2 · AI Video Cut Studio** | `/studio`, `/studio/[id]` | Upload → brand kit auto-applies → AI generates 3 ranked candidate cuts → voice → export 9:16 / 1:1 / 4:5. |
| Captions | `/studio/[id]/captions` | Style/translate animated captions with live phone preview. |
| Subtitles & Export | `/studio/[id]/subtitles` | Editable transcript → SRT / VTT / ASS / burn-in export. |
| Scheduling | `/schedule` | June 2026 calendar + queue, AI-recommended posting times, per-platform scheduling. |
| Publish Queue | `/publish` | Platform-adapter dispatch view with per-platform caption variants. |
| Approvals | `/approvals` | Trauma-informed governance — intern Lea exports are hard-blocked until an admin approves. |

## Stack

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS v3**
- **Recharts** for analytics visualizations
- **@tabler/icons-react** for iconography
- Type system mirrors the PRD's PostgreSQL schema (`src/lib/types.ts`); all data is mock/static (`src/lib/data/`) — there is no live backend, so AI calls, transcription, rendering, and platform APIs are represented faithfully in the UI but not executed.

## Getting started

```bash
pnpm install
pnpm dev      # http://localhost:3000  → redirects to /analytics
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm typecheck`.

## Project structure

```
src/
  app/
    layout.tsx              # fonts (Playfair / DM Sans / DM Mono) + globals
    page.tsx                # → /analytics
    (app)/
      layout.tsx            # sidebar shell
      analytics/            # Module 1
      studio/               # Module 2 (gallery, editor, captions, subtitles)
      brand-kits/           # Module 0 (gallery + onboarding)
      schedule/             # scheduling calendar + queue
      publish/              # publish queue
      approvals/            # Lea content governance
  components/
    ui/                     # Button, Tag, Card, BrowserChrome, PlatformIcon, Misc
    shell/                  # Sidebar, StudioTabs
  lib/
    types.ts                # domain model
    data/                   # brands, analytics, projects, schedule (mock)
    utils.ts                # formatters + cn()
```

## Design system

Tokens live in `tailwind.config.ts` + `src/app/globals.css`. Core palette: ink `#0f0c10`, paper `#faf8f5`, accent purple `#7c3aed`, pink `#db2777`, cyan `#0891b2`. Per-brand identity colors (Lea maroon/pink, MyLegali green, TeamLegali blue, LegaliLearn amber) are in `BRAND_KITS` / `BRAND_COLORS`.

## Notes

This is a faithful, fully-navigable front-end prototype of the PRD. Backend concerns described in the PRD (Whisper transcription, GPT-4V vision scoring, Claude cut generation + safety checks, FFmpeg/Remotion rendering, Meta/TikTok/LinkedIn APIs, Supabase/R2 storage) are represented in the interface — including the API contracts shown as inline dev annotations — but run against static fixtures.
