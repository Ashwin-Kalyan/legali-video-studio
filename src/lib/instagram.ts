// ---------------------------------------------------------------------------
// Instagram Graph API ingestion (server-only).
//
// Pulls live metrics for YOUR OWN Instagram Business/Creator account — no Meta
// App Review needed while the app is in Development mode and you're an admin.
//
// Setup (.env.local):
//   IG_ACCESS_TOKEN=<long-lived token>
//   IG_USER_ID=<your Instagram Business Account id>
//   IG_API_VERSION=v21.0   (optional)
//
// Note: Instagram insight metric names vary by media type and API version.
// This module degrades gracefully (a failed per-post insights call yields zeros)
// so it never throws on a single odd post — we fine-tune metrics once we see a
// real response from your account.
// ---------------------------------------------------------------------------

const TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const VERSION = process.env.IG_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${VERSION}`;

export function igConfigured(): boolean {
  return Boolean(TOKEN && IG_USER_ID);
}

export interface IgPost {
  id: string;
  caption: string;
  mediaType: string; // FEED | REELS | STORY | CAROUSEL_ALBUM | IMAGE | VIDEO
  timestamp: string;
  permalink: string;
  likes: number;
  comments: number;
  reach: number;
  saved: number;
  shares: number;
  views: number;
}

export interface IgSnapshot {
  username: string;
  followers: number;
  mediaCount: number;
  fetchedAt: string;
  posts: IgPost[];
  totals: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saved: number;
    reach: number;
  };
}

async function gget(
  path: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN! }).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Instagram ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// 5-minute in-memory cache so repeated insight requests don't re-hit the API.
let cache: { at: number; data: IgSnapshot } | null = null;

export async function fetchInstagramSnapshot(force = false): Promise<IgSnapshot> {
  if (!igConfigured()) throw new Error("Instagram is not configured");
  if (!force && cache && Date.now() - cache.at < 5 * 60 * 1000) {
    return cache.data;
  }

  const account = (await gget(`/${IG_USER_ID}`, {
    fields: "username,followers_count,media_count",
  })) as { username?: string; followers_count?: number; media_count?: number };

  const media = (await gget(`/${IG_USER_ID}/media`, {
    fields:
      "id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count",
    limit: "25",
  })) as { data?: Array<Record<string, unknown>> };

  const posts: IgPost[] = [];
  for (const m of media.data ?? []) {
    let ins: Record<string, number> = {};
    try {
      const r = (await gget(`/${m.id}/insights`, {
        metric: "reach,saved,shares,views",
      })) as { data?: Array<{ name: string; values?: Array<{ value: number }> }> };
      ins = Object.fromEntries(
        (r.data ?? []).map((d) => [d.name, d.values?.[0]?.value ?? 0]),
      );
    } catch {
      // metric set unsupported for this media type — leave zeros, refine later
    }
    posts.push({
      id: String(m.id),
      caption: String(m.caption ?? ""),
      mediaType: String(m.media_product_type ?? m.media_type ?? "FEED"),
      timestamp: String(m.timestamp ?? ""),
      permalink: String(m.permalink ?? ""),
      likes: Number(m.like_count ?? 0),
      comments: Number(m.comments_count ?? 0),
      reach: ins.reach ?? 0,
      saved: ins.saved ?? 0,
      shares: ins.shares ?? 0,
      views: ins.views ?? ins.plays ?? ins.impressions ?? 0,
    });
  }

  const totals = posts.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      shares: acc.shares + p.shares,
      saved: acc.saved + p.saved,
      reach: acc.reach + p.reach,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saved: 0, reach: 0 },
  );

  const data: IgSnapshot = {
    username: account.username ?? "unknown",
    followers: account.followers_count ?? 0,
    mediaCount: account.media_count ?? 0,
    fetchedAt: new Date().toISOString(),
    posts,
    totals,
  };
  cache = { at: Date.now(), data };
  return data;
}
