import { NextResponse } from "next/server";

// Hard-coded shot prompts from ScamGuard MY brief
interface ShotData {
  label: string;
  prompt: string;
  model: "wan" | "ltx";
  imageUrl?: string; // Required for LTX I2V
}

const SHOT_PROMPTS: Record<string, ShotData> = {
  "wan-1": {
    label: "Shot 1 - Opening Hook",
    model: "wan",
    prompt: `Extreme close-up of a Malaysian woman's hands holding a smartphone, the screen glowing with an incoming call from "BANK NEGARA URGENT". Her fingers hover hesitantly. Cinematic lighting, shallow depth of field, tension building. Malaysian home interior visible in soft bokeh background. 4K quality, dramatic shadows.`,
  },
  "wan-5": {
    label: "Shot 5 - Data Moment",
    model: "wan",
    prompt: `Smooth camera push into smartphone screen showing ScamGuard MY app interface with real-time threat analysis. Animated data visualization shows: "97.3% SCAM PROBABILITY" with pulsing red indicators. Neural network visualization processing in background. Sleek dark UI with gold accents. Tech thriller aesthetic, clean typography.`,
  },
  "wan-7": {
    label: "Shot 7 - Title Card",
    model: "wan",
    prompt: `Elegant title card animation: "ScamGuard MY" logo materializes from golden particles against deep navy background (#1A1F36). Tagline fades in below: "AI-Powered Scam Protection for Every Malaysian". Subtle lens flare, premium motion graphics aesthetic. Clean, professional, trustworthy.`,
  },
  "ltx-2": {
    label: "Shot 2 - Character Introduction (LTX-2 Test)",
    model: "ltx",
    prompt: `Malaysian Chinese woman, 35 years old, professional attire, worried expression slowly turning to relief as she looks at her phone. Soft natural lighting, shallow depth of field, cinematic color grading. Modern office environment.`,
    // For I2V we need an image - using a placeholder concept
    imageUrl: "https://fal.media/files/penguin/bxSVBd3fkHmHAa9sJiJXD.png", // Placeholder - replace with actual image
  },
};

export async function POST(request: Request) {
  try {
    const { shotId } = await request.json();

    if (!shotId || !SHOT_PROMPTS[shotId]) {
      return NextResponse.json(
        { error: "Invalid shot ID. Choose wan-1, wan-5, wan-7, or ltx-2." },
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

    const shotData = SHOT_PROMPTS[shotId];
    const isLtx = shotData.model === "ltx";

    // Choose endpoint based on model
    const endpoint = isLtx 
      ? "https://queue.fal.run/fal-ai/ltx-video-v0-9-5/image-to-video"
      : "https://queue.fal.run/fal-ai/wan/v2.6/text-to-video";

    // Build request body based on model
    const requestBody = isLtx
      ? {
          prompt: shotData.prompt,
          image_url: shotData.imageUrl,
          aspect_ratio: "9:16",
          duration: 5,
        }
      : {
          prompt: shotData.prompt,
          aspect_ratio: "9:16",
          duration: "5",
          resolution: "720p",
        };

    // Call fal.ai API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
        model: shotData.model,
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
  const model = searchParams.get("model") || "wan"; // wan or ltx

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

  // Choose endpoint based on model
  const baseEndpoint = model === "ltx"
    ? "fal-ai/ltx-video-v0-9-5/image-to-video"
    : "fal-ai/wan/v2.6/text-to-video";

  try {
    const response = await fetch(
      `https://queue.fal.run/${baseEndpoint}/requests/${requestId}/status`,
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
        `https://queue.fal.run/${baseEndpoint}/requests/${requestId}`,
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
