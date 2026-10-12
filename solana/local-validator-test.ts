import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { address as parseAddress, createSolanaRpc, generateKeyPairSigner, getProgramDerivedAddress, getAddressEncoder, AccountRole, createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstruction, signTransactionMessageWithSigners, getBase64EncodedWireTransaction, lamports, type Address, type Signature } from '@solana/kit'

// Local validator only. Keys are ephemeral, never printed or written.
const rpc = createSolanaRpc('http://127.0.0.1:8899')
const program = parseAddress('4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B')
const system = parseAddress('11111111111111111111111111111111')
const depositor = await generateKeyPairSigner(), provider = await generateKeyPairSigner(), attacker = await generateKeyPairSigner()
const amount = 1_000_000_000n
const discriminator = (name: string) => createHash('sha256').update(`global:${name}`).digest().subarray(0, 8)
const integer = (value: bigint, signed = false) => { const b = Buffer.alloc(8); if (signed) b.writeBigInt64LE(value); else b.writeBigUInt64LE(value); return b }
const key = (address: Address, isSigner: boolean, isWritable: boolean) => ({ address, role: isSigner ? isWritable ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY_SIGNER : isWritable ? AccountRole.WRITABLE : AccountRole.READONLY })
const address = async (id: Buffer) => (await getProgramDerivedAddress({ programAddress: program, seeds: [Buffer.from('demo-escrow'), getAddressEncoder().encode(depositor.address), id] }))[0]
const fundsAddress = async (escrow: Address) => (await getProgramDerivedAddress({ programAddress: program, seeds: [Buffer.from('demo-vault'), getAddressEncoder().encode(escrow)] }))[0]
async function clock() { const slot = await rpc.getSlot().send(); const time = await rpc.getBlockTime(slot).send(); assert.notEqual(time, null); return BigInt(time!) }
async function confirm(signature: Signature) {
  for (let i = 0; i < 120; i++) {
    const status = (await rpc.getSignatureStatuses([signature]).send()).value[0]
    if (status?.err) throw new Error('Confirmed transaction failed')
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('Local confirmation timed out')
}
async function send(name: string, keys: ReturnType<typeof key>[], data = Buffer.alloc(0), signer = depositor) {
  const block = (await rpc.getLatestBlockhash().send()).value
  const message = appendTransactionMessageInstruction({ programAddress: program, accounts: keys, data: Buffer.concat([discriminator(name), data]) }, setTransactionMessageLifetimeUsingBlockhash(block, setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 }))))
  const signed = await signTransactionMessageWithSigners(message)
  const signature = await rpc.sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: 'base64', preflightCommitment: 'confirmed' }).send()
  await confirm(signature)
  return signature
}
async function fund(id: Buffer, expiry: bigint, value = amount, vault?: Address) {
  const escrow = vault ?? await address(id)
  return send('fund', [key(depositor.address, true, true), key(provider.address, false, false), key(escrow, false, true), key(await fundsAddress(escrow), false, true), key(system, false, false)], Buffer.concat([id, integer(value), integer(expiry, true)]))
}
async function release(vault: Address, recipient = provider.address, signer = depositor, funds?: Address) {
  return send('release', [key(signer.address, true, false), key(recipient, false, true), key(vault, false, true), key(funds ?? await fundsAddress(vault), false, true)], Buffer.alloc(0), signer)
}
async function refund(vault: Address) { return send('refund', [key(depositor.address, true, true), key(vault, false, true), key(await fundsAddress(vault), false, true)]) }
async function state(vault: Address) { const account = (await rpc.getAccountInfo(vault, { encoding: 'base64' }).send()).value; assert(account); assert.equal(account.owner, program); return Buffer.from(account.data[0], 'base64')[120] }
async function balance(vault: Address) { return (await rpc.getBalance(vault).send()).value }
async function rejected(action: () => Promise<unknown>) {
  await assert.rejects(action, (error: unknown) => {
    // Transport/timeouts are test failures, not evidence of program authorization.
    assert(error instanceof Error)
    assert.match(error.message, /Transaction simulation failed|custom program error|already in use/)
    return true
  })
}

for (const wallet of [depositor, provider, attacker]) {
  const signature = await rpc.requestAirdrop(wallet.address, lamports(3_000_000_000n)).send()
  await confirm(signature)
}
assert((await rpc.getAccountInfo(program).send()).value?.executable, 'Load the compiled program in the local validator first')
const id = randomBytes(32), vault = await address(id), expiry = await clock() + 120n
await fund(id, expiry)
assert.equal(await state(vault), 0)
const protectedBalance = await balance(await fundsAddress(vault))
await rejected(() => fund(id, expiry))
await rejected(() => release(vault, provider.address, attacker))
await rejected(() => release(vault, attacker.address))
await rejected(() => release(vault, provider.address, depositor, vault))
await rejected(() => refund(vault))
assert.equal(await balance(await fundsAddress(vault)), protectedBalance)
const before = await balance(provider.address)
await release(vault)
assert.equal(await balance(provider.address) - before, amount)
assert.equal(await state(vault), 1)
await rejected(() => release(vault))
await rejected(() => refund(vault))
await rejected(() => fund(randomBytes(32), expiry, 0n))
await rejected(() => fund(randomBytes(32), expiry, 1_000_000_001n))
await rejected(() => fund(Buffer.alloc(32), expiry))
await rejected(() => fund(randomBytes(32), 0n))
await rejected(async () => fund(randomBytes(32), await clock() + 86_500n))
await rejected(() => fund(randomBytes(32), expiry, amount, attacker.address))
const refundId = randomBytes(32), refundVault = await address(refundId), refundExpiry = await clock() + 8n
await fund(refundId, refundExpiry)
while (await clock() < refundExpiry) await new Promise(resolve => setTimeout(resolve, 1000))
await rejected(() => release(refundVault))
const refundBefore = await balance(await fundsAddress(refundVault))
await refund(refundVault)
assert.equal(refundBefore - await balance(await fundsAddress(refundVault)), amount)
assert.equal(await state(refundVault), 2)
await rejected(() => refund(refundVault))
console.log('PASS: local validator funding, exact release, timed refund and rejected adversarial flows; no Devnet transaction sent.')


