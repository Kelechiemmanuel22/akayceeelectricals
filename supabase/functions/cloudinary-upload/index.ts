import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const sha1 = async (value: string) => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'Authentication is required.' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Supabase function credentials are unavailable.' }, 500)

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: userResult, error: userError } = await client.auth.getUser()
    if (userError || !userResult.user) return json({ error: 'Your admin session has expired.' }, 401)

    const { data: profile } = await client.from('profiles').select('role').eq('id', userResult.user.id).maybeSingle()
    if (profile?.role !== 'owner') return json({ error: 'Only the approved store owner can upload images.' }, 403)

    const form = await request.formData()
    const file = form.get('file')
    const requestedFolder = String(form.get('folder') || 'products')
    const allowedFolders = new Set(['products', 'brands', 'categories'])
    if (!(file instanceof File)) return json({ error: 'Choose an image to upload.' }, 400)
    if (!allowedFolders.has(requestedFolder)) return json({ error: 'Invalid image folder.' }, 400)
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) return json({ error: 'Use a JPG, PNG, WebP, or AVIF image.' }, 400)
    if (file.size > 5 * 1024 * 1024) return json({ error: 'Images must be 5MB or smaller.' }, 400)

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
    if (!cloudName || !apiKey || !apiSecret) return json({ error: 'Cloudinary has not been configured yet.' }, 503)

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const folder = `a-kaycee/${requestedFolder}`
    const signature = await sha1(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    const cloudinaryForm = new FormData()
    cloudinaryForm.append('file', file)
    cloudinaryForm.append('api_key', apiKey)
    cloudinaryForm.append('timestamp', timestamp)
    cloudinaryForm.append('folder', folder)
    cloudinaryForm.append('signature', signature)

    const upload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: cloudinaryForm })
    const result = await upload.json()
    if (!upload.ok) return json({ error: result?.error?.message || 'Cloudinary upload failed.' }, upload.status)
    return json({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected upload error.' }, 500)
  }
})
