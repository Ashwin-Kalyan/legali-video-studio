import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { LiveSegment } from "./projectStore";

// ---------------------------------------------------------------------------
// FFmpeg — executes the AI's edit decision list (trim + concat selected
// segments into a new MP4). This is the part that actually edits the video.
// ---------------------------------------------------------------------------

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

/**
 * Render a vertical (9:16) cut from the source by trimming + concatenating the
 * given segments. Re-encodes so arbitrary cut points are frame-accurate.
 */
export async function renderCut(
  inputPath: string,
  segments: LiveSegment[],
  outputPath: string,
): Promise<void> {
  const clean = segments
    .map((s) => ({ start: Math.max(0, s.startSec), end: s.endSec }))
    .filter((s) => s.end > s.start);
  if (clean.length === 0) throw new Error("No valid segments to render");

  // Build a trim+concat filter graph, with each kept segment scaled/cropped to 1080x1920 (9:16).
  const parts: string[] = [];
  const labels: string[] = [];
  clean.forEach((s, i) => {
    parts.push(
      `[0:v]trim=start=${s.start}:end=${s.end},setpts=PTS-STARTPTS,` +
        `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v${i}];` +
        `[0:a]atrim=start=${s.start}:end=${s.end},asetpts=PTS-STARTPTS[a${i}]`,
    );
    labels.push(`[v${i}][a${i}]`);
  });
  const filter =
    parts.join(";") +
    ";" +
    labels.join("") +
    `concat=n=${clean.length}:v=1:a=1[outv][outa]`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await run(FFMPEG, [
    "-y",
    "-i", inputPath,
    "-filter_complex", filter,
    "-map", "[outv]",
    "-map", "[outa]",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-c:a", "aac",
    "-movflags", "+faststart",
    outputPath,
  ]);
}
