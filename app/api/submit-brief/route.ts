import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { z } from "zod";
import { rateLimit, readJsonBody, serverError } from "@/lib/api-security";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID =
  process.env.NOTION_BRIEFS_DATABASE_ID || "cc27f313-ae7f-49c9-b67e-eabdfc9dfea8";

/** The form posts empty strings for untouched optional fields. */
function optional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional()
  );
}

// Notion select values must stay single-line and short.
const selectValue = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[^\n\r]+$/, "Must be a single line");

const briefSchema = z.object({
  briefTitle: z.string().trim().min(1).max(200),
  client: z.string().trim().min(1).max(200),
  contactName: optional(z.string().trim().max(200)),
  email: optional(z.string().trim().email().max(254)),
  whatsapp: optional(
    z.string().trim().max(30).regex(/^[+0-9()\-.\s]+$/, "Invalid phone number")
  ),
  platform: optional(selectValue),
  duration: optional(selectValue),
  budget: optional(z.string().trim().max(200)),
  targetAudience: optional(z.string().trim().max(2000)),
  keyMessage: optional(z.string().trim().max(2000)),
  tone: optional(selectValue),
  referenceUrl: optional(
    z
      .string()
      .trim()
      .max(2000)
      .url()
      .refine((value) => /^https?:\/\//i.test(value), "Only http(s) URLs are allowed")
  ),
  deadline: optional(
    z.string().trim().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, "Expected an ISO date")
  ),
  sourceChannel: optional(z.string().trim().max(200)),
});

export type BriefFormData = z.infer<typeof briefSchema>;

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "submit-brief", 10);
  if (limited) return limited;

  if (!process.env.NOTION_API_KEY) {
    return serverError("submit-brief", new Error("NOTION_API_KEY is not configured"));
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = briefSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid brief data",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
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
    return serverError("submit-brief", error, "Failed to submit brief");
  }
}
