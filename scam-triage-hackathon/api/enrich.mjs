import { handleEnrich } from "../lib/enrich-handler.mjs";

/** Vercel-style Node serverless function: POST /api/enrich */
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST." });
    return;
  }

  const { status, body } = await handleEnrich(request.body ?? {});
  response.status(status).json(body);
}
