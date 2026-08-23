import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Notion IDs are UUIDs, with or without dashes. Returns the dashed form, or null. */
export function normalizeNotionId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!UUID_RE.test(value)) return null;
  const hex = value.replace(/-/g, "").toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** True when the Notion page belongs to the given database. */
export function pageBelongsToDatabase(
  page: { parent?: { type?: string; database_id?: string } },
  databaseId: string
): boolean {
  const parent = page.parent;
  if (!parent || parent.type !== "database_id") return false;
  return normalizeNotionId(parent.database_id) === normalizeNotionId(databaseId);
}

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/**
 * Best-effort per-instance rate limit. Returns a 429 response when the caller
 * is over budget, otherwise null.
 */
export function rateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs = 60_000
): NextResponse | null {
  const now = Date.now();
  const key = clientKey(request, scope);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }
    return null;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) } }
    );
  }
  return null;
}

/**
 * Logs the real cause server-side and returns a response that does not leak
 * upstream provider details to the client.
 */
export function serverError(context: string, error: unknown, message = "Something went wrong"): NextResponse {
  console.error(`[${context}]`, error);
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

const MAX_JSON_BYTES = 64 * 1024;

/** Parses a JSON body, rejecting oversized or malformed payloads. */
export async function readJsonBody(request: NextRequest): Promise<
  { ok: true; data: unknown } | { ok: false; response: NextResponse }
> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_JSON_BYTES) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Payload too large" }, { status: 413 }),
    };
  }

  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Payload too large" }, { status: 413 }),
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}
