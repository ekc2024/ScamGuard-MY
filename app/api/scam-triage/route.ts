import { NextResponse } from "next/server";
import { z } from "zod";
import { triageScamMessage } from "@/lib/scam-triage";
import { isHermesConfigured, triageViaHermes } from "@/lib/hermes";

const requestSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(10000),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (isHermesConfigured()) {
      try {
        const result = await triageViaHermes(parsed.data.message);
        return NextResponse.json({ result, engine: "hermes" });
      } catch {
        // Hermes unreachable — fall through to the free local rule engine.
      }
    }

    return NextResponse.json({
      result: triageScamMessage(parsed.data.message).result,
      engine: "local",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Please send a message to check." },
      { status: 400 },
    );
  }
}
