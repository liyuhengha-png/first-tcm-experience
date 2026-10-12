# M1 report — 2026-10-11 (Asia/Shanghai)

LATEST CLOUD UPDATE: Supabase test configuration completed using user-entered local secrets; modern secret and publishable keys are never printed. User SQL screenshots confirm all four tables have enabled/forced RLS, no anon SELECT, no authenticated INSERT/UPDATE/DELETE, exact owner SELECT policies and server-only RPC execution. `node --env-file=.env --import tsx server/cloud-smoke.ts` returned HTTP 201 and a persisted safe REQUESTED receipt. `node --env-file=.env --import tsx server/cloud-isolation.ts` passed actual managed Auth login for two distinct synthetic users and verified own-only booking/consent reads, cross-user/anonymous rejection, denied PATCH writes, denied receipt/audit table reads and denied privileged RPC calls in en/zh-CN. Two synthetic users/owned bookings and one anonymous synthetic booking remain in the test project; no deletion or notification performed. Lint/typecheck pass after adding live scripts. The earlier live-Supabase blockers below are historical and resolved; real Turnstile/operator/legal/hosting/journal gates remain unresolved. Local preview is switched to configured Supabase with synthetic-only input.

Milestone: M1 local synthetic implementation verified. Live Supabase and production acceptance remain blocked; M2 has not started. User approved M1 on 2026-10-10, paused for shutdown, and resumed on 2026-10-11.

Implemented:
- Shared Chinese/English Discover, Book and Confirmation UI, planned inclusions/exclusions, FAQs, provisional RMB 499 and honest provider/availability notices.
- Booking contact-only form: preferred Shanghai date/time, 1–6 guests, independently selected in-person service language, name/email/optional messenger. No symptoms, clinical history, journal entry or crypto payment fields.
- Locale switching preserves memory-only form values and unchecked/affirmed independent consent; sets html lang. Only UI locale is stored in localStorage.
- Separate bilingual versioned draft terms/privacy notices; server stores purpose, version, locale, affirmative evidence and timestamp in the same transaction as the booking. Draft legal text is not reviewed production copy.
- Node server API with strict Zod input validation, unknown-field/owner injection rejection, same-origin POST, 8 KiB body limit, honeypot, bounded single-process privacy-preserving IP/account counters, suspicious-request rejection and optional server-verified Turnstile. Partial Turnstile configuration fails startup; failed attempts refresh the widget. Real provider verification is not tested without keys.
- Actual local PostgreSQL engine (PGlite) persistence in explicitly synthetic-only mode. No silent fallback from Supabase. Only @example.test emails are accepted; real booking mode is blocked at server startup. No local homemade login exists.
- Supabase REST server adapter and migration prepared: bookings, consent_events, booking_receipts and audit_events; RLS/owner read policies, denied browser writes, service-only transactional RPCs and audited creation. Local role tests verify the actual PostgreSQL policies; the auth.uid fixture represents an authenticated database session, not live Supabase Auth.
- Receipt generated from 32 cryptographically random bytes, 24-hour expiry, safe status only, generic missing/expired response. Creation returns REQUESTED only after successful persistence, never an invented commercial confirmation. Email unconfigured; manual handling explicitly pending.
- CSP, no-store, no-referrer, nosniff, private noindex and Permissions-Policy returned by local Node server. HSTS for configured HTTPS origin is coded but not verified over hosted HTTPS.

Files changed:
- package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.json, eslint.config.js, .gitignore, .env.example.
- src/App.tsx, src/Booking.tsx, src/booking-schema.ts, src/i18n/en.ts, src/i18n/zh-CN.ts, src/styles.css, src/test-setup.ts, src/App.test.tsx, src/Booking.test.tsx.
- server/api.ts, server/store.ts, server/local-store.ts, server/main.ts, server/synthetic-preview.ts, server/api.test.ts, server/database.test.ts.
- supabase/migrations/202610100001_booking.sql.
- README.md, TASKS.md, SECURITY_CHECKLIST.md, RESUME.md, M1_REPORT.md; evidence/m1-receipt-zh.png (synthetic safe receipt screenshot).
- Ignored generated dist/, node_modules/ and synthetic .local-data/ database files. No Git repository, commit, push or deployment exists.

Commands and test results:
Using bundled Node v24.19.0 and pnpm 11.25.0, with Node bin added to session PATH:
```powershell
$env:PATH = 'C:\Users\lyhen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
$projectPnpm = 'C:\Users\lyhen\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
& $projectPnpm install --frozen-lockfile
& $projectPnpm lint
& $projectPnpm typecheck
& $projectPnpm peers check
& $projectPnpm test
& $projectPnpm build
& $projectPnpm audit
& $projectPnpm preview:synthetic
```
- Frozen-lockfile installation passed on 2026-10-10 after resolving esbuild's explicitly allowed installation script and package-manager configuration.
- Latest lint/typecheck: exit 0. Peer check: exit 0, no peer issues. Audit: exit 0, no known vulnerabilities (snapshot, not a security guarantee); dependency inputs unchanged since this audit.
- Final tests: 39 passed, 4 files. Real PostgreSQL tests cover two-user RLS reads with distinct locales, cross-user/anonymous rejection, denied writes/RPCs, consent evidence, expiry, atomic rollback and actual disk persistence across engine close/reopen. API and bilingual UI tests cover validation, consent, owner injection, limits/challenge failure, storage failure, safe receipts, single submission and draft/native date preservation.
- Final production build: exit 0; Vite 8.3.4 generated updated assets.
- Browser check: real local synthetic POST succeeded, Chinese and English receipt rendered REQUESTED/manual pending without PII; draft name/service language remained during switch. Browser date event defect fixed with onInput handling and regression test, then browser rechecked successfully.
- HTTP /api/config: 200, bookingEnabled=true, syntheticOnly=true; no-store and CSP verified. Receipt GET returns only status and handling, including after restarting the server. Limited built-output scan found no supplied secret placeholders/private-key markers; no comprehensive secret-scanner claim.
- Browser viewport was the app's normal width; comprehensive mobile/WCAG/screen-reader review is still unverified. No CAPTCHA was solved and no external notification was sent.

Security controls implemented and verified:
Schema validation, same-origin POST, body limits, honeypot, rate-window behavior, failed challenge rejection, generic persistence/auth errors, server-derived optional owner, actual PostgreSQL role isolation, deny-by-default browser writes, transaction atomicity, consent evidence, safe/expired receipts, locale-only browser persistence, no clinical input, single-submit UI and local response headers. Supabase authentication verification is implemented but tested with an adapter mock; local RLS tests do not establish hosted auth/configuration security.

Not implemented / risks / blockers:
- No Supabase project/credentials provided; live Supabase migration, Auth, JWT and two-user end-to-end isolation are not verified. Do not declare full PRD M1 acceptance complete until those pass.
- No managed-email/operator notification or operator interface; manual queue handling is pending. No booking-only operator access/audit/MFA workflow is claimed.
- Turnstile keys missing; local synthetic preview denies suspicious attempts rather than presenting a real challenge. Real Turnstile/WAF/shared deployment rate limits remain unverified. Counters are process-local and reset on restart; not suitable for multiple workers without shared limits.
- Draft privacy/terms await counsel, retention/controller/contact details, hosting/cross-border and provider/operational review. Real booking data explicitly blocked; real health data always disabled.
- Supabase adapter plus Node server are prepared for reviewed hosting, but no hosted deployable-preview acceptance has been demonstrated. The server is loopback-only. No HTTPS, production restore/deletion drill, CI secret scan, auth UI, encrypted journal/KMS, Anchor contract or Devnet transaction exists.
- Receipts carry a random, short-lived status-only capability; URLs are not an authorization mechanism for booking details. No private details endpoint is exposed in this milestone.

Manual steps for founder:
1. Open http://127.0.0.1:4173/ or /book. Use only an invented name and an email such as visitor@example.test; no real contacts or health information.
2. Restart after shutdown with the bundled runtime prefix above: `pnpm preview:synthetic`. `pnpm preview` fails closed on writes if Supabase is not configured. The current synthetic preview is kept running for review.
3. Decide whether to use a test Supabase project or local Supabase. Do not paste secrets into chat. Configure server-only .env locally, apply reviewed migration and supply synthetic test users for hosted validation. No cloud project or paid resources will be created without approval.
4. Complete legal/provider/hosting/retention/operations reviews before enabling real data in any later release; current code deliberately rejects real-data mode.

Next milestone (awaiting approval): M2 secure journal remains unapproved and disabled. Finish live M1 integration acceptance before moving on.
