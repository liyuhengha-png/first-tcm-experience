// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { devnetGenesis, devnetRpc, verifyDevnet } from './devnet-network'
describe('Devnet network guard (no transactions)', () => {
  it('accepts only the expected cluster and fixed official endpoint', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: devnetGenesis })))
    await verifyDevnet(transport)
    expect(transport.mock.calls[0][0]).toBe(devnetRpc)
    expect(JSON.parse(transport.mock.calls[0][1]!.body as string).method).toBe('getGenesisHash')
  })
  it('rejects mainnet, testnet, forged/malformed envelopes and RPC failures', async () => {
    for (const body of [{ jsonrpc: '2.0', id: 1, result: 'mainnet' }, { jsonrpc: '2.0', id: 1, result: 'testnet' }, { result: devnetGenesis }, { jsonrpc: '2.0', id: 1, result: devnetGenesis, error: { code: -1 } }]) await expect(verifyDevnet(vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body))))).rejects.toThrow('Devnet unavailable')
    await expect(verifyDevnet(vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 503 })))).rejects.toThrow('Devnet unavailable')
  })
})
