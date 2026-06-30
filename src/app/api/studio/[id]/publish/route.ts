import { NextResponse } from "next/server";
import fs from "node:fs";
import {
  loadMeta,
  saveMeta,
  outputPath,
  type PublishRecord,
} from "@/lib/studio/projectStore";
import {
  instagramEnv,
  isPublicHttpsUrl,
  publishReel,
} from "@/lib/studio/instagram";

export const runtime = "nodejs";
export const maxDuration = 300;

// Publish a rendered cut to Instagram.
//   • mode "live"     → real Graph API publish (needs token + business id +
//                       a public https video URL). See lib/studio/instagram.ts.
//   • mode "simulate" → records the publish against the project without posting,
//                       so the library flow works without credentials.
// Credentials come from env (IG_ACCESS_TOKEN / IG_BUSINESS_ID / PUBLIC_BASE_URL)
// and can be overridden per-request from the modal's advanced fields.

interface PublishBody {
  candidateIndex?: number;
  caption?: string;
  mode?: "live" | "simulate";
  accessToken?: string;
  businessId?: string;
  publicBaseUrl?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const meta = loadMeta(params.id);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as PublishBody;
  const candidateIndex = body.candidateIndex ?? meta.selected ?? 0;

  if (!fs.existsSync(outputPath(meta.id, candidateIndex))) {
    return NextResponse.json(
      { ok: false, error: "Render this cut before publishing it." },
      { status: 200 },
    );
  }

  const candidate = meta.candidates?.[candidateIndex];
  const caption = (body.caption || candidate?.caption || meta.filename).slice(0, 2200);

  const env = instagramEnv();
  const accessToken = (body.accessToken || env.accessToken || "").trim();
  const businessId = (body.businessId || env.businessId || "").trim();
  const base = (body.publicBaseUrl || env.publicBaseUrl || new URL(req.url).origin).replace(
    /\/$/,
    "",
  );
  const videoUrl = `${base}/api/studio/${meta.id}/file?type=output&c=${candidateIndex}`;

  const mode = body.mode ?? (accessToken && businessId ? "live" : "simulate");

  function record(rec: PublishRecord) {
    meta!.publishedTo = [
      ...(meta!.publishedTo ?? []).filter((p) => p.candidateIndex !== candidateIndex),
      rec,
    ];
    saveMeta(meta!);
  }

  // --- simulated publish (demo / no creds) -----------------------------------
  if (mode === "simulate") {
    await new Promise((r) => setTimeout(r, 1000));
    const account = (body.businessId || "preview").toString();
    const rec: PublishRecord = {
      platform: "instagram",
      account,
      candidateIndex,
      caption,
      permalink: `https://instagram.com/reel/${meta.id}${candidateIndex}`,
      at: new Date().toISOString(),
      simulated: true,
    };
    record(rec);
    return NextResponse.json({ ok: true, simulated: true, record: rec, meta });
  }

  // --- real Graph API publish ------------------------------------------------
  if (!accessToken || !businessId) {
    return NextResponse.json(
      {
        ok: false,
        needsConfig: true,
        error:
          "Add an Instagram access token and Business account id (env IG_ACCESS_TOKEN / IG_BUSINESS_ID, or the advanced fields) to publish for real.",
      },
      { status: 200 },
    );
  }
  if (!isPublicHttpsUrl(videoUrl)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Instagram needs a public https URL to fetch the video. Set PUBLIC_BASE_URL to a tunnel (e.g. an ngrok https URL) so localhost is reachable.",
        videoUrl,
      },
      { status: 200 },
    );
  }

  try {
    const result = await publishReel({ businessId, accessToken, videoUrl, caption });
    const rec: PublishRecord = {
      platform: "instagram",
      account: result.account || businessId,
      candidateIndex,
      caption,
      permalink: result.permalink,
      at: new Date().toISOString(),
      mediaId: result.mediaId,
    };
    record(rec);
    return NextResponse.json({ ok: true, record: rec, meta });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 },
    );
  }
}
