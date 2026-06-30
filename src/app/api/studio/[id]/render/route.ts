import { NextResponse } from "next/server";
import {
  loadMeta,
  saveMeta,
  sourcePath,
  outputPath,
} from "@/lib/studio/projectStore";
import { ffmpegAvailable, renderCut } from "@/lib/studio/video";
import { getBrand } from "@/lib/data";
import type { BrandSlug } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RenderBody {
  candidateIndex?: number;
  effects?: { fades?: boolean; brandBar?: boolean; music?: boolean };
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const meta = loadMeta(params.id);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as RenderBody;
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

  const brand = getBrand((meta.brandSlug as BrandSlug) ?? "lea") ?? getBrand("lea");
  const fx = body.effects ?? {};

  try {
    meta.status = "rendering";
    saveMeta(meta);

    const out = outputPath(meta.id, candidateIndex);
    const { appliedEffects } = await renderCut(
      sourcePath(meta),
      candidate.segments,
      out,
      {
        fades: fx.fades !== false,
        brandBar: fx.brandBar !== false ? brand.secondaryColor : null,
        music: fx.music !== false ? candidate.musicMood || brand.musicMood : null,
      },
    );

    meta.outputs = [
      ...(meta.outputs ?? []).filter((o) => o.candidateIndex !== candidateIndex),
      {
        candidateIndex,
        file: `output-${candidateIndex}.mp4`,
        createdAt: new Date().toISOString(),
        appliedEffects,
      },
    ];
    meta.selected = candidateIndex;
    meta.status = "rendered";
    meta.error = undefined;
    saveMeta(meta);
    return NextResponse.json({
      ok: true,
      url: `/api/studio/${meta.id}/file?type=output&c=${candidateIndex}`,
      appliedEffects,
      meta,
    });
  } catch (e) {
    meta.status = "ready";
    meta.error = String(e);
    saveMeta(meta);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
