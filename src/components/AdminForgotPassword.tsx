import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function AdminForgotPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  useEffect(() => {
    if (!cooldown) return
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])
  async function requestReset(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase || busy || cooldown) return
    setBusy(true); setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: new URL('/ak-owner-portal?reset=1', window.location.origin).href,
      })
      if (error) throw error
      setSent(true); setCooldown(60)
    } catch {
      setError('Could not request a reset email. Please wait a moment and try again. If it continues, contact the store owner.')
      setCooldown(30)
    } finally { setBusy(false) }
  }
  return <main className="owner-login-shell"><form className="owner-login-card" onSubmit={requestReset}>
    <div className="owner-lock"><Mail size={28}/></div>
    <p className="eyebrow text-gold-dark">Private owner access</p>
    <h1>Forgot your password?</h1>
    <p>Enter your admin account email to request a secure password-reset link.</p>
    <label>Email address<input type="email" value={email} onChange={event => { setEmail(event.target.value); setSent(false) }} required autoComplete="email" disabled={busy}/></label>
    {sent && <p className="owner-notice" role="status">If an account exists for this email, you’ll receive a reset link. Check your inbox and spam folder. Use the newest link.</p>}
    {error && <p className="owner-error" role="alert">{error}</p>}
    <button className="button button-dark" disabled={busy || cooldown > 0}>{busy ? <Loader2 size={17} className="animate-spin"/> : <Mail size={17}/>} {busy ? 'Requesting link…' : cooldown ? `Try again in ${cooldown}s` : sent ? 'Send another link' : 'Send reset link'}</button>
    <button type="button" className="owner-back-link" onClick={onBack} disabled={busy}><ArrowLeft size={15}/> Back to sign in</button>
  </form></main>
}
