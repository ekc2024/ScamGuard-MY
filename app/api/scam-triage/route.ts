import { NextResponse } from "next/server";
import { z } from "zod";
import { triageScamMessage } from "@/lib/scam-triage";

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

    return NextResponse.json({
      result: triageScamMessage(parsed.data.message).result,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Please send a message to check." },
      { status: 400 },
    );
  }
}
