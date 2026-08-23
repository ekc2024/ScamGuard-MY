/**
 * Server-side glue for the optional Qwen enrichment layer.
 *
 * The browser never holds QWEN_API_KEY, so it posts the message here and this
 * handler re-runs the same deterministic triage before asking Qwen for an
 * explanation of that verdict. Nothing here can change a verdict.
 */
import { loadReferenceData } from "./load-reference-data.node.mjs";
import { MAX_MESSAGE_LENGTH, triageMessage } from "./triage.mjs";
import { enrichVerdict } from "./qwen-enrich.mjs";

let referenceDataLoaded = false;

export async function handleEnrich(body, options = {}) {
  let parsed;
  try {
    parsed = typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    return { status: 400, body: { error: "Body must be JSON." } };
  }

  const message = parsed?.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    return { status: 400, body: { error: "Field 'message' is required." } };
  }

  if (!referenceDataLoaded) {
    loadReferenceData();
    referenceDataLoaded = true;
  }

  const result = triageMessage(message.slice(0, MAX_MESSAGE_LENGTH));
  const enrichment = await enrichVerdict(result, message, options);

  return {
    status: 200,
    body: {
      verdict: result.verdict,
      category: result.category,
      enrichment,
      disclaimers: result.disclaimers,
    },
  };
}
