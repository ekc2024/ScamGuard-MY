import { NextRequest, NextResponse } from "next/server";

export interface BriefResult {
  id: string;
  briefTitle: string;
  client: string;
  contactName: string | null;
  email: string | null;
  whatsapp: string | null;
  platform: string | null;
  duration: string | null;
  budget: string | null;
  targetAudience: string | null;
  keyMessage: string | null;
  tone: string | null;
  referenceUrl: string | null;
  deadline: string | null;
  sourceChannel: string | null;
  status: string | null;
  createdTime: string;
  // Script fields
  script: string | null;
  hookScore: number | null;
  frameworkScore: number | null;
  ctaScore: number | null;
  imagePrompts: string | null;
  videoPrompts: string | null;
}

function extractTextContent(property: Record<string, unknown> | undefined): string | null {
  if (!property) return null;
  
  if (property.title && Array.isArray(property.title)) {
    return (property.title as Array<{ plain_text?: string }>)[0]?.plain_text || null;
  }
  if (property.rich_text && Array.isArray(property.rich_text)) {
    return (property.rich_text as Array<{ plain_text?: string }>).map(t => t.plain_text || '').join('') || null;
  }
  if (property.select && typeof property.select === 'object' && property.select !== null) {
    return (property.select as { name?: string }).name || null;
  }
  if (property.email) {
    return property.email as string;
  }
  if (property.phone_number) {
    return property.phone_number as string;
  }
  if (property.url) {
    return property.url as string;
  }
  if (property.date && typeof property.date === 'object' && property.date !== null) {
    return (property.date as { start?: string }).start || null;
  }
  if (property.number !== undefined && property.number !== null) {
    return String(property.number);
  }
  return null;
}

function extractNumber(property: Record<string, unknown> | undefined): number | null {
  if (!property) return null;
  if (property.number !== undefined && property.number !== null) {
    return property.number as number;
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const pageResponse = await fetch(
      `https://api.notion.com/v1/pages/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    if (!pageResponse.ok) {
      const error = await pageResponse.json();
      return NextResponse.json(
        { success: false, error: error.message || "Brief not found" },
        { status: 404 }
      );
    }

    const page = await pageResponse.json();
    const properties = page.properties as Record<string, Record<string, unknown>>;

    const brief: BriefResult = {
      id: page.id,
      briefTitle: extractTextContent(properties["Brief Title"]) || "Untitled",
      client: extractTextContent(properties["Client"]) || "",
      contactName: extractTextContent(properties["Contact Name"]),
      email: extractTextContent(properties["Email"]),
      whatsapp: extractTextContent(properties["WhatsApp"]),
      platform: extractTextContent(properties["Platform"]),
      duration: extractTextContent(properties["Duration"]),
      budget: extractTextContent(properties["Budget"]),
      targetAudience: extractTextContent(properties["Target Audience"]),
      keyMessage: extractTextContent(properties["Key Message"]),
      tone: extractTextContent(properties["Tone"]),
      referenceUrl: extractTextContent(properties["Reference URL"]),
      deadline: extractTextContent(properties["Deadline"]),
      sourceChannel: extractTextContent(properties["Source Channel"]),
      status: extractTextContent(properties["Status"]),
      createdTime: page.created_time,
      // Script fields
      script: extractTextContent(properties["Script"]),
      hookScore: extractNumber(properties["Hook Score"]),
      frameworkScore: extractNumber(properties["Framework Score"]),
      ctaScore: extractNumber(properties["CTA Score"]),
      imagePrompts: extractTextContent(properties["Image Prompts"]),
      videoPrompts: extractTextContent(properties["Video Prompts"]),
    };

    return NextResponse.json({ success: true, brief });
  } catch (error) {
    console.error("Error fetching brief:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch brief",
      },
      { status: 500 }
    );
  }
}
