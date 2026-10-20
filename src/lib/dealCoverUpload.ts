import { supabase } from './supabase'

export const DEAL_COVER_BUCKET = 'deal-covers'
export const MAX_DEAL_COVER_BYTES = 5 * 1024 * 1024
const imageExtensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }

export function validateDealCoverFile(file: Pick<File, 'type' | 'size'>) {
  if (!imageExtensions[file.type]) return 'Choose a JPG, PNG, WebP or AVIF image. SVG, PDF and video files are not supported.'
  if (!file.size || file.size > MAX_DEAL_COVER_BYTES) return 'Choose a non-empty image up to 5 MB.'
  return ''
}

export async function uploadDealCover(file: File) {
  const validation = validateDealCoverFile(file)
  if (validation) throw new Error(validation)
  if (!supabase) throw new Error('Supabase is not connected. Your cover has not been uploaded.')
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) } catch { throw new Error('This file could not be read as an image. Try exporting it as JPG or PNG.') }
  const tooLarge = bitmap.width * bitmap.height > 40000000
  bitmap.close()
  if (tooLarge) throw new Error('This image is too large. Export a smaller version before uploading.')
  const path = `combos/${crypto.randomUUID()}.${imageExtensions[file.type]}`
  const { error } = await supabase.storage.from(DEAL_COVER_BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })
  if (error) throw new Error(error.message.includes('row-level security') ? 'Your account is not allowed to upload deal covers. Sign in as an approved owner or administrator.' : `Cover upload failed: ${error.message}`)
  return supabase.storage.from(DEAL_COVER_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function downloadDealCover(url: string, packageId: string) {
  const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' })
  if (!response.ok) throw new Error('The original image could not be downloaded. Use “Open original” to save it instead.')
  const blob = await response.blob()
  const extension = imageExtensions[blob.type.split(';')[0]]
  if (!extension) throw new Error('This URL did not return a supported image. Check the cover URL or upload an image file.')
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl; anchor.download = `${packageId || 'combo-deal'}-cover.${extension}`
  document.body.appendChild(anchor); anchor.click(); anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
}
