import { Check, X, ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { brandPath } from '../lib/brandStore'
import { ProductCard } from '../components/ProductCard'
import { BrandFilter } from '../components/BrandFilter'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { useCatalog } from '../context/CatalogContext'
import { setPageMeta } from '../lib/site'
import { trackEvent } from '../lib/engagement'
import { CollectionSort } from '../components/CollectionSort'
import { DiscoverySearchHero } from '../components/DiscoverySearchHero'
import '../discovery.css'

export function ProductsPage() {
  const { products, categories, brands } = useCatalog()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const category = params.get('category') || 'all'
  const brand = params.get('brand') || 'all'
  const [sortBy, setSortBy] = useState<'featured' | 'az' | 'za'>('featured')
  const [pagination, setPagination] = useState({ key: '', limit: 12 })
  const isSearching = Boolean(query.trim())
  const searchKey = JSON.stringify([query.trim(), category, brand, sortBy])
  const resultLimit = pagination.key === searchKey ? pagination.limit : 12

  useEffect(() => {
    if (!query.trim()) return
    const timer = window.setTimeout(() => trackEvent('search', { search_term: query.trim(), metadata: { result_count: displayed.length } }), 800)
    return () => window.clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    setPageMeta('Electrical Materials, Appliances & Electronics Catalogue', 'Browse demo catalogue items across electrical materials, appliances and electronics from A Kaycee Electricals in Lagos.')
  }, [])

  const updateFilter = (key: 'category' | 'brand', value: string) => {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { preventScrollReset: true })
  }

  const displayed = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = products.filter((product) => {
      const categoryName = categories.find(item => item.id === product.category)?.name || product.category
      const searchable = `${product.name} ${product.brand} ${categoryName} ${product.description} ${product.specs.join(' ')}`.toLowerCase()
      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === 'all' || product.category.toLowerCase() === category.toLowerCase()) &&
        (brand === 'all' || product.brand.toLowerCase() === brand.toLowerCase())
    })

    return [...result].sort((a, b) => {
      if (sortBy === 'az') return a.name.localeCompare(b.name)
      if (sortBy === 'za') return b.name.localeCompare(a.name)
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    })
  }, [products, categories, brand, category, query, sortBy])

  const recommendations = useMemo(() => categories.map(item => {
    const matches = displayed.filter(product => product.category.toLowerCase() === item.id.toLowerCase())
    return { category: item, products: matches.slice(0, 5) }
  }).filter(group => group.products.length > 0), [categories, displayed])
  const recommendationCount = recommendations.reduce((count, group) => count + group.products.length, 0)

  const reset = () => {
    setQuery('')
    setSortBy('featured')
    setParams({})
  }

  const hasFilters = Boolean(query || category !== 'all' || brand !== 'all' || sortBy !== 'featured')

  // Preserve existing shared brand links while sending visitors to the storefront.
  if (params.get('brand') && params.get('brand') !== 'all') {
    const next = new URLSearchParams(params)
    next.delete('brand')
    return <Navigate replace to={`${brandPath(params.get('brand')!)}${next.size ? `?${next}` : ''}`}/>
  }

  return (
    <div className="discovery-page search-editorial">
      <DiscoverySearchHero query={query} onChange={setQuery} categories={categories} onCategory={value=>{setQuery('');updateFilter('category',value)}}/>

      <section className="catalogue-section discovery-results" id="search-results">
        <div className="container">
          <div className="catalogue-heading">
            <div><p className="eyebrow text-gold-dark">Your next good find</p><h2>{isSearching ? `Results for “${query.trim()}”` : 'Recommended for your space.'}</h2></div>
            <p role="status" aria-live="polite">{isSearching ? `${displayed.length} ${displayed.length === 1 ? 'item' : 'items'} found` : `${recommendationCount} picks to explore`}</p>
          </div>
          {!isSearching && <p className="discovery-recommendation-intro">Up to five picks per category, with featured products first. Search above to explore the full catalogue.</p>}

          <div className="category-tabs" aria-label="Filter by category">
            <button type="button" onClick={() => updateFilter('category', 'all')} className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'}>All categories</button>
            {categories.map((item) => <button key={item.id} type="button" onClick={() => updateFilter('category', item.id)} className={category === item.id ? 'active' : ''} aria-pressed={category === item.id}>{item.name}</button>)}
          </div>

          <div className="catalogue-toolbar">
            <BrandFilter value={brand} brands={brands.map(item => item.name)} onChange={value => updateFilter('brand', value)}/>
            {query && <span className="discovery-query-chip">{query}<button type="button" aria-label="Clear search filter" onClick={()=>setQuery('')}><X size={15}/></button></span>}
            <CollectionSort value={sortBy} onChange={setSortBy}/>
            {hasFilters && <button type="button" onClick={reset} className="catalogue-reset"><X size={15} /> Reset</button>}
          </div>

          <div className="catalogue-status"><Check size={15} /><span>Pricing and availability are confirmed on enquiry.</span></div>

          {displayed.length > 0 ? (
            isSearching ? <>
              <div className="catalogue-grid">{displayed.slice(0, resultLimit).map((product) => <ProductCard key={product.slug} product={product} />)}</div>
              <div className="discovery-results-more">
                <p role="status">Showing {Math.min(resultLimit, displayed.length)} of {displayed.length} results</p>
                {resultLimit < displayed.length && <button type="button" className="button button-dark" onClick={() => setPagination({ key: searchKey, limit: resultLimit + 12 })}>Show more results <ArrowRight size={17}/></button>}
              </div>
            </> : <div className="discovery-recommendations">
              {recommendations.map(group => <section key={group.category.id} aria-labelledby={`picks-${group.category.id}`}>
                <div className="discovery-picks-heading">
                  <h3 id={`picks-${group.category.id}`}>{group.category.name}</h3>
                  <Link to={`/category/${group.category.id}`}>Explore category <ArrowRight size={17}/></Link>
                </div>
                <div className="catalogue-grid">{group.products.map(product => <ProductCard key={product.slug} product={product}/>)}</div>
              </section>)}
            </div>
          ) : (
            <div className="catalogue-empty">
              <p className="eyebrow text-gold-dark">No matches</p>
              <h3>Not here? Let’s find it.</h3>
              <p>Try another search or ask our team about the exact item.</p>
              <div className="catalogue-empty-actions"><button type="button" onClick={reset} className="button button-dark">Clear filters</button><WhatsAppLink subject={query || 'unlisted product or brand enquiry'}>Ask on WhatsApp</WhatsAppLink></div>
            </div>
          )}

          <div className="discovery-search-help">
            <div><p className="eyebrow">A little guidance?</p><h3>Tell us what you have in mind.</h3><p>A room upgrade or a project list—we’ll help you explore the options.</p></div>
            <WhatsAppLink subject="Help finding a product" variant="gold">Help me choose <ArrowRight size={17}/></WhatsAppLink>
          </div>
        </div>
      </section>
    </div>
  )
}
