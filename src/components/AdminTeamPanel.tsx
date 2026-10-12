import { useCallback, useEffect, useState } from 'react'
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Member = { id: string; email: string; role: 'owner' | 'admin' }

export function AdminTeamPanel() {
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('id,email,role').in('role', ['owner', 'admin']).order('created_at')
    if (error) setError(error.message)
    else setMembers(data as Member[] || [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  async function request(body: { action: 'invite' | 'revoke'; email?: string; userId?: string }) {
    if (!supabase || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { data, error } = await supabase.functions.invoke('admin-team', { body })
      if (error) {
        let message = 'Team management is unavailable. Deploy the admin-team function and apply migration 003.'
        try { message = (await error.context?.json())?.error || message } catch { /* Use the deployment guidance. */ }
        throw new Error(message)
      }
      if (data?.error) throw new Error(data.error)
      setNotice(data?.message || 'Access updated.')
      setEmail(''); await load()
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not update access.') }
    finally { setBusy(false) }
  }

  return <div className="owner-team-panel">
    <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Owner only</p><h2>Your administrator team</h2><p>Only you can grant access. Each administrator signs in with their own account.</p></div><ShieldCheck size={30}/></div>
    <div className="owner-team-permissions"><strong>You remain the only owner.</strong><p>Invited admins can add, edit, hide and delete products, manage categories and brands, upload images and update business details. Team access, analytics, customer records and newsletters stay owner-only.</p></div>
    <form className="owner-team-invite" onSubmit={event => { event.preventDefault(); void request({ action: 'invite', email }) }}>
      <label>Administrator email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" placeholder="name@example.com" disabled={busy}/></label>
      <button className="button button-dark" disabled={busy || loading}>{busy ? <Loader2 size={17} className="animate-spin"/> : <UserPlus size={17}/>} Invite / grant access</button>
    </form>
    <p className="owner-team-help">New accounts receive an invitation email to set their password. Existing accounts keep their own password. Never share your owner login.</p>
    {error && <div role="alert" className="owner-error">{error}</div>}
    {notice && <p role="status" className="owner-notice">{notice}</p>}
    {loading ? <p role="status">Loading your team…</p> : <ul className="owner-team-list">{members.map(member => <li key={member.id}><div><strong>{member.email}</strong><span>{member.role === 'owner' ? 'Owner · protected account' : 'Catalogue administrator'}</span></div>{member.role === 'admin' && <button type="button" className="button button-ghost" disabled={busy} onClick={() => { if (window.confirm(`Remove administrator access for ${member.email}? Their account will remain, but they will no longer be able to manage the website.`)) void request({ action: 'revoke', userId: member.id }) }}>Remove access</button>}</li>)}</ul>}
  </div>
}

export function AdminPasswordSetup({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase || busy) return
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true); setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword(''); setConfirm(''); onComplete()
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not set your password.') }
    finally { setBusy(false) }
  }
  return <main className="owner-login-shell"><form className="owner-login-card" onSubmit={save}><ShieldCheck size={30}/><h1>Welcome to the team.</h1><p>Choose your own password for future admin sign-ins. Use at least 12 characters.</p><label>New password<input type="password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required/></label><label>Confirm password<input type="password" minLength={12} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required/></label>{error && <div role="alert" className="owner-error">{error}</div>}<button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Set password and continue'}</button><button type="button" className="owner-back-link" onClick={() => void supabase?.auth.signOut()}>Sign out</button></form></main>
}
