# Release readiness / 上线准备

Status: local development preview only. This document is a plan, not a launch approval.
状态：仅限本地开发预览。本文件为准备计划，不代表上线批准。

## Verified / 已验证
- Shared English/Chinese UI, preserved drafts, localized consent and validation.
- Synthetic booking persistence, safe status receipts, two-user booking RLS isolation.
- Founder email OTP test; secure local session attributes and rate-limit tests.
- $99 provisional offline fee; separate valueless 1 Devnet SOL deposit disclosure.
- Local escrow funding/release/refund and adversarial tests; no confirmed Devnet transaction.

## Before public registration / 公开注册前
- Choose and review the HTTPS Node hosting arrangement and Supabase data-transfer implications. The purchased domain is not proof of website hosting.
- Configure exact APP_ORIGIN, redirects and allowed origins; never use wildcard redirects. Keep keys server-side.
- Implement and test auth CAPTCHA; verify provider limits, WAF and shared rate limits. Current session/rate-limit maps are process-local and reset on restart.
- Review bilingual account privacy notices, controller identity/contact, vendor inventory and retention.
- Verify account disable/revocation behavior and recovery with actual managed Auth. Local sessions last up to 15 minutes; status reads now validate the server-held access token and exact user ID through Supabase, invalidating the local session on denial, mismatch or outage. This is not a guarantee that all provider revocation actions invalidate issued JWTs immediately. Sensitive operations remain unavailable; distributed session storage is still pending.
- Establish monitoring with redacted metadata only. No tokens, emails, journal text or raw request bodies in logs.

## Before real bookings / 真实预约前
- Review lawful basis, privacy/hosting/transfer arrangements, contact retention and rights handling.
- Verify provider identity, licenses, actual pricing and availability; $99 remains provisional until verified.
- Implement booking-only operator authorization, MFA and audited actions; no operator journal access.
- Define manual notification/confirmation and offline fee process. Telegram contact must not carry health notes or OTPs.
- Implement retention/deletion and encrypted backup recovery procedures and test them with synthetic data.
- Do not remove the real-booking server gate until requirements are verified.

## Journal and Devnet / 日记与开发网
- Real journals require reviewed privacy/consent, managed KMS, authentication, RLS, audits, deletion/backup and incident readiness. Keep real input disabled meanwhile.
- Funding is deferred by founder. Re-review the changed 1 SOL artifact before deployment; the old approved-hash guard intentionally blocks it.
- Actual wallet signatures are founder actions. Require confirmed signatures before claiming Devnet success.
- Remove founder funding setup UI before public release; no mainnet or real online payment.

## Verification commands / 验证命令
Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm audit`, `pnpm peers check`.
Review client assets for credentials; test both locales/mobile, private-route headers, cross-origin rejection and two-user isolation.
Keep any real inbox/wallet manual test free of tokens and personal data in screenshots or logs.

