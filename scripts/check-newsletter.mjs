import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

const sharedCode = stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/_shared/newsletter.ts', import.meta.url), 'utf8'))
const { newsletterHtml, validateNewsletter } = await import(`data:text/javascript;base64,${Buffer.from(sharedCode).toString('base64')}`)
const sample = { subject: 'Store news', preview_text: 'New catalogue updates', headline: '<script>Not HTML</script>', body: 'A message & details', button_label: 'Explore', button_url: 'https://akayceeelectricals.com/#categories' }
const html = newsletterHtml(sample, 'https://akayceeelectricals.com/unsubscribe?token=test-token')
assert.ok(html.includes('&lt;script&gt;Not HTML&lt;/script&gt;'))
assert.ok(html.includes('A message &amp; details'))
assert.ok(html.includes('New catalogue updates'))
assert.ok(html.includes('Unsubscribe'))
assert.ok(!html.includes('<script>'))
assert.ok(newsletterHtml(sample, null).includes('Owner-only test email'))
assert.throws(() => validateNewsletter({ ...sample, button_url: 'javascript:alert(1)' }))
assert.throws(() => validateNewsletter({ ...sample, button_url: 'https://user:password@example.com' }))
assert.throws(() => validateNewsletter({ ...sample, subject: 'hello\nBcc: other@example.com' }))
assert.throws(() => validateNewsletter({ ...sample, body: '' }))
// Compile the actual Edge Function and verify guards with fake clients. Never
// connect to Supabase or Resend, and fail immediately if a send is attempted.
const edgeCode = stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/send-newsletter/index.ts', import.meta.url), 'utf8').replace(/^import .*\n/gm, ''))
let handler
let role = 'owner', configured = false
const query = (table) => {
  const result = { data: table === 'profiles' ? { role } : [], error: null }
  const chain = { select() { return chain }, eq() { return chain }, single() { return Promise.resolve(result) }, limit() { return Promise.resolve(result) } }
  return chain
}
const context = { Response, URL, AbortSignal, setTimeout, crypto, newsletterHtml, validateNewsletter, newsletterText() { return '' }, createClient() { return { auth: { async getUser() { return { data: { user: { id: 'test-owner', email: 'owner@example.com' } }, error: null } } }, from: query } }, fetch() { throw Error('Tests must not send email.') }, Deno: { serve(fn) { handler = fn }, env: { get(name) { return configured ? ({ RESEND_API_KEY: 'test-only-not-real', NEWSLETTER_FROM_EMAIL: 'A Kaycee Electricals <updates@akayceeelectricals.com>', PUBLIC_SITE_URL: 'https://akayceeelectricals.com' })[name] : undefined } } } }
vm.runInNewContext(edgeCode, context)
const request = body => new Request('https://example.test/send-newsletter', { method: 'POST', headers: { Authorization: 'Bearer dummy-test-only', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
assert.equal((await handler(new Request('https://example.test/send-newsletter', { method: 'GET' }))).status, 405)
assert.equal((await handler(new Request('https://example.test/send-newsletter', { method: 'POST' }))).status, 401)
role = 'admin'; assert.equal((await handler(request({ action: 'status' }))).status, 403)
role = 'owner'
assert.equal((await (await handler(request({ action: 'status' }))).json()).ready, false)
configured = true
assert.equal((await (await handler(request({ action: 'status' }))).json()).ready, true)
assert.equal((await handler(request({ action: 'send', campaignId: 'not-a-uuid' }))).status, 400)
console.log('Passed: newsletter escaping, HTTPS links, preview/footer, content bounds, HTTP/auth/owner guards and setup readiness. No emails sent.')
