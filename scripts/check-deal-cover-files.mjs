import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const source = stripTypeScriptTypes(readFileSync(new URL('../src/lib/dealCoverUpload.ts', import.meta.url), 'utf8')).replace("import { supabase } from './supabase'", 'const supabase = null')
const { validateDealCoverFile, MAX_DEAL_COVER_BYTES } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/avif']) {
  assert.equal(validateDealCoverFile({ type, size: 1234 }), '')
  assert.equal(validateDealCoverFile({ type, size: MAX_DEAL_COVER_BYTES }), '')
  assert.notEqual(validateDealCoverFile({ type, size: 0 }), '')
  assert.notEqual(validateDealCoverFile({ type, size: MAX_DEAL_COVER_BYTES + 1 }), '')
}
for (const type of ['image/svg+xml', 'application/pdf', 'video/mp4', 'text/html', '']) assert.notEqual(validateDealCoverFile({ type, size: 1234 }), '')
console.log('Cover file checks passed: supported images, size limits and unsupported-file rejection.')
