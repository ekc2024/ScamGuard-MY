import { NextRequest, NextResponse } from "next/server";
import { NotionRequestError, notionFetch, toErrorResponse } from "@/lib/notion";

// Content Library database ID
const LIBRARY_DATABASE_ID = "d2e835f8b26e4190a76283d58a13c5c9";

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
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

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

    const data = await notionFetch<{
      results: { id: string; properties: Record<string, Record<string, unknown>>; created_time: string }[];
    }>(`/databases/${LIBRARY_DATABASE_ID}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      errorMessage: "Failed to fetch library",
    });

    if (!Array.isArray(data.results)) {
      throw new NotionRequestError("Unexpected response shape from Notion query", 502);
    }

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
    const { status, body } = toErrorResponse(
      "api/library GET",
      error,
      "Failed to fetch library"
    );
    return NextResponse.json(body, { status });
  }
}
