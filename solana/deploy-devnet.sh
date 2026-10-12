#!/usr/bin/env bash
# Founder approved this exact Devnet deployment on 2026-10-11.
set -euo pipefail
export PATH=/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/bin:/usr/bin:/bin
umask 077
workspace=$(cd "$(dirname "$0")/.." && pwd)
rpc=https://api.devnet.solana.com
program=4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B
artifact="$workspace/solana/target/deploy/demo_escrow.so"
identity="$workspace/solana/target/deploy/demo_escrow-keypair.json"
private_dir=/root/first-tcm-devnet-private
payer="$private_dir/deployment-keypair.json"
[[ "$(solana genesis-hash --url "$rpc")" == EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG ]] || { echo 'Wrong network; stopped'; exit 1; }
[[ "$(sha256sum "$artifact" | cut -d ' ' -f1)" == 65b6e0f3db57ba20ba4602f8544c92c0fbd7a58dd6869cd2a2bd5d269922aed9 ]] || { echo 'Artifact changed; stopped'; exit 1; }
[[ "$(solana-keygen pubkey "$identity")" == "$program" ]] || { echo 'Program identity mismatch; stopped'; exit 1; }
[[ -f "$payer" ]] || { echo 'Missing approved deployment payer'; exit 1; }
balance=$(solana balance --keypair "$payer" --url "$rpc" --lamports | cut -d ' ' -f1)
if [[ "$balance" -lt 1500000000 ]]; then
  echo 'Insufficient Devnet test SOL; stopped before deployment'
  exit 2
fi
buffer="$private_dir/buffer-keypair.json"
if [[ ! -f "$buffer" ]]; then
  solana-keygen new --no-bip39-passphrase --silent --outfile "$buffer" > "$private_dir/buffer-keygen.log" 2>&1
fi
if ! solana program deploy "$artifact" --program-id "$identity" --buffer "$buffer" --keypair "$payer" --upgrade-authority "$payer" --url "$rpc" --use-rpc --commitment confirmed --output json > "$private_dir/deploy.json" 2> "$private_dir/deploy-error.log"; then
  echo 'Deployment did not complete; private diagnostic output retained without exposing recovery secrets'
  exit 1
fi
solana program show "$program" --url "$rpc" --output json > "$private_dir/program-info.json" 2> "$private_dir/program-info-error.log"
python3 - "$private_dir/deploy.json" "$private_dir/program-info.json" <<'PY'
import json,re,sys
try:
    deployed=json.load(open(sys.argv[1]))
    info=json.load(open(sys.argv[2]))
    result={}
    for source in (deployed,info):
        for key in ('programId','signature','authority','programdataAddress'):
            value=source.get(key)
            if isinstance(value,str) and re.fullmatch(r'[1-9A-HJ-NP-Za-km-z]{32,88}',value): result[key]=value
    assert result.get('programId')=='4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B'
    print(json.dumps({'network':'devnet','publicDeploymentResult':result}))
except Exception:
    print('Deployment output requires private inspection; success not claimed')
    sys.exit(1)
PY
