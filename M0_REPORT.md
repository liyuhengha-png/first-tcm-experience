# M0 report — 2026-10-10

Milestone: M0 scaffold and plan complete. STOPPED; M1 requires explicit approval.

Implemented: one React/Vite/TypeScript/Tailwind codebase, English and Simplified Chinese dictionaries, accessible native language buttons, html lang updates, locale-only preference, responsive scaffold and disabled later-milestone placeholders. No contact/health forms, backend, authentication, credentials or wallet operations.

Files changed (all new in an initially empty workspace):
- AGENTS.md and First_TCM_Experience_Bilingual_Secure_Codex_PRD.md: exact copies of supplied documents; originals unchanged, hashes compared.
- TASKS.md, SECURITY_CHECKLIST.md, README.md, M0_REPORT.md.
- package.json, pnpm-lock.yaml, .gitignore, .env.example, index.html, tsconfig.json, vite.config.ts, eslint.config.js.
- src/App.tsx, src/main.tsx, src/styles.css, src/i18n/en.ts, src/i18n/zh-CN.ts, src/i18n/index.ts, src/App.test.tsx, src/test-setup.ts.
- Generated ignored node_modules/ and dist/.

Commands and test results:
Workspace had no files, Git repository, branch, package manager configuration or tests. `git status --short` and `git branch --show-current` reported not a repository. `node --version` / `npm --version` were unavailable on PATH; the bundled Node is v24.19.0 and pnpm is 11.25.0. No system tools were installed.

Executed commands below with this runtime prefix (PowerShell):
```powershell
$env:PATH = 'C:\Users\lyhen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
$projectPnpm = 'C:\Users\lyhen\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
& $projectPnpm add react react-dom
& $projectPnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite eslint @eslint/js typescript-eslint eslint-plugin-react-hooks vitest jsdom @testing-library/react @testing-library/jest-dom
& $projectPnpm add -D typescript@~6.0.0
& $projectPnpm lint
& $projectPnpm typecheck
& $projectPnpm build
& $projectPnpm test
& $projectPnpm peers check
& $projectPnpm audit
& $projectPnpm preview
```

Final results:
- lint: exit 0.
- typecheck: exit 0.
- build: exit 0; Vite 8.3.4 emitted HTML, CSS and JS in dist/.
- test: exit 0; 1 file / 15 tests passed (dictionary parity, both locales on five planned routes plus unknown route, no data forms, locale switching/storage, no reference reflection).
- peers check: exit 0; no issues.
- audit: exit 0; no known vulnerabilities reported, after transient ECONNRESET retry. This is a registry snapshot, not a guarantee of future safety.
- preview: loopback http://127.0.0.1:4173; Invoke-WebRequest returned HTTP 200 and app root for /, /book, /confirmation/synthetic-reference, /journal, /demo/solana. This verifies serving/fallback only; route rendering is verified by unit tests.
- Limited source/bundle patterns: no prohibited application network/storage/raw-HTML patterns or credential placeholder/private-key markers found. Dependencies include their own library strings; no comprehensive secret-scanner claim.

Initial failures resolved: sandbox registry access ECONNREFUSED required approved dependency-download escalation; TypeScript 7 was unsupported by typescript-eslint, resolved by supported TypeScript 6.0.3; sandbox Vite process spawning failed with EPERM, build/tests passed under approved escalation. Lockfile preserved. No failed check is being presented as passing without a successful rerun.

Security controls implemented and verified: no data-entry surface in every locale/route tested; confirmation reveals no identifier/data; only non-sensitive locale persisted; clinical and Devnet operations absent; no supplied credentials; source and generated bundle reviewed with limited patterns. The missing health-security infrastructure is an explicit blocker, not simulated. Real React browser layout, screen-reader behavior, blocked-storage fallback and WCAG compliance are not independently verified.

Not implemented / risks / blockers: M1–M4 backend, server validation, bot protection, RLS/user isolation, auth, KMS/AEAD, legal consent evidence, deployment security headers, no-store, audits, email, Anchor and real transactions. No patient data may be collected. Price, availability and providers remain provisional/unverified. No production deployment or Git actions occurred. TASKS.md preserves all future gates.

Manual steps for founder: review bilingual copy and scope; use `pnpm dev` with the bundled runtime prefix if Node/pnpm are not on PATH; inspect desktop/mobile layouts in both languages. No credentials are needed for M0. Preview handoff was queued by the app; it is not proof the browser tab opened or rendered. The owned preview server is stopped after verification; restart locally to view.

Next milestone (awaiting approval): M1 bilingual public booking MVP, including genuine server persistence and verified access/abuse controls. Do not proceed without explicit approval.
