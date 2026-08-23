export type ScamRiskBand = "Likely Scam" | "Suspicious" | "Probably Safe";

export interface ScamSignalDefinition {
  id: string;
  label: string;
  weight: number;
  patterns: RegExp[];
}

export interface ScamTriageResult {
  score: number;
  band: ScamRiskBand;
  matchedSignals: string[];
  recommendedAction: string;
  result: string;
}

export const SCAM_SIGNAL_DEFINITIONS: ScamSignalDefinition[] = [
  {
    id: "urgency-threat",
    label: "Urgency or threat language",
    weight: 15,
    patterns: [
      /\b(?:act now|immediately|urgent|last warning|within\s+24\s+hours?|avoid\s+(?:a\s+)?penalty|account\s+(?:is\s+)?(?:suspended|blocked|locked|deactivated))\b/i,
      /\b(?:segera|secepat mungkin|tindakan segera|amaran terakhir|dalam\s+24\s+jam|elak(?:kan)?\s+denda|akaun\s+(?:anda\s+)?(?:disekat|digantung|dikunci|dinyahaktifkan))\b/i,
    ],
  },
  {
    id: "payment-request",
    label: "Payment or money-transfer request",
    weight: 25,
    patterns: [
      /\b(?:bank\s+transfer|transfer\s+(?:money|funds)|make\s+a\s+payment|pay\s+now|send\s+money|wire\s+money|cash\s+deposit|gift\s+card)\b/i,
      /\b(?:pindahan|pemindahan|buat\s+bayaran|bayar\s+sekarang|hantar\s+duit|pindah\s+duit|duit\s+segera|deposit\s+tunai)\b/i,
    ],
  },
  {
    id: "mule-account-details",
    label: "Request for bank-account or mule-account details",
    weight: 20,
    patterns: [
      /\b(?:bank\s+account|account\s+(?:number|details)|receive\s+(?:money|funds)\s+on\s+behalf|mule\s+account|use\s+your\s+account)\b/i,
      /\b(?:nombor\s+akaun|akaun\s+bank|butiran\s+akaun|tumpang\s+akaun|terima\s+duit\s+bagi\s+pihak)\b/i,
    ],
  },
  {
    id: "credential-request",
    label: "Request for OTP, TAC, PIN, password, or identity details",
    weight: 30,
    patterns: [
      /\b(?:otp|one[-\s]?time\s+pass(?:code|word)|tac|pin|password|passcode|nric|i\.?c\.?\s*(?:number|no)?|identity\s+(?:card|number))\b/i,
      /\b(?:kod\s+otp|kata\s+laluan|nombor\s+pin|nombor\s+kad\s+pengenalan|no\.?\s*kp|nombor\s+ic|sahkan\s+identiti)\b/i,
    ],
  },
  {
    id: "impersonation",
    label: "Impersonation of a bank, government body, courier, or telco",
    weight: 10,
    patterns: [
      /\b(?:maybank|cimb|lhdn|pdrm|bnm|jpj|pos\s+laju|j\s*&\s*t|jnt|tnb|maxis|celcom|digi|u\s+mobile)\b/i,
      /\b(?:bank negara|hasil|polis|jabatan\s+pengangkutan|syarikat\s+kurier|courier|telecom(?:s)?|telco)\b/i,
    ],
  },
  {
    id: "suspicious-url",
    label: "Suspicious, shortened, or lookalike URL",
    weight: 25,
    patterns: [
      /\bhttps?:\/\/[^\s/]*(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|rb\.gy|shorturl\.at)[^\s]*/i,
      /\bhttps?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#][^\s]*)?/i,
      /\bhttps?:\/\/[^\s/]*xn--[^\s/]*/i,
      /\bhttps?:\/\/[^\s]*(?:maybank|cimb|lhdn|pdrm|bnm|jpj|poslaju|jnt|tnb)[^\s]*\.(?!my\b)[a-z]{2,}(?:[/?#][^\s]*)?/i,
    ],
  },
  {
    id: "link-verification-lure",
    label: "Link-based verification or claim lure",
    weight: 12,
    patterns: [
      /\b(?:click|tap|open)\s+(?:this\s+)?(?:link|here)\s+to\s+(?:verify|claim|update|activate|confirm)\b/i,
      /\b(?:klik|tekan|buka)\s+(?:pautan|link)\s+(?:ini\s+)?untuk\s+(?:sahkan|tuntut|kemas kini|aktifkan|confirm)\b/i,
      /\b(?:verify|claim|update|activate)\s+(?:your\s+)?(?:account|details|parcel|refund)\s+(?:here|via\s+the\s+link)\b/i,
      /\b(?:sahkan|pengesahan)\s+(?:akaun|maklumat|identiti)\b/i,
    ],
  },
  {
    id: "investment-job-lure",
    label: "Investment, loan, crypto, guaranteed-return, or easy-money lure",
    weight: 20,
    patterns: [
      /\b(?:investment|invest|crypto|cryptocurrency|guaranteed\s+returns?|guaranteed\s+profit|double\s+your\s+money|passive\s+income|easy\s+money|part[-\s]?time\s+job|work\s+from\s+home)\b/i,
      /\b(?:pelaburan|pinjaman|kripto|pulangan\s+terjamin|untung\s+terjamin|duit\s+mudah|kerja\s+sambilan|kerja\s+dari\s+rumah|gaji\s+lumayan)\b/i,
    ],
  },
  {
    id: "prize-refund-tax-lure",
    label: "Prize, refund, tax-rebate, or lottery claim",
    weight: 15,
    patterns: [
      /\b(?:congratulations|you(?:'ve)?\s+won|prize|reward|lottery|lucky\s+draw|refund|tax\s+rebate|cash\s+rebate)\b/i,
      /\b(?:tahniah|menang|hadiah|ganjaran|cabutan\s+bertuah|bayaran\s+balik|rebat\s+cukai|pulangan\s+cukai)\b/i,
    ],
  },
  {
    id: "private-channel-redirect",
    label: "Redirect to WhatsApp or Telegram and a private number",
    weight: 12,
    patterns: [
      /\b(?:whatsapp|telegram)\b[\s\S]{0,100}(?:\+?\d[\d\s().-]{6,}\d)\b/i,
      /(?:\+?\d[\d\s().-]{6,}\d)\b[\s\S]{0,100}\b(?:whatsapp|telegram)\b/i,
    ],
  },
  {
    id: "unusual-foreign-number",
    label: "Unusual or foreign phone-number format",
    weight: 8,
    patterns: [
      /\+(?!60)\d[\d\s().-]{6,}\d\b/i,
      /\b(?:call|text|hubungi|mesej)\s+(?:me\s+)?(?:at|di)?\s*0(?!1\d)\d[\d\s-]{6,}\b/i,
    ],
  },
];

function getRiskBand(score: number): ScamRiskBand {
  if (score >= 60) return "Likely Scam";
  if (score >= 30) return "Suspicious";
  return "Probably Safe";
}

function getRecommendedAction(band: ScamRiskBand): string {
  if (band === "Likely Scam") {
    return "Do not click links, reply, share credentials, or transfer money. Contact the organisation through an official channel.";
  }
  if (band === "Suspicious") {
    return "Pause and verify independently using the organisation's official website or phone number before taking action.";
  }
  return "No major scam signals were detected. Still avoid sharing sensitive information and verify unexpected requests.";
}

export function triageScamMessage(message: string): ScamTriageResult {
  const matchedDefinitions = SCAM_SIGNAL_DEFINITIONS.filter((signal) =>
    signal.patterns.some((pattern) => pattern.test(message)),
  );
  const score = Math.min(
    100,
    matchedDefinitions.reduce((total, signal) => total + signal.weight, 0),
  );
  const band = getRiskBand(score);
  const matchedSignals = matchedDefinitions.map((signal) => signal.label);
  const recommendedAction = getRecommendedAction(band);
  const signalText =
    matchedSignals.length > 0
      ? matchedSignals.map((signal) => `- ${signal}`).join("\n")
      : "- No configured scam signals detected";

  const result = [
    "Scam Triage (simulated demo)",
    "",
    `Risk score: ${score}/100`,
    `Assessment: ${band}`,
    "",
    "Matched signals:",
    signalText,
    "",
    `Recommended action: ${recommendedAction}`,
  ].join("\n");

  return { score, band, matchedSignals, recommendedAction, result };
}
