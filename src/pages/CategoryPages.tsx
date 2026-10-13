import { ArrowRight, Check, Search, X, Wind, Fan, MessageCircle } from 'lucide-react'
import { CategoryLanding, CategoryGuidance } from '../components/CategoryLanding'
import { categoryPresentations } from '../data/categoryPresentation'
import { categoryHeroes } from '../data/categoryHeroes'
import { categoryGroups } from '../data/categoryGroups'
import { CategoryGroupCards } from '../components/CategoryGroupCards'
import { matchesProductType } from '../data/productTypes'
import { getSubcategories } from '../data/subcategories'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { BrandFilter } from '../components/BrandFilter'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { useCatalog } from '../context/CatalogContext'
import { setPageMeta } from '../lib/site'

export function CategoriesPage() {
  const { categories, products } = useCatalog()

  useEffect(() => {
    setPageMeta('Shop by category', 'Explore every appliance, electronics and electrical-material category available from A Kaycee Electricals.')
  }, [])

  return <>
    <section className="category-index-hero">
      <div className="container">
        <p className="eyebrow text-gold-dark">Explore the range</p>
        <h1>Everything has<br/><span>its place.</span></h1>
        <p>Choose a category to explore suitable products, compare brands and enquire directly with the store.</p>
      </div>
    </section>
    <section className="category-index-section">
      <div className="container category-index-grid">
        {categories.map((category, index) => {
          const count = products.filter((product) => product.category === category.id).length
          return <Link className="category-index-card" to={`/category/${category.id}`} key={category.id}>
            <img src={category.image} alt={`${category.name} category`} loading={index < 3 ? 'eager' : 'lazy'} />
            <span className="category-index-shade" />
            <span className="category-index-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="category-index-copy"><small>{count} {count === 1 ? 'product' : 'products'}</small><strong>{category.name}</strong><em>Explore <ArrowRight size={16}/></em></span>
          </Link>
        })}
      </div>
    </section>
  </>
}

export function CategoryPage() {
  const { categoryId = '' } = useParams()
  const { categories, products, brands, subcategoryDefinitions } = useCatalog()
  const resolvedCategoryId = ({ 'air-conditioners': 'cooling', fans: 'cooling', televisions: 'entertainment', audio: 'entertainment' } as Record<string, string>)[categoryId.toLowerCase()] || categoryId
  const category = categories.find((item) => item.id.toLowerCase() === resolvedCategoryId.toLowerCase())
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('all')
  const [coolingType, setCoolingType] = useState('all')
  const isCooling = resolvedCategoryId.toLowerCase() === 'cooling'

  const categoryProducts = useMemo(() => products.filter((product) => product.category.toLowerCase() === resolvedCategoryId.toLowerCase()), [products, resolvedCategoryId])
  const categoryBrands = useMemo(() => Array.from(new Set(categoryProducts.map(product => product.brand))).sort().map(name => brands.find(item => item.name === name) || { name }), [brands, categoryProducts])
  const typeFilters = useMemo(() => getSubcategories(resolvedCategoryId, subcategoryDefinitions).map(item => ({ id: item.id, label: item.name })), [resolvedCategoryId, subcategoryDefinitions])
  const groups = useMemo(() => categoryGroups(resolvedCategoryId, subcategoryDefinitions), [resolvedCategoryId, subcategoryDefinitions])
  const displayed = useMemo(() => {
    const search = query.trim().toLowerCase()
    return categoryProducts.filter((product) => {
      const matchesBrand = brand === 'all' || product.brand.toLowerCase() === brand.toLowerCase()
      const matchesSearch = !search || `${product.name} ${product.brand} ${product.description} ${product.specs.join(' ')}`.toLowerCase().includes(search)
      const matchesType = matchesProductType(product, resolvedCategoryId, coolingType, subcategoryDefinitions)
      return matchesBrand && matchesSearch && matchesType
    })
  }, [brand, categoryProducts, query, coolingType, resolvedCategoryId, subcategoryDefinitions])

  useEffect(() => { if (coolingType !== 'all' && !typeFilters.some(item => item.id === coolingType) && !groups.some(item => item.id === coolingType)) setCoolingType('all') }, [coolingType, typeFilters, groups])

  useEffect(() => { setQuery(''); setBrand('all'); setCoolingType('all') }, [resolvedCategoryId])

  useEffect(() => {
    if (category) setPageMeta(category.name, `${category.description} Browse available ${category.name.toLowerCase()} and enquire directly with A Kaycee Electricals.`)
  }, [category])

  if (!category) return <section className="category-missing"><div className="container"><p className="eyebrow text-gold-dark">Category unavailable</p><h1>We could not find that category.</h1><Link className="button button-dark" to="/#categories">Browse homepage categories</Link></div></section>

  const related = categories.filter((item) => item.id !== category.id).slice(0, 3)

  return <div className="cooling-page">
    {isCooling ? <>
      <section className="cooling-hero category-photo-hero category-photo-cooling">
        <img className="category-photo-image" src={categoryHeroes.cooling.image} alt={categoryHeroes.cooling.alt} style={{ objectPosition: categoryHeroes.cooling.position }} fetchPriority="high" />
        <div className="cooling-hero-shade" />
        <div className="container cooling-hero-copy">
          <p className="eyebrow">A Kaycee Cooling</p>
          <h1>A cooler home.<br/><span>A happier you.</span></h1>
          <p>Comfort for every room, every day.</p>
          <div className="cooling-hero-actions"><a href="#cooling-collection" className="button button-dark">Explore cooling <ArrowRight size={17}/></a><WhatsAppLink subject="Cooling — air conditioners and fans" variant="ghost">Enquire now</WhatsAppLink></div>
        </div>
        <span className="cooling-hero-caption">AIR CONDITIONERS & FANS</span>
      </section>
      <section className="cooling-choices">
        <div className="container">
          <div className="cooling-section-title"><p className="eyebrow">Find your comfort</p><h2>How do you like to stay cool?</h2></div>
          <CategoryGroupCards category={category.id} products={categoryProducts} definitions={subcategoryDefinitions} selected={coolingType} onSelect={id => { setCoolingType(id); setBrand('all'); setQuery('') }}/>
        </div>
      </section>
    </> : <CategoryLanding category={category} products={categoryProducts} selected={coolingType} onSelect={(id) => { setCoolingType(id); setBrand('all'); setQuery('') }}/ >}

    <section className="category-products-section" id="cooling-collection">
      <div className="container">
        <div className="category-products-heading">
          <div><p className="eyebrow text-gold-dark">The collection</p><h2>{isCooling ? 'Your comfort starts here.' : 'Find your right fit.'}</h2></div>
          <label><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${category.shortName.toLowerCase()}`} aria-label={`Search ${category.name}`}/>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}</label>
        </div>
        <div className="cooling-product-tabs collection-type-tabs" aria-label={`${category.name} product type`}><button type="button" className={coolingType === 'all' ? 'active' : ''} aria-pressed={coolingType === 'all'} onClick={() => setCoolingType('all')}>All products</button>{(typeFilters || categoryPresentations[category.id]?.choices.map(item => ({ id:item.id, label:item.name })) || []).map(item => <button key={item.id} type="button" aria-pressed={coolingType === item.id} className={coolingType === item.id ? 'active' : ''} onClick={() => setCoolingType(item.id)}>{item.label}</button>)}<span>{displayed.length} {displayed.length === 1 ? 'item' : 'items'}</span></div>
        <BrandFilter value={brand} brands={categoryBrands.map(item => item.name)} onChange={setBrand}/>
        <div className="catalogue-status"><Check size={15}/><span>Current pricing and availability are confirmed when you enquire.</span></div>
        {displayed.length ? <div className="catalogue-grid">{displayed.map((product) => <ProductCard product={product} showPrice key={product.slug}/>)}</div> : <div className="catalogue-empty"><p className="eyebrow text-gold-dark">No matching items</p><h3>Let’s find your right fit.</h3><p>Try another filter or ask the store about {category.name.toLowerCase()}.</p><div className="catalogue-empty-actions"><button type="button" className="button button-dark" onClick={() => { setQuery(''); setBrand('all'); setCoolingType('all') }}>Reset filters</button><WhatsAppLink subject={category.name}>Ask on WhatsApp</WhatsAppLink></div></div>}
      </div>
    </section>

    {isCooling && <section className="cooling-guidance"><div className="container"><div className="cooling-guidance-title"><p className="eyebrow">Comfort, considered.</p><h2>Find what works<br/>for your space.</h2><WhatsAppLink subject="Help choosing an air conditioner or fan" variant="gold">Help me choose</WhatsAppLink></div><div className="cooling-guidance-grid">{[{icon:Wind,title:'The right room, the right AC',text:'Tell us your room size and we’ll help you explore suitable capacity options.'},{icon:Fan,title:'Breeze your way',text:'Explore standing and rechargeable fan options for home or office.'},{icon:MessageCircle,title:'A real conversation',text:'Ask the store about model details, installation and current pricing.'}].map((item) => <article key={item.title}><item.icon size={28} strokeWidth={1.5}/><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>}
    {!isCooling && <CategoryGuidance category={category}/>}
    <section className="category-related"><div className="container"><div className="category-related-heading"><p className="eyebrow text-gold-dark">Keep exploring</p><h2>More for your home.</h2></div><div className="category-related-grid">{related.map((item) => <Link to={`/category/${item.id}`} key={item.id}><img src={item.image} alt="" loading="lazy"/><span><strong>{item.name}</strong><ArrowRight size={17}/></span></Link>)}</div></div></section>
  </div>
}
