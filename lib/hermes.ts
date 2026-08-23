export type TriageEngine = "hermes" | "local";

export interface HermesTriageResponse {
  result: string;
  engine: TriageEngine;
}

const HERMES_TIMEOUT_MS = 15000;

export function isHermesConfigured(): boolean {
  return Boolean(process.env.HERMES_AGENT_URL);
}

function extractReply(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  for (const key of ["result", "reply", "response", "text", "message", "output"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

/**
 * Forward a message to the Hermes agent for triage. Requires
 * HERMES_AGENT_URL (and optionally HERMES_API_KEY) to be set. Throws when
 * Hermes is unreachable or returns an unusable payload so the caller can
 * fall back to the local rule engine.
 */
export async function triageViaHermes(message: string): Promise<string> {
  const url = process.env.HERMES_AGENT_URL;
  if (!url) {
    throw new Error("HERMES_AGENT_URL is not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.HERMES_API_KEY) {
    headers.Authorization = `Bearer ${process.env.HERMES_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HERMES_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, skill: "scam-triage" }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Hermes agent responded with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    const reply = extractReply(payload);
    if (!reply) {
      throw new Error("Hermes agent returned an empty or unrecognised reply");
    }
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}
