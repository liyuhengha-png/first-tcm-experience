// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import handler from '../api/index'

describe('hosted preview gates', () => {
  const server = createServer(handler)
  let origin: string
  beforeAll(async () => { await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}` })
  afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) })
  it('routes nested rewritten paths to a working Node function', async () => {
    const auth = await fetch(origin + '/api/index?route=auth/session')
    expect(auth.status).toBe(200)
    expect(await auth.json()).toEqual({ enabled: false, signedIn: false })
  })
  it('keeps all writes and authentication disabled across fresh requests', async () => {
    for (const path of ['/api/bookings', '/api/auth/request', '/api/auth/verify', '/api/receipts/example']) {
      const result = await fetch(origin + path, { method: 'POST' })
      expect(result.status).toBe(503)
      expect(result.headers.get('cache-control')).toBe('no-store')
    }
    const config = await fetch(origin + '/api/config')
    expect(await config.json()).toMatchObject({ bookingEnabled: false, syntheticOnly: true })
    const auth = await fetch(origin + '/api/auth/session')
    expect(await auth.json()).toEqual({ enabled: false, signedIn: false })
  })
})
