import { ArrowDown, ArrowRight, Check, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { BrandLogo } from '../components/BrandLogos'
import { ProductCard } from '../components/ProductCard'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { brandKey, brandPath, filterBrandProducts, relatedBrands } from '../lib/brandStore'
import { categoryHeroes } from '../data/categoryHeroes'
import { CollectionSort, type CollectionSortValue } from '../components/CollectionSort'
import '../brand-store.css'

export function BrandPage() {
  const { brandId = '' } = useParams()
  const { brands, categories, products, isLoading } = useCatalog()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<CollectionSortValue>('featured')
  const brand = brands.find(item => brandKey(item.name) === brandKey(brandId))
  const category = params.get('category') || 'all'
  const otherBrands = useMemo(() => relatedBrands(brands, products, brand?.name || brandId, category), [brands, products, brand, brandId, category])
  const brandProducts = useMemo(() => filterBrandProducts(products, brand?.name || brandId), [products, brand, brandId])
  const availableCategories = categories.filter(item => brandProducts.some(product => product.category === item.id))
  const displayed = useMemo(() => [...filterBrandProducts(products, brand?.name || brandId, category, query)].sort((a,b) => sort === 'az' ? a.name.localeCompare(b.name) : sort === 'za' ? b.name.localeCompare(a.name) : Number(Boolean(b.featured)) - Number(Boolean(a.featured))), [products, brand, brandId, category, query, sort])
  useEffect(() => { setQuery(''); setSort('featured') }, [brandId])
  const selectCategory = (id: string) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('category'); else next.set('category', id)
    setParams(next, { preventScrollReset: true })
  }
  const reset = () => { setQuery(''); setSort('featured'); setParams({}, { preventScrollReset: true }) }

  if (!brand) return <section className="category-missing"><div className="container"><p className="eyebrow text-gold-dark">{isLoading ? 'Loading brand' : 'Brand unavailable'}</p><h1>{isLoading ? 'Finding your collection…' : 'This brand is not available right now.'}</h1><Link to="/#brands" className="button button-dark">Explore available brands</Link></div></section>

  return <div className="brand-store-page">
    <section className="cooling-hero brand-store-hero">
      <img className="brand-store-hero-image" src="/assets/heroes/brand-home-v1.webp" alt="Illustrative open-plan home with a television, air conditioner, refrigerator and kitchen appliances" fetchPriority="high"/>
      <div className="brand-store-hero-shade"/>
      <div className="container cooling-hero-copy brand-store-hero-copy">
        <p className="eyebrow">The {brand.name} collection · A Kaycee Electricals</p>
        <h1>{brand.name} for<br/>the way<br/><span>you live.</span></h1>
        <p>A little more comfort.<br/>A lot more to come home to.</p>
        <div className="cooling-hero-actions"><a className="button button-dark" href="#brand-collection">Explore {brand.name} <ArrowDown size={17}/></a><WhatsAppLink variant="ghost" subject={`${brand.name} products`}>Enquire now</WhatsAppLink></div>
      </div>
      <span className="brand-store-hero-note">A whole-home perspective · Illustrative setting</span>
    </section>

    <section className="brand-store-intro"><div className="container">
      <div className="brand-store-identity"><BrandLogo brand={brand.name} logo={brand.logo} logoDark={brand.logoDark} variant="light" className="brand-store-logo"/><span>Explore {brand.name}<small>Available through A Kaycee Electricals</small></span></div>
      <p>{brand.tagline || 'Explore this brand’s collection for your home.'}</p>
      <a href="#brand-collection">View collection <ArrowRight size={18}/></a>
    </div></section>

    {availableCategories.length > 0 && <section className="brand-store-ranges"><div className="container">
      <div className="cooling-section-title"><p className="eyebrow">One brand. More possibilities.</p><h2>Find your kind of {brand.name}.</h2></div>
      <div className="brand-store-range-grid">{availableCategories.map(item => {
        const items = brandProducts.filter(product => product.category === item.id)
        return <a key={item.id} href="#brand-collection" className="brand-store-range" onClick={() => { selectCategory(item.id); setQuery('') }}>
          <img src={categoryHeroes[item.id]?.image || items[0]?.image || item.image} alt="" loading="lazy"/>
          <span><small>{items.length} {items.length === 1 ? 'product' : 'products'}</small><strong>{item.name}</strong><em>Explore <ArrowRight size={17}/></em></span>
        </a>
      })}</div>
    </div></section>}

    <section id="brand-collection" className="category-products-section brand-store-collection"><div className="container">
      <div className="category-products-heading"><div><p className="eyebrow text-gold-dark">The {brand.name} collection</p><h2>Made for your everyday.</h2></div><label><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${brand.name} products`} aria-label={`Search ${brand.name} products`}/>{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={17}/></button>}</label></div>
      <div className="cooling-product-tabs collection-type-tabs" aria-label={`Filter ${brand.name} by category`}><button type="button" className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => selectCategory('all')}>All {brand.name}</button>{availableCategories.map(item => <button key={item.id} type="button" className={category === item.id ? 'active' : ''} aria-pressed={category === item.id} onClick={() => selectCategory(item.id)}>{item.name}</button>)}</div>
      <div className="brand-store-toolbar"><p>{displayed.length} {displayed.length === 1 ? 'product' : 'products'}</p><CollectionSort value={sort} onChange={setSort}/></div>
      <div className="catalogue-status"><Check size={15}/><span>Confirm current pricing and availability with the store.</span></div>
      {isLoading ? <p role="status">Updating the collection…</p> : displayed.length ? <div className="catalogue-grid">{displayed.map(product => <ProductCard key={product.slug} product={product} showPrice/>)}</div> : <div className="catalogue-empty"><h3>{brandProducts.length ? 'Let’s find your right fit.' : `More ${brand.name}, coming soon.`}</h3><p>{brandProducts.length ? 'Try another category or search term.' : 'Ask the store about the model you have in mind.'}</p><div className="catalogue-empty-actions">{brandProducts.length > 0 && <button className="button button-dark" onClick={reset}>Reset filters</button>}<WhatsAppLink subject={`${brand.name} product enquiry`}>Ask on WhatsApp</WhatsAppLink></div></div>}
    </div></section>
    <section className="brand-store-help"><div className="container"><div><p className="eyebrow">A real conversation. A better choice.</p><h2>Your home.<br/>Your {brand.name}.</h2><p>Tell us what you’re looking for. We’ll help with the details.</p></div><WhatsAppLink subject={`Help choosing ${brand.name} products`} variant="gold">Let’s find your fit <ArrowRight size={17}/></WhatsAppLink></div></section>
    {otherBrands.length > 0 && <section className="brand-store-others" aria-labelledby="other-brands-title"><div className="container">
      <div className="cooling-section-title"><p className="eyebrow text-gold-dark">Similar products. More choice.</p><h2 id="other-brands-title">Explore similar brands.</h2></div>
      <div className="brand-store-other-grid">{otherBrands.map(item => <Link key={item.name} to={`${brandPath(item.name)}${category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''}`} className="brand-store-other-card" aria-label={`Explore ${item.name} brand store`}>
        <div className="brand-store-other-logo"><BrandLogo brand={item.name} logo={item.logo} logoDark={item.logoDark} variant="light"/></div>
        <span><strong>{item.name}</strong><ArrowRight size={18}/></span>
      </Link>)}</div>
    </div></section>}
  </div>
}
