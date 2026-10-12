// Run explicitly against the configured synthetic test project. Never print credentials/PII.
import { createApi } from './api'
import { supabaseStore } from './store'
import { emptyDraft } from '../src/booking-schema'
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error('Missing server configuration')
const origin = 'http://127.0.0.1:4173'
const store = supabaseStore(url, key)
const api = createApi({ origin, store, syntheticOnly: true })
const input = { ...emptyDraft(), name: 'Synthetic Cloud Visitor', email: 'cloud-test@example.test', date: '2099-01-02', terms: true, privacy: true }
const response = await api(new Request(origin + '/api/bookings', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(input) }), 'synthetic-cloud-test')
if (response.status !== 201) { console.info(JSON.stringify({ cloudCreateStatus: response.status, passed: false })); process.exit(1) }
const result = await response.json()
const receipt = await store.receipt(result.reference)
const safe = receipt?.status === 'REQUESTED' && Object.keys(receipt).sort().join(',') === 'handling,status'
console.info(JSON.stringify({ cloudCreateStatus: response.status, persistedReceipt: Boolean(receipt), receiptSafe: safe, passed: safe }))
if (!safe) process.exit(1)
