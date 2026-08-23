---
name: scam-triage
description: Classify a forwarded Malaysian scam message into one of six survey-backed categories and return a STOP-CHECK-REPORT verdict. Use whenever a user forwards a suspicious SMS, WhatsApp, or social media message, or asks whether a link, phone number, or bank account is a scam.
---

# scam-triage

Version-controlled mirror of the Hermes (OpenClaw) skill deployed at
`~/.hermes/skills/scam-triage/SKILL.md` on the production VPS. Keep the two in
sync: the VPS copy is what runs in chat, this copy is what gets reviewed.

## Scope

Text input only. No OCR, no image or audio handling, no screenshot parsing. If a
user sends an image, ask them to paste the text.

## Categories

Six categories, taken from the TAR UMT Scam Ready Movers survey (18-20 Aug 2026):

| id | label | prototype coverage |
| --- | --- | --- |
| `tng_ewallet_phishing` | Touch 'n Go / eWallet phishing | full |
| `whatsapp_malicious_link` | WhatsApp malicious link / APK | full |
| `job_deposit_scam` | Job offer with upfront deposit | full |
| `social_media_impersonation` | Social media impersonation | partial |
| `authority_fraud_robocall` | Authority / enforcement fraud call | partial |
| `education_scholarship_scam` | Education / scholarship scam | partial |

`partial` categories are detected but capped at medium confidence. Three
categories working properly beats six working badly - do not widen coverage by
loosening signals.

## Procedure

1. Extract identifiers from the message: URLs, phone numbers, bank account
   numbers, social handles.
2. Score every category by matching its signals against the lower-cased text.
   Signals cover both Malay and English phrasing, because forwarded messages mix
   them.
3. Run the two verification functions:
   - `check_url(url)` - domain and link reputation. Heuristic: brand-lookalike
     domains, URL shorteners, throwaway TLDs, raw IP hosts, `.apk` downloads,
     credential-flavoured paths. Returns `high` / `medium` / `low` / `unknown`.
   - `check_reference_list(identifier)` - match a phone number, domain, bank
     account, or social handle against the bundled demo placeholder JSON. A
     match is a demo signal; a non-match is never a clearance.
4. Pick the verdict:
   - `REPORT` - an identifier matched the demo reference list. Stop engaging and
     report it.
   - `STOP` - a link scored high risk, or the top category matched at high
     confidence.
   - `CHECK` - anything weaker or ambiguous. Verify through an official channel
     before acting.
5. Answer in three sections, always in this order: **STOP** (what not to do),
   **CHECK** (verification results plus what the user should confirm themselves),
   **REPORT** (where to report: NSRC 997, Semak Mule, MCMC, PDRM).
6. Close with both mandatory disclaimer lines, verbatim.

## Mandatory disclaimers

Every response that carries a verdict must include both lines, unchanged:

```
AI-generated assessment - not an official determination
Checked against demo reference data, not a live database
```

## Reference data

`reference-data.json` is a hand-written placeholder. It is **not** a real
database, not an official record, and holds roughly a dozen illustrative
entries. Always label it as demo data in any UI or chat output. Never imply a
non-match means a message is safe.

## Implementation in this repo

| Concern | File |
| --- | --- |
| Category signals, stop advice, verify steps | `lib/scam-triage/categories.ts` |
| `check_url` | `lib/scam-triage/check-url.ts` |
| `check_reference_list` | `lib/scam-triage/check-reference-list.ts` |
| Demo placeholder reference data | `lib/scam-triage/reference-data.json` |
| Identifier extraction | `lib/scam-triage/extract.ts` |
| Verdict assembly | `lib/scam-triage/triage.ts` |
| Mandatory disclaimers | `lib/scam-triage/disclaimers.ts` |
| Web front-end (one page) | `app/triage/page.tsx`, `components/scam-triage-form.tsx` |
| HTTP endpoint | `app/api/triage/route.ts` |

The endpoint is rule-based and needs no API key, so the live judging URL keeps
working even when Notion or model credentials are absent.

```bash
# full triage
curl -sX POST "$BASE_URL/api/triage" -H 'content-type: application/json' \
  -d '{"message":"Akaun TNG anda akan digantung. Sahkan di https://tngo-reload-verify.xyz/login"}'

# single link reputation check
curl -sX POST "$BASE_URL/api/triage" -H 'content-type: application/json' \
  -d '{"url":"https://tngo-reload-verify.xyz/login"}'

# single reference-list lookup
curl -sX POST "$BASE_URL/api/triage" -H 'content-type: application/json' \
  -d '{"identifier":"012-345 6789"}'
```
