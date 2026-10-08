import { ArrowRight, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { setPageMeta } from '../lib/site'
import { BrandLogo } from '../components/BrandLogos'
import { ProductCard } from '../components/ProductCard'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { NewsletterSignup } from '../components/NewsletterSignup'
import { useCatalog } from '../context/CatalogContext'

export function HomePage() {
  const { products, categories, brands } = useCatalog()

  useEffect(() => {
    setPageMeta('Electrical Materials, Appliances & Electronics in Lagos', 'Explore appliances, electronics and electrical materials from A Kaycee Electricals in Ogba, Lagos. Enquire directly on WhatsApp.')
  }, [])

  const featured = products.filter((product) => product.featured).slice(0, 4)

  return (
    <>
      <section className="showroom-hero">
        <img className="showroom-hero-image" src="/assets/business/family-lifestyle-hero-light.jpg" alt="Happy family enjoying a bright comfortable modern home with appliances" />
        <div className="showroom-hero-overlay" />
        <div className="container showroom-hero-content">
          <p className="showroom-kicker">Appliances · Electronics · Electricals</p>
          <h1>Better living.<br /><span>Better choices.</span></h1>
          <p>Quality essentials for your home, business and next project.</p>
          <div className="showroom-hero-actions">
            <Link to="/#categories" className="showroom-button showroom-button-primary">Explore categories <ArrowRight size={17} /></Link>
            <WhatsAppLink className="showroom-button showroom-button-secondary">Enquire on WhatsApp</WhatsAppLink>
          </div>
        </div>
        <div className="showroom-scroll-cue"><span />Discover</div>
      </section>

      <section className="showroom-categories" id="categories">
        <div className="container showroom-section-heading">
          <div><p className="showroom-kicker showroom-kicker-blue">Explore the range</p><h2>Shop by category</h2></div>
          <Link to="/#categories">Browse below <ArrowRight size={16} /></Link>
        </div>
        <div className="container showroom-category-grid">
          {categories.map((category, index) => {
            const count = products.filter((product) => product.category === category.id).length
            return (
              <Link key={category.id} to={`/category/${category.id}`} className={`showroom-category-card showroom-category-${index + 1}`}>
                <img src={category.image} alt={`${category.name} at A Kaycee Electricals`} loading={index > 2 ? 'lazy' : 'eager'} />
                <div className="showroom-category-overlay" />
                <span className="showroom-category-count">{count || 'New'} {count === 1 ? 'product' : count ? 'products' : ''}</span>
                <div><h3>{category.name}</h3><span>Explore <ArrowRight size={17} /></span></div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="showroom-products">
        <div className="container showroom-section-heading">
          <div><p className="showroom-kicker showroom-kicker-blue">Popular choices</p><h2>Made for everyday living</h2></div>
          <p>Browse a few catalogue highlights, then ask our team to confirm the model, pricing and availability.</p>
        </div>
        <div className="container showroom-product-grid">
          {featured.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
        <div className="container showroom-centered-link"><Link to="/#categories" className="showroom-button showroom-button-ink">Browse categories <ArrowRight size={17} /></Link></div>
      </section>

      <section className="showroom-story">
        <div className="showroom-story-image"><img src="/assets/products/lg-55-4k-tv.jpg" alt="Modern television and home entertainment setting" loading="lazy" /></div>
        <div className="showroom-story-copy">
          <p className="showroom-kicker">One dependable stop</p>
          <h2>For the home.<br />For the project.</h2>
          <p>From major appliances to installation materials, A Kaycee helps homes, businesses and contractors find practical options in one place.</p>
          <div className="showroom-story-points">
            <span><BadgeCheck size={19} /> 10+ years of experience</span>
            <span><BadgeCheck size={19} /> Recognized appliance brands</span>
            <span><BadgeCheck size={19} /> Physical store in Ogba, Lagos</span>
          </div>
          <Link to="/services">Explore our services <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="showroom-brands">
        <div className="container">
          <p className="showroom-kicker showroom-kicker-blue">Brands available</p>
          <div className="showroom-brand-row">
            <div className="showroom-brand-track">
              {[0, 1].map((copy) => (
                <div className="showroom-brand-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                  {brands.map((brand) => (
                    <Link key={`${copy}-${brand.name}`} to={`/products?brand=${encodeURIComponent(brand.name)}`} aria-label={copy === 0 ? `Browse ${brand.name} products` : undefined} tabIndex={copy === 1 ? -1 : undefined}>
                      <BrandLogo brand={brand.name} logo={brand.logo} logoDark={brand.logoDark} variant="dark" className="showroom-brand-logo" />
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="showroom-contact">
        <div className="container showroom-contact-inner">
          <div><p className="showroom-kicker">Stay in the know</p><h2>See something you like?</h2><p>Subscribe for useful buying guides, new catalogue additions and occasional store updates.</p></div>
          <NewsletterSignup compact />
        </div>
      </section>

    </>
  )
}
