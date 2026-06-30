import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------------------------------------------------------------------------
// File-backed store for UPLOADED (real) studio projects. Lives in the OS temp
// dir so Next's dev file-watcher never recompiles when a video is written.
// Each project: <base>/<id>/source.<ext>, output-<n>.mp4, meta.json
// ---------------------------------------------------------------------------

export interface TranscriptLine {
  startSec: number;
  endSec: number;
  text: string;
}

export interface LiveSegment {
  startSec: number;
  endSec: number;
  reason?: string;
}

export interface LiveCandidate {
  rank: number;
  title: string;
  hook: string;
  caption: string;
  cta?: string;
  durationS: number;
  score: number;
  breakdown?: { hook: number; pacing: number; brandFit: number };
  segments: LiveSegment[];
  /** Human-readable list of the edit decisions the AI made for this cut. */
  editLog?: string[];
  /** Suggested on-screen text overlays (for the changelog / future burn-in). */
  textOverlays?: string[];
  /** Music mood the AI recommends for this marketing cut. */
  musicMood?: string;
}

/** A record of a cut being published out to a social platform. */
export interface PublishRecord {
  platform: "instagram";
  account: string;
  candidateIndex: number;
  caption: string;
  permalink: string;
  at: string;
  /** Instagram media id when published for real via the Graph API. */
  mediaId?: string;
  /** True when recorded without a real Graph API publish (demo / no creds). */
  simulated?: boolean;
}

export type LiveStatus =
  | "uploaded"
  | "analyzing"
  | "ready"
  | "rendering"
  | "rendered"
  | "error";

export interface LiveProject {
  id: string;
  filename: string;
  ext: string;
  mime: string;
  brandSlug: string;
  status: LiveStatus;
  durationS: number;
  createdAt: string;
  summary?: string;
  transcript?: TranscriptLine[];
  candidates?: LiveCandidate[];
  selected?: number;
  outputs?: {
    candidateIndex: number;
    file: string;
    createdAt: string;
    appliedEffects?: string[];
  }[];
  /** Cuts that have been pushed out to a social platform (shown in library). */
  publishedTo?: PublishRecord[];
  error?: string;
}

const BASE = path.join(os.tmpdir(), "legali-studio-uploads");

export function ensureBase(): string {
  fs.mkdirSync(BASE, { recursive: true });
  return BASE;
}

export function projectDir(id: string): string {
  return path.join(BASE, id);
}

export function newId(): string {
  // server-runtime only — fine to use time + randomness
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toLowerCase();
}

export function metaPath(id: string): string {
  return path.join(projectDir(id), "meta.json");
}

export function saveMeta(meta: LiveProject): void {
  fs.mkdirSync(projectDir(meta.id), { recursive: true });
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta, null, 2));
}

export function loadMeta(id: string): LiveProject | null {
  try {
    return JSON.parse(fs.readFileSync(metaPath(id), "utf8")) as LiveProject;
  } catch {
    return null;
  }
}

export function sourcePath(meta: LiveProject): string {
  return path.join(projectDir(meta.id), `source.${meta.ext}`);
}

export function outputPath(id: string, n: number): string {
  return path.join(projectDir(id), `output-${n}.mp4`);
}

export function listProjects(): LiveProject[] {
  ensureBase();
  const ids = fs
    .readdirSync(BASE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const out: LiveProject[] = [];
  for (const id of ids) {
    const m = loadMeta(id);
    if (m) out.push(m);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
