import fs from "node:fs";
import { loadMeta, sourcePath, outputPath } from "@/lib/studio/projectStore";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const meta = loadMeta(params.id);
  if (!meta) return new Response("not found", { status: 404 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "source";
  const c = parseInt(url.searchParams.get("c") || "0", 10);
  const filePath =
    type === "output" ? outputPath(meta.id, c) : sourcePath(meta);
  if (!fs.existsSync(filePath)) return new Response("not found", { status: 404 });

  const size = fs.statSync(filePath).size;
  const contentType = type === "output" ? "video/mp4" : meta.mime || "video/mp4";
  const range = req.headers.get("range");

  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    const length = end - start + 1;
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(length);
    fs.readSync(fd, buf, 0, length, start);
    fs.closeSync(fd);
    return new Response(buf, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(length),
        "Content-Type": contentType,
      },
    });
  }

  const buf = fs.readFileSync(filePath);
  return new Response(buf, {
    headers: {
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
    },
  });
}
