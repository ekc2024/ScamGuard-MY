export interface ApiErrorBody {
  success?: boolean;
  error?: string;
}

/**
 * Fetches a JSON API route and throws an Error carrying the server-provided
 * message when the request fails, the body is not JSON, or `success` is false.
 * Callers get one failure path instead of silently treating an error page as
 * a successful (but empty) payload.
 */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    throw new Error(
      `Network request failed: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }

  const text = await response.text();
  let payload: unknown;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        `Unexpected response from server (HTTP ${response.status}): ${text.slice(0, 200)}`
      );
    }
  }

  const body = (payload ?? {}) as ApiErrorBody & T;

  if (!response.ok || body.success === false) {
    throw new Error(body.error || `Request failed with HTTP ${response.status}`);
  }

  return body as T;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
