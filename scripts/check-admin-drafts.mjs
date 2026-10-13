import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const source = readFileSync(new URL('../src/lib/adminDrafts.ts', import.meta.url), 'utf8')
const compiled = stripTypeScriptTypes(source)
const { ADMIN_DRAFT_TTL, readAdminDrafts, writeAdminDrafts, clearAdminDrafts } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const entries = new Map()
const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) }
const start = 1_000_000
assert.equal(ADMIN_DRAFT_TTL, 600_000)
writeAdminDrafts('owner', { section: 'categories', creatingCategory: true, 'category:new:form': { name: 'Small appliances' } }, storage, start)
assert.equal(readAdminDrafts('owner', storage, start + ADMIN_DRAFT_TTL - 1)['category:new:form'].name, 'Small appliances')
assert.deepEqual(readAdminDrafts('another-admin', storage, start + 1), {})
// Reading does not extend the ten-minute window; a real input change does.
const resumed = readAdminDrafts('owner', storage, start + 120_000)
writeAdminDrafts('owner', { ...resumed, 'category:new:form': { name: 'Home essentials' } }, storage, start + 120_000)
assert.equal(readAdminDrafts('owner', storage, start + ADMIN_DRAFT_TTL)['category:new:form'].name, 'Home essentials')
assert.deepEqual(readAdminDrafts('owner', storage, start + 120_000 + ADMIN_DRAFT_TTL), {})
assert.equal(entries.size, 0)
writeAdminDrafts('owner', { creatingCategory: true }, storage, start)
clearAdminDrafts('owner', storage)
assert.deepEqual(readAdminDrafts('owner', storage, start), {})
storage.setItem('akaycee:admin-drafts:v1:owner', '{broken')
assert.deepEqual(readAdminDrafts('owner', storage, start), {})
const blockedStorage = { getItem() { throw Error('Blocked') }, setItem() { throw Error('Blocked') }, removeItem() { throw Error('Blocked') } }
assert.deepEqual(readAdminDrafts('owner', blockedStorage, start), {})
assert.doesNotThrow(() => writeAdminDrafts('owner', {}, blockedStorage, start))
assert.doesNotThrow(() => clearAdminDrafts('owner', blockedStorage))
console.log('Admin drafts: resume, ten-minute expiry, sliding edits, user isolation, sign-out clear, corruption and blocked storage passed.')
