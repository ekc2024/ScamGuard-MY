import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, serverError } from "@/lib/api-security";

// Content Library database ID
const LIBRARY_DATABASE_ID =
  process.env.NOTION_LIBRARY_DATABASE_ID || "d2e835f8b26e4190a76283d58a13c5c9";

const querySchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  type: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

export interface ContentItem {
  id: string;
  title: string;
  category: string | null;
  type: string | null;
  tags: string[];
  content: string | null;
  createdTime: string;
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
  return null;
}

function extractMultiSelect(property: Record<string, unknown> | undefined): string[] {
  if (!property) return [];
  if (property.multi_select && Array.isArray(property.multi_select)) {
    return (property.multi_select as Array<{ name?: string }>).map(item => item.name || '').filter(Boolean);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "library", 60);
  if (limited) return limited;

  if (!process.env.NOTION_API_KEY) {
    return serverError("library", new Error("NOTION_API_KEY is not configured"));
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid filter parameters" },
      { status: 400 }
    );
  }

  const { category, type, search } = parsed.data;

  try {
    // Build filter array
    const filterConditions: Record<string, unknown>[] = [];
    
    if (category) {
      filterConditions.push({
        property: "Category",
        select: { equals: category },
      });
    }
    
    if (type) {
      filterConditions.push({
        property: "Type",
        select: { equals: type },
      });
    }
    
    if (search) {
      filterConditions.push({
        property: "Title",
        title: { contains: search },
      });
    }

    const requestBody: Record<string, unknown> = {
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 100,
    };

    if (filterConditions.length > 0) {
      requestBody.filter = filterConditions.length === 1 
        ? filterConditions[0]
        : { and: filterConditions };
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${encodeURIComponent(LIBRARY_DATABASE_ID)}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      return serverError(
        "library",
        new Error(`Notion query failed with status ${response.status}`),
        "Failed to fetch library"
      );
    }

    const data = await response.json();

    const items: ContentItem[] = data.results.map((page: { id: string; properties: Record<string, Record<string, unknown>>; created_time: string }) => {
      const properties = page.properties;
      return {
        id: page.id,
        title: extractTextContent(properties["Title"]) || extractTextContent(properties["Name"]) || "Untitled",
        category: extractTextContent(properties["Category"]),
        type: extractTextContent(properties["Type"]),
        tags: extractMultiSelect(properties["Tags"]),
        content: extractTextContent(properties["Content"]) || extractTextContent(properties["Description"]),
        createdTime: page.created_time,
      };
    });

    // Get unique categories and types for filters
    const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[];
    const types = [...new Set(items.map(i => i.type).filter(Boolean))] as string[];

    return NextResponse.json({ 
      success: true, 
      items,
      filters: { categories, types },
    });
  } catch (error) {
    return serverError("library", error, "Failed to fetch library");
  }
}
