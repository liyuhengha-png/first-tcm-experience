import { address, getAddressEncoder, getProgramDerivedAddress, AccountRole, type Address, type Instruction } from '@solana/kit'

export const escrowProgram = address('4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B')
const system = address('11111111111111111111111111111111')
const utf8 = new TextEncoder()
const meta = (address: Address, role: AccountRole) => ({ address, role })
export async function escrowAddresses(depositor: Address, demoId: Uint8Array) {
  if (demoId.length !== 32 || demoId.every(byte => byte === 0)) throw new Error('Invalid demo ID')
  const [escrow] = await getProgramDerivedAddress({ programAddress: escrowProgram, seeds: [utf8.encode('demo-escrow'), getAddressEncoder().encode(depositor), demoId] })
  const [vault] = await getProgramDerivedAddress({ programAddress: escrowProgram, seeds: [utf8.encode('demo-vault'), getAddressEncoder().encode(escrow)] })
  return { escrow, vault }
}
async function instructionData(name: string, extra = new Uint8Array(0)) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', utf8.encode(`global:${name}`)))
  const data = new Uint8Array(8 + extra.length)
  data.set(hash.subarray(0, 8)); data.set(extra, 8)
  return data
}
export async function fundInstruction(depositor: Address, recipient: Address, demoId: Uint8Array, amount: bigint, expiry: bigint): Promise<Instruction> {
  if (depositor === recipient || amount <= 0n || amount > 1_000_000_000n || expiry <= 0n || expiry > 9_223_372_036_854_775_807n) throw new Error('Invalid deposit')
  const { escrow, vault } = await escrowAddresses(depositor, demoId)
  const args = new Uint8Array(48)
  args.set(demoId)
  const view = new DataView(args.buffer)
  view.setBigUint64(32, amount, true); view.setBigInt64(40, expiry, true)
  return { programAddress: escrowProgram, accounts: [meta(depositor, AccountRole.WRITABLE_SIGNER), meta(recipient, AccountRole.READONLY), meta(escrow, AccountRole.WRITABLE), meta(vault, AccountRole.WRITABLE), meta(system, AccountRole.READONLY)], data: await instructionData('fund', args) }
}
export async function releaseInstruction(depositor: Address, recipient: Address, demoId: Uint8Array): Promise<Instruction> {
  const { escrow, vault } = await escrowAddresses(depositor, demoId)
  return { programAddress: escrowProgram, accounts: [meta(depositor, AccountRole.READONLY_SIGNER), meta(recipient, AccountRole.WRITABLE), meta(escrow, AccountRole.WRITABLE), meta(vault, AccountRole.WRITABLE)], data: await instructionData('release') }
}
export async function refundInstruction(depositor: Address, demoId: Uint8Array): Promise<Instruction> {
  const { escrow, vault } = await escrowAddresses(depositor, demoId)
  return { programAddress: escrowProgram, accounts: [meta(depositor, AccountRole.WRITABLE_SIGNER), meta(escrow, AccountRole.WRITABLE), meta(vault, AccountRole.WRITABLE)], data: await instructionData('refund') }
}
