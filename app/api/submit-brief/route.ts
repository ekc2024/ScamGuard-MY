import { NextRequest } from "next/server";
import { Client } from "@notionhq/client";
import { catchResponse, errorResponse, successResponse } from "@/lib/api-response";
import { BRIEFS_DATABASE_ID } from "@/lib/notion";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export interface BriefFormData {
  briefTitle: string;
  client: string;
  contactName?: string;
  email?: string;
  whatsapp?: string;
  platform?: string;
  duration?: string;
  budget?: string;
  targetAudience?: string;
  keyMessage?: string;
  tone?: string;
  referenceUrl?: string;
  deadline?: string;
  sourceChannel?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: BriefFormData = await request.json();

    // Validate required fields
    if (!data.briefTitle || !data.client) {
      return errorResponse("Brief Title and Client are required", 400);
    }

    // Create the page in Notion with exact property names
    const response = await notion.pages.create({
      parent: { database_id: BRIEFS_DATABASE_ID },
      properties: {
        "Brief Title": {
          title: [{ text: { content: data.briefTitle } }],
        },
        "Client": {
          rich_text: [{ text: { content: data.client } }],
        },
        ...(data.contactName && {
          "Contact Name": {
            rich_text: [{ text: { content: data.contactName } }],
          },
        }),
        ...(data.email && {
          "Email": { email: data.email },
        }),
        ...(data.whatsapp && {
          "WhatsApp": { phone_number: data.whatsapp },
        }),
        ...(data.platform && {
          "Platform": { select: { name: data.platform } },
        }),
        ...(data.duration && {
          "Duration": { select: { name: data.duration } },
        }),
        ...(data.budget && {
          "Budget": {
            rich_text: [{ text: { content: data.budget } }],
          },
        }),
        ...(data.targetAudience && {
          "Target Audience": {
            rich_text: [{ text: { content: data.targetAudience } }],
          },
        }),
        ...(data.keyMessage && {
          "Key Message": {
            rich_text: [{ text: { content: data.keyMessage } }],
          },
        }),
        ...(data.tone && {
          "Tone": { select: { name: data.tone } },
        }),
        ...(data.referenceUrl && {
          "Reference URL": { url: data.referenceUrl },
        }),
        ...(data.deadline && {
          "Deadline": { date: { start: data.deadline } },
        }),
        ...(data.sourceChannel && {
          "Source Channel": {
            rich_text: [{ text: { content: data.sourceChannel } }],
          },
        }),
        "Status": { select: { name: "New" } },
      },
    });

    return successResponse({
      message: "Brief submitted successfully",
      pageId: response.id,
    });
  } catch (error) {
    return catchResponse(error, "Error creating Notion page:", "Failed to submit brief");
  }
}
