import { setReferenceData } from "./check-reference-list.mjs";

/** Browser loader: fetch the demo placeholder JSON that sits beside this module. */
export async function loadReferenceData(url = new URL("./reference-data.json", import.meta.url)) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load demo reference data (HTTP ${response.status}).`);
  }
  const data = await response.json();
  setReferenceData(data);
  return data;
}
