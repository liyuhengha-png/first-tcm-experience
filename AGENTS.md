# AGENTS.md — First TCM Experience Codex Rules

## Mission and priorities
Build the **smallest real, secure** bilingual Simplified Chinese/English TCM booking MVP, with an optional private health journal and a **separate Solana Devnet escrow demo**. Priorities: (1) confidentiality and correct authorization, (2) functional booking, (3) real tested Devnet transaction, (4) polish. Follow `First_TCM_Experience_Bilingual_Secure_Codex_PRD.md`.

## Operating protocol
1. Before editing, inspect repository, current branch, package manager, toolchain, environment and existing tests. Never overwrite user work.
2. Maintain `TASKS.md` and `SECURITY_CHECKLIST.md`; work **one milestone at a time**. M0 only initially; stop and ask approval before M1–M4.
3. Make minimal, reviewable changes. Avoid unnecessary frameworks, abstractions and dependencies. Explain architectural tradeoffs briefly.
4. Run applicable lint, typecheck, build, tests and dependency/security checks. Fix failures you caused. Report exact commands, results, unverified items and blockers.
5. Never say a security control exists unless implemented and tested. Never claim a transaction succeeded without a real confirmed signature.
6. Do not commit, push, deploy, install system-wide tools, create paid cloud resources, or make irreversible external changes without explicit approval when not already authorized by the user/environment.

## Health data: hard rules
- Use **synthetic demo patients and records** throughout development. No real patient information in fixtures, prompts, test logs, screenshots, analytics, blockchain or sample emails.
- Keep booking contact data separate from journal data. Minimize collection; no symptoms in booking form.
- Journal entries are **self-reported personal notes**, not official clinical records or AI diagnosis.
- No real journal data collection until explicit consent, documented lawful basis, reviewed privacy requirements, verified hosting/data transfer arrangements, encryption/KMS, authentication, RLS, audits and incident plan are in place. Default to **demo-only mode** when uncertain.
- Never send journal text to an LLM or third-party analytics by default. No clinical advice generation.
- No medical data, record hashes, identity or stable patient-linkable metadata on Solana.

## Security engineering
- Deny-by-default server authorization and Postgres RLS; write tests with **two distinct users** showing isolation. Never rely only on client filtering or obscured URLs.
- Clinical text must be AEAD-encrypted before persistence with keys kept in a separate managed key system. Do not invent cryptography or silently fall back to plaintext.
- Keep secrets server-side, never in `VITE_*` or client bundles; `.env.example` contains placeholders only; `.env` ignored by Git.
- Use maintained dependencies and lockfile, typed schema validation, parameterized DB operations, sanitized rendering, CSP, secure headers, no-store on private routes, no tracking on journal routes.
- Rate-limit auth and booking endpoints; challenge suspicious traffic; generic errors prevent enumeration. `robots.txt` is not an access control.
- Minimize logs; never log tokens, note content, PII or secrets. Provide audited operator permissions, not global service-role access in browser.
- For Solana: **Devnet only**, real wallet confirmation, Anchor PDA and signer/account constraints, state-machine validation, checked math, no unrestricted admin withdrawal, tests for adversarial flows.

## Mandatory bilingual engineering rules
- Ship `en` and `zh-CN` simultaneously for each milestone. Use a shared React UI and translation dictionaries, not duplicate page implementations.
- Add an obvious accessible `中文 | English` toggle on desktop and mobile. Default to English unless a user preference exists; switching must preserve unsent form and journal drafts and must not cause payment or submission.
- Keep UI locale distinct from requested in-person interpretation language; store both separately when needed.
- Translate all labels, errors, confirmation states, accessibility text, medical warnings, privacy and consent text; ensure translations have matching keys and versioned legal copy.
- Never auto-translate or send health-journal content to any translation API/LLM. Do not store health drafts in browser persistent storage; do not include sensitive information in URLs or translation keys.
- Use `Intl` for localized presentation while keeping API dates, order states, and onchain amounts canonical. Set `document.documentElement.lang` for current locale.
- Add bilingual tests: both routes, missing keys, preserved drafts, localized validation/consent, security isolation unaffected by language choice.

## UX and business integrity
- Only one fixed package; price RMB 499 is **provisional**, not a verified quote. No invented provider names, licenses, partnerships, availability, testimonials or completed bookings.
- Booking submission means **request received**, not confirmed. Optional acupuncture, moxibustion and prescriptions require licensed practitioner assessment, informed consent and separate confirmation.
- Display clear medical boundaries and privacy notices. Offer journal view/edit/export/delete with realistic retention and backup caveats.
- Keep website accessible, mobile responsive and understandable to first-time international visitors.

## Required end-of-milestone report
```
Milestone:
Implemented:
Files changed:
Commands and test results:
Security controls implemented and verified:
Not implemented / risks / blockers:
Manual steps for founder:
Next milestone (awaiting approval):
```

## First task
Read this file and `First_TCM_Experience_Bilingual_Secure_Codex_PRD.md`, inspect the repo, create `TASKS.md` and `SECURITY_CHECKLIST.md`, scaffold M0, run build/lint/typecheck as available, report, **STOP**.
