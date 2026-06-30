import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { LiveSegment } from "./projectStore";

// ---------------------------------------------------------------------------
// FFmpeg — executes the AI's edit decision list (trim + concat selected
// segments into a new 9:16 MP4) and bakes in optional marketing effects
// (cinematic fades, a brand accent band, and a music bed). This is the part
// that actually edits the video.
// ---------------------------------------------------------------------------

export interface RenderEffects {
  /** Cinematic fade in/out on picture + sound. */
  fades?: boolean;
  /** Slim brand-colored accent band along the bottom (hex like "#FF6B9D"). */
  brandBar?: string | null;
  /** Background music bed; pass the brand's musicMood (e.g. "soft-emotional"). */
  music?: string | null;
}

export interface RenderResult {
  /** Plain-language list of the effects actually baked into the output. */
  appliedEffects: string[];
}

function resolveBin(name: string): string {
  const candidates = [
    `/opt/homebrew/bin/${name}`, // Apple Silicon brew
    `/usr/local/bin/${name}`, // Intel brew
    `/usr/bin/${name}`,
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return name; // fall back to PATH
}

const FFMPEG = resolveBin("ffmpeg");
const FFPROBE = resolveBin("ffprobe");

export function ffmpegAvailable(): boolean {
  return (
    fs.existsSync(FFMPEG) ||
    ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"].some((p) =>
      fs.existsSync(p),
    )
  );
}

function run(bin: string, args: string[], timeoutMs = 180000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: timeoutMs, maxBuffer: 1 << 24 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr?.toString().slice(-800) || String(err)));
      else resolve(stdout?.toString() ?? "");
    });
  });
}

/** Duration of a media file in seconds (0 if it can't be probed). */
export async function probeDuration(filePath: string): Promise<number> {
  try {
    const out = await run(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    return Math.round(parseFloat(out.trim()) || 0);
  } catch {
    return 0;
  }
}

/** Whether the file has at least one audio stream (screen recordings often don't). */
async function probeHasAudio(filePath: string): Promise<boolean> {
  try {
    const out = await run(FFPROBE, [
      "-v", "error",
      "-select_streams", "a",
      "-show_entries", "stream=index",
      "-of", "csv=p=0",
      filePath,
    ]);
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

// Common music moods → a soft sustained triad (Hz) used to synthesize a music
// bed when no real track is dropped into public/studio/music. Keeps speech on
// top — the pad sits low and warm underneath.
const MUSIC_CHORDS: { match: RegExp; freqs: number[]; label: string }[] = [
  { match: /soft|emotion|warm|gentle|calm|hope/i, freqs: [220, 261.63, 329.63], label: "Soft-emotional" },
  { match: /confident|corporate|bold|drive|power/i, freqs: [261.63, 329.63, 392.0], label: "Confident" },
  { match: /play|fun|energ|upbeat|bright/i, freqs: [392.0, 493.88, 587.33], label: "Playful" },
];

function chordFor(mood: string): { freqs: number[]; label: string } {
  const hit = MUSIC_CHORDS.find((m) => m.match.test(mood));
  return hit ?? { freqs: [220, 261.63, 329.63], label: "Cinematic" };
}

function hexToFf(hex: string): string {
  const h = hex.replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(h) ? `0x${h}` : "0xFFFFFF";
}

/** Locate a real music track for this mood, if the user dropped one in. */
function musicFileFor(mood: string): string | null {
  const dir = path.join(process.cwd(), "public", "studio", "music");
  const slug = mood.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const name of [`${slug}.mp3`, `${slug}.m4a`, "default.mp3"]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Build the trim → concat half of the filter graph. Each kept segment is scaled
// & cropped to 1080x1920 (9:16). The source stream is fanned out with
// split/asplit because an input pad can only feed one filter in FFmpeg.
function buildConcat(
  clean: { start: number; end: number }[],
  hasAudio: boolean,
  vOut: string,
  aOut: string | null,
): { video: string; audio: string | null } {
  const n = clean.length;
  const vsplit = `[0:v]split=${n}` + clean.map((_, i) => `[sv${i}]`).join("");
  const vtrims = clean.map(
    (s, i) =>
      `[sv${i}]trim=start=${s.start}:end=${s.end},setpts=PTS-STARTPTS,` +
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v${i}]`,
  );
  const vin = clean.map((_, i) => `[v${i}]`).join("");
  const video = `${vsplit};${vtrims.join(";")};${vin}concat=n=${n}:v=1:a=0${vOut}`;

  let audio: string | null = null;
  if (hasAudio && aOut) {
    const asplit = `[0:a]asplit=${n}` + clean.map((_, i) => `[sa${i}]`).join("");
    const atrims = clean.map(
      (s, i) => `[sa${i}]atrim=start=${s.start}:end=${s.end},asetpts=PTS-STARTPTS[a${i}]`,
    );
    const ain = clean.map((_, i) => `[a${i}]`).join("");
    audio = `${asplit};${atrims.join(";")};${ain}concat=n=${n}:v=0:a=1${aOut}`;
  }
  return { video, audio };
}

/**
 * Render a vertical (9:16) marketing cut from the source by trimming +
 * concatenating the chosen segments, then baking in optional cinematic effects
 * (fades), a brand accent band, and a music bed. Handles sources with no audio
 * track (e.g. screen recordings) by synthesizing one. Re-encodes so arbitrary
 * cut points are frame-accurate. If the effects graph fails for any reason we
 * fall back to a clean cut so a render never hard-fails on a fancy filter.
 */
export async function renderCut(
  inputPath: string,
  segments: LiveSegment[],
  outputPath: string,
  effects: RenderEffects = {},
): Promise<RenderResult> {
  const clean = segments
    .map((s) => ({ start: Math.max(0, s.startSec), end: s.endSec }))
    .filter((s) => s.end > s.start);
  if (clean.length === 0) throw new Error("No valid segments to render");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const total = clean.reduce((sum, s) => sum + (s.end - s.start), 0);
  const dur = total.toFixed(2);
  const hasAudio = await probeHasAudio(inputPath);

  const applied: string[] = [];
  const inputs = ["-i", inputPath];
  const musicOn = !!effects.music;

  const { video: videoConcat, audio: audioConcat } = buildConcat(
    clean,
    hasAudio,
    "[cv]",
    "[ca]",
  );
  const graph: string[] = [videoConcat];
  if (audioConcat) graph.push(audioConcat);

  // --- video post chain (brand bar + fades) ----------------------------------
  const useFades = effects.fades !== false && total > 2;
  const foutStart = Math.max(0, total - 0.6);
  const vChain: string[] = [];
  if (effects.brandBar) {
    vChain.push(`drawbox=x=0:y=ih-22:w=iw:h=22:color=${hexToFf(effects.brandBar)}@0.95:t=fill`);
    applied.push("Brand accent band baked along the bottom");
  }
  if (useFades) {
    vChain.push(`fade=t=in:st=0:d=0.5`, `fade=t=out:st=${foutStart}:d=0.6`);
    applied.push("Cinematic fade in / out");
  }
  graph.push(`[cv]${vChain.length ? vChain.join(",") : "null"}[outv]`);

  // --- audio base (real audio, or synthesized silence) -----------------------
  const baseOut = musicOn ? "[abase]" : "[outa]";
  if (hasAudio) {
    const aChain: string[] = [];
    if (useFades) aChain.push(`afade=t=in:st=0:d=0.4`, `afade=t=out:st=${foutStart}:d=0.6`);
    graph.push(`[ca]${aChain.length ? aChain.join(",") : "anull"}${baseOut}`);
  } else {
    graph.push(`anullsrc=r=44100:cl=stereo,atrim=0:${dur}${baseOut}`);
    if (!musicOn) applied.push("Source had no audio — exported with a silent track");
  }

  // --- music bed -------------------------------------------------------------
  if (musicOn && effects.music) {
    const lead = !hasAudio; // with no speech, music carries the whole reel
    const realFile = musicFileFor(effects.music);
    if (realFile) {
      inputs.push("-stream_loop", "-1", "-i", realFile);
      const vol = lead ? 0.5 : 0.22;
      graph.push(
        `[1:a]atrim=0:${dur},asetpts=PTS-STARTPTS,volume=${vol},` +
          `afade=t=out:st=${Math.max(0, total - 1.2)}:d=1.2[mus]`,
      );
      applied.push(`Music bed: ${path.basename(realFile)}`);
    } else {
      const { freqs, label } = chordFor(effects.music);
      const expr = freqs
        .map((f, i) => `${(0.2 - i * 0.03).toFixed(2)}*sin(2*PI*${f}*t)`)
        .join("+");
      const vol = lead ? 0.3 : 0.13;
      graph.push(
        `aevalsrc=${expr}:s=44100:d=${dur},lowpass=f=2200,volume=${vol},` +
          `afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, total - 1.5)}:d=1.5[mus]`,
      );
      applied.push(`${label} music bed (synthesized)${lead ? " over silent footage" : ""}`);
    }
    graph.push(`[abase][mus]amix=inputs=2:duration=first:normalize=0[outa]`);
  }

  const encode = [
    "-map", "[outv]",
    "-map", "[outa]",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-c:a", "aac",
    "-movflags", "+faststart",
    outputPath,
  ];

  try {
    await run(FFMPEG, ["-y", ...inputs, "-filter_complex", graph.join(";"), ...encode]);
    return { appliedEffects: applied };
  } catch (err) {
    const hadEffects = vChain.length > 0 || musicOn || (useFades && hasAudio);
    if (!hadEffects) throw err;
    // Effects graph failed — re-encode a clean cut so the user still gets video.
    const fb = buildConcat(clean, hasAudio, "[outv]", "[outa]");
    const fbGraph = [fb.video];
    if (fb.audio) fbGraph.push(fb.audio);
    else fbGraph.push(`anullsrc=r=44100:cl=stereo,atrim=0:${dur}[outa]`);
    await run(FFMPEG, [
      "-y", "-i", inputPath,
      "-filter_complex", fbGraph.join(";"),
      ...encode,
    ]);
    return { appliedEffects: ["Clean cut (effects unavailable on this clip)"] };
  }
}
