import { NextResponse } from "next/server";
import fs from "node:fs";
import {
  ensureBase,
  newId,
  projectDir,
  saveMeta,
  type LiveProject,
} from "@/lib/studio/projectStore";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 300 * 1024 * 1024; // 300 MB

export async function POST(req: Request) {
  ensureBase();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const brand = String(form?.get("brand") || "lea");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 300 MB)" }, { status: 400 });
  }

  const id = newId();
  const ext =
    (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "mp4";
  const mime = file.type || "video/mp4";

  fs.mkdirSync(projectDir(id), { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(`${projectDir(id)}/source.${ext}`, buf);

  const meta: LiveProject = {
    id,
    filename: file.name,
    ext,
    mime,
    brandSlug: brand,
    status: "uploaded",
    durationS: 0,
    createdAt: new Date().toISOString(),
  };
  saveMeta(meta);
  return NextResponse.json({ id });
}
