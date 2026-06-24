// ---------------------------------------------------------------------------
// Server-only Google Gemini helper (Google AI Studio free API).
// All AI features in the app go through this one module.
//
// Setup: put GEMINI_API_KEY in .env.local (see .env.local.example).
// Default model is gemini-2.5-flash (free tier); override with GEMINI_MODEL.
// ---------------------------------------------------------------------------

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function geminiConfigured(): boolean {
  return Boolean(API_KEY);
}

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

async function call(body: Record<string, unknown>): Promise<string> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");
  let lastError = "";
  // Retry transient overloads (503/500) with a short backoff.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(ENDPOINT(MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    lastError = `Gemini ${res.status}: ${await res.text()}`;
    if (res.status === 503 || res.status === 500) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }
    throw new Error(lastError);
  }
  throw new Error(lastError);
}

interface JsonOpts {
  system?: string;
  user: string;
  schema?: Record<string, unknown>;
  temperature?: number;
}

/** Generate a structured JSON object from Gemini and parse it. */
export async function generateJson<T>(opts: JsonOpts): Promise<T> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      responseMimeType: "application/json",
      ...(opts.schema ? { responseSchema: opts.schema } : {}),
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  const text = await call(body);
  return JSON.parse(text || "{}") as T;
}

/** Generate plain text from Gemini. */
export async function generateText(opts: {
  system?: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: { temperature: opts.temperature ?? 0.7 },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  return (await call(body)).trim();
}
