import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeNotionId, pageBelongsToDatabase, rateLimit, serverError } from "@/lib/api-security";

const DATABASE_ID =
  process.env.NOTION_BRIEFS_DATABASE_ID || "cc27f313-ae7f-49c9-b67e-eabdfc9dfea8";

const querySchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  briefId: z.string().trim().max(64).optional(),
});

export interface Brief {
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
}

function extractTextContent(property: Record<string, unknown> | undefined): string | null {
  if (!property) return null;
  
  if (property.title && Array.isArray(property.title)) {
    return (property.title as Array<{ plain_text?: string }>)[0]?.plain_text || null;
  }
  if (property.rich_text && Array.isArray(property.rich_text)) {
    return (property.rich_text as Array<{ plain_text?: string }>)[0]?.plain_text || null;
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
  return null;
}

function mapPageToBrief(page: { id: string; properties: Record<string, Record<string, unknown>>; created_time: string }): Brief {
  const properties = page.properties;
  return {
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
  };
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "briefs", 30);
  if (limited) return limited;

  if (!process.env.NOTION_API_KEY) {
    return serverError("briefs", new Error("NOTION_API_KEY is not configured"));
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: searchParams.get("email") ?? undefined,
    briefId: searchParams.get("briefId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid email or Brief ID" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const briefId = normalizeNotionId(parsed.data.briefId);

  if (!email && !parsed.data.briefId) {
    return NextResponse.json(
      { success: false, error: "Email or Brief ID is required" },
      { status: 400 }
    );
  }

  if (parsed.data.briefId && !briefId) {
    return NextResponse.json(
      { success: false, error: "Invalid Brief ID" },
      { status: 400 }
    );
  }

  try {
    // If briefId provided, fetch that specific page
    if (briefId) {
      const pageResponse = await fetch(
        `https://api.notion.com/v1/pages/${encodeURIComponent(briefId)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
          },
        }
      );

      if (!pageResponse.ok) {
        return NextResponse.json(
          { success: false, error: "Brief not found" },
          { status: 404 }
        );
      }

      const page = await pageResponse.json();

      // Only expose pages that live in the Brief Intake database, so the
      // integration token cannot be used to read unrelated Notion pages.
      if (!pageBelongsToDatabase(page, DATABASE_ID)) {
        return NextResponse.json(
          { success: false, error: "Brief not found" },
          { status: 404 }
        );
      }

      const brief = mapPageToBrief(page);

      return NextResponse.json({ success: true, briefs: [brief] });
    }

    // Query by email
    const filter = {
      property: "Email",
      email: { equals: email },
    };

    const response = await fetch(
      `https://api.notion.com/v1/databases/${encodeURIComponent(DATABASE_ID)}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter,
          sorts: [{ timestamp: "created_time", direction: "descending" }],
          page_size: 50,
        }),
      }
    );

    if (!response.ok) {
      return serverError(
        "briefs",
        new Error(`Notion query failed with status ${response.status}`),
        "Failed to fetch briefs"
      );
    }

    const data = await response.json();
    const briefs: Brief[] = data.results.map(mapPageToBrief);

    return NextResponse.json({ success: true, briefs });
  } catch (error) {
    return serverError("briefs", error, "Failed to fetch briefs");
  }
}
