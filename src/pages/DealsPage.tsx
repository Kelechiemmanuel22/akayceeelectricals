import { ArrowLeft, ArrowRight, Check, Gift, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { useDeals } from '../context/DealsContext'
import { useQuoteCart } from '../context/QuoteCartContext'
import { DealCollectionCard } from '../components/DealCollections'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { comboQuoteProduct, dealPrice, resolveCombo, type ComboDeal, type DealCollection } from '../lib/deals'
import '../deals.css'

function DealNote() { return <p className="deals-preview-note">Package availability and final pricing are confirmed by the store. Delivery and installation are quoted separately.</p> }

function ComboPrice({ combo }: { combo: ComboDeal }) {
  return <div className="combo-price">{combo.price !== null ? <>
    <small>{combo.priceIsEstimate ? 'Estimated combo price' : 'Combo price'}</small>
    <strong>{dealPrice(combo.price)}</strong>
    {combo.priceIsEstimate && <small className="combo-estimate-note">Estimated price—please confirm with the store.</small>}
  </> : <span>Ask us for the combo price</span>}</div>
}

function ComboCard({ combo, collection }: { combo: ComboDeal; collection: DealCollection }) {
  const { products } = useCatalog()
  const items = resolveCombo(combo, products)
  return <article className="combo-card"><Link className="combo-card-images" to={`/deals/${collection.id}/${combo.id}`} aria-label={`View ${combo.name}`}>
    {items.slice(0, 3).map(item => <img key={item.product.slug} src={item.product.image} alt={item.product.name} loading="lazy"/>)}<span>{items.reduce((sum, item) => sum + item.quantity, 0)} items. One package.</span>
  </Link><div className="combo-card-copy"><p className="eyebrow">{collection.name}</p><h3><Link to={`/deals/${collection.id}/${combo.id}`}>{combo.name}</Link></h3><p>{combo.description}</p><ComboPrice combo={combo}/><Link className="button button-dark" to={`/deals/${collection.id}/${combo.id}`}>See what’s included <ArrowRight size={17}/></Link></div></article>
}

export function DealsPage() {
  const { collectionId, comboId } = useParams()
  const { enabled, liveCollections, liveCombos, isLoading: dealsLoading, ready, error, reload } = useDeals()
  const { products, isLoading } = useCatalog()
  const { addItem, items } = useQuoteCart()
  const collection = liveCollections.find(item => item.id === collectionId)
  const combo = liveCombos.find(item => item.collectionId === collectionId && item.id === comboId)
  if (dealsLoading || isLoading) return <section className="section"><div className="container" role="status">Finding your packages…</div></section>
  if (!ready && error) return <section className="section deal-unavailable"><div className="container"><h1>Deals are temporarily unavailable.</h1><p>We couldn’t load the latest packages. Please try again.</p><button className="button button-dark" onClick={() => void reload()}>Try again</button><Link to="/products" className="deal-text-link">Browse products <ArrowRight size={17}/></Link></div></section>
  if (!enabled) return <section className="section deal-unavailable"><div className="container"><p className="eyebrow">Explore something else</p><h1>Combo deals are currently paused.</h1><p>Our regular catalogue is still here for you.</p><Link to="/products" className="button button-dark">Browse products <ArrowRight size={17}/></Link></div></section>
  if (collectionId && (!collection || (comboId && !combo))) return <section className="section deal-unavailable"><div className="container"><p className="eyebrow">Come back for something good</p><h1>This deal isn’t available right now.</h1><p>It may have ended, or the store is refreshing its packages.</p><Link to="/deals" className="button button-dark">Explore available deals <ArrowRight size={17}/></Link></div></section>
  if (collection && combo) {
    const included = resolveCombo(combo, products)
    const inQuote = items.some(item => item.product.slug === `combo:${combo.id}`)
    const enquiry = `${combo.name} (${collection.name}), including ${included.map(item => `${item.quantity} x ${item.product.name}`).join(', ')}${combo.price !== null ? `. ${combo.priceIsEstimate ? 'Estimated' : 'Listed'} combo price: ${dealPrice(combo.price)} (please confirm)` : ''}`
    return <div className={`deals-page deal-theme-${collection.theme}`}><section className="combo-detail"><div className="container"><Link to={`/deals/${collection.id}`} className="deal-text-link"><ArrowLeft size={16}/> Back to {collection.name}</Link><div className="combo-detail-grid"><div><p className="eyebrow">{collection.name}</p><h1>{combo.name}</h1><p className="combo-detail-description">{combo.description}</p><div className="combo-detail-products">{included.map(item => <Link key={item.product.slug} to={`/products/${item.product.slug}`}><img src={item.product.image} alt={item.product.name}/><span><small>Quantity: {item.quantity}</small><strong>{item.product.name}</strong></span><ArrowRight size={18}/></Link>)}</div></div><aside className="combo-summary"><Gift size={25}/><p className="eyebrow">Better together</p><h2>Your space, sorted.</h2><p>{included.reduce((sum, item) => sum + item.quantity, 0)} items, thoughtfully brought together.</p><ComboPrice combo={combo}/><button className="button button-dark" onClick={() => addItem(comboQuoteProduct(combo, collection, products))}>{inQuote ? <Check size={17}/> : <Plus size={17}/>} {inQuote ? 'Add another package' : 'Add combo to quote'}</button><WhatsAppLink subject={enquiry}>Enquire about this combo</WhatsAppLink><p className="combo-smallprint">The store confirms availability and final pricing. Delivery and installation are quoted separately. Packages are supplied as listed; ask the team about any changes.</p></aside></div><DealNote/></div></section><section className="deals-more"><div className="container"><h2>Another kind of living?</h2><div className="deal-collection-grid">{liveCollections.filter(item => item.id !== collection.id).slice(0, 2).map(item => <DealCollectionCard key={item.id} collection={item}/>)}</div></div></section></div>
  }
  return <div className={`deals-page deal-theme-${collection?.theme || 'odogwu'}`}>
    <section className="deals-hero"><img src={collection?.image || '/assets/deals/odogwu-home-v1.jpg'} alt="Illustrative home setting with everyday appliance comforts"/><div className="deals-hero-shade"/><div className="container deals-hero-copy"><p className="eyebrow">{collection?.eyebrow || 'Good things come together'}</p><h1>{collection ? collection.name : <>Your life.<br/>Your kind of <em>deal.</em></>}</h1><p>{collection?.description || 'From campus beginnings to big-home energy. Discover appliance packages made for the way you live.'}</p><a href="#deal-packages" className="button button-dark">{collection ? 'Explore the packages' : 'Find your package'} <ArrowRight size={18}/></a><small>Illustrative lifestyle setting · Products listed below</small></div></section>
    <section className="deals-list" id="deal-packages"><div className="container"><div className="deals-section-heading"><div><p className="eyebrow">{collection ? 'Choose your combo' : 'Made for your next chapter'}</p><h2>{collection ? 'A few things. A better everyday.' : 'Find your package.'}</h2></div>{collection && <Link to="/deals" className="deal-text-link">All deal collections <ArrowRight size={17}/></Link>}</div>
      {collection ? <div className="combo-grid">{liveCombos.filter(item => item.collectionId === collection.id).map(item => <ComboCard key={item.id} combo={item} collection={collection}/>)}</div> : liveCollections.length ? <div className="deal-collection-grid">{liveCollections.map(item => <DealCollectionCard key={item.id} collection={item}/>)}</div> : <p>New packages are on the way. Ask the store what’s available today.</p>}
      <DealNote/>
    </div></section>
  </div>
}
