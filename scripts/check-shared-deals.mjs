// Read-only integration check against the real API using the public anon key.
// No owner session, local storage or service-role key is used.
import assert from 'node:assert/strict'
import { loadEnv } from 'vite'

const env = loadEnv('production', process.cwd(), 'VITE_')
const base = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
assert.ok(base && key, 'Configure the public Supabase URL and key before running this check.')
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
const request = (path, body, method = 'POST') => fetch(`${base}/rest/v1/${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const response = await request('rpc/read_deals_catalog', {})
assert.equal(response.status, 200, 'Anonymous visitors must be able to load live deals.')
const snapshot = await response.json()
assert.equal(typeof snapshot.enabled, 'boolean')
assert.ok(Number.isSafeInteger(snapshot.revision))
assert.ok(Array.isArray(snapshot.collections) && Array.isArray(snapshot.combos))
const now = Date.now()
for (const collection of snapshot.collections) {
  assert.equal(collection.active, true, 'Paused collections must not be exposed by the API.')
  assert.ok(!collection.startsAt || Date.parse(collection.startsAt) <= now, 'Future collections must remain private.')
  assert.ok(!collection.endsAt || Date.parse(collection.endsAt) > now, 'Expired collections must remain private.')
}
for (const combo of snapshot.combos) {
  assert.equal(typeof combo.coverImage, 'string', 'The API must return a shared cover field, even when empty.')
  assert.equal(typeof combo.coverAlt, 'string')
  assert.equal(combo.active, true, 'Paused packages must not be exposed by the API.')
  assert.ok(snapshot.collections.some(c => c.id === combo.collectionId), 'A hidden collection must not expose its packages.')
  assert.ok(combo.items.length >= 2)
  assert.equal(new Set(combo.items.map(item => item.slug)).size, combo.items.length)
  assert.ok(combo.items.every(item => Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99))
}
if (process.argv.includes('--expect-off')) {
  assert.equal(snapshot.enabled, false)
  assert.deepEqual(snapshot.collections, [])
  assert.deepEqual(snapshot.combos, [])
} else if (process.argv.includes('--expect-on')) {
  assert.equal(snapshot.enabled, true)
  assert.ok(snapshot.collections.length > 0 && snapshot.combos.length > 0)
}
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--paused-collection=')) assert.ok(!snapshot.collections.some(c => c.id === arg.split('=')[1]))
  if (arg.startsWith('--paused-combo=')) assert.ok(!snapshot.combos.some(c => c.id === arg.split('=')[1]))
  if (arg.startsWith('--price=')) {
    const [id, price] = arg.slice(8).split(':')
    assert.equal(snapshot.combos.find(c => c.id === id)?.price, Number(price))
  }
  if (arg.startsWith('--has-cover=')) {
    const combo = snapshot.combos.find(c => c.id === arg.split('=')[1])
    assert.ok(combo?.coverImage?.startsWith(`${base}/storage/v1/object/public/deal-covers/combos/`), 'The uploaded cover must be persisted in the public shared snapshot.')
    const cover = await fetch(combo.coverImage)
    assert.equal(cover.status, 200, 'Visitors must be able to load the cover file.')
    assert.ok(cover.headers.get('content-type')?.startsWith('image/'))
  }
}
// Permission checks must reject attempts rather than silently relying on UI gating.
const forbiddenSave = await request('rpc/save_deals_catalog', { payload: snapshot, expected_revision: snapshot.revision })
assert.ok([401, 403].includes(forbiddenSave.status), 'Anonymous publishing must be denied.')
const forbiddenUpdate = await request('deal_settings?id=eq.1', { enabled: !snapshot.enabled }, 'PATCH')
assert.ok([401, 403].includes(forbiddenUpdate.status), 'Anonymous table updates must be denied.')
console.log(JSON.stringify({ passed: true, scope: 'anonymous shared API and denied publishing', enabled: snapshot.enabled, revision: snapshot.revision, collections: snapshot.collections.map(c => c.id), packages: snapshot.combos.map(c => ({ id: c.id, price: c.price, hasCover: Boolean(c.coverImage) })) }, null, 2))
