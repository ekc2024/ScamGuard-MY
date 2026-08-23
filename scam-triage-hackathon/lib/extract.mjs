const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>"'()]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|gov|edu|my|xyz|top|click|icu|tk|buzz|cfd|sbs|info|site|online|app|link|me|co|biz|io|shop|store|live|ly|gle)\b(?:\/[^\s<>"'()]*)?/gi;

/** Malaysian mobile and landline numbers, tolerant of spaces, dashes and brackets. */
const PHONE_PATTERN = /(?:\+?60|\b0)\s?1?\d[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g;

const BANK_ACCOUNT_PATTERN = /\b\d{10,17}\b/g;

const SOCIAL_HANDLE_PATTERN = /@[a-z0-9._]{3,30}\b/gi;

function unique(values) {
  return [...new Set(values)];
}

/** Pull the identifiers worth verifying out of a forwarded message. */
export function extractIdentifiers(text) {
  const urls = unique((text.match(URL_PATTERN) ?? []).map((url) => url.replace(/[.,;:!?)]+$/, "")));

  // Strip URLs first so digits inside a link are not read as phone numbers.
  let residual = text;
  for (const url of urls) {
    residual = residual.split(url).join(" ");
  }

  const phones = unique((residual.match(PHONE_PATTERN) ?? []).map((phone) => phone.trim()));

  let digitsOnly = residual;
  for (const phone of phones) {
    digitsOnly = digitsOnly.split(phone).join(" ");
  }

  const bankAccounts = unique(digitsOnly.match(BANK_ACCOUNT_PATTERN) ?? []);
  const socialHandles = unique((residual.match(SOCIAL_HANDLE_PATTERN) ?? []).map((handle) => handle.toLowerCase()));

  return { urls, phones, bankAccounts, socialHandles };
}
