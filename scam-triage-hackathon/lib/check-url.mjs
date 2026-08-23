import { checkReferenceList } from "./check-reference-list.mjs";

/** Brands most often imitated in Malaysian scam messages, with their real domains. */
const PROTECTED_BRANDS = [
  { brand: "Touch 'n Go eWallet", tokens: ["tng", "tngo", "touchngo", "touch-n-go", "ewallet"], officialDomains: ["touchngo.com.my", "tngdigital.com.my"] },
  { brand: "Maybank", tokens: ["maybank", "maybank2u", "m2u"], officialDomains: ["maybank2u.com.my", "maybank.com"] },
  { brand: "CIMB", tokens: ["cimb", "cimbclicks"], officialDomains: ["cimbclicks.com.my", "cimb.com.my"] },
  { brand: "Public Bank", tokens: ["publicbank", "pbebank"], officialDomains: ["pbebank.com"] },
  { brand: "DuitNow", tokens: ["duitnow"], officialDomains: ["duitnow.my", "paynet.my"] },
  { brand: "LHDN", tokens: ["lhdn", "hasil"], officialDomains: ["hasil.gov.my"] },
  { brand: "PTPTN", tokens: ["ptptn"], officialDomains: ["ptptn.gov.my"] },
  { brand: "Pos Malaysia", tokens: ["posmalaysia", "poslaju"], officialDomains: ["pos.com.my"] },
  { brand: "WhatsApp", tokens: ["whatsapp", "wasap"], officialDomains: ["whatsapp.com", "wa.me"] },
];

const URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "cutt.ly", "t.co", "rebrand.ly", "is.gd", "shorturl.at",
  "rb.gy", "s.id", "t.me", "goo.gl", "ow.ly", "buff.ly",
];

/** TLDs disproportionately used by throwaway scam domains. */
const HIGH_RISK_TLDS = [".xyz", ".top", ".click", ".icu", ".tk", ".buzz", ".cfd", ".rest", ".sbs", ".gq", ".ml", ".cf", ".work", ".live"];

const IP_HOST = /^\d{1,3}(\.\d{1,3}){3}$/;

function parseDomain(raw) {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isOfficialDomain(domain, officialDomains) {
  return officialDomains.some((official) => domain === official || domain.endsWith(`.${official}`));
}

/**
 * check_url - domain and link reputation for a single URL or bare domain.
 *
 * Heuristic only: there is no live threat-intelligence feed behind this. It
 * combines the demo reference list with structural signals (brand lookalikes,
 * shorteners, throwaway TLDs, raw IP hosts, credential-flavoured paths).
 */
export function checkUrl(url) {
  const trimmed = url.trim();
  const domain = parseDomain(trimmed);
  const reasons = [];

  if (!domain) {
    return { url: trimmed, domain: null, risk: "unknown", reasons: ["Could not parse a domain from this link."], lookalikeOf: null };
  }

  let score = 0;
  let lookalikeOf = null;

  const reference = checkReferenceList(domain);
  if (reference.matched) {
    score += 6;
    reasons.push(`Domain appears in the demo reference list (${reference.reportCount} demo reports).`);
  }

  const brandHit = PROTECTED_BRANDS.find((brand) => brand.tokens.some((token) => domain.includes(token)));
  if (brandHit) {
    if (isOfficialDomain(domain, brandHit.officialDomains)) {
      score -= 4;
      reasons.push(`Domain matches the official ${brandHit.brand} domain.`);
    } else {
      score += 5;
      lookalikeOf = brandHit.brand;
      reasons.push(`Imitates ${brandHit.brand} but is not an official ${brandHit.brand} domain (official: ${brandHit.officialDomains.join(", ")}).`);
    }
  }

  if (URL_SHORTENERS.includes(domain)) {
    score += 3;
    reasons.push("Shortened link - the real destination is hidden.");
  }

  const riskyTld = HIGH_RISK_TLDS.find((tld) => domain.endsWith(tld));
  if (riskyTld) {
    score += 3;
    reasons.push(`Uses ${riskyTld}, a top-level domain commonly used for throwaway scam sites.`);
  }

  if (IP_HOST.test(domain)) {
    score += 4;
    reasons.push("Link points at a raw IP address instead of a named domain.");
  }

  if (domain.split(".").length > 3) {
    score += 1;
    reasons.push("Unusually deep subdomain chain, often used to bury a fake brand name.");
  }

  if (/-{2,}|\d{4,}/.test(domain)) {
    score += 1;
    reasons.push("Domain contains padding characters or long digit runs typical of generated domains.");
  }

  if (/\.(apk|exe|zip)(\?|$)/i.test(trimmed)) {
    score += 5;
    reasons.push("Link downloads an installable file - never install apps from a forwarded link.");
  }

  if (/(login|verify|otp|secure|reload|update|claim|rebate|wallet)/i.test(trimmed) && !isOfficialDomain(domain, brandHit?.officialDomains ?? [])) {
    score += 2;
    reasons.push("Link path is built around login, verification or reload wording.");
  }

  if (domain.endsWith(".gov.my")) {
    score -= 4;
    reasons.push("Domain is on the .gov.my namespace.");
  }

  let risk;
  if (score >= 6) risk = "high";
  else if (score >= 3) risk = "medium";
  else if (reasons.length === 0) risk = "unknown";
  else risk = "low";

  if (reasons.length === 0) {
    reasons.push("No known-bad signal found. Absence of a signal is not proof the link is safe.");
  }

  return { url: trimmed, domain, risk, reasons, lookalikeOf };
}

export { checkUrl as check_url };
