import type { CategoryCoverage, ScamCategory } from "./types";

export interface Signal {
  /** Short human-readable name shown in the verdict, e.g. "TnG / eWallet brand mention". */
  name: string;
  pattern: RegExp;
  weight: number;
}

export interface CategoryDefinition {
  category: ScamCategory;
  label: string;
  /**
   * "full" categories were tuned against the TAR UMT Scam Ready Movers survey
   * responses (18-20 Aug 2026) and are demo-ready. "partial" categories are
   * detected but deliberately capped at medium confidence.
   */
  coverage: CategoryCoverage;
  signals: Signal[];
  stop: string[];
  userActions: string[];
}

/**
 * Signals are matched against the lower-cased message text. Malay and English
 * phrasing are both covered because forwarded messages routinely mix the two.
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    category: "tng_ewallet_phishing",
    label: "Touch 'n Go / eWallet phishing",
    coverage: "full",
    signals: [
      { name: "eWallet brand mention", pattern: /touch\s*'?n\s*go|tng\s*ewallet|\btng\b|ewallet|e-wallet|grabpay|boost\s*wallet|setel/, weight: 3 },
      { name: "Reload / balance bait", pattern: /reload|top\s*-?\s*up|tambah\s*nilai|baki|balance|cashback|rebate|refund|tuntut|claim/, weight: 2 },
      { name: "Account suspension threat", pattern: /suspend|digantung|dibekukan|frozen|deactivat|disekat|blocked|akan\s*ditutup|will\s*be\s*closed/, weight: 3 },
      { name: "Credential / PIN / OTP request", pattern: /\botp\b|tac\b|kata\s*sandi|password|pin\s*wallet|login|log\s*masuk|verify\s*your\s*account|sahkan\s*akaun/, weight: 4 },
      { name: "Urgency window", pattern: /within\s*\d+\s*(hour|hr|minute|min|jam|minit)|dalam\s*\d+\s*(jam|minit)|segera|immediately|hari\s*ini|today\s*only|last\s*chance/, weight: 2 },
      { name: "Link to click", pattern: /https?:\/\/|www\.|\bbit\.ly|\btinyurl|\bt\.co\/|\.xyz|\.top|\.click/, weight: 2 },
    ],
    stop: [
      "Do not click the link or open it in any browser.",
      "Do not enter your eWallet PIN, password, OTP or TAC anywhere you reached from this message.",
      "Do not reload, transfer or 'verify' any amount to unlock a balance or refund.",
    ],
    userActions: [
      "Open the official Touch 'n Go eWallet app directly and check your balance and notifications there.",
      "Compare the link's domain against the brand's official domain, letter by letter.",
      "If you already entered your PIN or OTP, change it in the app now and contact the eWallet's official support line.",
    ],
  },
  {
    category: "whatsapp_malicious_link",
    label: "WhatsApp malicious link / APK",
    coverage: "full",
    signals: [
      { name: "Messaging-app context", pattern: /whatsapp|wasap|\bwa\b|telegram|group\s*chat|kumpulan|broadcast|forwarded\s*many\s*times/, weight: 2 },
      { name: "Shortened or throwaway domain", pattern: /bit\.ly|tinyurl|cutt\.ly|\bt\.me\b|rebrand\.ly|is\.gd|shorturl|\.xyz|\.top|\.click|\.icu|\.tk|\.buzz/, weight: 4 },
      { name: "APK / app install request", pattern: /\.apk\b|install\s*(this\s*)?app|pasang\s*aplikasi|download\s*app|enable\s*unknown\s*sources|sideload/, weight: 5 },
      { name: "Free gift / giveaway bait", pattern: /free\s*(gift|voucher|hamper|data|iphone)|hadiah|percuma|giveaway|lucky\s*draw|cabutan|you\s*(have\s*)?won|anda\s*menang/, weight: 3 },
      { name: "Forward / share pressure", pattern: /forward\s*(this|to)|share\s*to\s*\d+|kongsi\s*(kepada|ke)\s*\d+|hantar\s*kepada\s*\d+|invite\s*\d+\s*friends/, weight: 2 },
      { name: "Link to click", pattern: /https?:\/\/|www\./, weight: 2 },
    ],
    stop: [
      "Do not tap the link and do not install any APK or app it offers.",
      "Do not forward the message onward - forwarding is what the sender wants.",
      "Do not grant SMS, contacts or accessibility permissions to anything installed from this link.",
    ],
    userActions: [
      "Expand the shortened link with a link-preview service instead of opening it.",
      "If an APK was already installed, put the phone in airplane mode, uninstall the app, and check for unknown accessibility services.",
      "Report and block the sender inside WhatsApp so the number is flagged.",
    ],
  },
  {
    category: "job_deposit_scam",
    label: "Job offer with upfront deposit",
    coverage: "full",
    signals: [
      { name: "Job / recruitment framing", pattern: /part[\s-]*time|full[\s-]*time|job\s*(offer|vacancy|opportunity)|kerja|jawatan|gaji|salary|hiring|recruit|interview/, weight: 3 },
      { name: "Unrealistic pay promise", pattern: /rm\s*\d{3,}\s*(per|se)?\s*(day|hari|week|minggu)|easy\s*money|daily\s*income|pendapatan\s*harian|earn\s*rm\s*\d+|no\s*experience\s*(needed|required)/, weight: 3 },
      { name: "Upfront payment / deposit request", pattern: /deposit|bayaran\s*(pendahuluan|awal)|registration\s*fee|processing\s*fee|yuran|training\s*fee|refundable|pay\s*rm\s*\d+\s*(first|dulu)/, weight: 5 },
      { name: "Bank / transfer instruction", pattern: /bank\s*(in|transfer)|maybank|cimb|public\s*bank|rhb|bank\s*islam|ambank|duitnow|account\s*(no|number)|no\s*akaun/, weight: 3 },
      { name: "Task-based / commission scheme", pattern: /simple\s*task|like\s*and\s*(follow|subscribe)|complete\s*task|misi|komisen|commission|top\s*up\s*to\s*unlock|mission\s*\d/, weight: 3 },
      { name: "Unofficial contact channel", pattern: /whatsapp\s*(me|us|admin)|contact\s*admin|hr\s*admin|click\s*link\s*to\s*apply|\bt\.me\b|telegram/, weight: 2 },
    ],
    stop: [
      "Do not pay any deposit, registration, training or 'refundable' fee - legitimate employers never charge to hire you.",
      "Do not send your IC, bank account details or a selfie holding your IC.",
      "Do not top up a wallet or platform to 'unlock' higher-paying tasks.",
    ],
    userActions: [
      "Search the company name plus 'scam' and check it exists on the SSM register.",
      "Verify the recruiter through the company's official website or main line, not the number that messaged you.",
      "Ask for the offer in writing on company letterhead before sharing any personal data.",
    ],
  },
  {
    category: "social_media_impersonation",
    label: "Social media impersonation",
    coverage: "partial",
    signals: [
      { name: "Social platform context", pattern: /facebook|\bfb\b|instagram|\big\b|tiktok|messenger|x\.com|twitter|profile|akaun\s*palsu|fake\s*account/, weight: 3 },
      { name: "Known-person impersonation", pattern: /it'?s\s*me|this\s*is\s*(my\s*)?new\s*(number|account)|nombor\s*baru|akaun\s*baru|your\s*(friend|cousin|boss)|kawan|bos\s*saya/, weight: 3 },
      { name: "Emergency money request", pattern: /pinjam|lend\s*me|need\s*money|urgent(ly)?\s*need|help\s*me\s*pay|tolong\s*bank\s*in|emergency/, weight: 4 },
      { name: "Bank / transfer instruction", pattern: /bank\s*in|duitnow|transfer|tng\s*number|account\s*(no|number)|no\s*akaun/, weight: 2 },
    ],
    stop: [
      "Do not transfer money before speaking to the real person on a number you already have.",
      "Do not continue the conversation only in chat - scammers avoid voice and video calls.",
    ],
    userActions: [
      "Call the person on their existing saved number, or video call them, to confirm.",
      "Ask a question only the real person could answer.",
      "Report the impersonating profile to the platform.",
    ],
  },
  {
    category: "authority_fraud_robocall",
    label: "Authority / enforcement fraud call",
    coverage: "partial",
    signals: [
      { name: "Authority name-drop", pattern: /pdrm|police|polis|bank\s*negara|\bbnm\b|lhdn|inland\s*revenue|jpj|kastam|customs|court|mahkamah|immigration|imigresen|macc|sprm|pos\s*malaysia|courier/, weight: 4 },
      { name: "Automated call framing", pattern: /press\s*[1-9]|tekan\s*[1-9]|automated\s*(call|message)|recorded\s*message|panggilan\s*automatik|robocall|this\s*call\s*is\s*regarding/, weight: 3 },
      { name: "Legal threat", pattern: /warrant|waran|arrest|tangkap|summons|saman|court\s*case|kes\s*mahkamah|frozen\s*account|akaun\s*dibekukan|money\s*laundering|pengubahan\s*wang/, weight: 4 },
      { name: "Payment or secrecy demand", pattern: /pay\s*(the\s*)?(fine|penalty|compound)|bayar\s*denda|transfer\s*to\s*(a\s*)?safe\s*account|akaun\s*selamat|do\s*not\s*tell|jangan\s*beritahu|settle\s*now/, weight: 4 },
    ],
    stop: [
      "Do not press any keypad option and do not stay on the line.",
      "Do not transfer money to a 'safe account' - no Malaysian authority ever asks for this.",
      "Do not share your IC, banking details or OTP with the caller.",
    ],
    userActions: [
      "Hang up and call the agency back on the number published on its official website.",
      "Check the caller's claim with the NSRC hotline 997 before acting.",
    ],
  },
  {
    category: "education_scholarship_scam",
    label: "Education / scholarship scam",
    coverage: "partial",
    signals: [
      { name: "Scholarship / study framing", pattern: /scholarship|biasiswa|ptptn|bursary|tuition\s*fee|university\s*offer|tawaran\s*(kemasukan|biasiswa)|student\s*loan|study\s*grant|geran/, weight: 4 },
      { name: "Guaranteed approval claim", pattern: /guaranteed|dijamin|100%\s*(approved|lulus)|no\s*(cgpa|result)\s*needed|tanpa\s*syarat|instant\s*approval|pre[\s-]*approved/, weight: 3 },
      { name: "Processing fee request", pattern: /processing\s*fee|yuran\s*proses|admin\s*fee|deposit|bayaran\s*pendaftaran|pay\s*rm\s*\d+\s*to\s*(secure|confirm)/, weight: 4 },
      { name: "Unofficial application channel", pattern: /google\s*form|forms\.gle|whatsapp\s*(admin|us)|telegram|dm\s*(us|me)|click\s*link\s*to\s*register/, weight: 2 },
    ],
    stop: [
      "Do not pay any processing or administration fee to secure a scholarship.",
      "Do not submit your IC, results slip or bank details through a form linked from the message.",
    ],
    userActions: [
      "Apply only through the provider's official portal, reached by typing the address yourself.",
      "Confirm the offer with your institution's student affairs or scholarship office.",
    ],
  },
];

export const CATEGORY_BY_ID: Record<ScamCategory, CategoryDefinition> = CATEGORY_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.category] = def;
    return acc;
  },
  {} as Record<ScamCategory, CategoryDefinition>
);
