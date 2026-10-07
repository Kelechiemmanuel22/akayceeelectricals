import { Check, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogos'
import { ProductCard } from '../components/ProductCard'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { useCatalog } from '../context/CatalogContext'
import { setPageMeta } from '../lib/site'
import { trackEvent } from '../lib/engagement'

export function ProductsPage() {
  const { products, categories, brands } = useCatalog()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(params.get('category') || 'all')
  const [brand, setBrand] = useState(params.get('brand') || 'all')
  const [sortBy, setSortBy] = useState<'featured' | 'az' | 'za'>('featured')

  useEffect(() => {
    if (!query.trim()) return
    const timer = window.setTimeout(() => trackEvent('search', { search_term: query.trim(), metadata: { result_count: displayed.length } }), 800)
    return () => window.clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    setCategory(params.get('category') || 'all')
    setBrand(params.get('brand') || 'all')
  }, [params])

  useEffect(() => {
    setPageMeta('Electrical Materials, Appliances & Electronics Catalogue', 'Browse demo catalogue items across electrical materials, appliances and electronics from A Kaycee Electricals in Lagos.')
  }, [])

  const updateFilter = (key: 'category' | 'brand', value: string) => {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  const displayed = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = products.filter((product) => {
      const searchable = `${product.name} ${product.brand} ${product.description} ${product.specs.join(' ')}`.toLowerCase()
      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === 'all' || product.category.toLowerCase() === category.toLowerCase()) &&
        (brand === 'all' || product.brand.toLowerCase() === brand.toLowerCase())
    })

    return [...result].sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name)
      if (sortBy === 'za') return b.name.localeCompare(a.name)
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    })
  }, [products, brand, category, query, sortBy])

  const reset = () => {
    setQuery('')
    setCategory('all')
    setBrand('all')
    setSortBy('featured')
    setParams({})
  }

  const hasFilters = Boolean(query || category !== 'all' || brand !== 'all' || sortBy !== 'featured')

  return (
    <>
      <section className="catalogue-hero">
        <div className="container catalogue-hero-grid">
          <div>
            <p className="eyebrow text-gold-light">A Kaycee catalogue</p>
            <h1>Designed for your home.<br /><span>Ready for your project.</span></h1>
            <p>Browse appliances, electronics and electrical materials, then ask the store team to confirm current pricing and availability.</p>
          </div>
          <div className="catalogue-hero-images" aria-hidden="true">
            <img src="/assets/products/hisense-1-5hp-ac.jpg" alt="" />
            <img src="/assets/products/lg-55-4k-tv.jpg" alt="" />
            <img src="/assets/products/midea-washing-machine.jpg" alt="" />
          </div>
        </div>
      </section>

      <section className="catalogue-brand-strip" aria-label="Filter catalogue by brand">
        <div className="container">
          <button type="button" onClick={() => updateFilter('brand', 'all')} className={brand === 'all' ? 'active' : ''} aria-pressed={brand === 'all'}>All brands</button>
          {brands.map((item) => (
            <button key={item.name} type="button" onClick={() => updateFilter('brand', item.name)} className={brand === item.name ? 'active' : ''} aria-label={`Filter by ${item.name}`} aria-pressed={brand === item.name}>
              <BrandLogo brand={item.name} logo={item.logo} logoDark={item.logoDark} variant="dark" className={`brand-filter-logo brand-logo-${item.name.toLowerCase()}`} />
            </button>
          ))}
        </div>
      </section>

      <section className="catalogue-section">
        <div className="container">
          <div className="catalogue-heading">
            <div><p className="eyebrow text-gold-dark">Browse catalogue</p><h2>Find the right fit.</h2></div>
            <p>{displayed.length} {displayed.length === 1 ? 'item' : 'items'} shown</p>
          </div>

          <div className="category-tabs" aria-label="Filter by category">
            <button type="button" onClick={() => updateFilter('category', 'all')} className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'}>All products</button>
            {categories.map((item) => <button key={item.id} type="button" onClick={() => updateFilter('category', item.id)} className={category === item.id ? 'active' : ''} aria-pressed={category === item.id}>{item.name}</button>)}
          </div>

          <div className="catalogue-toolbar">
            <label className="catalogue-search">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories or brands" aria-label="Search products" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
            </label>
            <label className="catalogue-sort">
              <SlidersHorizontal size={17} />
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'featured' | 'az' | 'za')} aria-label="Sort products">
                <option value="featured">Featured first</option>
                <option value="az">Name A–Z</option>
                <option value="za">Name Z–A</option>
              </select>
            </label>
            {hasFilters && <button type="button" onClick={reset} className="catalogue-reset"><X size={15} /> Reset</button>}
          </div>

          <div className="catalogue-status"><Check size={15} /><span>Pricing and availability are confirmed on enquiry.</span></div>

          {displayed.length > 0 ? (
            <div className="catalogue-grid">{displayed.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
          ) : (
            <div className="catalogue-empty">
              <p className="eyebrow text-gold-dark">No matches</p>
              <h3>We could not find that item in this demo catalogue.</h3>
              <p>Clear the filters or ask the store team about the exact product you need.</p>
              <div><button type="button" onClick={reset} className="button button-dark">Clear filters</button><WhatsAppLink subject="unlisted product or brand enquiry">Ask on WhatsApp</WhatsAppLink></div>
            </div>
          )}

          <div className="project-banner">
            <div><p className="eyebrow text-gold-light">Project and bulk enquiries</p><h3>Working from a bill of quantities?</h3><p>Send your material list or appliance requirements to discuss suitable options and request a current quote.</p></div>
            <WhatsAppLink subject="Bulk electrical material Bill of Quantities (BOQ)">Send your list</WhatsAppLink>
          </div>
        </div>
      </section>
    </>
  )
}
