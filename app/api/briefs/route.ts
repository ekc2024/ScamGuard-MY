import { NextRequest, NextResponse } from "next/server";

const DATABASE_ID = "cc27f313-ae7f-49c9-b67e-eabdfc9dfea8";

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
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const briefId = searchParams.get("briefId");

  if (!email && !briefId) {
    return NextResponse.json(
      { success: false, error: "Email or Brief ID is required" },
      { status: 400 }
    );
  }

  try {
    // If briefId provided, fetch that specific page
    if (briefId) {
      const pageResponse = await fetch(
        `https://api.notion.com/v1/pages/${briefId}`,
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
      const brief = mapPageToBrief(page);

      return NextResponse.json({ success: true, briefs: [brief] });
    }

    // Query by email
    const filter = {
      property: "Email",
      email: { equals: email },
    };

    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
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
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch briefs" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const briefs: Brief[] = data.results.map(mapPageToBrief);

    return NextResponse.json({ success: true, briefs });
  } catch (error) {
    console.error("Error fetching briefs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch briefs",
      },
      { status: 500 }
    );
  }
}
