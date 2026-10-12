import { address, AccountRole, createSolanaRpc, createTransactionMessage, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, appendTransactionMessageInstruction, compileTransaction, getTransactionEncoder, getTransactionDecoder, getBase64EncodedWireTransaction, type Address, type Instruction } from '@solana/kit'
import type { SolanaSignTransactionFeature, SolanaSignTransactionInput } from '@solana/wallet-standard-features'
import { escrowProgram } from './escrow'

export const demoRecipient = address('4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ')
export const demoRpc = 'https://api.devnet.solana.com'
const genesis = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'
const rpc = createSolanaRpc(demoRpc)
type WalletAccount = SolanaSignTransactionInput['account']
type SignMethod = SolanaSignTransactionFeature['solana:signTransaction']['signTransaction']
export function verifySignedMessage(unsigned: Uint8Array, signed: Uint8Array) {
  if (signed.length > 1232) throw new Error('Wallet changed transaction')
  const original = getTransactionDecoder().decode(unsigned).messageBytes
  const returned = getTransactionDecoder().decode(signed).messageBytes
  if (original.length !== returned.length || !original.every((byte, index) => byte === returned[index])) throw new Error('Wallet changed transaction')
}
export async function networkReady(requireProgram = true) {
  const options = { abortSignal: AbortSignal.timeout(8000) }
  if (await rpc.getGenesisHash().send(options) !== genesis) throw new Error('Wrong network')
  if (!requireProgram) return
  const program = (await rpc.getAccountInfo(escrowProgram, { encoding: 'base64', commitment: 'confirmed' }).send(options)).value
  if (!program?.executable || program.owner !== 'BPFLoaderUpgradeab1e11111111111111111111111') throw new Error('Program unavailable')
}
export async function chainTime() {
  const slot = await rpc.getSlot({ commitment: 'confirmed' }).send({ abortSignal: AbortSignal.timeout(8000) })
  const timestamp = await rpc.getBlockTime(slot).send({ abortSignal: AbortSignal.timeout(8000) })
  if (timestamp === null) throw new Error('Clock unavailable')
  return timestamp
}
export async function requestDemoTransaction(account: WalletAccount, sign: SignMethod, instruction: Instruction, payer: Address) {
  if (instruction.programAddress !== escrowProgram) throw new Error('Invalid program')
  return requestTransaction(account, sign, instruction, payer, true)
}
export function deploymentFundingInstruction(payer: Address): Instruction {
  if (payer !== '7Vw7cQoJqxR3DQpWnpXTtE9Wq2BNzxkqep2b6vkCMwVE') throw new Error('Select the founder test wallet')
  const data = new Uint8Array(12)
  const view = new DataView(data.buffer)
  view.setUint32(0, 2, true); view.setBigUint64(4, 1_600_000_000n, true)
  return { programAddress: address('11111111111111111111111111111111'), accounts: [{ address: payer, role: AccountRole.WRITABLE_SIGNER }, { address: demoRecipient, role: AccountRole.WRITABLE }], data }
}
export type FundingStage = 'checking' | 'simulating' | 'wallet' | 'broadcasting' | 'confirming'
export async function requestDeploymentFunding(account: WalletAccount, sign: SignMethod, progress: (stage: FundingStage) => void = () => {}) {
  progress('checking')
  const payer = address(account.address)
  await networkReady(false)
  const balance = (await rpc.getBalance(demoRecipient, { commitment: 'confirmed' }).send({ abortSignal: AbortSignal.timeout(8000) })).value
  if (balance >= 1_500_000_000n) throw new Error('Deployment already funded')
  return requestTransaction(account, sign, deploymentFundingInstruction(payer), payer, false, progress)
}
async function requestTransaction(account: WalletAccount, sign: SignMethod, instruction: Instruction, payer: Address, requireProgram: boolean, progress: (stage: FundingStage) => void = () => {}) {
  if (!account.chains.includes('solana:devnet') || !account.features.includes('solana:signTransaction') || account.address !== payer) throw new Error('Unsupported wallet')
  await networkReady(requireProgram)
  const block = (await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send({ abortSignal: AbortSignal.timeout(8000) })).value
  const message = appendTransactionMessageInstruction(instruction, setTransactionMessageLifetimeUsingBlockhash(block, setTransactionMessageFeePayer(payer, createTransactionMessage({ version: 0 }))))
  const unsigned = compileTransaction(message)
  const wire = getBase64EncodedWireTransaction(unsigned)
  progress('simulating')
  const simulated = await rpc.simulateTransaction(wire, { encoding: 'base64', sigVerify: false, commitment: 'confirmed' }).send({ abortSignal: AbortSignal.timeout(8000) })
  if (simulated.value.err) throw new Error('Simulation rejected')
  progress('wallet')
  const outputs = await sign({ account, transaction: new Uint8Array(getTransactionEncoder().encode(unsigned)), chain: 'solana:devnet', options: { preflightCommitment: 'confirmed' } })
  if (outputs.length !== 1) throw new Error('Invalid wallet response')
  verifySignedMessage(new Uint8Array(getTransactionEncoder().encode(unsigned)), outputs[0].signedTransaction)
  await networkReady(requireProgram)
  const signed = getTransactionDecoder().decode(outputs[0].signedTransaction)
  progress('broadcasting')
  const signature = await rpc.sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 0n }).send({ abortSignal: AbortSignal.timeout(15000) })
  progress('confirming')
  for (let attempt = 0; attempt < 90; attempt++) {
    const status = (await rpc.getSignatureStatuses([signature]).send({ abortSignal: AbortSignal.timeout(8000) })).value[0]
    if (status?.err) throw new Error('Transaction failed')
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') return signature
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error('Confirmation pending; do not resubmit automatically')
}
