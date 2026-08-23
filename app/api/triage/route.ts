import { NextRequest, NextResponse } from "next/server";
import { checkReferenceList } from "@/lib/scam-triage/check-reference-list";
import { checkUrl } from "@/lib/scam-triage/check-url";
import { DISCLAIMERS } from "@/lib/scam-triage/disclaimers";
import { MAX_MESSAGE_LENGTH, triageMessage } from "@/lib/scam-triage/triage";

/** Rule-based triage - no external services, so no API key is required. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Request body must be JSON." }, { status: 400 });
  }

  const { message, url, identifier } = (body ?? {}) as {
    message?: unknown;
    url?: unknown;
    identifier?: unknown;
  };

  // Single-identifier lookups, so the two verification functions are callable on their own.
  if (typeof url === "string" && url.trim().length > 0) {
    return NextResponse.json({ success: true, urlCheck: checkUrl(url), disclaimers: DISCLAIMERS });
  }

  if (typeof identifier === "string" && identifier.trim().length > 0) {
    return NextResponse.json({ success: true, reference: checkReferenceList(identifier), disclaimers: DISCLAIMERS });
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Provide a 'message' to triage, or a single 'url' or 'identifier' to verify." },
      { status: 400 }
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { success: false, error: `Message is too long. Paste at most ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, result: triageMessage(message) });
}
