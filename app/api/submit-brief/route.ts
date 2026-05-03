import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = "cc27f313-ae7f-49c9-b67e-eabdfc9dfea8";

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
      return NextResponse.json(
        { success: false, error: "Brief Title and Client are required" },
        { status: 400 }
      );
    }

    // Create the page in Notion with exact property names
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
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

    return NextResponse.json({
      success: true,
      message: "Brief submitted successfully",
      pageId: response.id,
    });
  } catch (error) {
    console.error("Error creating Notion page:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit brief",
      },
      { status: 500 }
    );
  }
}
