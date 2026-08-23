import referenceData from "./reference-data.json";
import type { IdentifierType, ReferenceMatch, ScamCategory } from "./types";
import { SCAM_CATEGORIES } from "./types";

interface RawEntry {
  identifier: string;
  type: string;
  reportedAs: string;
  reportCount: number;
  note: string;
}

export const REFERENCE_DISCLAIMER = referenceData._disclaimer;
export const REFERENCE_VERSION = referenceData._version;

function asCategory(value: string): ScamCategory | null {
  return (SCAM_CATEGORIES as readonly string[]).includes(value) ? (value as ScamCategory) : null;
}

function asIdentifierType(value: string): IdentifierType {
  const allowed: IdentifierType[] = ["phone", "url", "bank_account", "social_handle"];
  return allowed.includes(value as IdentifierType) ? (value as IdentifierType) : "unknown";
}

export function classifyIdentifier(identifier: string): IdentifierType {
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
function normalizePhone(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("60")) return `+${digits}`;
  if (digits.startsWith("0")) return `+60${digits.slice(1)}`;
  return `+${digits}`;
}

function normalizeUrl(value: string): string {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`;
  try {
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value.trim().toLowerCase().replace(/^www\./, "");
  }
}

export function normalizeIdentifier(identifier: string, type: IdentifierType): string {
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

const NORMALIZED_ENTRIES: { key: string; type: IdentifierType; entry: RawEntry }[] = (
  referenceData.entries as RawEntry[]
).map((entry) => {
  const type = asIdentifierType(entry.type);
  return { key: normalizeIdentifier(entry.identifier, type), type, entry };
});

/**
 * check_reference_list - match a phone number, domain, bank account or social
 * handle against the bundled demo reference list.
 *
 * The reference list is a hand-written placeholder JSON. A match is a demo
 * signal only; a non-match says nothing about legitimacy.
 */
export function checkReferenceList(identifier: string): ReferenceMatch {
  const type = classifyIdentifier(identifier);
  const normalized = normalizeIdentifier(identifier, type);

  const hit = NORMALIZED_ENTRIES.find(
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
