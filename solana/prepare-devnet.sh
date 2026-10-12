#!/usr/bin/env bash
set -euo pipefail
export PATH=/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/bin:/usr/bin:/bin
umask 077
rpc=https://api.devnet.solana.com
expected=EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG
[[ "$(solana genesis-hash --url "$rpc")" == "$expected" ]] || { echo 'Wrong network; stopped'; exit 1; }
private_dir=/root/first-tcm-devnet-private
mkdir -p "$private_dir"
chmod 700 "$private_dir"
payer="$private_dir/deployment-keypair.json"
if [[ ! -f "$payer" ]]; then
  solana-keygen new --no-bip39-passphrase --silent --outfile "$payer" > "$private_dir/keygen.log" 2>&1
fi
chmod 600 "$payer"
public_address=$(solana-keygen pubkey "$payer")
printf 'Devnet deployment payer public address: %s\n' "$public_address"
if solana airdrop 2 "$public_address" --url "$rpc" > "$private_dir/airdrop.log" 2>&1; then
  echo 'Devnet faucet request completed'
else
  echo 'Devnet faucet request unavailable; no deployment attempted'
fi
solana balance "$public_address" --url "$rpc"
