// ---------------------------------------------------------------------------
// Instagram Content Publishing via the official Graph API.
//
// This is the ToS-compliant path (NOT username/password). It requires:
//   • an Instagram Business or Creator account linked to a Facebook Page
//   • a Meta app with the instagram_content_publish permission
//   • a long-lived access token + the Instagram Business account id
//   • the rendered video served from a PUBLIC https URL (Instagram's servers
//     fetch `video_url` themselves — localhost is not reachable, so in dev you
//     need a tunnel like ngrok and PUBLIC_BASE_URL pointing at it)
//
// Publishing a reel is a 3-step async flow:
//   1. POST /{ig-user-id}/media        → creates a media container (creation id)
//   2. GET  /{container-id}?status     → poll until status_code = FINISHED
//   3. POST /{ig-user-id}/media_publish → publishes the container
// ---------------------------------------------------------------------------

const GRAPH = "https://graph.facebook.com";
const VERSION = process.env.IG_GRAPH_VERSION || "v21.0";

export interface InstagramEnv {
  accessToken: string;
  businessId: string;
  publicBaseUrl: string;
}

export function instagramEnv(): InstagramEnv {
  return {
    accessToken: process.env.IG_ACCESS_TOKEN || "",
    businessId: process.env.IG_BUSINESS_ID || "",
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, ""),
  };
}

export function instagramConfigured(): boolean {
  const e = instagramEnv();
  return Boolean(e.accessToken && e.businessId);
}

/** Instagram fetches video_url itself, so it must be a public https URL. */
export function isPublicHttpsUrl(u: string): boolean {
  try {
    const url = new URL(u);
    if (url.protocol !== "https:") return false;
    return !/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|\[::1\])/.test(
      url.hostname,
    );
  } catch {
    return false;
  }
}

export interface PublishReelInput {
  businessId: string;
  accessToken: string;
  videoUrl: string;
  caption: string;
  shareToFeed?: boolean;
}

export interface PublishReelResult {
  mediaId: string;
  permalink: string;
  account?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function graphError(stage: string, status: number, json: unknown): string {
  const e = (json as { error?: { message?: string; error_user_msg?: string } })?.error;
  if (!e) return `Instagram ${stage} failed (HTTP ${status})`;
  return `Instagram ${stage} failed: ${e.error_user_msg || e.message || `HTTP ${status}`}`;
}

export async function publishReel(input: PublishReelInput): Promise<PublishReelResult> {
  const { businessId, accessToken, videoUrl, caption } = input;

  // 1. create the media container --------------------------------------------
  const createParams = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: String(input.shareToFeed ?? true),
    access_token: accessToken,
  });
  const cRes = await fetch(`${GRAPH}/${VERSION}/${businessId}/media`, {
    method: "POST",
    body: createParams,
  });
  const cJson = await cRes.json().catch(() => ({}));
  if (!cRes.ok || !cJson.id) throw new Error(graphError("upload", cRes.status, cJson));
  const containerId: string = cJson.id;

  // 2. poll until the upload finishes processing ------------------------------
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    await sleep(i === 0 ? 2500 : 4000);
    const sRes = await fetch(
      `${GRAPH}/${VERSION}/${containerId}?fields=status_code,status&access_token=${accessToken}`,
    );
    const sJson = await sRes.json().catch(() => ({}));
    const code = sJson.status_code;
    if (code === "FINISHED") ready = true;
    else if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(
        `Instagram could not process the video (${code})${sJson.status ? `: ${sJson.status}` : ""}`,
      );
    }
  }
  if (!ready) throw new Error("Instagram video processing timed out (still IN_PROGRESS)");

  // 3. publish the container --------------------------------------------------
  const pubParams = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });
  const pRes = await fetch(`${GRAPH}/${VERSION}/${businessId}/media_publish`, {
    method: "POST",
    body: pubParams,
  });
  const pJson = await pRes.json().catch(() => ({}));
  if (!pRes.ok || !pJson.id) throw new Error(graphError("publish", pRes.status, pJson));
  const mediaId: string = pJson.id;

  // 4. best-effort: resolve the permalink + handle ----------------------------
  let permalink = "https://www.instagram.com/";
  let account: string | undefined;
  try {
    const mRes = await fetch(
      `${GRAPH}/${VERSION}/${mediaId}?fields=permalink,username&access_token=${accessToken}`,
    );
    const mJson = await mRes.json();
    if (mJson.permalink) permalink = mJson.permalink;
    if (mJson.username) account = mJson.username;
  } catch {
    /* permalink is a nicety — don't fail the publish over it */
  }
  return { mediaId, permalink, account };
}
