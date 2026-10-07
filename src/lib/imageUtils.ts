/**
 * Client-side image compression and optimization utility.
 * Resizes large photos and compresses them to lightweight WebP/JPEG DataURLs (~30KB-80KB).
 * Prevents LocalStorage QuotaExceededError while maintaining crisp visual quality.
 */

export type CompressOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png'
}

export function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options

  return new Promise((resolve, reject) => {
    // If SVG, read directly as text/dataURL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onerror = (err) => reject(err)
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => {
        // Fallback to original data URL if image cannot be decoded
        resolve(e.target?.result as string)
      }
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width
          let height = img.naturalHeight || img.height

          // Calculate aspect ratio scale
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(e.target?.result as string)
            return
          }

          // Fill white background for transparent images converted to JPEG
          if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, width, height)
          }

          // Smooth scaling
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Try exporting as preferred mimeType (falls back to PNG/JPEG if unsupported)
          let dataUrl = canvas.toDataURL(mimeType, quality)
          if (!dataUrl || dataUrl === 'data:,') {
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }
          resolve(dataUrl)
        } catch {
          // Fallback to original data URL on any canvas error
          resolve(e.target?.result as string)
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
