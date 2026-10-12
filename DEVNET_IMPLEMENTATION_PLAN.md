# Isolated Devnet escrow — implementation and verification plan

Status: blocked on verified local Solana/Anchor toolchain. No contract, wallet connection, escrow deposit, deployment or confirmed transaction exists yet. Public demo controls remain disabled. This is a plan, not a security implementation.

Environment inspection:
- PowerShell Get-Command found no solana, anchor, cargo or rustc on PATH.
- wsl.exe exists, but wsl --list --quiet / wsl --status did not establish a usable Linux environment (status command exited 1 and returned usage output).
- No Docker command found on PATH.
- Windows setup follows official Anchor WSL instructions: https://www.anchor-lang.com/docs/installation

Proposed program:
- A fresh random 32-byte demo ID per escrow; never derive from booking, email, journal or authenticated user ID.
- PDA derived only from constant domain separator, depositor public key and random demo ID. Wallet public key is visible onchain and is not linked by the application to health/booking identity.
- Escrow stores depositor/provider wallet, integer lamports, expiry, state and PDA bump. No medical text, hashes, external contact or booking metadata.
- Fund once with a small displayed test amount after wallet confirmation. Checked integer math; exact account owner/PDA/signer/recipient checks.
- Depositor authorizes release to the fixed provider; expiry permits depositor refund. No operator/admin withdrawal. A funded escrow ends in released or refunded exactly once.
- Contact organizer link remains ordinary external contact; do not describe it as protected by a deposit gate. Successful deposit UI requires real chain confirmation.

Required tests before enabling wallet actions:
1. Actual local-validator fund/release and expired refund.
2. Wrong depositor signer, wrong provider/recipient, wrong PDA/vault, wrong program owner.
3. Duplicate fund/release/refund, early refund, overflow and invalid-state paths.
4. Devnet cluster identity verified before signing; reject mainnet/testnet and inconsistent RPC/wallet selection.
5. Show success only after a successful confirmed transaction and verified escrow account state. Explorer links always specify Devnet.
6. Language toggle preserves wallet state without requesting a signature or transaction. Wallet state remains separate from email/journal state.

Approval needed: system-level WSL/Linux setup and Rust/Solana/Anchor installation, which may require administrator privileges or reboot. Do not install without explicit permission. Creating a Devnet deployer key and publishing a program also require separately reviewed authorization; never print its secret key or request the user's wallet seed phrase.

After prerequisites: scaffold and build the contract, run all adversarial tests, integrate both locales, then review actual Devnet deployment/funding before sending transactions.
