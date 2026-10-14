import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Mail, RefreshCw, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Subscriber = { id: string; email: string; status: string; created_at: string }
type Campaign = { id: string; subject: string; preview_text: string; headline: string; body: string; button_label: string; button_url: string; status: string; recipient_count: number; accepted_count?: number; last_error?: string; recipient_ids?: string[]; created_at: string }
const empty = { subject: '', preview_text: '', headline: '', body: '', button_label: 'Explore catalogue', button_url: 'https://akayceeelectricals.com/#categories' }

export function AdminNewsletterPanel() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [ready, setReady] = useState(false)
  const [schemaReady, setSchemaReady] = useState(false)
  const [setup, setSetup] = useState('Checking email delivery…')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const [audience, history, probe, delivery] = await Promise.all([
        supabase.from('newsletter_subscribers').select('id,email,status,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range(0, 999),
        supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('newsletter_campaigns').select('recipient_ids,accepted_count,last_error').limit(1),
        supabase.functions.invoke('send-newsletter', { body: { action: 'status' } }),
      ])
      if (audience.error || history.error) throw Error('Could not load newsletter data. Apply migration 002 and check owner access.')
      setSubscribers(audience.data || []); setTotal(audience.count || 0); setCampaigns(history.data || [])
      setSchemaReady(!probe.error)
      const configured = !probe.error && !delivery.error && delivery.data?.ready === true
      setReady(configured)
      setSetup(configured ? 'Delivery settings detected. Test a draft to your owner email to verify them.' : probe.error ? 'Setup required: apply migration 008_newsletter_delivery.sql.' : delivery.error ? 'Setup required: deploy the updated send-newsletter Edge Function.' : 'Setup required: ' + (delivery.data?.missing?.join(', ') || 'complete the newsletter backend migration') + '.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load newsletters.'); setReady(false) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const eligible = useMemo(() => subscribers.filter(item => item.status === 'confirmed'), [subscribers])
  const shown = eligible.filter(item => item.email.toLowerCase().includes(search.trim().toLowerCase()))
  const chosen = selected.filter(id => eligible.some(item => item.id === id))
  const edit = (item: Campaign) => {
    setEditingId(item.id); setForm({ subject: item.subject, preview_text: item.preview_text, headline: item.headline, body: item.body, button_label: item.button_label || '', button_url: item.button_url || '' }); setSelected(item.recipient_ids || []); setNotice('Draft loaded. Changes must be saved before testing or sending.'); setError('')
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || busy || !schemaReady) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (form.button_url && !form.button_url.startsWith('https://')) throw Error('Use an HTTPS button link.')
      const payload = { ...form, subject: form.subject.trim(), headline: form.headline.trim(), recipient_ids: chosen, recipient_count: chosen.length, status: 'draft' }
      const result = editingId
        ? await supabase.from('newsletter_campaigns').update(payload).eq('id', editingId).eq('status', 'draft').select('id').single()
        : await supabase.from('newsletter_campaigns').insert(payload).select('id').single()
      if (result.error) throw Error('Could not save this draft. It may already be sending; refresh and check its status.')
      setEditingId(null); setForm(empty); setSelected([]); setNotice('Draft saved. No emails sent. Use its Test button, then Send when you’re ready.'); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save draft.') }
    finally { setBusy(false) }
  }
  const deliver = async (item: Campaign, action: 'test' | 'send') => {
    if (!supabase || busy || !ready) return
    if (!window.confirm(action === 'test' ? 'Send this saved draft ONLY to your signed-in owner email? No subscribers will be emailed.' : `Send “${item.subject}” to up to ${item.recipient_count} selected subscribed addresses? This cannot be undone.`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await supabase.functions.invoke('send-newsletter', { body: { campaignId: item.id, action } })
      if (result.error) {
        let message = 'Send request failed. Refresh and check campaign status and Resend logs before trying another send.'
        try { message = (await result.error.context?.json())?.error || message } catch { /* Do not expose tokens or internal requests. */ }
        throw Error(message)
      }
      if (result.data?.error) throw Error(result.data.error)
      setNotice(result.data?.message || 'Request completed.'); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not process send.'); await load() }
    finally { setBusy(false) }
  }
  return <div className="admin-newsletter-panel">
    <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Owner only · Resend</p><h1>Newsletter</h1><p>Choose subscribers, write an update and test it before sending.</p></div><button type="button" className="button button-light" onClick={() => void load()} disabled={busy || loading}><RefreshCw size={16}/>Refresh</button></div>
    <p className={ready ? 'owner-notice' : 'owner-error'} role="status">{setup}</p>
    {notice && <p className="owner-notice" role="status">{notice}</p>}{error && <p className="owner-error" role="alert">{error}</p>}
    {loading ? <p role="status">Loading newsletter workspace…</p> : <>
      <div className="newsletter-admin-grid">
        <section className="subscriber-panel"><h2><Mail size={20}/> {eligible.length} subscribed addresses shown</h2><label>Find subscriber<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search email addresses"/></label><div className="admin-newsletter-actions"><button type="button" className="button button-light" disabled={busy} onClick={() => setSelected([...new Set([...selected, ...shown.map(item => item.id)])])}>Select all shown</button><button type="button" className="button button-light" disabled={busy} onClick={() => setSelected([])}>Clear</button></div><p>{chosen.length} selected · {total} total records{total > subscribers.length ? ' · First 1,000 shown; refine this audience before sending.' : ''}</p><div className="subscriber-list">{shown.map(item => <label className="admin-subscriber-choice" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} disabled={busy} onChange={event => setSelected(event.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))}/><span>{item.email}</span></label>)}</div>{!shown.length && <p>No matching subscribed addresses.</p>}<small>Unsubscribed and suppressed addresses cannot be selected.</small></section>
        <form className="campaign-form" onSubmit={save}><h2>{editingId ? 'Edit draft' : 'Write an update'}</h2><label>Subject<input maxLength={150} required value={form.subject} disabled={busy} onChange={event => setForm({ ...form, subject: event.target.value })}/></label><label>Inbox preview<input maxLength={200} value={form.preview_text} disabled={busy} onChange={event => setForm({ ...form, preview_text: event.target.value })}/></label><label>Headline<input maxLength={200} required value={form.headline} disabled={busy} onChange={event => setForm({ ...form, headline: event.target.value })}/></label><label>Message<textarea maxLength={15000} required rows={7} value={form.body} disabled={busy} onChange={event => setForm({ ...form, body: event.target.value })}/></label><div className="owner-form-grid"><label>Button text<input maxLength={80} value={form.button_label} disabled={busy} onChange={event => setForm({ ...form, button_label: event.target.value })}/></label><label>Button link<input type="url" value={form.button_url} disabled={busy} onChange={event => setForm({ ...form, button_url: event.target.value })}/></label></div><div className="admin-newsletter-actions"><button className="button button-dark" disabled={busy || !schemaReady}>{busy ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Save draft</button>{editingId && <button type="button" className="button button-light" disabled={busy} onClick={() => { setEditingId(null); setForm(empty); setSelected([]) }}>Cancel edit</button>}</div><small>Saving never sends an email. Each recipient receives a private email with an unsubscribe link.</small></form>
      </div>
      <section className="admin-campaign-history"><h2>Saved campaigns</h2><p>“Sent” means accepted by Resend, not delivered or read. Refresh if a request times out; never recreate a failed campaign without checking provider logs.</p>{campaigns.length ? campaigns.map(item => <article key={item.id}><div><h3>{item.subject}</h3><p>{item.status} · {item.recipient_count} recipients · {item.accepted_count || 0} accepted</p>{item.last_error && <p className="owner-error">{item.last_error}</p>}</div>{item.status === 'draft' && <div className="admin-newsletter-actions"><button type="button" className="button button-light" disabled={busy || !schemaReady} onClick={() => edit(item)}>Edit</button><button type="button" className="button button-light" disabled={busy || !ready} onClick={() => void deliver(item, 'test')}>Test to my email</button><button type="button" className="button button-dark" disabled={busy || !ready || !item.recipient_count || Boolean(editingId)} onClick={() => void deliver(item, 'send')}>Send campaign</button></div>}</article>) : <p>No saved campaigns yet.</p>}<small>Latest 50 campaigns shown. Maximum 1,000 recipients per campaign.</small></section>
    </>}
  </div>
}
