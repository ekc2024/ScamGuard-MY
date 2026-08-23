import { NextRequest } from "next/server";
import { catchResponse, errorResponse, successResponse } from "@/lib/api-response";
import { fetchNotionPage, mapPageToBriefResult, type BriefResult } from "@/lib/notion";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const pageResponse = await fetchNotionPage(id);

    if (!pageResponse.ok) {
      const error = await pageResponse.json();
      return errorResponse(error.message || "Brief not found", 404);
    }

    const page = await pageResponse.json();
    const brief: BriefResult = mapPageToBriefResult(page);

    return successResponse({ brief });
  } catch (error) {
    return catchResponse(error, "Error fetching brief:", "Failed to fetch brief");
  }
}
