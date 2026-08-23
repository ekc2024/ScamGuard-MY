/**
 * Both lines are mandatory in every surface that shows a triage verdict
 * (web UI, API response, Hermes chat reply). Do not reword or drop either one.
 */
export const DISCLAIMERS = [
  "AI-generated assessment - not an official determination",
  "Checked against demo reference data, not a live database",
] as const;
