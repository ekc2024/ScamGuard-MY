import { SCAM_CATEGORIES } from "./categories.mjs";

/**
 * The demo reference list is injected rather than imported, so the same module
 * works in the browser (fetched JSON) and in Node (read from disk) without
 * relying on JSON import attributes.
 */
let referenceData = null;
let normalizedEntries = [];

export function setReferenceData(data) {
  referenceData = data;
  normalizedEntries = (data.entries ?? []).map((entry) => {
    const type = asIdentifierType(entry.type);
    return { key: normalizeIdentifier(entry.identifier, type), type, entry };
  });
}

export function getReferenceMeta() {
  return {
    disclaimer: referenceData?._disclaimer ?? "",
    source: referenceData?._source ?? "",
    version: referenceData?._version ?? "",
    entryCount: normalizedEntries.length,
  };
}

function asCategory(value) {
  return SCAM_CATEGORIES.includes(value) ? value : null;
}

function asIdentifierType(value) {
  return ["phone", "url", "bank_account", "social_handle"].includes(value) ? value : "unknown";
}

export function classifyIdentifier(identifier) {
  const value = identifier.trim();
  if (value.startsWith("@")) return "social_handle";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /[a-z0-9-]+\.[a-z]{2,}/i.test(value.replace(/\s/g, ""))) return "url";
  const digits = value.replace(/[^\d]/g, "");
  if (/^\+?\d[\d\s()-]{6,}$/.test(value)) {
    // Malaysian mobile numbers are 9-11 digits; longer digit strings are treated as accounts.
    if (digits.length <= 12 && (value.startsWith("+") || digits.startsWith("60") || digits.startsWith("0"))) return "phone";
    return "bank_account";
  }
  if (/^\d{8,17}$/.test(digits) && digits.length === value.length) return "bank_account";
  return "unknown";
}

/** Malaysian numbers are stored in +60 form so 012-345 6789 and +60123456789 collide. */
function normalizePhone(value) {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("60")) return `+${digits}`;
  if (digits.startsWith("0")) return `+60${digits.slice(1)}`;
  return `+${digits}`;
}

function normalizeUrl(value) {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`;
  try {
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value.trim().toLowerCase().replace(/^www\./, "");
  }
}

export function normalizeIdentifier(identifier, type) {
  const value = identifier.trim();
  switch (type) {
    case "phone":
      return normalizePhone(value);
    case "url":
      return normalizeUrl(value);
    case "bank_account":
      return value.replace(/[^\d]/g, "");
    case "social_handle":
      return value.toLowerCase().replace(/^@/, "");
    default:
      return value.toLowerCase();
  }
}

/**
 * check_reference_list - match a phone number, domain, bank account or social
 * handle against the bundled demo reference list.
 *
 * The reference list is a hand-written placeholder JSON. A match is a demo
 * signal only; a non-match says nothing about legitimacy.
 */
export function checkReferenceList(identifier) {
  if (referenceData === null) {
    throw new Error("Reference data not loaded. Call setReferenceData() first.");
  }

  const type = classifyIdentifier(identifier);
  const normalized = normalizeIdentifier(identifier, type);

  const hit = normalizedEntries.find(
    (candidate) =>
      candidate.key === normalized ||
      (candidate.type === "url" && type === "url" && normalized.endsWith(`.${candidate.key}`))
  );

  if (!hit) {
    return {
      identifier: identifier.trim(),
      normalized,
      type,
      matched: false,
      reportedAs: null,
      reportCount: 0,
      note: "Not present in the demo reference list. This is not a clearance - the list only holds a handful of illustrative entries.",
      source: "demo_reference_list",
    };
  }

  return {
    identifier: identifier.trim(),
    normalized,
    type,
    matched: true,
    reportedAs: asCategory(hit.entry.reportedAs),
    reportCount: hit.entry.reportCount,
    note: hit.entry.note,
    source: "demo_reference_list",
  };
}

export { checkReferenceList as check_reference_list };
