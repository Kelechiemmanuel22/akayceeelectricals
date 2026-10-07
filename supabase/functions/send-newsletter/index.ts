import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const auth = req.headers.get('Authorization')
    if (!auth) throw new Error('Authentication is required.')
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Authentication is required.')
    const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'owner') throw new Error('Owner access is required.')
    const { campaignId } = await req.json()
    const { data: campaign } = await client.from('newsletter_campaigns').select('*').eq('id', campaignId).single()
    if (!campaign) throw new Error('Campaign not found.')
    const { data: subscribers } = await client.from('newsletter_subscribers').select('email').eq('status', 'confirmed')
    const apiKey = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('NEWSLETTER_FROM_EMAIL')
    if (!apiKey || !from) throw new Error('Email delivery is not configured yet.')
    await client.from('newsletter_campaigns').update({ status: 'sending', recipient_count: subscribers?.length || 0 }).eq('id', campaignId)
    let delivered = 0
    for (const subscriber of subscribers || []) {
      const base = Deno.env.get('PUBLIC_SITE_URL') || 'https://akayceeelectricals.com'
      const unsubscribe = `${base}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [subscriber.email], subject: campaign.subject, html: emailHtml(campaign, unsubscribe) }) })
      if (response.ok) delivered++
    }
    await client.from('newsletter_campaigns').update({ status: delivered === (subscribers?.length || 0) ? 'sent' : 'failed', sent_at: new Date().toISOString(), recipient_count: delivered }).eq('id', campaignId)
    return new Response(JSON.stringify({ delivered, total: subscribers?.length || 0 }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to send campaign.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})

function safe(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]!) }
function emailHtml(c: Record<string, string>, unsubscribe: string) { return `<!doctype html><html><body style="margin:0;background:#f5f1e9;font-family:Arial,sans-serif;color:#0b111a"><div style="max-width:620px;margin:auto;padding:32px 20px"><div style="background:#071426;color:#fff;padding:32px;border-radius:20px"><p style="color:#e5ab19;font-size:12px;font-weight:bold;letter-spacing:2px">A KAYCEE ELECTRICALS</p><h1 style="font-size:36px;line-height:1.1">${safe(c.headline)}</h1><div style="color:#d7dce2;line-height:1.75;white-space:pre-line">${safe(c.body)}</div>${c.button_url ? `<p style="margin-top:28px"><a href="${safe(c.button_url)}" style="display:inline-block;background:#e5ab19;color:#071426;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${safe(c.button_label || 'Learn more')}</a></p>` : ''}</div><p style="font-size:11px;color:#68717d;text-align:center">You subscribed to A Kaycee updates. <a href="${unsubscribe}">Unsubscribe</a></p></div></body></html>` }
