/**
 * Optional Qwen enrichment layer.
 *
 * This NEVER decides or changes a verdict. The pattern-matching triage in
 * triage.mjs stays the single source of truth; Qwen is only asked for a
 * plain-language paragraph explaining a verdict that has already been made.
 * Every failure path degrades silently to "no explanation".
 */

export const QWEN_BASE_URL = process.env.QWEN_BASE_URL ?? "https://api-inference.modelscope.ai/v1";
export const QWEN_MODEL = process.env.QWEN_MODEL ?? "Qwen-Ambassador/Qwen3.8-Max";

/** Only the three fully-tuned categories are enriched. */
export const ENRICHABLE_CATEGORIES = Object.freeze([
  "tng_ewallet_phishing",
  "whatsapp_malicious_link",
  "job_deposit_scam",
]);

const MAX_EXPLANATION_LENGTH = 900;
const DEFAULT_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT = [
  "You explain an assessment that has ALREADY been made by a rule-based scam triage tool for Malaysian users.",
  "You do not decide, confirm, overturn or re-score the verdict, and you never state a different verdict.",
  "Write exactly one paragraph of plain language (maximum 80 words) that explains, to a non-technical reader,",
  "why the message shows the listed indicators and what the given verdict means for them in practice.",
  "Do not add new facts, do not claim anything is officially confirmed, do not say the message is definitely safe,",
  "do not invent report numbers or database records, and do not use bullet points, headings or markdown.",
].join(" ");

export function isEnrichableCategory(category) {
  return typeof category === "string" && ENRICHABLE_CATEGORIES.includes(category);
}

function buildUserPrompt(result, message) {
  const indicators = [
    ...result.check.urls.map((check) => `link ${check.domain ?? check.url}: ${check.risk} risk (${check.reasons.join("; ")})`),
    ...result.check.references.map(
      (reference) =>
        `${reference.type} ${reference.identifier}: ${reference.matched ? "matches a demo reference entry" : "no demo match"}`
    ),
  ];

  return [
    `Verdict: ${result.verdict}`,
    `Category: ${result.categoryLabel ?? result.category ?? "unclassified"}`,
    `Confidence: ${result.confidence}`,
    `Headline shown to the user: ${result.headline}`,
    `Indicators the tool found: ${indicators.length > 0 ? indicators.join(" | ") : "wording patterns only"}`,
    "Message the user received:",
    message,
  ].join("\n");
}

function unavailable(reason) {
  return { available: false, reason, explanation: null, model: QWEN_MODEL };
}

/**
 * @returns {Promise<{available: boolean, reason: string|null, explanation: string|null, model: string}>}
 */
export async function enrichVerdict(result, message, options = {}) {
  const {
    apiKey = process.env.QWEN_API_KEY,
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    baseUrl = QWEN_BASE_URL,
    model = QWEN_MODEL,
  } = options;

  if (!isEnrichableCategory(result?.category)) {
    return unavailable("Enrichment only runs for the three fully-covered categories.");
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return unavailable("No message text to explain.");
  }
  if (!apiKey) {
    return unavailable("QWEN_API_KEY is not configured, so enrichment is disabled.");
  }
  if (typeof fetchImpl !== "function") {
    return unavailable("No fetch implementation available.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(result, message) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return unavailable(`Enrichment service returned HTTP ${response.status}.`);
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      return unavailable("Enrichment service returned no explanation.");
    }

    const explanation = text.trim().replace(/\s+/g, " ").slice(0, MAX_EXPLANATION_LENGTH);
    return { available: true, reason: null, explanation, model };
  } catch (error) {
    return unavailable(
      error?.name === "AbortError" ? "Enrichment timed out." : "Enrichment could not be reached."
    );
  } finally {
    clearTimeout(timer);
  }
}

export { enrichVerdict as qwen_enrich };
