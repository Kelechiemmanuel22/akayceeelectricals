import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function UnsubscribePage() {
  const [params] = useSearchParams(), [email, setEmail] = useState(params.get('email') || ''), [done, setDone] = useState(false), [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!supabase) return; setBusy(true); await supabase.rpc('unsubscribe_newsletter', { subscriber_email: email }); setBusy(false); setDone(true) }
  return <section className="section"><div className="container"><div className="owner-login-card mx-auto">{done ? <><CheckCircle2 className="text-gold-dark" /><h1>You’re unsubscribed.</h1><p>You will no longer receive newsletter emails from A Kaycee Electricals.</p></> : <form onSubmit={submit}><p className="eyebrow text-gold-dark">Email preferences</p><h1>Unsubscribe from updates.</h1><p>Enter the email address that receives A Kaycee newsletters.</p><label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><button className="button button-dark" disabled={busy}>{busy ? 'Updating…' : 'Unsubscribe'}</button></form>}</div></div></section>
}
