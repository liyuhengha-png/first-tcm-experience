# Devnet escrow work in progress

This contract passed Rust checking, SBF compilation and actual local-validator tests on 2026-10-11. It has not been deployed to Devnet. Do not enable a payment button from the presence of this source. Program ID is a placeholder; no confirmed Devnet signatures exist.

No booking/email/journal fields or hashes are accepted. Wallets and random demo IDs are public onchain. Deposit is at most 1 test SOL; expiry is within 24 hours. Funded state ends in released or refunded, authorized by depositor. The same PDA remains allocated to prevent reuse and preserve terminal-state rejection; its rent is not recovered in this MVP. Extra lamports sent directly to the PDA are not automatically withdrawn. Disclose both limitations before enabling wallets.

Verified tools: Rust 1.99.0, Solana 4.3.0, Anchor 1.2.1. `cargo check --locked` and `cargo-build-sbf --manifest-path programs/demo-escrow/Cargo.toml` passed. `node --import tsx solana/local-validator-test.ts` passed against a loopback-only validator loading the compiled .so, with ephemeral in-memory wallets. It verifies funding, exact recipient amount, timed refund, terminal states and rejection of attacker signer, wrong recipient/PDA, duplicate funding/release/refund, early refund, expired release, zero/oversized amount, zero ID and invalid expiry. Rejection checks require a program simulation failure; a network failure cannot count as authorization evidence.

Pending: deployment review, Devnet-only wallet/network checks, bilingual error mapping and real confirmed transactions. The program itself cannot prove cluster identity; Devnet enforcement must be implemented in deployment/frontend tooling, and mainnet is forbidden for this project.

The local-test-only web3.js SDK is not imported into the website. Full dependency audit has four moderate findings in its transitive jayson/uuid/stream-json dependencies; production dependency audit passes. Peer compatibility warnings remain. Resolve or replace this SDK before integrating it into public code; do not force incompatible major transitive overrides merely to silence audit.

Release is a depositor-authorized test transfer to the recipient selected at funding, not proof of a clinical service or real booking settlement. No provider identity is verified by this program. Public Telegram contact is a separate link; no deposit access gate is currently implemented.

Tool installation follows https://www.anchor-lang.com/docs/installation. Anchor dependency pinned to 1.2.1 from current official documentation, subject to build validation.
Latest verified checkpoint: independent state/vault PDA SBF compile and actual validator suite pass, including balance preservation under rejected attacks. Solana Kit8.4.0 replaces legacy web3.js; legacy Anchor JS package removed. Full pnpm audit reports no known vulnerabilities; pnpm peers check passes. Website pnpm build/typecheck, lint, test70/70 across13files and public bundle marker scan pass. Explicit Wallet Standard connection added in both languages; no transaction-signing action enabled. No Devnet deployment/signatures. Supersedes prior dependency/test-pending statements.
