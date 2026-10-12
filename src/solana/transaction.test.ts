// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { address, appendTransactionMessageInstruction, compileTransaction, createTransactionMessage, getTransactionEncoder, setTransactionMessageFeePayer, type Address } from '@solana/kit'
import { escrowAddresses, fundInstruction, releaseInstruction, refundInstruction, escrowProgram } from './escrow'
import { demoRecipient, deploymentFundingInstruction, verifySignedMessage } from './transaction'

const payer = address('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMQHGwUzALK')
const id = new Uint8Array(32).fill(7)
describe('Devnet transaction boundaries', () => {
  it('fixes deployment funding to the founder, intended recipient and 1.6 test SOL', () => {
    const founder = address('7Vw7cQoJqxR3DQpWnpXTtE9Wq2BNzxkqep2b6vkCMwVE')
    const instruction = deploymentFundingInstruction(founder)
    expect(instruction.programAddress).toBe('11111111111111111111111111111111')
    expect(instruction.accounts?.map(account => account.address)).toEqual([founder, demoRecipient])
    const view = new DataView(new Uint8Array(instruction.data!).buffer)
    expect(view.getUint32(0, true)).toBe(2)
    expect(view.getBigUint64(4, true)).toBe(1_600_000_000n)
    expect(() => deploymentFundingInstruction(payer)).toThrow('Select the founder test wallet')
  })
  it('encodes canonical amount and expiry with separate constrained addresses', async () => {
    const instruction = await fundInstruction(payer, demoRecipient, id, 1_000_000_000n, 1_900_000_000n)
    const addresses = await escrowAddresses(payer, id)
    expect(instruction.programAddress).toBe(escrowProgram)
    expect(instruction.accounts?.map(account => account.address)).toEqual([payer, demoRecipient, addresses.escrow, addresses.vault, '11111111111111111111111111111111'])
    expect(addresses.escrow).not.toBe(addresses.vault)
    const bytes = new Uint8Array(instruction.data!)
    const view = new DataView(bytes.buffer)
    expect(view.getBigUint64(40, true)).toBe(1_000_000_000n)
    expect(view.getBigInt64(48, true)).toBe(1_900_000_000n)
    expect(bytes.slice(8, 40)).toEqual(id)
    expect((await releaseInstruction(payer, demoRecipient, id)).accounts?.at(-1)?.address).toBe(addresses.vault)
    expect((await refundInstruction(payer, id)).accounts?.at(-1)?.address).toBe(addresses.vault)
  })
  it('rejects wallet changes to recipient, amount or instruction before broadcast', async () => {
    const encode = async (recipient: Address = demoRecipient, amount = 1_000_000_000n) => new Uint8Array(getTransactionEncoder().encode(compileTransaction(appendTransactionMessageInstruction(await fundInstruction(payer, recipient, id, amount, 1_900_000_000n), setTransactionMessageFeePayer(payer, createTransactionMessage({ version: 0 }))))))
    const original = await encode()
    expect(() => verifySignedMessage(original, original)).not.toThrow()
    expect(() => verifySignedMessage(original, new Uint8Array(1233))).toThrow()
    expect(() => verifySignedMessage(original, new Uint8Array())).toThrow()
    expect(() => verifySignedMessage(original, original.slice(1))).toThrow()
    const changedAmount = await encode(demoRecipient, 2_000_000n)
    expect(() => verifySignedMessage(original, changedAmount)).toThrow('Wallet changed transaction')
    const changedRecipient = await encode(address('11111111111111111111111111111111'))
    expect(() => verifySignedMessage(original, changedRecipient)).toThrow('Wallet changed transaction')
  })
  it('rejects unsafe inputs before asking a wallet to sign', async () => {
    await expect(fundInstruction(payer, payer, id, 1n, 1n)).rejects.toThrow()
    for (const amount of [0n, -1n, 1_000_000_001n]) await expect(fundInstruction(payer, demoRecipient, id, amount, 1n)).rejects.toThrow()
    await expect(fundInstruction(payer, demoRecipient, id, 1n, -1n)).rejects.toThrow()
    await expect(escrowAddresses(payer, new Uint8Array(32))).rejects.toThrow()
    await expect(escrowAddresses(payer, new Uint8Array(31))).rejects.toThrow()
  })
})
