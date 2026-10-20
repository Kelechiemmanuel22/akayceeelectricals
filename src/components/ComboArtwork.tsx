import { useState } from 'react'
import type { Product } from '../data/catalog'
import { resolveCombo, type ComboDeal } from '../lib/deals'

export function ComboArtwork({ combo, products, detail = false }: { combo: ComboDeal; products: Product[]; detail?: boolean }) {
  const [failedUrl, setFailedUrl] = useState('')
  const hasCover = Boolean(combo.coverImage && combo.coverImage !== failedUrl)
  return <div className={`combo-artwork ${hasCover ? 'has-cover' : 'has-products'} ${detail ? 'combo-detail-artwork' : ''}`}>
    {hasCover ? <img src={combo.coverImage} alt={combo.coverAlt || `${combo.name} promotional cover`} loading={detail ? 'eager' : 'lazy'} onError={() => setFailedUrl(combo.coverImage || '')}/> : resolveCombo(combo, products).slice(0, 3).map(item => <img key={item.product.slug} src={item.product.image} alt={item.product.name} loading="lazy"/>)}
  </div>
}
