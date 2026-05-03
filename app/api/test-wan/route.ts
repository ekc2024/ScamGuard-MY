import { NextResponse } from "next/server";

// Hard-coded shot prompts from ScamGuard MY brief
const SHOT_PROMPTS: Record<string, { label: string; prompt: string }> = {
  "1": {
    label: "Shot 1 - Opening Hook",
    prompt: `Extreme close-up of a Malaysian woman's hands holding a smartphone, the screen glowing with an incoming call from "BANK NEGARA URGENT". Her fingers hover hesitantly. Cinematic lighting, shallow depth of field, tension building. Malaysian home interior visible in soft bokeh background. 4K quality, dramatic shadows.`,
  },
  "5": {
    label: "Shot 5 - Data Moment",
    prompt: `Smooth camera push into smartphone screen showing ScamGuard MY app interface with real-time threat analysis. Animated data visualization shows: "97.3% SCAM PROBABILITY" with pulsing red indicators. Neural network visualization processing in background. Sleek dark UI with gold accents. Tech thriller aesthetic, clean typography.`,
  },
  "7": {
    label: "Shot 7 - Title Card",
    prompt: `Elegant title card animation: "ScamGuard MY" logo materializes from golden particles against deep navy background (#1A1F36). Tagline fades in below: "AI-Powered Scam Protection for Every Malaysian". Subtle lens flare, premium motion graphics aesthetic. Clean, professional, trustworthy.`,
  },
};

export async function POST(request: Request) {
  try {
    const { shotNumber } = await request.json();

    if (!shotNumber || !SHOT_PROMPTS[shotNumber]) {
      return NextResponse.json(
        { error: "Invalid shot number. Choose 1, 5, or 7." },
        { status: 400 }
      );
    }

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY not configured" },
        { status: 500 }
      );
    }

    const shotData = SHOT_PROMPTS[shotNumber];

    // Call fal.ai WAN 2.6 Text-to-Video API
    const response = await fetch("https://queue.fal.run/fal-ai/wan/v2.6/text-to-video", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: shotData.prompt,
        aspect_ratio: "9:16",
        duration: "5",
        resolution: "720p",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] fal.ai error:", errorText);
      return NextResponse.json(
        { error: `fal.ai API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // fal.ai queue returns a request_id for polling
    if (result.request_id) {
      return NextResponse.json({
        status: "queued",
        requestId: result.request_id,
        shotLabel: shotData.label,
      });
    }

    // If immediate result (unlikely for video)
    return NextResponse.json({
      status: "completed",
      videoUrl: result.video?.url || result.output?.video?.url,
      shotLabel: shotData.label,
    });
  } catch (error) {
    console.error("[v0] test-wan error:", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    );
  }
}

// Poll for result
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json(
      { error: "Missing requestId" },
      { status: 400 }
    );
  }

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    return NextResponse.json(
      { error: "FAL_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://queue.fal.run/fal-ai/wan/v2.6/text-to-video/requests/${requestId}/status`,
      {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Status check failed: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.status === "COMPLETED") {
      // Fetch the actual result
      const resultResponse = await fetch(
        `https://queue.fal.run/fal-ai/wan/v2.6/text-to-video/requests/${requestId}`,
        {
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
          },
        }
      );
      const finalResult = await resultResponse.json();
      
      return NextResponse.json({
        status: "completed",
        videoUrl: finalResult.video?.url || finalResult.output?.video?.url || finalResult.data?.video?.url,
      });
    }

    return NextResponse.json({
      status: result.status?.toLowerCase() || "processing",
    });
  } catch (error) {
    console.error("[v0] poll error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
