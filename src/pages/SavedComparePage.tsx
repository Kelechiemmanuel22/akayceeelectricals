import { Link } from 'react-router-dom'
import { Bookmark, GitCompareArrows, Trash2 } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../context/CatalogContext'
import { useShopTools } from '../context/ShopToolsContext'

export function SavedComparePage() {
  const { products } = useCatalog()
  const { savedProducts, comparedProducts, toggleCompared } = useShopTools()
  const saved = savedProducts(products)
  const compared = comparedProducts(products)
  return <section className="section"><div className="container saved-page">
    <div className="saved-heading"><div><p className="eyebrow text-gold-dark">Your shortlist</p><h1>Saved and compared.</h1><p>These choices stay on this device. Add any product to your quote list when you are ready to enquire.</p></div><Link className="button button-dark" to="/products">Browse catalogue</Link></div>
    <section><h2><Bookmark size={22}/>Saved products <span>{saved.length}</span></h2>{saved.length ? <div className="catalogue-grid">{saved.map(product=><ProductCard key={product.slug} product={product}/>)}</div> : <div className="empty-panel">Save products from the catalogue to find them here.</div>}</section>
    <section><h2><GitCompareArrows size={22}/>Comparison <span>{compared.length}/3</span></h2>{compared.length ? <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Product</th>{compared.map(p=><th key={p.slug}>{p.name}<button onClick={()=>toggleCompared(p.slug)} aria-label={`Remove ${p.name} from comparison`}><Trash2 size={14}/></button></th>)}</tr></thead><tbody><tr><th>Brand</th>{compared.map(p=><td key={p.slug}>{p.brand}</td>)}</tr><tr><th>Category</th>{compared.map(p=><td key={p.slug}>{p.category.replace(/-/g,' ')}</td>)}</tr>{Array.from({length:Math.max(...compared.map(p=>p.specs.length))}).map((_,i)=><tr key={i}><th>{i===0?'Specifications':''}</th>{compared.map(p=><td key={p.slug}>{p.specs[i]||'—'}</td>)}</tr>)}</tbody></table></div> : <div className="empty-panel">Choose up to three products to compare their key specifications.</div>}</section>
  </div></section>
}
