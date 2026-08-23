import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setReferenceData } from "./check-reference-list.mjs";

/** Node loader: read the demo placeholder JSON from disk (used by the CLI and tests). */
export function loadReferenceData(path = fileURLToPath(new URL("./reference-data.json", import.meta.url))) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  setReferenceData(data);
  return data;
}
