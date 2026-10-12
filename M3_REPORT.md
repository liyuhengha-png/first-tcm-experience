# M3 — Solana Devnet escrow, in progress (2026-10-11)

Implemented: Anchor1.2.1 escrow and separate funds-vault PDAs; depositor/recipient constraints; checked rent-preserving transfers; capped test amount and expiry; terminal-state rejection. Final program identity synchronized. Bilingual Wallet Standard connection, explicit test-token acknowledgment, fixed 0.001 test SOL / one-hour deadline, simulation before signing, wallet-message comparison, and confirmation polling implemented. Transactions remain gated by deployed-program checks; no Devnet deployment or deposit/release success claimed.

Files changed: solana workspace/contract/lockfile/local-validator-test.ts; solana/prepare-devnet.sh and deploy-devnet.sh; src/DevnetWallet.tsx and tests; src/solana/escrow.ts, transaction.ts and transaction.test.ts; both dictionaries; server/main.ts CSP; package/lockfile; deployment and milestone/security/resume documents.

Commands and results:
- pnpm test: 73 passed across14files.
- pnpm build: TypeScript/Vite passed; wallet/transaction code split into separate assets.
- pnpm lint: passed.
- Updated transaction/wallet targeted tests:5 passed, including amount/recipient mutation rejection, no signing on locale switch, acknowledged deposit disabled before program check.
- pnpm audit: no known vulnerabilities; pnpm peers check: no issues.
- node --import tsx server/check-public-bundle.ts: passed for6public assets; bounded marker scan, not comprehensive certification.
- Final cargo-build-sbf: passed; final .so actual local-validator funding, exact release, timed refund and adversarial suite passed using Solana Kit.
- bash -n solana/deploy-devnet.sh: passed. Authorized deployment prerequisites checked; insufficient test SOL stops before broadcast.
- Actual HTTP /demo/solana and /journal:200; Devnet connect-src allowed only on demo; journal remains no-store and does not allow Devnet RPC.

Security verified: actual final local contract rejects unauthorized signer, wrong vault/recipient/PDA, duplicate operations, premature refund, expired release, zero/oversized amount, invalid ID/expiry; failed attacks preserve vault funds. Browser message comparison rejects modified amount/recipient/malformed bytes. Two-language acknowledgment persists without signing on locale switch. Deployment scripts recheck fixed Devnet genesis, artifact hash and program identity. Key generation/deploy diagnostics redirected to private Linux files to avoid leaking recovery secrets.

Not implemented / risks / blockers: official faucet did not fund wallet; balance0SOL. Actual browser-wallet signing/simulation/confirmation and Devnet deposit/release remain unverified. Account/escrow recovery after refresh absent; keep demo tab open. Upgrade authority retained and disclosed. Rent locked; extra vault deposits unrecoverable. No clinical/provider/dispute verification. Real journal input remains disabled. No public website launch.

Manual founder step: obtain/transfer about2 Devnet test SOL to deployment public address4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ. Never send mainnet SOL. Founder approved Devnet deployment and has a wallet for personal signing. Do not ask for deployment permission again for this reviewed artifact.

Next: resume already-authorized Devnet deployment when funded; verify executable/authority/signature; conduct founder wallet deposit/release test with explicit network/recipient/amount; then finish remaining M3 checks. No website publishing or paid resources authorized.
Founder requested help moving own Devnet funds from MetaMask. Added temporary bilingual founder deployment funding UI and fixed SystemProgram transfer helper: only public founder7Vw7cQoJqxR3DQpWnpXTtE9Wq2BNzxkqep2b6vkCMwVE to deployment4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ, exactly1.6testSOL, Devnet genesis checked, simulate before wallet sign, signed-message unchanged check, confirmed result only. Refuses funding if receiver already has>=1.5SOL. No auto-sign; explicit separate checkbox; current-tab attempt lock. Browser wallet compatibility/actual transfer remains unverified. No mainnet supported. Remove setup UI before public launch.
Founder funding helper checks complete: full pnpm test74/74 across14files, targeted6pass, lint and build/typecheck pass. Public bundle marker scan6filespass and /demo/solana HTTP200. Actual MetaMask connection/transfer requires founder browser test; no deployment success claimed.
Fixed pre-broadcast funding failures incorrectly left in confirmation lock: now phase progress/localized failure/current connected Solana address shown, method bound to wallet feature, retry only reopened before any broadcast attempt. After broadcast uncertainty remains locked. Actual Devnet preparation and simulation reached the signing callback in a no-sign/no-broadcast Node check; read-only check passed. Founder browser signing remains unverified; deployment balance0SOL. Targeted6tests and build passed; wrong-account retry regression being checked. No credentials logged.
