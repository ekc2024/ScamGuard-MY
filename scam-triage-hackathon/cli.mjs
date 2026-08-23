#!/usr/bin/env node
import { checkReferenceList } from "./lib/check-reference-list.mjs";
import { checkUrl } from "./lib/check-url.mjs";
import { loadReferenceData } from "./lib/load-reference-data.node.mjs";
import { triageMessage } from "./lib/triage.mjs";

const USAGE = `Usage:
  node cli.mjs "<message text>"          full STOP-CHECK-REPORT triage
  node cli.mjs --url "<url>"             link reputation only
  node cli.mjs --identifier "<value>"    demo reference-list lookup only

Add --json for machine-readable output (what the Hermes skill consumes).`;

function render(result) {
  const lines = [`VERDICT: ${result.verdict}`, result.headline, ""];

  lines.push("STOP");
  lines.push(...result.stop.map((item) => `  - ${item}`));

  lines.push("", "CHECK");
  for (const check of result.check.urls) {
    lines.push(`  ${check.domain ?? check.url} [${check.risk} risk]`);
    lines.push(...check.reasons.map((reason) => `    - ${reason}`));
  }
  for (const reference of result.check.references) {
    lines.push(`  ${reference.identifier} [${reference.type}] ${reference.matched ? "DEMO MATCH" : "no demo match"}`);
    lines.push(`    - ${reference.note}`);
  }
  lines.push(...result.check.userActions.map((action) => `  -> ${action}`));

  lines.push("", "REPORT");
  lines.push(...result.report.map((channel) => `  ${channel.channel} - ${channel.detail}`));

  lines.push("", ...result.disclaimers);
  return lines.join("\n");
}

function main(argv) {
  const json = argv.includes("--json");
  const args = argv.filter((arg) => arg !== "--json");

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return;
  }

  loadReferenceData();

  const urlIndex = args.indexOf("--url");
  if (urlIndex !== -1) {
    console.log(JSON.stringify(checkUrl(args[urlIndex + 1] ?? ""), null, 2));
    return;
  }

  const identifierIndex = args.indexOf("--identifier");
  if (identifierIndex !== -1) {
    console.log(JSON.stringify(checkReferenceList(args[identifierIndex + 1] ?? ""), null, 2));
    return;
  }

  const result = triageMessage(args.join(" "));
  console.log(json ? JSON.stringify(result, null, 2) : render(result));
}

main(process.argv.slice(2));
