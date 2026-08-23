# scam-triage-hackathon

Self-contained scam-triage prototype for the Devin x Claw Collective x Qwen
hackathon (23 Aug 2026). Paste a forwarded message, get a STOP-CHECK-REPORT
verdict.

Nothing outside this folder is touched, and there are no dependencies: plain
Node ESM plus a static page. The same modules run in the browser and in Node, so
the web front-end and the Hermes skill share one implementation.

```
AI-generated assessment - not an official determination
Checked against demo reference data, not a live database
```

Both lines are mandatory in every output surface. They live in
`lib/disclaimers.mjs`.

## Run it

```bash
cd scam-triage-hackathon
npm start            # http://localhost:3100
npm test             # smoke checks over all three demo-ready categories
node cli.mjs "Akaun TNG anda akan digantung, sahkan OTP di https://tngo-reload-verify.xyz/login"
```

The page runs entirely client-side; no message text ever leaves the browser.

## Deploy the live URL

The judging requirement is a working live URL. Because this is a static folder,
deploy it as its own Vercel project rather than through the root Next.js app:

1. New Vercel project on this repo, branch `hackathon-scam-triage`.
2. **Root Directory** = `scam-triage-hackathon`.
3. **Framework Preset** = Other, no build command, output directory = `.`.

Any static host works the same way - the only requirement is HTTP, since
`lib/reference-data.json` is fetched at page load (opening `index.html` from the
filesystem will not work).

## What it does

1. Extracts URLs, phone numbers, bank accounts and social handles from the text.
2. Scores six scam categories from the TAR UMT Scam Ready Movers survey against
   Malay and English signal patterns.
3. Runs two verification functions - `check_url` (link reputation) and
   `check_reference_list` (demo placeholder lookup).
4. Returns a verdict plus all three sections: what to **stop**, what was
   **checked** and what to verify yourself, and where to **report** (NSRC 997,
   Semak Mule, MCMC, PDRM).

Verdict selection:

```
reference-list match                 -> REPORT
high-risk link OR high-confidence    -> STOP
otherwise                            -> CHECK
```

Three categories are tuned and demo-ready (`tng_ewallet_phishing`,
`whatsapp_malicious_link`, `job_deposit_scam`). The other three are marked
`coverage: "partial"`, structurally capped at medium confidence, and labelled as
such in the UI.

## Demo reference data is fake

`lib/reference-data.json` is a hand-written placeholder with about a dozen
illustrative entries. It is not a database, not official, and a non-match is
never a clearance. Keep it labelled as demo data everywhere it surfaces.

## Hermes skill

`SKILL.md` mirrors the skill deployed at
`~/.hermes/skills/scam-triage/SKILL.md` on the production VPS. Update both
together; the VPS copy has to be synced by hand.
