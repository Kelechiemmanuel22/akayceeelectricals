import { ArrowUpRight, Bookmark, ChevronDown, MapPin, Menu, Phone, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { contact, navLinks } from '../lib/site'
import { BrandMark } from './BrandMark'
import { WhatsAppLink } from './WhatsAppLink'
import { InstagramIcon, WhatsAppIcon } from './SocialIcons'
import { QuoteDrawer } from './QuoteDrawer'
import { useQuoteCart } from '../context/QuoteCartContext'
import { useCatalog } from '../context/CatalogContext'
import { useShopTools } from '../context/ShopToolsContext'

export function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { setIsOpen: setQuoteDrawerOpen, totalCount } = useQuoteCart()
  const { saved, compared } = useShopTools()
  const { categories } = useCatalog()
  const close = () => { setMenuOpen(false); setCategoriesOpen(false) }
  useEffect(() => {
    // Leave the opening composition untouched, then turn the same header into
    // a fixed white bar as soon as the visitor begins moving through the page.
    const updateHeader = () => setScrolled(window.scrollY > 16)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col justify-between">
      <header className={`site-header ${scrolled ? 'site-header-scrolled' : ''}`}>
        <div className="container site-header-inner">
          <BrandMark />
          <div className="site-header-actions">
            <Link to="/products" className="site-header-icon site-header-search" aria-label="Search products"><Search size={19}/></Link>
            <a href={contact.phoneHref} className="site-header-icon" aria-label="Call A Kaycee Electricals"><Phone size={18}/></a>
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="site-header-icon site-header-whatsapp-icon" aria-label="Chat with A Kaycee Electricals on WhatsApp"><WhatsAppIcon className="size-[18px]"/></a>
            <button className="site-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu"><Menu size={22}/></button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="mobile-menu-header">
            <BrandMark light />
            <button onClick={close} className="mobile-menu-close" aria-label="Close navigation menu"><X size={22}/></button>
          </div>
          <nav className="mobile-menu-nav" aria-label="Main navigation">
            {navLinks.map((link) => link.label === 'Categories' ? (
              <div className={`mobile-category-menu ${categoriesOpen ? 'open' : ''}`} key={link.label}>
                <button type="button" className="category-menu-trigger" aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen((open) => !open)}>
                  <span>Categories</span><ChevronDown size={21}/>
                </button>
                <div className="category-menu-list">
                  {categories.map((category) => <NavLink key={category.id} to={`/category/${category.id}`} onClick={close}>{category.name}</NavLink>)}
                </div>
              </div>
            ) : (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={close} className={({ isActive }) => isActive ? 'active' : ''}>{link.label}</NavLink>
            ))}
          </nav>
          <div className="mobile-menu-footer">
            <div className="mobile-menu-tools">
              <Link to="/saved" onClick={close}><Bookmark size={16}/> Saved & compare <span>{saved.length + compared.length}</span></Link>
              <button type="button" onClick={() => { close(); setQuoteDrawerOpen(true) }}><ShoppingBag size={16}/> Quote list <span>{totalCount}</span></button>
            </div>
            <div className="mobile-menu-contact">
              <a href={contact.phoneHref}><Phone size={15}/> Call store</a>
              <a href={contact.instagram} target="_blank" rel="noreferrer"><InstagramIcon className="size-4"/> Instagram</a>
            </div>
            <WhatsAppLink className="w-full text-center" />
            <p><MapPin size={13}/>12 Ajayi Road, Ogba Okeira, Lagos</p>
          </div>
        </div>
      )}

      <main className="flex-1"><Outlet /></main>
      <QuoteDrawer />
      <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="floating-whatsapp" aria-label="Direct WhatsApp chat"><WhatsAppIcon className="size-7"/></a>
      <Footer />
    </div>
  )
}

function Footer() {
  const { categories } = useCatalog()
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <BrandMark />
          <p>Electrical materials, cooling systems, home appliances and electronics for homes, contractors and businesses in Lagos.</p>
          <div className="footer-socials">
            <a href={contact.instagram} target="_blank" rel="noreferrer" className="footer-social-link"><InstagramIcon className="size-4"/><span>@a_kaycee_electricals</span><ArrowUpRight size={13}/></a>
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="footer-social-link"><WhatsAppIcon className="size-4"/><span>WhatsApp Store</span></a>
          </div>
        </div>
        <FooterList title="Explore" links={navLinks.filter((link) => link.label !== 'Categories').map(({ to, label }) => ({ label, to }))}/>
        <FooterList title="Categories" links={categories.slice(0, 6).map((item) => ({ label: item.name, to: `/category/${item.id}` }))}/>
        <div className="footer-contact">
          <p className="footer-label">Store & Contact</p>
          <a className="footer-address" href={contact.directions} target="_blank" rel="noreferrer">{contact.address}</a>
          <a className="footer-phone" href={contact.phoneHref}>{contact.phone}</a>
          <a className="footer-email" href={`mailto:${contact.email}`}>{contact.email}</a>
          <WhatsAppLink compact className="mt-5 w-full text-center" />
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} A Kaycee Electricals. All rights reserved.</p>
        <p><a href={contact.instagram} target="_blank" rel="noreferrer">Instagram</a><span>•</span><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a><span>•</span><a href={contact.directions} target="_blank" rel="noreferrer">Google Maps</a></p>
      </div>
    </footer>
  )
}

function FooterList({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return <div><p className="footer-label">{title}</p><ul className="footer-list">{links.map((link) => <li key={link.to}><Link to={link.to} className="footer-list-link">{link.label}</Link></li>)}</ul></div>
}
