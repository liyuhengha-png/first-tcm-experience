# Hosting handoff / 网站托管准备

Draft only. No public deployment has occurred. Choose a platform before changing networking or DNS.
仅为准备草案，尚未公开部署。选择平台后再修改网络监听或 DNS。

## Runtime / 运行环境
The application requires a Node backend, not just uploading `dist`: booking and email verification use server endpoints. Use the pinned pnpm lockfile and the Node version documented in README. Supabase and Turnstile secrets belong in the platform's server environment, never the client build.

Build: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
Current local start: `pnpm preview`; server binds only to `127.0.0.1`. This is deliberately local and is not a ready-to-use cloud start configuration.

## Platform adaptation / 平台适配
- Review host region, data transfers and provider terms. Do not create a paid resource without founder approval.
- Adapt port/listener or a trusted reverse proxy for the selected platform; explicitly document proxy trust, HTTPS termination and IP-based abuse controls. Never blindly trust X-Forwarded-For.
- Replace process-local sessions/rate limits with reviewed hosted arrangements before treating the app as production ready; verify restart and multi-instance behavior.
- The existing AUTH_EMAIL_TEST_ENABLED flag is restricted to loopback origins. Do not repurpose it to enable public sign-up; add a reviewed public registration configuration only after its gates pass.
- Account disable/revocation handling, provider-side abuse protection and account retention still require implementation/review. A website CAPTCHA does not stop direct provider API requests.

## Domain / 域名
- Production origin will be `https://hellotcm.world` once hosting, HTTPS and DNS are verified.
- Use a separate production Turnstile widget limited to `hellotcm.world`; retain the local widget for development.
- Apply the hosting platform's exact A/CNAME records only after the deployment target is known. Preserve existing Resend mail records; do not guess IP addresses or replace nameservers unnecessarily.
- Set precise origin and auth redirect allowlists; no wildcards. Verify HTTP redirects, TLS, private no-store headers and both locales from the public origin.

## Release / 发布
- Review RELEASE_READINESS.md and INCIDENT_PLAYBOOK.md. Keep real booking/journal gates closed until their requirements are met.
- Remove founder deployment funding controls from any public release. Devnet remains incomplete and clearly disclosed while funding is deferred.
- Require founder approval for the concrete deployment and external DNS changes. An approved local build is not approval to publish secrets or collect real patient data.
- Revert to the previous reviewed artifact if release checks fail; do not drop tables or reset consent evidence as a rollback.
