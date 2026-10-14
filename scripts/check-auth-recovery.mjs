import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const code = stripTypeScriptTypes(readFileSync(new URL('../src/lib/authRecovery.ts', import.meta.url), 'utf8'))
const { isPasswordRecoveryCallback, createRecoveryTracker, recoveryDestination } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
assert.equal(isPasswordRecoveryCallback('#type=recovery&access_token=dummy-test-only'), true)
assert.equal(isPasswordRecoveryCallback('#type=invite'), false)
assert.equal(isPasswordRecoveryCallback('#categories'), false)
assert.equal(isPasswordRecoveryCallback(''), false)
const tracker = createRecoveryTracker()
tracker.handle('SIGNED_IN'); tracker.handle('TOKEN_REFRESHED')
assert.equal(tracker.isPending(), false)
tracker.handle('PASSWORD_RECOVERY')
assert.equal(tracker.isPending(), true, 'Recovery must survive before the owner route mounts.')
let signals = 0
const unsubscribe = tracker.subscribe(() => signals++)
assert.equal(tracker.isPending(), true, 'A late subscriber can recover the event.')
tracker.clear(); assert.equal(tracker.isPending(), false)
tracker.handle('PASSWORD_RECOVERY'); assert.equal(signals, 1)
unsubscribe(); tracker.handle('PASSWORD_RECOVERY'); assert.equal(signals, 1)
tracker.handle('SIGNED_OUT'); assert.equal(tracker.isPending(), false)
assert.equal(createRecoveryTracker(true).isPending(), true)
assert.equal(recoveryDestination(true), '/ak-owner-portal?reset=1')
assert.equal(recoveryDestination(false), '/ak-owner-portal?reset=1&error=invalid_recovery')
console.log('Passed: homepage recovery detection, early-event retention, late subscriptions, normal-login exclusion, sign-out clearing and invalid-session routing.')
