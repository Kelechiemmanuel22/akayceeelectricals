import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { newsletterHtml, newsletterText, validateNewsletter } from '../_shared/newsletter.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)
  let claimed: string | null = null, accepted = 0
  let client: SupabaseClient | null = null
  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Authentication is required.' }, 401)
    client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (!user || authError) return json({ error: 'Authentication is required.' }, 401)
    const { data: profile, error: roleError } = await client.from('profiles').select('role').eq('id', user.id).single()
    if (roleError || profile?.role !== 'owner') return json({ error: 'Owner access is required.' }, 403)
    const body = await req.json(), action = body.action || 'send'
    const key = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('NEWSLETTER_FROM_EMAIL'), site = Deno.env.get('PUBLIC_SITE_URL')
    const replyTo = Deno.env.get('NEWSLETTER_REPLY_TO_EMAIL') || 'kelechiemmanuel999@gmail.com'
    const missing = [!key && 'RESEND_API_KEY', !from && 'NEWSLETTER_FROM_EMAIL', !site && 'PUBLIC_SITE_URL'].filter(Boolean)
    const [campaignProbe, subscriberProbe] = await Promise.all([
      client.from('newsletter_campaigns').select('recipient_ids,accepted_count,last_error').limit(1),
      client.from('newsletter_subscribers').select('unsubscribe_token').limit(1),
    ])
    const schemaReady = !campaignProbe.error && !subscriberProbe.error
    let settingsValid = false
    try {
      const origin = new URL(site || '')
      settingsValid = origin.protocol === 'https:' && !origin.username && !origin.password && origin.pathname === '/' && !origin.search && !origin.hash && /@akayceeelectricals\.com>?$/i.test(from || '')
    } catch { /* Missing or invalid site settings are not ready. */ }
    if (action === 'status') return json({ ready: schemaReady && !missing.length && settingsValid, schemaReady, missing: missing.length ? missing : settingsValid ? [] : ['valid NEWSLETTER_FROM_EMAIL and PUBLIC_SITE_URL'] })
    if (!schemaReady) throw Error('Apply newsletter migration 008 before sending.')
    if (missing.length) throw Error('Configure Supabase Edge Function secrets: ' + missing.join(', ') + '.')
    const base = new URL(site!)
    if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw Error('PUBLIC_SITE_URL must be the HTTPS website origin.')
    if (!/@akayceeelectricals\.com>?$/i.test(from!)) throw Error('Use a sender at the verified akayceeelectricals.com domain.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) throw Error('Use a valid NEWSLETTER_REPLY_TO_EMAIL.')
    if (!['test', 'send'].includes(action) || typeof body.campaignId !== 'string' || !uuid.test(body.campaignId)) throw Error('Choose a valid campaign and action.')
    const { data: campaign, error: campaignError } = await client.from('newsletter_campaigns').select('*').eq('id', body.campaignId).single()
    if (campaignError || !campaign) throw Error('Campaign not found.')
    if (campaign.status !== 'draft') throw Error('Only unsent drafts can be sent or tested. Check Resend logs before recreating a failed campaign.')
    validateNewsletter(campaign)
    const sendBatch = async (emails: unknown[], idempotencyKey: string) => {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(emails), signal: AbortSignal.timeout(20000),
      })
      if (!response.ok) throw Error('Resend rejected the send (' + response.status + '). Check sender, key permissions and account limits.')
      const result = await response.json()
      if (!Array.isArray(result.data) || result.data.length !== emails.length || result.data.some((item: { id?: string }) => !item.id)) throw Error('Resend returned an incomplete result. Check provider logs before another send.')
      return result.data.length as number
    }
    if (action === 'test') {
      if (!user.email) throw Error('Your signed-in owner account needs an email address.')
      await sendBatch([{ from, reply_to: replyTo, to: [user.email], subject: '[TEST] ' + campaign.subject, html: newsletterHtml(campaign, null), text: newsletterText(campaign, null) }], 'newsletter-test/' + campaign.id + '/' + crypto.randomUUID())
      return json({ message: 'Test accepted by Resend for your owner email. Check your inbox and spam folder.' })
    }
    const ids: string[] = campaign.recipient_ids || []
    if (!ids.length || ids.length > 1000 || ids.some(id => !uuid.test(id))) throw Error('Select between 1 and 1,000 subscribed recipients.')
    const { data: audience, error: audienceError } = await client.rpc('newsletter_campaign_recipients', { selected_ids: ids })
    const subscribers = audience as { id: string; email: string; unsubscribe_token: string }[] | null
    if (audienceError) throw Error('Could not verify subscriber consent.')
    if (!subscribers?.length) throw Error('No selected recipients are currently subscribed.')
    // Atomic draft-to-sending claim prevents concurrent campaign sends.
    const { data: lock, error: lockError } = await client.from('newsletter_campaigns').update({ status: 'sending', recipient_count: subscribers.length, accepted_count: 0, last_error: '' }).eq('id', campaign.id).eq('status', 'draft').select('id').maybeSingle()
    if (lockError || !lock) throw Error('This campaign has already been claimed. Refresh its status.')
    claimed = campaign.id
    for (let offset = 0; offset < subscribers.length; offset += 100) {
      const batch = subscribers.slice(offset, offset + 100)
      const { data: stillSubscribed, error: consentError } = await client.from('newsletter_subscribers').select('id').in('id', batch.map(item => item.id)).eq('status', 'confirmed')
      if (consentError) throw Error('Could not recheck consent before sending.')
      const allowed = new Set(stillSubscribed?.map(item => item.id))
      const emails = batch.filter(item => allowed.has(item.id)).map(item => {
        const unsubscribe = new URL('/unsubscribe', base)
        unsubscribe.searchParams.set('token', item.unsubscribe_token)
        return { from, reply_to: replyTo, to: [item.email], subject: campaign.subject, html: newsletterHtml(campaign, unsubscribe.href), text: newsletterText(campaign, unsubscribe.href), headers: { 'List-Unsubscribe': '<' + unsubscribe.href + '>' } }
      })
      if (emails.length) accepted += await sendBatch(emails, 'newsletter/' + campaign.id + '/batch/' + offset / 100)
      const { error: progressError } = await client.from('newsletter_campaigns').update({ accepted_count: accepted }).eq('id', campaign.id)
      if (progressError) throw Error('Emails were accepted but status could not be saved. Check provider logs; do not resend.')
      if (offset + 100 < subscribers.length) await new Promise(resolve => setTimeout(resolve, 600))
    }
    const { error: finalError } = await client.from('newsletter_campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: accepted, accepted_count: accepted }).eq('id', campaign.id)
    if (finalError) throw Error('Sending finished but status could not be saved. Check provider logs; do not resend.')
    return json({ accepted, message: accepted + ' individual emails accepted by Resend. This is not a delivery or open count.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process newsletter.'
    if (claimed && client) await client.from('newsletter_campaigns').update({ status: 'failed', accepted_count: accepted, last_error: message }).eq('id', claimed)
    return json({ error: message }, 400)
  }
})
