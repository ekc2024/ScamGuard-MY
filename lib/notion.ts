const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export class NotionRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NotionRequestError";
    this.status = status;
  }
}

export function getNotionApiKey(): string {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new NotionRequestError(
      "Notion integration is not configured (missing NOTION_API_KEY)",
      500
    );
  }
  return apiKey;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.text().catch(() => "");
  if (!body) return fallback;

  try {
    const parsed = JSON.parse(body) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    // Notion returned a non-JSON body (e.g. an HTML gateway error page).
  }
  return `${fallback} (${response.status}: ${body.slice(0, 200)})`;
}

/**
 * Calls the Notion REST API and throws a NotionRequestError with a usable
 * status and message when the request fails or returns an unparseable body.
 */
export async function notionFetch<T>(
  path: string,
  init: RequestInit & { errorMessage: string; errorStatus?: number }
): Promise<T> {
  const { errorMessage, errorStatus, headers, ...requestInit } = init;
  const apiKey = getNotionApiKey();

  let response: Response;
  try {
    response = await fetch(`${NOTION_API_BASE}${path}`, {
      ...requestInit,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
        ...headers,
      },
    });
  } catch (error) {
    throw new NotionRequestError(
      `${errorMessage}: ${error instanceof Error ? error.message : "network error"}`,
      502
    );
  }

  if (!response.ok) {
    throw new NotionRequestError(
      await readErrorMessage(response, errorMessage),
      errorStatus ?? (response.status === 404 ? 404 : 502)
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new NotionRequestError(
      `${errorMessage}: invalid response from Notion (${
        error instanceof Error ? error.message : "unparseable body"
      })`,
      502
    );
  }
}

/**
 * Logs the failure with full detail and maps it to a client-facing
 * status/message pair.
 */
export function toErrorResponse(
  context: string,
  error: unknown,
  fallbackMessage: string
): { status: number; body: { success: false; error: string } } {
  console.error(`[${context}]`, error);

  if (error instanceof NotionRequestError) {
    return { status: error.status, body: { success: false, error: error.message } };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    },
  };
}
