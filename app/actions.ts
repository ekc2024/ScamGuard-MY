"use server";

export interface BriefFormData {
  briefTitle: string;
  client: string;
  platform: string;
  duration: string;
  purpose: string;
  targetAudience: string;
  tone: string;
  keyMessage: string;
  videoMode: string;
  aiVideoTool: string;
}

export async function submitBrief(data: BriefFormData) {
  // This server action validates and returns the data
  // The actual Notion page creation happens via MCP tool call
  
  if (!data.briefTitle || !data.client) {
    return {
      success: false,
      error: "Brief Title and Client are required",
    };
  }

  return {
    success: true,
    message: "Brief submitted successfully! Creating Notion entry...",
    notionData: {
      "Brief Title": data.briefTitle,
      "Client": data.client,
      "Platform": data.platform || null,
      "Duration": data.duration || null,
      "Purpose": data.purpose || null,
      "Target Audience": data.targetAudience || null,
      "Tone": data.tone || null,
      "Key Message": data.keyMessage || null,
      "Video Mode": data.videoMode || null,
      "AI Video Tool": data.aiVideoTool || null,
      "Status": "New",
    },
  };
}
