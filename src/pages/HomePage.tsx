import { Building2, MapPin, Phone, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { contact, setPageMeta } from '../lib/site'
import { BrandShowcase } from '../components/BrandShowcase'
import { ProductCard } from '../components/ProductCard'
import { SectionIntro } from '../components/SectionIntro'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { SizingCalculator } from '../components/SizingCalculator'
import { FaqSection } from '../components/FaqSection'
import { useCatalog } from '../context/CatalogContext'
import { NewsletterSignup } from '../components/NewsletterSignup'

const trust = [
  { icon: Building2, title: '10+ years', text: 'Experience across electricals, appliances and electronics.' },
  { icon: ShieldCheck, title: 'One dependable stop', text: 'Materials, appliances and electronics for different needs.' },
  { icon: Sparkles, title: 'Recognized brands', text: 'Explore familiar brands across core product categories.' },
  { icon: Wrench, title: 'Project supply', text: 'Share your materials list or project requirements for a quote.' },
]

export function HomePage() {
  const { products, categories, brands } = useCatalog()

  useEffect(() => {
    setPageMeta('Electrical Materials, Appliances & Electronics in Lagos', 'A Kaycee Electricals supplies electrical materials, home appliances and consumer electronics in Ogba Okeira, Lagos.')
  }, [])

  const featured = products.filter((product) => product.featured).slice(0, 6)

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow text-gold-light">Electricals · Appliances · Electronics</p>
            <h1 className="home-hero-title">Better choices for every room and every project.</h1>
            <p className="home-hero-text">Explore electrical materials, home appliances and consumer electronics for homes, offices, businesses and projects across Lagos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="button button-gold">Shop the catalogue</Link>
              <WhatsAppLink>Ask on WhatsApp</WhatsAppLink>
            </div>
            <div className="home-hero-location">
              <MapPin size={18} />
              <span><strong>12 Ajayi Road, Ogba Okeira</strong><small>Lagos State, Nigeria</small></span>
            </div>
          </div>
          <div className="home-hero-visual">
            <img src="/assets/business/hero-showroom.png" alt="Modern interior featuring air conditioning, television and lighting" />
            <div className="home-hero-caption"><span>For home</span><span>For business</span><span>For projects</span></div>
          </div>
        </div>
      </section>

      <section className="quick-paths" aria-label="Quick shopping paths">
        <div className="container quick-paths-grid">
          <Link to="/products?category=electrical-materials"><span>01</span><strong>Electrical materials</strong><small>Wires, cables, switches and fittings</small></Link>
          <Link to="/products?category=air-conditioners"><span>02</span><strong>Cooling solutions</strong><small>Split and standing air conditioners</small></Link>
          <Link to="/products?category=kitchen"><span>03</span><strong>Home appliances</strong><small>Everyday appliances for modern living</small></Link>
          <Link to="/contact"><span>04</span><strong>Project enquiry</strong><small>Send a list and request a quote</small></Link>
        </div>
      </section>

      <section className="section category-section">
        <div className="container">
          <div className="section-heading-row">
            <SectionIntro eyebrow="Shop by category" title="Find what your space needs.">Browse practical choices for everyday living and larger installation projects.</SectionIntro>
            <Link to="/products" className="text-link">View every category</Link>
          </div>
          <div className="category-editorial-grid">
            {categories.slice(0, 6).map((category, index) => (
              <Link key={category.id} to={`/products?category=${category.id}`} className={`category-editorial-card category-editorial-card-${index + 1}`}>
                <img src={category.image} alt={`${category.name} product selection`} loading={index > 1 ? 'lazy' : 'eager'} />
                <div className="category-editorial-shade" />
                <span className="category-editorial-number">{String(index + 1).padStart(2, '0')}</span>
                <div className="category-editorial-copy">
                  <p>{category.shortName}</p>
                  <h3>{category.name}</h3>
                  <span>Browse products</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section products-featured-section">
        <div className="container">
          <div className="section-heading-row">
            <SectionIntro eyebrow="Catalogue highlights" title="A closer look at popular choices.">Demo catalogue items across appliances and installation materials. Confirm current pricing and availability with the store.</SectionIntro>
            <Link to="/products" className="button button-light">Browse full catalogue</Link>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </div>
      </section>

      <section className="brand-showcase-section">
        <div className="container">
          <div className="brand-showcase-heading">
            <div>
              <p className="eyebrow text-gold-light">Available brands</p>
              <h2>Names you know.<br />Options worth exploring.</h2>
            </div>
            <p>Browse products across familiar appliance and electronics brands. Ask the store team to confirm the options currently available.</p>
          </div>
          <BrandShowcase brands={brands} />
        </div>
      </section>

      <section className="section trust-section">
        <div className="container">
          <div className="trust-intro">
            <p className="eyebrow text-gold-dark">Why A Kaycee</p>
            <h2>Practical support, from first question to final choice.</h2>
          </div>
          <div className="trust-list">
            {trust.map(({ icon: Icon, title, text }, index) => (
              <article key={title}>
                <span className="trust-index">0{index + 1}</span>
                <Icon size={24} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section calculator-section"><div className="container"><SizingCalculator /></div></section>
      <section className="section buying-guides-section"><div className="container"><div className="section-heading-row"><SectionIntro eyebrow="Before you choose" title="Simple buying guides.">Useful starting points for better product conversations—then confirm the exact model with the store.</SectionIntro><Link className="button button-light" to="/request">Get personal help</Link></div><div className="guide-grid"><article><span>Cooling</span><h3>Choose the right AC size</h3><p>Room dimensions, sunlight and occupancy all affect the cooling capacity you need.</p><Link to="/request">Ask for guidance</Link></article><article><span>Energy use</span><h3>Inverter or non-inverter?</h3><p>Compare usage patterns, initial budget and long-term operating needs.</p><Link to="/request">Compare options</Link></article><article><span>Entertainment</span><h3>Find a comfortable TV size</h3><p>Balance viewing distance, wall space and picture quality for your room.</p><Link to="/request">Get a recommendation</Link></article></div></div></section>
      <FaqSection className="bg-sand" />

      <section className="newsletter-section"><div className="container"><NewsletterSignup /></div></section>

      <section className="final-cta-section">
        <div className="container final-cta-inner">
          <div>
            <p className="eyebrow text-gold-light">Visit or enquire</p>
            <h2>Let’s find the right appliance or material for you.</h2>
            <p>Speak with the store team about options, specifications and current pricing.</p>
          </div>
          <div className="final-cta-actions">
            <a href={contact.phoneHref} className="button button-light"><Phone size={17} /> Call {contact.phone}</a>
            <WhatsAppLink>Chat on WhatsApp</WhatsAppLink>
          </div>
        </div>
      </section>
    </>
  )
}
