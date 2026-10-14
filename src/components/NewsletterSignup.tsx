import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/engagement'

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setFailed(false)
    if (!supabase) { setFailed(true); return setMessage('Newsletter signup is temporarily unavailable.') }
    setBusy(true)
    try {
      const { error } = await supabase.rpc('subscribe_newsletter', { subscriber_email: email.trim() })
      if (error) throw error
      trackEvent('newsletter_signup')
      setEmail('')
      setMessage('Your signup has been recorded. Watch your inbox for useful product updates.')
    } catch { setFailed(true); setMessage('Could not complete signup. Please try again in a moment.') }
    finally { setBusy(false) }
  }

  return <div className={compact ? 'newsletter newsletter-compact' : 'newsletter'}>
    {!compact && <div><p className="eyebrow text-gold-light">Useful updates, not noise</p><h2>Join the A Kaycee list.</h2><p>Occasional buying guides, new catalogue additions and store announcements.</p></div>}
    <form onSubmit={subscribe}>
      <label className="sr-only" htmlFor={compact ? 'footer-newsletter' : 'newsletter-email'}>Email address</label>
      <input id={compact ? 'footer-newsletter' : 'newsletter-email'} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" required />
      <button disabled={busy} aria-label="Subscribe to newsletter">{busy ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}</button>
    </form>
    <small>By subscribing, you agree to receive A Kaycee emails. Unsubscribe anytime.</small>
    {message && <p className="newsletter-message" role={failed ? 'alert' : 'status'}>{failed ? <AlertCircle size={15}/> : <CheckCircle2 size={15}/>} {message}</p>}
  </div>
}

