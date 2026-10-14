import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function UnsubscribePage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
  const [done, setDone] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !valid || busy) return
    setBusy(true); setError('')
    try {
      const { error } = await supabase.rpc('unsubscribe_newsletter_token', { subscriber_token: token })
      if (error) throw error
      setDone(true)
    } catch { setError('Could not update your preferences. Please try again or contact the store.') }
    finally { setBusy(false) }
  }
  return <section className="section"><div className="container"><div className="owner-login-card mx-auto">{done ? <><CheckCircle2 className="text-gold-dark"/><h1>Request processed.</h1><p>The subscription linked to this newsletter link will no longer receive updates.</p></> : <form onSubmit={submit}><p className="eyebrow text-gold-dark">Email preferences</p><h1>Unsubscribe from updates.</h1><p>{valid ? 'Confirm below to stop receiving A Kaycee newsletter emails.' : 'Open the unsubscribe link in your latest newsletter. An email address alone cannot change someone’s subscription.'}</p>{error && <p role="alert" className="owner-error">{error}</p>}<button className="button button-dark" disabled={busy || !valid || !supabase}>{busy ? 'Updating…' : 'Confirm unsubscribe'}</button></form>}</div></div></section>
}
