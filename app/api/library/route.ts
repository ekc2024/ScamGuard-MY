import { NextRequest } from "next/server";
import { catchResponse, errorResponse, successResponse } from "@/lib/api-response";
import {
  extractMultiSelect,
  extractTextContent,
  LIBRARY_DATABASE_ID,
  queryNotionDatabase,
} from "@/lib/notion";

export interface ContentItem {
  id: string;
  title: string;
  category: string | null;
  type: string | null;
  tags: string[];
  content: string | null;
  createdTime: string;
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

    const response = await queryNotionDatabase(LIBRARY_DATABASE_ID, requestBody);

    if (!response.ok) {
      const error = await response.json();
      console.error("Notion API error:", error);
      return errorResponse(error.message || "Failed to fetch library", 500);
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

    return successResponse({
      items,
      filters: { categories, types },
    });
  } catch (error) {
    return catchResponse(error, "Error fetching library:", "Failed to fetch library");
  }
}
