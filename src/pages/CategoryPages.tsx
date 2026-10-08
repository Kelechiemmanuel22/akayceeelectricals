import { ArrowLeft, ArrowRight, Check, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogos'
import { ProductCard } from '../components/ProductCard'
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
  const { categories, products, brands } = useCatalog()
  const resolvedCategoryId = ({ 'air-conditioners': 'cooling', fans: 'cooling', televisions: 'entertainment', audio: 'entertainment' } as Record<string, string>)[categoryId.toLowerCase()] || categoryId
  const category = categories.find((item) => item.id.toLowerCase() === resolvedCategoryId.toLowerCase())
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('all')

  const categoryProducts = useMemo(() => products.filter((product) => product.category.toLowerCase() === resolvedCategoryId.toLowerCase()), [products, resolvedCategoryId])
  const categoryBrands = useMemo(() => brands.filter((item) => categoryProducts.some((product) => product.brand.toLowerCase() === item.name.toLowerCase())), [brands, categoryProducts])
  const displayed = useMemo(() => {
    const search = query.trim().toLowerCase()
    return categoryProducts.filter((product) => {
      const matchesBrand = brand === 'all' || product.brand.toLowerCase() === brand.toLowerCase()
      const matchesSearch = !search || `${product.name} ${product.brand} ${product.description} ${product.specs.join(' ')}`.toLowerCase().includes(search)
      return matchesBrand && matchesSearch
    })
  }, [brand, categoryProducts, query])

  useEffect(() => {
    if (category) setPageMeta(category.name, `${category.description} Browse available ${category.name.toLowerCase()} and enquire directly with A Kaycee Electricals.`)
  }, [category])

  if (!category) return <section className="category-missing"><div className="container"><p className="eyebrow text-gold-dark">Category unavailable</p><h1>We could not find that category.</h1><Link className="button button-dark" to="/#categories">Browse homepage categories</Link></div></section>

  const related = categories.filter((item) => item.id !== category.id).slice(0, 3)

  return <>
    <section className="category-detail-hero">
      <img src={category.image} alt={category.name} />
      <div className="category-detail-shade" />
      <div className="container category-detail-copy">
        <Link to="/#categories"><ArrowLeft size={15}/> Homepage categories</Link>
        <p className="eyebrow text-gold-light">A Kaycee collection</p>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
        <span>{categoryProducts.length} {categoryProducts.length === 1 ? 'catalogue item' : 'catalogue items'}</span>
      </div>
    </section>

    {categoryBrands.length > 0 && <section className="category-brand-filter" aria-label={`Filter ${category.name} by brand`}>
      <div className="container">
        <button type="button" className={brand === 'all' ? 'active' : ''} onClick={() => setBrand('all')}>All brands</button>
        {categoryBrands.map((item) => <button type="button" key={item.name} className={brand === item.name ? 'active' : ''} onClick={() => setBrand(item.name)} aria-label={`Show ${item.name} products`}>
          <BrandLogo brand={item.name} logo={item.logo} logoDark={item.logoDark} variant="dark" className="category-brand-logo"/>
        </button>)}
      </div>
    </section>}

    <section className="category-products-section">
      <div className="container">
        <div className="category-products-heading">
          <div><p className="eyebrow text-gold-dark">The collection</p><h2>Find your right fit.</h2></div>
          <label><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${category.shortName.toLowerCase()}`} aria-label={`Search ${category.name}`}/>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}</label>
        </div>
        <div className="catalogue-status"><Check size={15}/><span>Current pricing and availability are confirmed when you enquire.</span></div>
        {displayed.length ? <div className="catalogue-grid">{displayed.map((product) => <ProductCard product={product} key={product.slug}/>)}</div> : <div className="catalogue-empty"><p className="eyebrow text-gold-dark">Nothing listed yet</p><h3>Ask us about {category.name.toLowerCase()}.</h3><p>The owner can add products to this category from the admin portal at any time.</p><WhatsAppLink subject={category.name}>Ask on WhatsApp</WhatsAppLink></div>}
      </div>
    </section>

    <section className="category-related"><div className="container"><div className="category-related-heading"><p className="eyebrow text-gold-dark">Keep exploring</p><h2>Other categories</h2></div><div className="category-related-grid">{related.map((item) => <Link to={`/category/${item.id}`} key={item.id}><img src={item.image} alt="" loading="lazy"/><span><strong>{item.name}</strong><ArrowRight size={17}/></span></Link>)}</div></div></section>
  </>
}
