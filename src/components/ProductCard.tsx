import { Bookmark, Check, GitCompareArrows, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/catalog'
import { WhatsAppLink } from './WhatsAppLink'
import { useQuoteCart } from '../context/QuoteCartContext'
import { useCatalog } from '../context/CatalogContext'
import { useShopTools } from '../context/ShopToolsContext'

export function ProductCard({ product }: { product: Product }) {
  const { getCategoryById } = useCatalog()
  const category = getCategoryById(product.category)
  const { addItem, items } = useQuoteCart()
  const isInCart = items.some((item) => item.product.slug === product.slug)
  const { saved, compared, toggleSaved, toggleCompared } = useShopTools()

  return (
    <article className="product-card group">
      <Link to={`/products/${product.slug}`} className="product-card-image" aria-label={`View ${product.name}`}>
        <img
          src={product.image}
          alt={`${product.name} at A Kaycee Electricals Lagos`}
          loading="lazy"
          onError={(event) => {
            ;(event.currentTarget as HTMLImageElement).src = '/assets/products/copper-cable-coil.jpg'
          }}
        />
        <span className="product-card-badge">Demo catalogue</span>
        <span className="product-card-view">View details</span>
      </Link>
      <div className="product-card-tools"><button className={saved.includes(product.slug)?'active':''} onClick={()=>toggleSaved(product.slug)} aria-label={`${saved.includes(product.slug)?'Remove':'Save'} ${product.name}`}><Bookmark size={15}/></button><button className={compared.includes(product.slug)?'active':''} onClick={()=>toggleCompared(product.slug)} aria-label={`${compared.includes(product.slug)?'Remove from':'Add to'} comparison`}><GitCompareArrows size={15}/></button></div>

      <div className="product-card-content">
        <p className="product-card-meta">{product.brand}<span />{category.name}</p>
        <h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-specs">
          {product.specs.slice(0, 2).map((spec) => <span key={spec}>{spec}</span>)}
        </div>
        <div className="product-card-actions">
          <button type="button" onClick={() => addItem(product)} className={`quote-button ${isInCart ? 'quote-button-active' : ''}`}>
            {isInCart ? <Check size={15} /> : <Plus size={15} />}
            {isInCart ? 'Added to quote' : 'Add to quote'}
          </button>
          <WhatsAppLink subject={product.name} compact className="product-whatsapp">Ask price</WhatsAppLink>
        </div>
      </div>
    </article>
  )
}
