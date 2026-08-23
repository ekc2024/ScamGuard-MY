import assert from "node:assert/strict";
import { checkReferenceList } from "../lib/check-reference-list.mjs";
import { checkUrl } from "../lib/check-url.mjs";
import { DISCLAIMERS } from "../lib/disclaimers.mjs";
import { loadReferenceData } from "../lib/load-reference-data.node.mjs";
import { triageMessage } from "../lib/triage.mjs";

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

if (failures > 0) {
  console.error(`\n${failures} failing check(s)`);
  process.exit(1);
}

console.log("\nall checks passed");
