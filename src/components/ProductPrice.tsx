import type { Product } from '../data/catalog'
import { formatPrice } from '../lib/pricing'

export function ProductPrice({ product, detail = false }: { product: Product; detail?: boolean }) {
  const amount = formatPrice(product.price)
  if (!amount) return null
  return <div className={detail ? 'product-detail-price' : 'product-price-block'}>
    {product.priceIsEstimate && <span className="estimated-price-label">Estimated price</span>}
    <p className={detail ? undefined : 'product-price'}>{amount}</p>
    {product.priceNote && <small className="product-price-note">{product.priceNote}</small>}
    {product.priceIsEstimate && <small className="product-price-note">Guide only—not a store quote. Confirm the exact model and current price on WhatsApp. Delivery and installation excluded.</small>}
    {detail && !product.priceIsEstimate && <small>Confirm current pricing and availability with the store on WhatsApp.</small>}
  </div>
}
