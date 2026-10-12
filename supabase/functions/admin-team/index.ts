import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sign in first.' }, 401)
    const url = Deno.env.get('SUPABASE_URL')!
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!url || !key) return json({ error: 'Team management is not configured.' }, 503)
    const service = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error: authError } = await service.auth.getUser(authorization.slice(7))
    if (authError || !user) return json({ error: 'Your session has expired.' }, 401)
    const { data: caller, error: roleError } = await service.from('profiles').select('role').eq('id', user.id).single()
    if (roleError || caller?.role !== 'owner') return json({ error: 'Only the owner can manage administrator access.' }, 403)
    const body = await req.json()

    if (body.action === 'revoke') {
      if (typeof body.userId !== 'string' || body.userId === user.id) return json({ error: 'You cannot revoke the owner.' }, 400)
      const { data, error } = await service.from('profiles').update({ role: 'staff' }).eq('id', body.userId).eq('role', 'admin').select('id')
      if (error) throw error
      if (!data?.length) return json({ error: 'Administrator not found, or this is the owner account.' }, 404)
      return json({ message: 'Administrator access removed. Database access is revoked even for existing sessions.' })
    }
    if (body.action !== 'invite') return json({ error: 'Invalid action.' }, 400)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: 'Enter a valid email address.' }, 400)
    const { data: existing, error: lookupError } = await service.from('profiles').select('id,role').ilike('email', email.replace(/[%_\\]/g, '\\$&')).maybeSingle()
    if (lookupError) throw lookupError
    if (existing?.role === 'owner') return json({ error: 'This email already belongs to the owner.' }, 400)
    if (existing?.role === 'admin') return json({ error: 'This person already has administrator access.' }, 409)
    let id = existing?.id
    if (!id) {
      const siteUrl = Deno.env.get('PUBLIC_SITE_URL')
      if (!siteUrl) return json({ error: 'Configure PUBLIC_SITE_URL before sending invitations.' }, 503)
      const { data, error } = await service.auth.admin.inviteUserByEmail(email, { redirectTo: new URL('/ak-owner-portal?setup=1', siteUrl).href })
      if (error) return json({ error: error.message }, 400)
      id = data.user?.id
    }
    if (!id) throw new Error('Could not create the invited account.')
    const { data: approved, error } = await service.from('profiles').update({ role: 'admin' }).eq('id', id).eq('role', 'staff').select('id')
    if (error) throw error
    if (!approved?.length) throw new Error('The account was not approved. Check the profile trigger and retry.')
    return json({ message: existing ? 'Administrator access granted to the existing account. They can use their own login.' : 'Invitation sent. The recipient can follow the email link and choose their own password.' })
  } catch (error) {
    console.error('Admin team request failed:', error instanceof Error ? error.message : 'Unknown error')
    return json({ error: 'Team request failed. Check the migration and function configuration, then retry.' }, 500)
  }
})
