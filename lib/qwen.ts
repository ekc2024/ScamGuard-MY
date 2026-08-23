/**
 * Qwen (ModelScope / DashScope) AI integration for scam triage.
 *
 * Uses the OpenAI-compatible chat completions endpoint from Alibaba Cloud
 * Model Studio (DashScope). Set QWEN_API_KEY in your environment.
 *
 * Optionally set QWEN_BASE_URL to override the default endpoint
 * (e.g. for international regions or workspace-specific domains).
 */

const DEFAULT_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

const QWEN_MODEL = "qwen-plus"; // Good balance of speed + quality

const QWEN_TIMEOUT_MS = 30000;

const SYSTEM_PROMPT = `You are ScamGuard MY, an AI scam detection specialist focused on Malaysia. Your job is to analyze messages and determine if they are scams.

When analyzing a message, you MUST respond in this exact format:

Risk score: [0-100]/100
Assessment: [Likely Scam | Suspicious | Probably Safe]

Matched signals:
- [list each scam signal detected, one per line]

Recommended action: [one clear sentence of advice]

---

Scoring guidelines:
- 60-100 = "Likely Scam" — Clear scam indicators (fake URLs, credential requests, urgency + payment demands)
- 30-59 = "Suspicious" — Some red flags but not conclusive (unusual requests, mild urgency)
- 0-29 = "Probably Safe" — No significant scam indicators detected

Key scam signals to check for:
1. Urgency or threat language (account suspended, act now, within 24 hours)
2. Payment or money-transfer requests (bank transfer, pay now, gift card)
3. Requests for bank-account or mule-account details
4. Requests for OTP, TAC, PIN, password, or NRIC
5. Impersonation of banks (Maybank, CIMB), government (LHDN, PDRM, BNM), couriers (Pos Laju, J&T), or telcos
6. Suspicious, shortened, or lookalike URLs
7. Link-based verification or claim lures
8. Investment, loan, crypto, or guaranteed-return schemes
9. Prize, refund, tax-rebate, or lottery claims
10. Redirect to WhatsApp/Telegram with private numbers
11. Unusual or foreign phone-number formats

Be especially aware of Malaysian context: BM/Malay language scams, local banks, LHDN tax scams, Pos Laju delivery scams, and e-wallet (Touch 'n Go, GrabPay, Boost) fraud.

Always respond in English. Be concise.`;

export interface QwenChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface QwenChatChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

interface QwenChatResponse {
  id: string;
  choices: QwenChatChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Returns true when the QWEN_API_KEY environment variable is set.
 */
export function isQwenConfigured(): boolean {
  return Boolean(process.env.QWEN_API_KEY);
}

/**
 * Analyze a message for scam indicators using Qwen AI.
 * Throws when the API is unreachable or returns an unusable response,
 * so the caller can fall back to the local rule engine.
 */
export async function triageViaQwen(message: string): Promise<string> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error("QWEN_API_KEY is not configured");
  }

  const baseUrl = process.env.QWEN_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.QWEN_MODEL || QWEN_MODEL;
  const url = `${baseUrl}/chat/completions`;

  const messages: QwenChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze this message for scam indicators:\n\n"${message}"`,
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QWEN_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 512,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Qwen API responded with status ${response.status}: ${errorBody.slice(0, 200)}`,
      );
    }

    const data: QwenChatResponse = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Qwen API returned an empty response");
    }

    return reply;
  } finally {
    clearTimeout(timeout);
  }
}
