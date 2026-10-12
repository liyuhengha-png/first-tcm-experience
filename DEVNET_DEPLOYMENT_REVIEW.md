# Devnet deployment review — approval required

Scope: deploy only the tested demo escrow to https://api.devnet.solana.com. No mainnet, paid cloud service, website publishing, booking settlement or medical data.

Program address: `4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B`.

Compiled artifact: `solana/target/deploy/demo_escrow.so`, SHA256 `65B6E0F3DB57BA20BA4602F8544C92C0FBD7A58DD6869CD2A2BD5D269922AED9`.

Final address-synchronized artifact passed actual local-validator tests. Independent escrow-state and vault PDAs; depositor-only release/refund; fixed recipient; amount cap 0.01 test SOL; expiry at most24h; checked math; terminal states reject duplicate funding/payout. Test keys were ephemeral and never printed. Test source: solana/local-validator-test.ts.

Deployment payer/upgrade authority: a separately generated local Devnet-only keypair, outside public assets and ignored by version control. No founder private key or seed phrase requested. Request faucet test SOL only after approval. Retain explicitly documented upgrade authority for this unfinished demo; do not freeze authority irreversibly. This authority can upgrade program code, so it is a trust limitation even though the current program has no admin withdrawal instruction.

Before any broadcast: recheck artifact hash, keypair public program address and exact Devnet genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. Use an explicit RPC URL and payer/authority path on each deployment command; preserve preflight. Capture CLI output to a private file, because CLI deployment failures can contain buffer recovery secrets. Expose only validated public addresses/signatures and generic failures.

Deployment command, after creating a Devnet-only payer and obtaining sufficient test SOL:

```sh
solana program deploy solana/target/deploy/demo_escrow.so \
  --program-id solana/target/deploy/demo_escrow-keypair.json \
  --keypair "$DEVNET_PAYER_PATH" --upgrade-authority "$DEVNET_PAYER_PATH" \
  --url https://api.devnet.solana.com --use-rpc --commitment confirmed --output json
```

After broadcast: inspect executable program account and upgrade authority, retrieve confirmed deployment signature, then prepare founder wallet deposit/release test with explicit Devnet, amount, expiry, recipient and Explorer links. Deployment success alone is not a successful deposit/release. Provider recipient must be configured from a public address; never silently invent a commercial provider.

Remaining: frontend simulation/signing/confirmation workflow, receiver configuration, real Devnet deployment and deposit/release signatures. Rent remains allocated and unsolicited vault funds are unrecoverable by current code. Website health inputs stay disabled. No public launch claimed.
