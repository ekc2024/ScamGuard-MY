import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { checkReferenceList } from "../lib/check-reference-list.mjs";
import { checkUrl } from "../lib/check-url.mjs";
import { DISCLAIMERS } from "../lib/disclaimers.mjs";
import { loadReferenceData } from "../lib/load-reference-data.node.mjs";
import { triageMessage } from "../lib/triage.mjs";
import { enrichVerdict, isEnrichableCategory } from "../lib/qwen-enrich.mjs";
import { handleEnrich } from "../lib/enrich-handler.mjs";

loadReferenceData();

const cases = [
  {
    name: "TnG phishing with reference-listed domain -> REPORT",
    message:
      "AMARAN: Akaun TNG eWallet anda akan digantung dalam 12 jam. Sahkan akaun dan OTP anda di https://tngo-reload-verify.xyz/login segera.",
    verdict: "REPORT",
    category: "tng_ewallet_phishing",
  },
  {
    name: "TnG lookalike domain not on the list -> STOP",
    message: "Akaun eWallet anda akan disekat. Sahkan OTP dan log masuk di https://tng-verify-akaun2026.top/login dalam 6 jam.",
    verdict: "STOP",
    category: "tng_ewallet_phishing",
  },
  {
    name: "WhatsApp APK giveaway -> REPORT",
    message:
      "Congratulations! You won a free hamper. Download the app https://wasap-hadiah2026.click/gift.apk and forward this to 5 friends to claim.",
    verdict: "REPORT",
    category: "whatsapp_malicious_link",
  },
  {
    name: "Job deposit scam with mule account -> REPORT",
    message:
      "Hiring part time staff. Earn RM300 per day, no experience needed. Pay RM250 refundable deposit to Maybank account 514012345678 then WhatsApp admin 012-345 6789.",
    verdict: "REPORT",
    category: "job_deposit_scam",
  },
  {
    name: "Partial-coverage authority fraud stays at CHECK",
    message:
      "PDRM automated message: a warrant has been issued. Press 1 now to speak to an officer and settle the compound, or your account will be frozen.",
    verdict: "CHECK",
    category: "authority_fraud_robocall",
  },
  {
    name: "Benign message -> CHECK with no category",
    message: "Hi mum, can we have dinner at 7pm tonight?",
    verdict: "CHECK",
    category: null,
  },
];

let failures = 0;

for (const testCase of cases) {
  const result = triageMessage(testCase.message);
  try {
    assert.equal(result.verdict, testCase.verdict, `verdict was ${result.verdict}`);
    assert.equal(result.category, testCase.category, `category was ${result.category}`);
    assert.deepEqual(result.disclaimers, DISCLAIMERS, "both disclaimer lines must be present");
    assert.ok(result.stop.length > 0 && result.report.length > 0, "stop and report sections must be populated");
    console.log(`ok   ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}: ${error.message}`);
  }
}

// Verification functions on their own.
const official = checkUrl("https://www.touchngo.com.my/reload");
const lookalike = checkUrl("http://tngo-reload-verify.xyz/login");
const phone = checkReferenceList("012-999 8877");
const unknownPhone = checkReferenceList("011-1111 2222");

try {
  assert.equal(official.risk, "low", `official domain scored ${official.risk}`);
  assert.equal(official.lookalikeOf, null);
  assert.equal(lookalike.risk, "high", `lookalike domain scored ${lookalike.risk}`);
  assert.equal(lookalike.lookalikeOf, "Touch 'n Go eWallet");
  assert.equal(phone.matched, true, "0129998877 should normalize to +60129998877 and match");
  assert.equal(phone.normalized, "+60129998877");
  assert.equal(unknownPhone.matched, false);
  console.log("ok   check_url and check_reference_list");
} catch (error) {
  failures += 1;
  console.error(`FAIL check_url and check_reference_list: ${error.message}`);
}

// Optional Qwen enrichment layer: never required, never verdict-changing.
const phishing = triageMessage(
  "AMARAN: Akaun TNG eWallet anda akan digantung. Sahkan OTP anda di https://tngo-reload-verify.xyz/login."
);
const partial = triageMessage(
  "PDRM automated message: a warrant has been issued. Press 1 now to settle the compound."
);

const stubFetch = (payload, ok = true) => async () => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => payload,
});

try {
  assert.equal(isEnrichableCategory("tng_ewallet_phishing"), true);
  assert.equal(isEnrichableCategory("authority_fraud_robocall"), false);

  const noKey = await enrichVerdict(phishing, "text", { apiKey: undefined });
  assert.equal(noKey.available, false, "missing key must disable enrichment");

  const notCovered = await enrichVerdict(partial, "text", { apiKey: "test-key" });
  assert.equal(notCovered.available, false, "partial categories must not be enriched");

  const failed = await enrichVerdict(phishing, "text", { apiKey: "test-key", fetchImpl: stubFetch({}, false) });
  assert.equal(failed.available, false, "HTTP failure must degrade silently");
  assert.equal(failed.explanation, null);

  const enriched = await enrichVerdict(phishing, "text", {
    apiKey: "test-key",
    fetchImpl: stubFetch({ choices: [{ message: { content: "  This message pretends\n to be TnG.  " } }] }),
  });
  assert.equal(enriched.available, true);
  assert.equal(enriched.explanation, "This message pretends to be TnG.");

  const handled = await handleEnrich(
    JSON.stringify({
      message: "AMARAN: Akaun TNG eWallet anda akan digantung. Sahkan OTP anda di https://tngo-reload-verify.xyz/login.",
    }),
    { apiKey: "test-key", fetchImpl: stubFetch({ choices: [{ message: { content: "Explanation." } }] }) }
  );
  assert.equal(handled.status, 200);
  assert.equal(handled.body.verdict, phishing.verdict, "enrichment must not change the verdict");
  assert.deepEqual(handled.body.disclaimers, DISCLAIMERS);
  assert.equal(handled.body.enrichment.explanation, "Explanation.");

  const rejected = await handleEnrich("{}");
  assert.equal(rejected.status, 400);

  // app.js imports this module in the browser, where `process` does not exist.
  execFileSync(process.execPath, [
    "--input-type=module",
    "-e",
    `delete globalThis.process; const m = await import(${JSON.stringify(
      new URL("../lib/qwen-enrich.mjs", import.meta.url).href
    )}); if (!m.isEnrichableCategory("job_deposit_scam")) throw new Error("unexpected");`,
  ]);

  console.log("ok   optional Qwen enrichment layer");
} catch (error) {
  failures += 1;
  console.error(`FAIL optional Qwen enrichment layer: ${error.message}`);
}

if (failures > 0) {
  console.error(`\n${failures} failing check(s)`);
  process.exit(1);
}

console.log("\nall checks passed");
