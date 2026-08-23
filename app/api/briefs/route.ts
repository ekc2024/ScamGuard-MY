import { NextRequest } from "next/server";
import { catchResponse, errorResponse, successResponse } from "@/lib/api-response";
import {
  BRIEFS_DATABASE_ID,
  fetchNotionPage,
  mapPageToBrief,
  queryNotionDatabase,
  type Brief,
} from "@/lib/notion";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const briefId = searchParams.get("briefId");

  if (!email && !briefId) {
    return errorResponse("Email or Brief ID is required", 400);
  }

  try {
    // If briefId provided, fetch that specific page
    if (briefId) {
      const pageResponse = await fetchNotionPage(briefId);

      if (!pageResponse.ok) {
        const error = await pageResponse.json();
        return errorResponse(error.message || "Brief not found", 404);
      }

      const page = await pageResponse.json();
      const brief = mapPageToBrief(page);

      return successResponse({ briefs: [brief] });
    }

    // Query by email
    const filter = {
      property: "Email",
      email: { equals: email },
    };

    const response = await queryNotionDatabase(BRIEFS_DATABASE_ID, {
      filter,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 50,
    });

    if (!response.ok) {
      const error = await response.json();
      return errorResponse(error.message || "Failed to fetch briefs", 500);
    }

    const data = await response.json();
    const briefs: Brief[] = data.results.map(mapPageToBrief);

    return successResponse({ briefs });
  } catch (error) {
    return catchResponse(error, "Error fetching briefs:", "Failed to fetch briefs");
  }
}
