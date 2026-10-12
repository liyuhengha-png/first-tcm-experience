// Read-only cluster check; never a transaction or escrow success signal.
export const devnetRpc = 'https://api.devnet.solana.com'
export const devnetGenesis = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'
export async function verifyDevnet(transport: typeof fetch = fetch): Promise<void> {
  const response = await transport(devnetRpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getGenesisHash' }), signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('Devnet unavailable')
  const result = await response.json()
  if (result.jsonrpc !== '2.0' || result.id !== 1 || result.error || result.result !== devnetGenesis) throw new Error('Devnet unavailable')
}
