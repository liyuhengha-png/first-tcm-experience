# First TCM Experience · 初次中医体验

The bilingual booking flow persists synthetic requests in Supabase. Local email OTP registration/sign-in has been tested with the founder. Homepage pricing is provisional $99 USD/person plus a separate 1 SOL Devnet test deposit, which has no real monetary value and does not offset offline fees or confirm a booking. Real booking contact collection and real health-journal input remain disabled. The escrow is compiled and tested locally; Devnet deployment and actual wallet transactions remain incomplete.

## Run locally
Use Node 24.19+ (tested v24.19.0) and pnpm 11.25.0. No credentials are needed for the explicit synthetic preview:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm peers check
pnpm test
pnpm build
pnpm audit
pnpm preview:synthetic
```

Open http://127.0.0.1:4173/ or /book. Use an invented name and an @example.test email only. Submissions actually persist in a local PostgreSQL engine under ignored .local-data/booking; receipts expire after 24 hours. These synthetic requests are not commercial bookings. The server stays loopback-only. Restart it after shutdown using the same command. See M1_REPORT.md for bundled Windows Node/pnpm paths when they are absent from PATH.

pnpm preview serves the built UI plus API but disables submissions when no Supabase configuration exists. It never silently falls back to a local database. pnpm dev is frontend-only; use the built full preview to test server persistence. All environments reject real booking data in this milestone.

## Shared bilingual implementation
One React component tree uses typed en and zh-CN dictionaries, matching-key tests and an accessible native Chinese/English toggle. English is the fallback for unknown preferences. html lang and Intl currency presentation update. Only the non-sensitive UI locale is persisted; form drafts stay in memory and are lost on reload. Switching language preserves draft fields, consent and independently requested service language without submitting.

Both languages include package boundaries, provisional $99 USD, FAQs, form/errors, separate draft terms/privacy consent, request receipts, medical warnings and disabled journal/Devnet states. User notes are never translated, collected or sent to analytics/LLMs. Legal copies share version 2026-10-11-draft-v2 and await review.

## Data/security architecture
Node HTTP server -> strict Zod validation -> transactional service-only PostgreSQL RPC. Supabase uses server-only HTTPS REST/Auth endpoints; keys never enter the browser. Local synthetic preview uses PGlite, an actual PostgreSQL engine, with explicit roles and the same migration; this is not Supabase Auth and has no local login endpoint. Tests verify two synthetic users' RLS isolation, consent and audit writes, safe receipts, atomic rollback and disk persistence after reopening the database.

Browser database writes are denied. Own booking/consent reads use RLS; anonymous bookings have no authenticated owner and cannot be claimed from their reference. The receipt discloses only status/manual handling; private booking details have no endpoint in M1. Submissions become REQUESTED only after persistence. Resend SMTP is configured for managed email OTP; booking notifications and an operator workflow are not implemented.

The local server returns CSP, no-store, noindex, no-referrer, nosniff and Permissions-Policy. POST requires the configured exact origin; bodies are capped at 8 KiB. Honeypot, generic errors and bounded in-memory IP/account rate windows are implemented. Suspicious local requests are denied; when configured, Turnstile checks token success, hostname and booking action server-side. Partial challenge configuration fails closed. Real Turnstile, WAF, distributed limits and hosted HTTPS remain unverified. Counters reset on server restart.

## Supabase and launch blockers
The founder's Singapore Supabase test project is configured. Booking RLS was tested with two distinct users. The draft-v2 pricing consent migration has been applied; live synthetic booking creation and receipt retrieval were verified in both languages. Journal migrations and production readiness require separate review. For a new test project, follow SUPABASE_SETUP.md and apply the pricing consent migration after the base booking migration. Do not paste keys into chat or put them in VITE_*.

No operator portal/MFA permissions or booking notification workflow is implemented. Legal copy, controller contacts, retention, hosting/transfer/privacy review and verified providers are still required. Do not collect real contact or clinical data. Journal encryption interfaces and synthetic tests exist, but managed KMS is not configured and real journal operations remain disabled. The Anchor program and wallet UI exist; no Devnet deposit or release has been confirmed. Real-health-data prerequisites from the PRD remain mandatory and must be tested before writes are enabled.

No public deployment, paid resources, Git commits or pushes were performed. The founder authorized continued work; Devnet funding is currently deferred. See TASKS.md, SECURITY_CHECKLIST.md and RESUME.md for current checkpoints; milestone reports retain historical results. RELEASE_READINESS.md and INCIDENT_PLAYBOOK.md describe remaining release requirements and response procedures, not completed operational controls.
