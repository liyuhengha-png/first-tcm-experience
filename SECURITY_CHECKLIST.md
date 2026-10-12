# Security checklist — current M1 status

M1 resumed and locally verified on 2026-10-11. Full live Supabase acceptance remains pending; real booking/health data stays disabled. See M1_REPORT.md.

## M1 implemented and verified locally
- [x] Actual managed Supabase Auth and two-user JWT/RLS isolation now verified by server/cloud-isolation.ts (both locales, booking/consent reads, cross-user write/private-table/RPC/anonymous denials). Credentials stay in memory and local ignored .env. Test accounts retained, no notification sent. Prior live-auth pending notes below are historical; production health-data prerequisites remain unresolved.
- [x] Cloud schema privilege/RLS configuration inspected from user SQL results. Actual cloud synthetic request returned HTTP 201 and persisted status-only REQUESTED receipt. This does not yet verify managed-user JWT isolation; publishable key is needed for that next check.
- [x] Modern Supabase secret-key header handling and legacy compatibility regression tests; 41 tests across 5 files, lint/typecheck pass after adapter update. Test project URL/region confirmed; real key entry and live migration pending. Ignored local .env has blank secret, no secret received in chat.
- [x] Shared bilingual form and localized validation; independent unchecked draft booking/privacy consent; persisted purpose/version/locale/time/affirmative evidence.
- [x] Server schema validation, unknown-field/owner injection rejection, parameterized transactional persistence and rollback.
- [x] Actual PostgreSQL RLS: two synthetic users see only their own booking/consent; anonymous reads and browser writes/RPC calls denied. Supabase Auth fixture/live differences documented.
- [x] Local disk persistence after database reopen and actual receipt retention after server restart.
- [x] Receipt: 256-bit random reference, 24-hour expiry, no contact/date/health details, generic missing/expired response; no private details endpoint.
- [x] Same-origin submission, 8 KiB limit, honeypot, bounded process-local IP/account windows and suspicious-request denial tested.
- [x] API challenge failure checked; live provider unverified. Partial key configuration startup guard implemented; no real CAPTCHA solved.
- [x] Browser-tested draft/native-date preservation and successful local synthetic request; REQUESTED only, manual handling/email absence disclosed.
- [x] Local HTTP no-store/CSP and other security headers inspected; no tracking/clinical input/wallet actions. Only UI locale in browser persistence.
- [x] Final 39 tests, lint, typecheck, build, peer check and audit pass. Limited bundle marker scan only, not full CI secret scanning.

## M1 pending or unverified
- [ ] Live Supabase Auth/JWT and hosted RLS integration; migration deployment.
- [ ] Actual Turnstile/WAF/shared rate limits; counters currently reset on restart.
- [ ] Audited booking-only operator permission, MFA, notifications and operations.
- [ ] Legal copy, contact/retention/vendor/hosting/transfer review; production booking entry.
- [ ] Hosted HTTPS/HSTS, deployment security, full mobile/WCAG/screen-reader audit and CI secret scan.
- [ ] Journal auth/KMS/AEAD/clinical writes and all Solana features remain disabled for M2/M3.

## Historical M0 ledger below

This is an implementation-status ledger, not a security certification. Production and real-health-data use are blocked. No server, database, authentication, wallet or payment feature exists in M0.

## Implemented in scaffold (source review and M0 tests)
- [x] No input forms for contact data or clinical notes; no submission endpoints.
- [x] No tracking, remote fonts, translation API, LLM integration or blockchain calls in app source.
- [x] Only UI locale is persisted in localStorage; no clinical draft storage.
- [x] Shared bilingual dictionaries with exact typed key parity; English fallback for invalid preference.
- [x] Confirmation placeholder displays no identifier or booking data and claims no received/confirmed request.
- [x] Real-data entry and Devnet actions absent; translated notices explain missing controls.
- [x] .env ignored; .env.example uses commented server-only placeholders; no production credentials supplied.
- [x] React text rendering; no raw HTML injection in scaffold.

## Not implemented / must not be claimed
- [ ] Managed auth, cookie/session security and reauthentication.
- [ ] Server-enforced ownership and strict RLS on all personal-data tables.
- [ ] Two-user negative isolation and operator-denial integration tests.
- [ ] AEAD envelope encryption, separate managed KMS, nonce uniqueness, key rotation/recovery.
- [ ] Versioned legally reviewed consent and server-side evidence; localized equivalent legal notices.
- [ ] Server booking validation, request/pagination limits, rate limits, bot challenge and generic auth errors.
- [ ] Audited booking-only operator permission and MFA; no operator journal access.
- [ ] Deployment HTTPS, CSP, HSTS, Referrer-Policy, nosniff and Permissions-Policy.
- [ ] Private Cache-Control: no-store and X-Robots-Tag verification. Static preview contains no personal records; robots metadata is not access control.
- [ ] CSRF/CORS/SQL injection/SSRF protections for future server integrations; uploads excluded.
- [ ] Encrypted backups, restore/delete drill, retention policy, incident response and data-rights process.
- [ ] PIPL/privacy impact and counsel review, controller/processor roles, institutional agreements, vendor and hosting/cross-border verification.
- [ ] Anchor constraints, adversarial escrow tests and real confirmed Devnet signatures.
- [ ] CI secret/dependency scanning and deployment review.

## Verification log
2026-10-10: pnpm lint, typecheck, build, test (15 tests), peers check and audit passed. All five planned route URLs returned HTTP 200 with the built app shell on the loopback preview. Both locales were rendered through jsdom tests, not a real browser visual/accessibility audit. A limited source-pattern review found no app fetch, sessionStorage, raw HTML injection or VITE_ reference; a limited built-output scan found no example credential placeholders or private-key markers. These checks are not a comprehensive secrets scan; CI scanning remains future work. Full details and resolved initial failures are in M0_REPORT.md.

Draft-preservation, consent, validation, isolation and transaction tests belong to milestones implementing those features; disabled placeholders do not establish those controls.

## M2 current update — 2026-10-11
- [x] Fixed fictional journal preview only; network/storage absence and locale-state preservation tested.
- [x] Managed OTP adapter validates responses and fails generically; no live OTP/email/session integration claimed.
- [ ] Real journal writes remain disabled; managed KMS, AEAD, journal ownership/RLS, sessions and readiness review pending.

Telegram external link is fixed with noopener/noreferrer and no user metadata. Test value and offline fee separation disclosed in both locales. No transaction success or deposit gating claimed.
M2 auth handler: exact-origin POST, strict payload schema, bounded HMAC IP/email counters, generic OTP request responses, random HttpOnly SameSite sessions, Secure prefix on HTTPS, expiry/logout/fabricated-cookie denials unit-tested. Process-local only; live OTP and journal access not implemented.
M2 login UI tests verify both locales, locale-state preservation without duplicate submissions, generic failures, token clearing and no credential localStorage/sessionStorage. Live delivery/registration remains disabled and unverified.
Journal crypto helper has mock-only roundtrip/tamper/context-binding/fail-closed tests; data keys wiped best-effort (not a guarantee of removal of all runtime copies). No managed KMS adapter configured or independently reviewed crypto deployment; health persistence remains disabled.
Journal local PostgreSQL RLS forced; two-owner ciphertext isolation, browser/anon/service-role denials, soft-deleted read exclusion tested. Migration prepared but cloud deployment unverified. Clinical metadata kept inside encrypted payload; no real health writes enabled.
Managed OTP account creation defaults false; explicit true option regression-tested. Account route does not enable health data or link wallets to journal identity. No OTP email sent.
Devnet remains disabled. Verified toolchain unavailable; PDA/state-machine/adversarial test design documented as plan only, not implemented controls. No chain transaction, contract build or deployment claimed.
OTP mail template tested for both language sections, single code placeholder, absence of user identity/health/wallet template fields or external images/scripts. Public bundle scan detects listed server-secret markers only and is not comprehensive secret scanning.
Session replacement and logout revocation unit-tested; failed managed OTP does not create cookie; oversized auth body rejected. Production dependency audit found no known vulnerabilities; this is not a security certification.
Email test binding requires loopback origin and managed publishable config, registration explicit true. No mail sent by agent; founder submits own inbox in browser. Public CAPTCHA/readiness and live delivery still unverified; health writes disabled.
Founder-owned inbox actual mail delivery and OTP sign-in confirmed by founder. Email/code/token not supplied to chat or logs. Local-only test; production auth readiness and journal remain pending.
Escrow source is unverified scaffold, not implemented-and-tested control. No chain identifier ties to booking/journal, cap0.01 test SOL, expiry<=24h; no unrestricted admin function. Program ID placeholder. Actual compilation and adversarial validator tests pending. Keypair/target ignores added.
M3 toolchain checkpoint: Rust1.99.0, Solana4.3.0 and Anchor1.2.1 installed; cargo check --locked passed. Devnet genesis read-only check matches expected cluster. SBF compile session26432 running. Local-validator test source typechecks, execution pending. Website: pnpm test 68/68 (12 files); pnpm build/lint and public-bundle marker scan passed. Removed unused vulnerable Anchor JS dependency. web3.js1.99.0 dev-only audit still reports four moderate transitive findings (jayson uuid/stream-json); peers check fails TS6 vs codecs TS5 and optional utf8 version. Do not bundle SDK into website or claim clean full audit. Production audit pending repeat. No chain deployment or transaction.
M3 actual execution: first SBF build passed and local-validator funding/release/refund plus attacker/recipient/PDA/state/amount/expiry rejection tests passed. PRD review identified separate vault PDA requirement; source and test now updated to separate escrow-state and funds-vault PDAs. Revised SBF build session65341 running; revised validator suite NOT yet executed. Prior pass does not establish revised source correctness. Validator old session63831 stopped. pnpm audit --prod and lint pass. Anchor install complete1.2.1.
Separate-vault revision SBF compilation and actual local-validator test both passed. State and funds use separate constrained program-owned PDAs. Attacker/recipient/wrong-vault failures preserve funds; exact release and timed refund verified. No Devnet transaction. Validator session28948 running. Bilingual UI now describes verified local status, limits, locked rent and unsolicited-fund limitation. Website regression being repeated.
Latest verified checkpoint: independent state/vault PDA SBF compile and actual validator suite pass, including balance preservation under rejected attacks. Solana Kit8.4.0 replaces legacy web3.js; legacy Anchor JS package removed. Full pnpm audit reports no known vulnerabilities; pnpm peers check passes. Website pnpm build/typecheck, lint, test70/70 across13files and public bundle marker scan pass. Explicit Wallet Standard connection added in both languages; no transaction-signing action enabled. No Devnet deployment/signatures. Supersedes prior dependency/test-pending statements.
Final program public identity synchronized to4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B; final SBF build and actual local validator suite passed (session83315 exit0). Final artifactSHA25665B6E0F3DB57BA20BA4602F8544C92C0FBD7A58DD6869CD2A2BD5D269922AED9. DEVNET_DEPLOYMENT_REVIEW.md prepared. No deployment or chain transaction sent. Founder has wallet and can personally sign. Public deployment requires explicit approval under AGENTS rule6; wallet simulation/sign/confirmation remains pending. Preview6887 serves latest dist; validator16558 local only.
2026-10-11 latest: founder explicitly approved reviewed Devnet deployment. prepare-devnet.sh created private deployment key (not exposed), official faucet failed, public payer4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ balance0SOL. deploy-devnet.sh stops before broadcast for insufficient funds. Await founder test SOL, not deployment reapproval. Browser simulation/signature message validation/confirmation code and bilingual explicit deposit UI implemented, real wallet flow unverified. 73tests/14files pass; targeted5tests pass; build/typecheck/lint/audit/peers/6-asset marker scan pass. Demo-only Devnet CSP verified by actual HTTP; journal no-store and no Devnet access. Preview nowsession52207. Validator16558 local only. No Devnet deployment/transaction signature.
Founder requested help moving own Devnet funds from MetaMask. Added temporary bilingual founder deployment funding UI and fixed SystemProgram transfer helper: only public founder7Vw7cQoJqxR3DQpWnpXTtE9Wq2BNzxkqep2b6vkCMwVE to deployment4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ, exactly1.6testSOL, Devnet genesis checked, simulate before wallet sign, signed-message unchanged check, confirmed result only. Refuses funding if receiver already has>=1.5SOL. No auto-sign; explicit separate checkbox; current-tab attempt lock. Browser wallet compatibility/actual transfer remains unverified. No mainnet supported. Remove setup UI before public launch.
Founder funding helper checks complete: full pnpm test74/74 across14files, targeted6pass, lint and build/typecheck pass. Public bundle marker scan6filespass and /demo/solana HTTP200. Actual MetaMask connection/transfer requires founder browser test; no deployment success claimed.
Fixed pre-broadcast funding failures incorrectly left in confirmation lock: now phase progress/localized failure/current connected Solana address shown, method bound to wallet feature, retry only reopened before any broadcast attempt. After broadcast uncertainty remains locked. Actual Devnet preparation and simulation reached the signing callback in a no-sign/no-broadcast Node check; read-only check passed. Founder browser signing remains unverified; deployment balance0SOL. Targeted6tests and build passed; wrong-account retry regression being checked. No credentials logged.

## Pricing change, 2026-10-11
- Both locales disclose $99 provisional offline fee and valueless 1 Devnet SOL deposit; no confirmed booking implication.
- Client and contract enforce updated 1 SOL maximum; existing signer/PDA/state constraints retained. Tests 74/74, lint/typecheck/build and SBF compilation passed.
- Versioned consent migration prepared and tested locally; existing Supabase function requires founder application before booking submission. Old consent evidence is preserved.
- New artifact is not deployed; previous approved-hash deployment guard intentionally rejects it.
Updated 1 SOL contract verified on local validator: fund/release/refund and adversarial paths passed. No Devnet confirmation claimed.

Pricing migration now applied and independently verified on Supabase: v2 true; definer true; empty search_path; anon/authenticated execution false. Synthetic live API booking/receipt checks pass in both locales. No historical consent data rewritten; no new browser DB write privileges. Local service session74093.

Shutdown checkpoint2026-10-11: paused at founder request; latest verified security state preserved in RESUME.md. Real booking and journal gates remain closed; Devnet funding deferred. No further background work scheduled.

Resumed2026-10-11: regression74/74, lint/build/typecheck and dependency checks run; audit0known, peer0issues. Escrow signing callback now bound to wallet feature (real wallet execution remains unverified). Release/incident documents are plans; no new operational security control claimed. Real contact/journal gates retained, Devnet deferred.

Verified session read abuse control: separate60/min/IP budget, cross-site403, no-store error response, normal OTP budget unaffected; regression75/75 +lint/build/typecheck pass. In-memory limits still reset on restart and do not substitute for WAF/distributed limits. Live endpoint200/no-store and cross-site403 checked. Preview31106.

Founder-provided public operator/contact added to bilingual account notice; draft explicitly retains outstanding privacy/hosting/retention gates. No credentials or real patient data added. No account consent record fabricated; public registration remains disabled.
Account notice changes: regression75/75 and lint/build/typecheck passed; no data-collection gate changed.

Auth Turnstile adapter and shared UI implemented; negative/mock tests and bilingual missing-token tests pass.78/78 tests +lint/build/typecheck pass. Real widget/service verification not yet performed. Existing exact-host/action validation is wired; optional local bypass only under existing loopback email-test configuration, not public registration. Provider's direct API abuse protection still needs provider configuration; website CAPTCHA alone does not protect direct Supabase Auth calls.
2026-10-12 actual configured auth missing-token403 verified; both keys present, not logged. Real widget solve/valid-token verification pending; no actual email sent in this check.
2026-10-12: deployment plan explicitly retains loopback/public-registration gates and direct Supabase API abuse limitation. Founder widget report is not an independent verification of actual email or valid-token response.
Vercel preview preparation: server gate disables hosted auth and writes, secrets/local data excluded from upload, private-route no-store and Devnet CSP confined to demo. Artifact not deployed/real headers not verified until hosted. Shared session/rate-limit implementation still pending.
2026-10-13: server-side user/token check on status reads and failure invalidation added with synthetic tests; tokens retained only in server memory. No distributed storage or instantaneous revocation guarantee claimed; actual managed disable/revoke test still required.
Vercel static no-store/CSP verified online; API malfunction documented, no writes successful. Revised standard Node entry and nested rewrite tested locally;82tests/lint/build passed. Online function verification requires fresh deployment. No hosted auth/data gates lifted.
Git publication readiness: sensitive paths ignored and staged85files scanned against configured server secrets/private key markers; no matches. Repository upload explicitly requested. No medical records included; development fixtures synthetic.
