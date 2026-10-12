# First TCM Experience — Secure Bilingual MVP PRD (Codex)

**Version:** 3.0 | **Date:** 2026-10-10 | **Owner:** Solo founder | **Status:** Build specification

## 0. Product decision
Build a real bilingual Chinese/English booking website for a guided first Traditional Chinese Medicine (TCM) consultation and cultural experience in Shanghai, with optional acupuncture/moxibustion subject to licensed clinician assessment and informed consent. A user's first consultation can become the beginning of a longitudinal, **user-controlled private health journal**. Separately demonstrate Solana Devnet escrow for the hackathon. **Never place medical data, patient identity, medical record hashes, or booking-to-patient identifiers onchain.**

### Non-negotiable scope
- **Three public journey screens (Chinese and English):** Discover, Book, Confirmation; plus **one authenticated private area**: My Health Journal. This is the only additional product surface.
- **One fixed package**; tentative RMB 499/person, ~2 hours; price and availability clearly marked provisional until verified.
- No marketplace, AI diagnosis, NFT, token, DAO, complex provider portal, medical-record exchange, real crypto checkout, mainnet, or real patient data in Devnet demonstrations.
- Production health data features are **gated** until security/privacy review, real institutional partnership and compliant operational readiness. In early demo use synthetic records only.


## 0A. Bilingual UX — mandatory, not a stretch goal
- Support **Simplified Chinese (`zh-CN`) and English (`en`)** everywhere: navigation, package description, FAQs, medical boundaries, booking form, validation, confirmation, login, private journal, export instructions, consent/privacy text, Solana Devnet demo, loading/error/empty states, and transactional email templates where implemented.
- Default locale: `en` for visitors without a saved preference; allow explicit toggle in the header labeled `中文 | English` and a mobile-accessible equivalent. Persist preference in a non-sensitive local preference or user profile when signed in. Do **not** infer a user's nationality or clinical language from browser locale.
- Implement one React component tree with translation dictionaries (e.g. `src/i18n/en.ts`, `src/i18n/zh-CN.ts`) using `react-i18next` or another minimal maintained i18n library. **Do not duplicate pages, data models, or business logic.** Use stable translation keys, type checking/validation for missing keys, and documented fallback to English.
- Switching language must **not** reset forms, journal drafts, wallet state, authentication, selected date, or order status; it must not trigger duplicate submissions or payments. Persist drafts only in memory where they contain health data; **never persist clinical drafts to localStorage/sessionStorage**.
- Set `<html lang>` correctly for the active locale; localize date/time/currency display with `Intl`, but retain ISO dates, integer lamports, and canonical enums in APIs and database. Display `RMB ¥499` as provisional in both languages; do not convert into another currency without an explicit rate source.
- Distinguish **UI language** from **language requested for the in-person companion service**. The latter is a separate booking field and must not change automatically when toggling the interface.
- No machine translation or external translation API calls on private journal text. User-written medical notes remain exactly as entered; translate only UI labels and explanatory text. Do not claim medical translations are clinically certified.
- Maintain versioned, equivalent Chinese and English privacy notices, booking terms, explicit sensitive-health-data consent, and optional marketing consent. Store consent `purpose`, `version`, `locale`, `timestamp`, and evidence of affirmative action server-side. Changing locale must not silently imply consent. Obtain legal review before production.
- WCAG-minded accessibility: keyboard-operated toggle, visible focus, labels, screen-reader names, sensible Chinese and Latin font fallbacks, responsive layouts, no text clipped in either language.
- Tests: both locales render all routes; no missing translation keys; language switch preserves a partially completed booking and journal draft; error messages and consent are localized; user A cannot read user B records regardless of locale; no health data leaks to translations, URLs, logs, or browser storage.

## 1. Users and jobs
- **Visitor:** understands package, requests booking, receives manual confirmation, securely accesses own consultation notes and controls their retention.
- **Operator:** sees minimum necessary booking contact details; cannot read private clinical notes by default.
- **Licensed clinician / authorized record contributor (future):** may enter or verify notes only after institutional agreements, verified identity, role-based authorization and patient consent. **For MVP, no clinician portal**; the user may create a clearly labeled *self-reported personal health journal entry*; an operator may not silently write a diagnosis.

## 2. User flows
### A. Discover → Booking request → Confirmation
1. Discover page: localized Chinese and English copy, transparent inclusions/exclusions, medical limitations, sample price, provider verification status, privacy summary.
2. Book page: preferred date/time, group size, preferred service language, name, email, optional messenger contact; consent to booking terms and separate privacy notice. **Do not ask symptoms or medical history in booking form.**
3. Server validates, rate-limits and persists booking. Show `REQUESTED`, not `CONFIRMED`, until operator verifies availability. Send transactional email via server-side provider if configured; otherwise explicitly show pending manual handling. Never claim confirmed booking without actual confirmation.

### B. First visit → Private health journal
1. Authenticated user opens My Health Journal; explicit consent and short notice before creating the first entry.
2. User may enter date, clinic name (optional), pulse/tongue observations as **self-reported notes**, consultation summary, recommendations they recall, and optional follow-up plan. Avoid collecting national ID/passport numbers, precise home address, genetic data, payment card data or unnecessary fields.
3. UI labels `Self-reported, not an official medical record or clinician-verified diagnosis` prominently. Do not infer or fabricate a diagnosis.
4. User can view, edit, export, and request deletion of their own journal. Subsequent entries form a timeline. Downloaded exports should require recent authentication and be clearly labeled sensitive.
5. **Production gating:** If security prerequisites are unmet, disable real-health-data entry and show synthetic demo data only. No real health information should be used in tests, seed scripts, analytics, logs or screenshots.

### C. Solana Devnet demonstration (isolated)
1. Separate clearly labeled `Solana Devnet Demo — Not a Real Payment` panel, linked from confirmation.
2. Connect Phantom or compatible wallet on Devnet, show network and public address.
3. Create a demo escrow for a **random, unlinked demo order ID** and deposit small test SOL.
4. Demo completion and authorized release to the demo provider, with genuine signature, finality confirmation and Solana Explorer Devnet link.
5. Do not connect wallet identity to the private health journal. No medical or identifying information, or hashes of such information, in transaction instructions, memo, logs, account fields or PDA seeds.

## 3. Minimum screens
- `/`: Discover (package, 2h estimate, consultation and cultural interpretation, optional acupuncture/moxibustion *only if medically appropriate*, price provisional, FAQs, safety notice, CTA).
- `/book`: Booking form and consent.
- `/confirmation/:opaqueReference`: Public-safe booking receipt; **no sensitive details** and no enumeration; authenticated access required for detailed booking information. Prefer short-lived signed confirmation links for email flows.
- `/journal`: Authenticated private health journal, entries timeline, create/edit/export/delete controls. This is a single simple screen, not a full EHR.
- `/demo/solana`: Devnet-only demonstration; can be a section on confirmation if simpler.

## 4. Stack (choose few dependencies)
- React + Vite + TypeScript + Tailwind CSS frontend.
- Supabase Auth + Postgres with **strict RLS** for user-owned records; secure server-side API/Edge Functions for privileged actions. Use a managed transactional email provider if configured. Choose supported maintained library versions.
- Server-side encryption of journal content using **envelope encryption with a managed KMS** where available, or a reviewed equivalent. **Never store encryption keys in source control, frontend, public environment variables or database rows alongside ciphertext.** TLS in transit; encrypted backups. RLS is mandatory even when application code filters by user.
- Solana Devnet + Anchor Rust for isolated escrow demo, only after booking/journal MVP works. Do not use EVM/Solidity.
- Vercel or equivalent deployment with environment separation (local, preview, production). Production secrets are server-side only.

## 5. Data model (minimal)
`profiles(id UUID PK references auth.users, created_at, privacy_notice_version, privacy_accepted_at)`

`bookings(id UUID PK random, owner_id UUID nullable, contact_name TEXT, contact_email TEXT, preferred_date DATE, guests INT, preferred_service_language TEXT, ui_locale TEXT nullable, status ENUM[REQUESTED,CONFIRMED,CANCELLED], created_at, updated_at)`

`journal_entries(id UUID PK random, owner_id UUID NOT NULL, visit_date DATE, ciphertext BYTEA/TEXT, encrypted_data_key BYTEA/TEXT, key_version TEXT, schema_version INT, created_at, updated_at, deleted_at nullable)`

`consent_events(id UUID, owner_id UUID, purpose ENUM[booking,journal,optional_followup], version TEXT, locale TEXT, granted BOOL, created_at)`

`audit_events(id UUID, actor_id UUID nullable, action TEXT, resource_type TEXT, resource_id UUID nullable, outcome TEXT, timestamp, ip_prefix_or_privacy_preserving_metadata)`

- **No plaintext clinical note columns, search indexes or embeddings.** Encrypt content before persistence. No third-party analytics on journal routes. Use a short, documented retention schedule and deletion/backup policy rather than inventing legal periods.
- Access: booking owner sees own booking; journal owner sees only own entries. Operators may manage booking metadata only through audited server-side permission checks; no clinical access. **Do not ship broad service-role access in browser.**
- Every table containing personal data has explicit RLS policies; deny by default. Add negative tests proving user A cannot read/write user B's booking or journal.

## 6. Privacy, consent and regulatory gates
- Health information is sensitive personal information. Provide separate, explicit, informed consent for the journal; explain purpose, categories, retention, recipients, cross-border access, user rights, withdrawal, and contact route in accessible English and any legally required local language.
- Conduct a **PIPL/privacy impact assessment** and confirm applicable Chinese rules for sensitive personal information, healthcare data, data localization, cross-border transfers and provider/medical-record obligations with qualified counsel before handling real patients. Do not assume an overseas hosting provider or cross-border operator access is permissible.
- Before real launch, document controller/processor roles, DPA/vendor inventory, breach response, deletion process, backups, data subject requests, incident contacts, and retention. If requirements are not met, **disable journal writes for real patients**.
- Distinguish user journal from a hospital's legally maintained medical records. Never promise clinical outcomes, diagnosis by AI, guaranteed acupuncture/moxibustion, or verified providers without evidence.
- Optional treatments require licensed practitioners, suitable medical premises, clinical assessment and informed consent. Booking does not guarantee treatment.

## 7. Security requirements — mandatory
### Authentication / authorization
- Managed email magic link or OTP; secure sessions, HTTP-only/SameSite cookies when supported; do not implement homemade authentication.
- Reauthentication before bulk export or destructive account action. Password reset/OTP flows rate-limited. Avoid putting access tokens in URLs or logs.
- Server-enforced authorization for every record operation; ownership checks and deny-by-default RLS. Never trust client-provided `owner_id` or role.
- Do not allow unauthenticated creation of clinical entries.

### Encryption / secrets
- HTTPS everywhere; no secrets in `VITE_*` variables, Git, screenshots or frontend bundles. Secret scanning in CI. Separate Devnet vs production credentials.
- Encrypt clinical payloads with AEAD (e.g., AES-256-GCM) and managed key lifecycle; unique nonce per encryption; support key rotation. Do not invent cryptography or silently downgrade to plaintext if KMS unavailable.
- Supabase RLS is **not** a substitute for encryption or privacy review. A compromised authorized account can still read its own data; explain this limitation.

### Anti-bot / anti-scraping / abuse
- Public pages are intentionally public; focus on preventing **automated collection of personal records**, credential stuffing, booking spam, enumeration and API scraping.
- Edge/WAF rules; IP- and account-based rate limits; Turnstile or equivalent challenge on suspicious booking/auth activity; honeypot; server validation; request size limits; uniform errors and generic auth responses; pagination limits.
- `robots.txt` is not security. Never rely on obscured URLs, client-side checks or CAPTCHA alone to protect health records.
- Avoid sensitive content in URL params, cache, analytics, error traces, referrers and search indexing; private routes use `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` as defense in depth.

### Web security
- Protect against OWASP Top 10 and API authorization failures: XSS, CSRF (when cookie auth), SQL injection, IDOR/BOLA, SSRF in server integrations, insecure file upload (uploads excluded from MVP), CORS misconfiguration and open redirects.
- Set CSP, HSTS, Referrer-Policy, X-Content-Type-Options, appropriate Permissions-Policy; sanitize output; parameterized queries; validate all inputs using schemas.
- No third-party tracking pixels or session replay on journal or booking details. Restrict admin access; MFA for operators; audit every sensitive access.
- Backups encrypted; test restore and deletion process; incident response checklist; dependency lockfile and automated vulnerability scanning.

### Web3 security
- Devnet only; show explicit chain/network; never request seed phrases or private keys. Wallet connection is **not** medical record authentication.
- Anchor escrow with order PDA + vault; deterministic PDA seeds using random demo ID only, validated bumps and ownership; exact signer and account constraints; checked math; status transition checks; prevent double funding, double release, unauthorized withdrawal and refund; reject incorrect recipients/accounts; use local validator tests.
- For wallet sign-in (only if later needed), use domain-bound nonce, expiration, signature verification and single-use challenge; not needed in MVP.
- No private patient data or hash onchain. No unreviewed upgrade authority or hidden admin withdrawal. Publish limitations of dispute handling and smart-contract risk.
- Never label Devnet test funds as paid commercial bookings.

## 8. Threat model (minimum)
| Threat | Control | Test |
|---|---|---|
| User A requests user B's journal | RLS + server ownership checks | Negative cross-user test |
| Stolen public URL/booking ID | No PHI in URL, authenticated details | Anonymous request returns no PHI |
| Scraping/booking spam | WAF, throttling, challenge, limits | Rate-limit integration test |
| Database exposure | Encrypted clinical payloads, KMS separation | Assert no plaintext note persisted |
| Operator overreach | Booking-only role, audit logs, MFA | Operator denied journal read |
| XSS leaking health data | CSP, escaped output, no third-party scripts | XSS test payload |
| Wallet drain / fake payment | Devnet-only checks, simulation, confirmed tx | Invalid network/tx fails |
| Unauthorized escrow release | Anchor signer/account constraints | Attacker release test |
| Duplicate escrow payout | Strict state machine | Second release fails |
| Lost encryption key | Documented backup/rotation/recovery process | Restore drill before production |

## 9. Delivery milestones — stop after each
**M0: Scaffold and plan** — inspect repo; React/Vite/Tailwind; `.env.example`, `TASKS.md`, README; run lint/build. No production credentials.

**M1: Public booking MVP** — Discover/Book/Confirmation; server-validated booking requests, bot protection, clear provisional price, consent and manual confirmation. Real booking request persistence and operator notification if configured. Tests and deployable preview.

**M2: Secure journal (synthetic-data mode first)** — auth, RLS, encrypted private notes, consent events, timeline, export/delete, access audit, negative cross-user tests. **If encryption/KMS, auth, RLS, privacy review or hosting requirements are unresolved, keep real-data input disabled.** No simulated security claims.

**M3: Solana Devnet escrow** — isolated demo; Anchor contract + tests for happy path, unauthorized signer, wrong vault, double release, refund and invalid state; frontend wallet integration; confirmed Explorer links.

**M4: Hardening and release** — security checks, dependency audit, secrets scan, accessibility/mobile, privacy notices, deployment instructions, incident playbook, demo video script, honest README listing production blockers.

## 10. Acceptance criteria
- [ ] English booking request actually persists server-side and is **not** mislabeled as confirmed.
- [ ] Unauthenticated visitors cannot read private notes; two-user RLS isolation tests pass.
- [ ] Clinical notes never appear in plaintext DB fields, logs, analytics or onchain.
- [ ] Explicit separate journal consent is stored with version/time; export/delete works with stated backup limitations.
- [ ] Booking and auth endpoints have server-side validation and abuse controls.
- [ ] No secret key in client bundle or Git.
- [ ] Devnet escrow deposit/release produce real confirmed signatures, or feature is clearly marked incomplete and disabled.
- [ ] README separates tested functionality from mocks and identifies legal, security, institutional and payment prerequisites for production.
- [ ] Build, lint, typecheck, unit tests and relevant integration/Anchor tests pass; if tools unavailable, record exact blockers.

## 11. Commercial and hackathon narrative
**Consumer promise:** `Your first TCM visit, with guidance you can understand and notes you control.`

**Hackathon thesis:** `A trustworthy entry point for cross-border real-world care experiences: private longitudinal notes offchain, verifiable booking settlement on Solana.`

Do **not** claim blockchain protects clinical data. Privacy comes from access controls, encryption, minimized collection and governance; Solana supports transparent **nonmedical** settlement. Future ideas (not MVP): verified provider attestations, optional encrypted sharing with clinicians, fiat checkout, multi-city service catalogue.

## 12. Codex execution instruction
Read `AGENTS.md` and this PRD. Inspect the repo first. Create `TASKS.md` with M0–M4 and a `SECURITY_CHECKLIST.md`. Implement **M0 only**, run commands and tests, report changed files and results, then stop for approval. Never skip safety gates to meet a deadline. Do not generate production claims or collect real medical data until prerequisites are verified.

## Bilingual acceptance checklist (release blocker)
- [ ] Every user-facing route and state works in both `en` and `zh-CN` without duplicated components.
- [ ] Header/mobile language switch works without page reload or data loss; `html[lang]` updates.
- [ ] Booking service language is independent of interface language.
- [ ] Localized booking/privacy/health-data consent versions are shown and recorded; no pre-checked sensitive consent.
- [ ] Journal content is never sent to translation services, analytics, Solana or unprotected browser storage.
- [ ] Chinese/English emails, if enabled, are server-rendered safely; no medical data in messages.
- [ ] Both locales pass accessibility, form validation, typecheck, build, and security regression tests.

## Codex implementation note
At each milestone implement the corresponding feature **in both languages in the same change**; do not defer Chinese until the end. Keep security controls and synthetic-data-only production gate from this PRD unchanged. If infrastructure for encryption/KMS or a real Anchor escrow cannot be tested, stop, explain the blocker, and never substitute plaintext storage or simulated onchain transactions while claiming completion.
