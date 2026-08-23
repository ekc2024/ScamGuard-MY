export const SCAM_CATEGORIES = [
  "tng_ewallet_phishing",
  "social_media_impersonation",
  "whatsapp_malicious_link",
  "authority_fraud_robocall",
  "job_deposit_scam",
  "education_scholarship_scam",
] as const;

export type ScamCategory = (typeof SCAM_CATEGORIES)[number];

/** Coverage of a category in this prototype. Only "full" categories are demo-ready. */
export type CategoryCoverage = "full" | "partial";

export type Verdict = "STOP" | "CHECK" | "REPORT";

export type UrlRisk = "high" | "medium" | "low" | "unknown";

export interface UrlCheck {
  url: string;
  domain: string | null;
  risk: UrlRisk;
  reasons: string[];
  /** True when the domain imitates a known Malaysian brand without being the real domain. */
  lookalikeOf: string | null;
}

export type IdentifierType = "phone" | "url" | "bank_account" | "social_handle" | "unknown";

export interface ReferenceMatch {
  identifier: string;
  normalized: string;
  type: IdentifierType;
  matched: boolean;
  /** Category the reference entry was reported under, when matched. */
  reportedAs: ScamCategory | null;
  reportCount: number;
  note: string;
  source: "demo_reference_list";
}

export interface CategoryScore {
  category: ScamCategory;
  label: string;
  coverage: CategoryCoverage;
  score: number;
  confidence: "high" | "medium" | "low";
  matchedSignals: string[];
}

export interface TriageResult {
  verdict: Verdict;
  headline: string;
  category: ScamCategory | null;
  categoryLabel: string | null;
  coverage: CategoryCoverage | null;
  confidence: "high" | "medium" | "low";
  /** What the recipient must not do, in plain language. */
  stop: string[];
  /** Verification steps already run plus what the user should verify themselves. */
  check: {
    urls: UrlCheck[];
    references: ReferenceMatch[];
    userActions: string[];
  };
  /** Where and how to report. */
  report: {
    channel: string;
    detail: string;
  }[];
  runnerUp: CategoryScore | null;
  allScores: CategoryScore[];
  extracted: {
    urls: string[];
    phones: string[];
    bankAccounts: string[];
    socialHandles: string[];
  };
  disclaimers: string[];
}
