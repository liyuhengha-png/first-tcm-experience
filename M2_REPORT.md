# M2 progress — 2026-10-11

Milestone: M2 in progress; incomplete, synthetic preview only. DNS verification delegated to Resend; no background monitoring scheduled.

Latest independent work:
- src/EmailLogin.tsx, src/EmailLogin.test.tsx, src/Journal.tsx, src/App.test.tsx and both dictionaries: bilingual session status, email/code form, request/verify/logout, loading lock, generic errors, change-email control, in-memory credentials and clearing after verification. Switching locale preserves state without resubmission. Disabled mail configuration prevents submission.
- Latest pnpm lint, pnpm test (52 tests / 8 files), pnpm build including TypeScript check passed. Live email delivery is still disabled and untested; UI success-flow tests use mocked responses.
- server/auth-api.ts and server/auth-api.test.ts: managed-OTP request/verify/session/logout handler, strict payload validation, exact-origin POST checks, bounded hashed IP/email counters, generic membership responses, random server-side sessions, HttpOnly/SameSite cookies, Secure/__Host prefix on HTTPS, 15-minute maximum session lifetime and local logout.
- server/main.ts routes /api/auth/* to this handler with provider disabled. This cannot send email or grant access to journal records. There are no journal read/write endpoints.
- pnpm lint, pnpm typecheck, pnpm test (49 tests / 7 files), pnpm build all passed after this update.
- These auth tests use mocked managed verification; live OTP delivery/session integration remains unverified. Sessions are process-local and restart invalidates them; distributed deployment, revocation checks, recent-auth workflows and shared rate limits remain pending.

Implemented:
- Shared bilingual journal preview with fixed fictional content, explicit demo acknowledgement and in-memory reset. Language changes preserve acknowledgement/view state.
- Managed Supabase email OTP adapter: existing accounts only, HTTPS, timeout, POST verification, validated session response and generic failures. Adapter is not connected to a public endpoint or browser session yet; login remains disabled.

Files changed:
- src/Journal.tsx, src/App.tsx, src/App.test.tsx
- src/i18n/en.ts, src/i18n/zh-CN.ts
- server/email-auth.ts, server/email-auth.test.ts
- TASKS.md, SECURITY_CHECKLIST.md, M2_REPORT.md

Commands and test results:
- pnpm lint: passed.
- pnpm typecheck: passed.
- pnpm test: 45 tests / 6 files passed.
- pnpm build: passed.
- No dependency added; live email delivery and live OTP verification have not been run. Adapter tests use synthetic mocked responses.

Security controls implemented and verified:
- No free-text journal input or health persistence. Demo interaction causes no network call and stores only locale in browser persistence.
- Locale switching and clearing tested. Adapter rejects malformed sessions, provider failures and non-HTTPS configuration; credentials are POST bodies, not URLs.

Not implemented / risks / blockers:
- Browser login UI is implemented and tested with mocked managed responses. Live mail delivery, registration enablement, journal schema/RLS, KMS/AEAD, actual journal CRUD/export/delete, reauthentication, legal/hosting review remain incomplete. Local auth endpoint same-origin checks/limits and cookie handling are implemented and unit-tested; production deployment remains unverified.
- Demo acknowledgement is not sensitive-data consent. Public fictional preview is not an authenticated journal.
- Real contact/health data remains disabled. No transaction sent. PoE/ZK Email is a separate requested feasibility item, not implemented by ordinary email OTP.

Manual steps for founder:
- Confirm whether Supabase Authentication has custom SMTP configured. Do not paste SMTP credentials in chat. OTP mail template must contain {{ .Token }}; no email will be sent until explicitly configured and reviewed.
- A separate managed KMS and privacy readiness are required before real journal persistence. No paid resource will be created without authorization.

Next milestone: continue M2 under existing authorization, preserving security gates; M2 completion is not claimed.
Encryption foundation update: server/journal-crypto.ts uses Node AES-256-GCM with 12-byte random nonces, authenticated owner/entry/schema context, wrapped data-key metadata and key-buffer wiping. server/journal-crypto.test.ts covers bilingual roundtrip, cross-owner/entry denial, ciphertext tamper, unavailable/invalid KMS and nonce changes. Only mock KMS tested; no real managed KMS, persistence, journal authorization endpoint or production crypto review claimed. No plaintext fallback; module is not wired to live writes.
Journal schema update: prepared migration 202610110002_journal.sql NOT deployed. Encrypted-only payload columns, forced RLS, owner-only nondeleted SELECT, anon/service-role/browser writes revoked. Four actual local PostgreSQL tests cover two owners, encrypted fixtures in both languages, denied role access/writes, no clinical columns and soft deletion. Full run: 60 tests / 10 files, lint and build/typecheck passed. Managed KMS and cloud journal acceptance remain pending; see JOURNAL_READINESS.md.
Account update: src/App.tsx, dictionaries and App.test.tsx add independent bilingual /login; server/email-auth.ts accepts explicit server-only registration opt-in (off by default), regression-tested. Live SMTP still disconnected. Solana/Anchor/Rust executables not found on PATH; no Devnet contract built or transaction sent.
Mail preparation: bilingual OTP template and template-boundary regression test added. Build marker scan script added; no live email template modification or delivery performed. 64 unit/integration tests passed; WSL installation continues independently.
Live founder acceptance: actual OTP received and browser shows signed in. No email/code/token logged. Local signup/login happy path verified manually; public launch and journal/KMS remain gated.
