export const BRIEFS_DATABASE_ID = "cc27f313-ae7f-49c9-b67e-eabdfc9dfea8";
export const LIBRARY_DATABASE_ID = "d2e835f8b26e4190a76283d58a13c5c9";

const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export interface NotionPage {
  id: string;
  properties: Record<string, Record<string, unknown>>;
  created_time: string;
}

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

export interface BriefResult extends Brief {
  script: string | null;
  hookScore: number | null;
  frameworkScore: number | null;
  ctaScore: number | null;
  imagePrompts: string | null;
  videoPrompts: string | null;
}

function notionHeaders(contentType?: string): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    ...(contentType && { "Content-Type": contentType }),
    "Notion-Version": NOTION_VERSION,
  };
}

export function fetchNotionPage(id: string): Promise<Response> {
  return fetch(`${NOTION_API_URL}/pages/${id}`, {
    headers: notionHeaders(),
  });
}

export function queryNotionDatabase(
  databaseId: string,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(`${NOTION_API_URL}/databases/${databaseId}/query`, {
    method: "POST",
    headers: notionHeaders("application/json"),
    body: JSON.stringify(body),
  });
}

export function extractTextContent(
  property: Record<string, unknown> | undefined
): string | null {
  if (!property) return null;

  if (property.title && Array.isArray(property.title)) {
    return (
      property.title as Array<{ plain_text?: string }>
    )[0]?.plain_text || null;
  }
  if (property.rich_text && Array.isArray(property.rich_text)) {
    return (
      property.rich_text as Array<{ plain_text?: string }>
    ).map((text) => text.plain_text || "").join("") || null;
  }
  if (
    property.select &&
    typeof property.select === "object" &&
    property.select !== null
  ) {
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
  if (
    property.date &&
    typeof property.date === "object" &&
    property.date !== null
  ) {
    return (property.date as { start?: string }).start || null;
  }
  if (property.number !== undefined && property.number !== null) {
    return String(property.number);
  }
  return null;
}

export function extractNumber(
  property: Record<string, unknown> | undefined
): number | null {
  if (!property) return null;
  if (property.number !== undefined && property.number !== null) {
    return property.number as number;
  }
  return null;
}

export function extractMultiSelect(
  property: Record<string, unknown> | undefined
): string[] {
  if (!property) return [];
  if (property.multi_select && Array.isArray(property.multi_select)) {
    return (property.multi_select as Array<{ name?: string }>)
      .map((item) => item.name || "")
      .filter(Boolean);
  }
  return [];
}

export function mapPageToBrief(page: NotionPage): Brief {
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

export function mapPageToBriefResult(page: NotionPage): BriefResult {
  const properties = page.properties;
  return {
    ...mapPageToBrief(page),
    script: extractTextContent(properties["Script"]),
    hookScore: extractNumber(properties["Hook Score"]),
    frameworkScore: extractNumber(properties["Framework Score"]),
    ctaScore: extractNumber(properties["CTA Score"]),
    imagePrompts: extractTextContent(properties["Image Prompts"]),
    videoPrompts: extractTextContent(properties["Video Prompts"]),
  };
}
