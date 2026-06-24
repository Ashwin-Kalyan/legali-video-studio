import { NextResponse } from "next/server";
import {
  loadMeta,
  saveMeta,
  sourcePath,
  outputPath,
} from "@/lib/studio/projectStore";
import { ffmpegAvailable, renderCut } from "@/lib/studio/video";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const meta = loadMeta(params.id);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { candidateIndex?: number };
  const candidateIndex = body.candidateIndex ?? meta.selected ?? 0;
  const candidate = meta.candidates?.[candidateIndex];
  if (!candidate) {
    return NextResponse.json({ ok: false, error: "No such candidate" }, { status: 400 });
  }
  if (!ffmpegAvailable()) {
    return NextResponse.json(
      { ok: false, error: "FFmpeg is not installed on the server" },
      { status: 200 },
    );
  }

  try {
    meta.status = "rendering";
    saveMeta(meta);

    const out = outputPath(meta.id, candidateIndex);
    await renderCut(sourcePath(meta), candidate.segments, out);

    meta.outputs = [
      ...(meta.outputs ?? []).filter((o) => o.candidateIndex !== candidateIndex),
      {
        candidateIndex,
        file: `output-${candidateIndex}.mp4`,
        createdAt: new Date().toISOString(),
      },
    ];
    meta.selected = candidateIndex;
    meta.status = "rendered";
    meta.error = undefined;
    saveMeta(meta);
    return NextResponse.json({
      ok: true,
      url: `/api/studio/${meta.id}/file?type=output&c=${candidateIndex}`,
      meta,
    });
  } catch (e) {
    meta.status = "ready";
    meta.error = String(e);
    saveMeta(meta);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
