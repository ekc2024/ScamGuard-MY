import { CATEGORY_BY_ID, CATEGORY_DEFINITIONS } from "./categories.mjs";
import { checkReferenceList } from "./check-reference-list.mjs";
import { checkUrl } from "./check-url.mjs";
import { DISCLAIMERS } from "./disclaimers.mjs";
import { extractIdentifiers } from "./extract.mjs";

export const MAX_MESSAGE_LENGTH = 4000;

const REPORT_CHANNELS = {
  nsrc: {
    channel: "NSRC 997",
    detail: "National Scam Response Centre, 24/7. Call immediately if any money already left your account - the first hour matters most.",
  },
  semakMule: {
    channel: "Semak Mule (PDRM CCID)",
    detail: "Check and report the account number or phone number at semakmule.rmp.gov.my.",
  },
  police: {
    channel: "Nearest PDRM station",
    detail: "Lodge a police report with screenshots of the full conversation, the number, and any transfer receipt.",
  },
  mcmc: {
    channel: "MCMC",
    detail: "Report the sending number or spam SMS to MCMC at 1-800-188-030 or aduanskmm.my.",
  },
  platform: {
    channel: "In-app report",
    detail: "Use the platform's own Report and Block action so the sender is flagged for other users.",
  },
};

function scoreCategories(text) {
  const haystack = text.toLowerCase();

  return CATEGORY_DEFINITIONS.map((definition) => {
    const matchedSignals = [];
    let raw = 0;
    let max = 0;

    for (const signal of definition.signals) {
      max += signal.weight;
      if (signal.pattern.test(haystack)) {
        raw += signal.weight;
        matchedSignals.push(signal.name);
      }
    }

    const score = max === 0 ? 0 : Number((raw / max).toFixed(3));

    let confidence;
    if (score >= 0.6 && matchedSignals.length >= 3 && definition.coverage === "full") confidence = "high";
    else if (score >= 0.4 && matchedSignals.length >= 2) confidence = "medium";
    else confidence = "low";

    return {
      category: definition.category,
      label: definition.label,
      coverage: definition.coverage,
      score,
      confidence,
      matchedSignals,
    };
  }).sort((a, b) => b.score - a.score || b.matchedSignals.length - a.matchedSignals.length);
}

function verdictFor(top, urlChecks, references) {
  const referenceHit = references.find((reference) => reference.matched);
  const highRiskUrl = urlChecks.find((check) => check.risk === "high");

  if (referenceHit) {
    return {
      verdict: "REPORT",
      headline: `This ${referenceHit.type.replace("_", " ")} matches a demo reference entry reported as ${
        referenceHit.reportedAs ? CATEGORY_BY_ID[referenceHit.reportedAs].label : "a scam"
      }. Stop engaging and report it.`,
    };
  }

  if (highRiskUrl) {
    return {
      verdict: "STOP",
      headline: `The link ${highRiskUrl.domain ?? highRiskUrl.url} shows high-risk indicators. Do not open it.`,
    };
  }

  if (top && top.confidence === "high") {
    return { verdict: "STOP", headline: `This reads as ${top.label}. Do not act on it.` };
  }

  if (top && top.confidence === "medium") {
    return { verdict: "CHECK", headline: `Possible ${top.label}. Verify through an official channel before you act.` };
  }

  return {
    verdict: "CHECK",
    headline: "No strong scam pattern matched. Treat the message as unverified and confirm anything it asks of you independently.",
  };
}

function reportChannelsFor(top, extracted) {
  const channels = [REPORT_CHANNELS.nsrc];

  if (extracted.bankAccounts.length > 0 || extracted.phones.length > 0) channels.push(REPORT_CHANNELS.semakMule);
  if (extracted.phones.length > 0) channels.push(REPORT_CHANNELS.mcmc);
  if (top && (top.category === "whatsapp_malicious_link" || top.category === "social_media_impersonation")) {
    channels.push(REPORT_CHANNELS.platform);
  }
  channels.push(REPORT_CHANNELS.police);

  return channels;
}

const GENERIC_STOP = [
  "Do not reply, click, install or transfer anything while the message is unverified.",
  "Do not share your IC number, banking details, OTP or TAC with the sender.",
];

const GENERIC_ACTIONS = [
  "Contact the organisation on a number or address you looked up yourself, never one supplied in the message.",
  "Keep the original message and screenshots in case you need to file a report.",
];

/** Run the full STOP-CHECK-REPORT triage over a forwarded message. */
export function triageMessage(rawText) {
  const text = rawText.slice(0, MAX_MESSAGE_LENGTH);
  const extracted = extractIdentifiers(text);
  const allScores = scoreCategories(text);

  const urlChecks = extracted.urls.map(checkUrl);
  const references = [
    ...extracted.urls,
    ...extracted.phones,
    ...extracted.bankAccounts,
    ...extracted.socialHandles,
  ].map(checkReferenceList);

  const scored = allScores.filter((entry) => entry.matchedSignals.length > 0 && entry.score > 0);
  const top = scored[0] ?? null;
  const runnerUp = scored[1] ?? null;

  const { verdict, headline } = verdictFor(top, urlChecks, references);
  const definition = top ? CATEGORY_BY_ID[top.category] : null;
  const confident = top !== null && top.confidence !== "low";

  return {
    verdict,
    headline,
    category: confident ? top.category : null,
    categoryLabel: confident ? top.label : null,
    coverage: confident ? top.coverage : null,
    confidence: top?.confidence ?? "low",
    stop: confident ? definition.stop : GENERIC_STOP,
    check: {
      urls: urlChecks,
      references,
      userActions: confident ? definition.userActions : GENERIC_ACTIONS,
    },
    report: reportChannelsFor(confident ? top : null, extracted),
    runnerUp,
    allScores,
    extracted,
    disclaimers: [...DISCLAIMERS],
  };
}
