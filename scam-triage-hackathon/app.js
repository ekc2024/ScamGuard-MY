import { DISCLAIMERS } from "./lib/disclaimers.mjs";
import { loadReferenceData } from "./lib/load-reference-data.browser.mjs";
import { getReferenceMeta } from "./lib/check-reference-list.mjs";
import { triageMessage } from "./lib/triage.mjs";

const SAMPLES = [
  {
    label: "TnG eWallet phishing",
    text:
      "AMARAN: Akaun TNG eWallet anda akan digantung dalam 12 jam. Sahkan akaun dan OTP anda di https://tngo-reload-verify.xyz/login untuk elak akaun disekat.",
  },
  {
    label: "WhatsApp APK giveaway",
    text:
      "Congratulations! You have won a free hamper from our 2026 giveaway. Download the app here https://wasap-hadiah2026.click/gift.apk and forward this to 5 friends to claim.",
  },
  {
    label: "Part-time job deposit",
    text:
      "Hi, we are hiring part time staff. Easy task, earn RM300 per day, no experience needed. Pay RM250 refundable deposit first to Maybank account 514012345678, then WhatsApp admin at 012-345 6789.",
  },
];

const VERDICT_BLURBS = {
  STOP: "Strong scam indicators. Do not engage.",
  REPORT: "Matches a demo reference entry. Stop and report.",
  CHECK: "Unclear. Verify through an official channel first.",
};

const form = document.getElementById("triage-form");
const messageField = document.getElementById("message");
const submitButton = document.getElementById("submit");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const bootError = document.getElementById("boot-error");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function list(items, className) {
  const ul = element("ul", className);
  for (const item of items) {
    ul.append(element("li", null, item));
  }
  return ul;
}

function badge(text, className) {
  return element("span", className ? `badge ${className}` : "badge", text);
}

function renderDisclaimers(target, lines) {
  target.replaceChildren();
  for (const line of lines) {
    target.append(element("li", null, line));
  }
}

function renderVerdict(result) {
  const panel = element("div", `verdict ${result.verdict.toLowerCase()}`);
  const badges = element("div", "badges");
  badges.append(badge(result.verdict, `verdict-${result.verdict.toLowerCase()}`));
  if (result.categoryLabel) badges.append(badge(result.categoryLabel));
  badges.append(badge(`${result.confidence} confidence`));
  if (result.coverage === "partial") badges.append(badge("category only partially covered"));
  panel.append(badges);
  panel.append(element("p", "headline", result.headline));
  panel.append(element("p", "blurb", VERDICT_BLURBS[result.verdict]));
  return panel;
}

function step(number, title) {
  const section = element("section", "step");
  const heading = element("h2");
  heading.append(element("span", "num", number));
  heading.append(document.createTextNode(title));
  section.append(heading);
  return section;
}

function renderCheck(result) {
  const section = step("02", "Check");

  if (result.check.urls.length > 0) {
    section.append(element("h3", null, "Link reputation"));
    for (const check of result.check.urls) {
      const box = element("div", `finding ${check.risk}`);
      const badges = element("div", "badges");
      badges.append(element("span", "mono", check.domain ?? check.url));
      badges.append(badge(`${check.risk} risk`));
      if (check.lookalikeOf) badges.append(badge(`imitates ${check.lookalikeOf}`));
      box.append(badges);
      box.append(list(check.reasons));
      section.append(box);
    }
  }

  if (result.check.references.length > 0) {
    section.append(element("h3", null, "Demo reference list (placeholder data, not a live database)"));
    for (const reference of result.check.references) {
      const box = element("div", `finding ${reference.matched ? "matched" : ""}`);
      const badges = element("div", "badges");
      badges.append(element("span", "mono", reference.identifier));
      badges.append(badge(reference.type.replace("_", " ")));
      badges.append(badge(reference.matched ? `${reference.reportCount} demo reports` : "no demo match"));
      box.append(badges);
      box.append(element("p", null, reference.note));
      section.append(box);
    }
  }

  section.append(element("h3", null, "Verify yourself"));
  section.append(list(result.check.userActions));
  return section;
}

function renderResult(result) {
  const report = step("03", "Report");
  report.append(list(result.report.map((channel) => `${channel.channel} - ${channel.detail}`)));

  const stop = step("01", "Stop");
  stop.append(list(result.stop));

  const disclaimerBox = element("section", "step");
  disclaimerBox.append(list(result.disclaimers.length > 0 ? result.disclaimers : DISCLAIMERS, "disclaimers"));

  resultBox.replaceChildren(renderVerdict(result), stop, renderCheck(result), report, disclaimerBox);
  resultBox.hidden = false;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  resultBox.hidden = true;
}

function renderSamples() {
  const container = document.getElementById("sample-buttons");
  for (const sample of SAMPLES) {
    const button = element("button", "sample", sample.label);
    button.type = "button";
    button.addEventListener("click", () => {
      messageField.value = sample.text;
      errorBox.hidden = true;
      resultBox.hidden = true;
      messageField.focus();
    });
    container.append(button);
  }
}

async function main() {
  bootError.hidden = true;
  renderDisclaimers(document.getElementById("header-disclaimers"), DISCLAIMERS);
  renderSamples();

  try {
    await loadReferenceData();
  } catch (loadError) {
    showError(`${loadError.message} Serve this folder over HTTP (npm start) rather than opening the file directly.`);
    return;
  }
  submitButton.disabled = false;

  const meta = getReferenceMeta();
  document.getElementById("reference-meta").textContent =
    `Demo reference list v${meta.version} - ${meta.entryCount} placeholder entries. ${meta.disclaimer}`;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = messageField.value;
    if (message.trim().length === 0) {
      showError("Paste the message you want checked.");
      return;
    }
    errorBox.hidden = true;
    renderResult(triageMessage(message));
  });
}

main();
