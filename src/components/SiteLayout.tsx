import { Menu, Phone, X, MapPin, ArrowUpRight, ShoppingBag, Bookmark } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { contact, navLinks } from '../lib/site'
import { BrandMark } from './BrandMark'
import { WhatsAppLink } from './WhatsAppLink'
import { WhatsAppIcon, InstagramIcon } from './SocialIcons'
import { QuoteDrawer } from './QuoteDrawer'
import { useQuoteCart } from '../context/QuoteCartContext'
import { useCatalog } from '../context/CatalogContext'
import { NewsletterSignup } from './NewsletterSignup'
import { useShopTools } from '../context/ShopToolsContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link ${isActive ? 'nav-link-active' : ''}`

export function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { setIsOpen: setQuoteDrawerOpen, totalCount } = useQuoteCart()
  const { categories } = useCatalog()
  const { saved, compared } = useShopTools()
  const close = () => setMenuOpen(false)

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col justify-between">
      {/* Main Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 backdrop-blur-md">
        <div className="container flex h-[78px] items-center justify-between gap-6">
          <BrandMark />

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={navClass}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/saved" className="header-saved" aria-label="Open saved products and comparison"><Bookmark size={15}/><span>{saved.length + compared.length}</span></Link>
            {/* Quote Request List Drawer Trigger */}
            <button
              type="button"
              onClick={() => setQuoteDrawerOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3.5 py-2 text-xs font-bold text-ink shadow-xs transition hover:border-gold hover:bg-gold/10"
              aria-label="Open Quote List"
            >
              <ShoppingBag size={15} className="text-gold-dark" />
              <span className="hidden sm:inline">Quote List</span>
              {totalCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-gold-dark text-[10px] font-extrabold text-white">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Direct WhatsApp Action */}
            <div className="hidden sm:block">
              <WhatsAppLink compact />
            </div>

            {/* Mobile Navigation Trigger */}
            <button
              className="grid size-11 place-items-center rounded-full border border-ink/15 text-ink transition hover:bg-sand lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Full Screen Drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-between bg-ink text-white lg:hidden overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Header inside mobile menu */}
          <div className="container flex h-[78px] items-center justify-between border-b border-white/10">
            <BrandMark light />
            <button
              onClick={close}
              className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
              aria-label="Close navigation menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Links with comfortable spacing */}
          <nav className="container flex flex-col gap-4 py-8" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={close}
                className={({ isActive }) =>
                  `font-display text-2xl font-bold tracking-tight transition-colors py-2 border-b border-white/5 ${
                    isActive ? 'text-gold-light' : 'text-white/90 hover:text-gold'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer inside mobile menu with WhatsApp & Instagram */}
          <div className="container space-y-4 pb-10">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="button button-instagram text-center text-xs"
              >
                <InstagramIcon className="size-4" /> Instagram
              </a>
              <a
                href={contact.phoneHref}
                className="button button-light text-center text-xs"
              >
                <Phone size={14} /> Call Store
              </a>
            </div>

            <WhatsAppLink className="w-full text-center" />

            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-white/50">
              <MapPin size={13} className="text-gold" />
              <span>12 Ajayi Road, Ogba Okeira, Lagos</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Quote Drawer Component */}
      <QuoteDrawer />

      {/* Floating Action Buttons */}
      <a
        href={`https://wa.me/${contact.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-xl shadow-whatsapp/30 transition hover:scale-110"
        aria-label="Direct WhatsApp chat"
      >
        <WhatsAppIcon className="size-7" />
      </a>

      {/* Footer */}
      <Footer />
    </div>
  )
}

function Footer() {
  const { categories } = useCatalog()
  return (
    <footer className="mt-20 border-t border-white/10 bg-ink pt-16 pb-12 text-white">
      <div className="container grid gap-12 sm:grid-cols-2 md:grid-cols-[1.3fr_0.7fr_0.8fr_1.1fr]">
        {/* Col 1: Brand & Socials */}
        <div>
          <BrandMark light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
            Electrical installation materials, cooling systems, home appliances, and consumer electronics for homes, contractors, and businesses in Lagos.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-gold hover:text-gold-light"
            >
              <InstagramIcon className="size-4 text-pink-400" />
              <span>@a_kaycee_electricals</span>
              <ArrowUpRight size={13} />
            </a>

            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-whatsapp/40 bg-whatsapp/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-whatsapp/30"
            >
              <WhatsAppIcon className="size-4 text-whatsapp" />
              <span>WhatsApp Store</span>
            </a>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <FooterList
          title="Explore"
          links={navLinks.map(({ to, label }) => ({ label, to }))}
        />

        {/* Col 3: Product Categories */}
        <FooterList
          title="Categories"
          links={categories.slice(0, 6).map((item) => ({
            label: item.name,
            to: `/products?category=${item.id}`,
          }))}
        />

        {/* Col 4: Store Info & Hours */}
        <div>
          <p className="eyebrow text-gold">Store & Contact</p>
          <a
            className="mt-4 block text-sm leading-relaxed text-white/75 transition hover:text-gold"
            href={contact.directions}
            target="_blank"
            rel="noreferrer"
          >
            {contact.address}
          </a>
          <a
            className="mt-4 block font-display text-base font-bold text-white hover:text-gold"
            href={contact.phoneHref}
          >
            {contact.phone}
          </a>
          <a
            className="mt-1 block text-xs text-white/70 hover:text-gold"
            href={`mailto:${contact.email}`}
          >
            {contact.email}
          </a>
          <WhatsAppLink compact className="mt-5 w-full text-center" />
        </div>
      </div>
      <div className="container mt-12"><NewsletterSignup compact /></div>

      {/* Footer Bottom Bar */}
      <div className="container mt-14 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
        <p>© {new Date().getFullYear()} A Kaycee Electricals. All rights reserved.</p>
        <p className="flex items-center gap-4">
          <a href={contact.instagram} target="_blank" rel="noreferrer" className="hover:text-gold">
            Instagram
          </a>
          <span>•</span>
          <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-gold">
            WhatsApp
          </a>
          <span>•</span>
          <a href={contact.directions} target="_blank" rel="noreferrer" className="hover:text-gold">
            Google Maps
          </a>
        </p>
      </div>
    </footer>
  )
}

function FooterList({
  title,
  links,
}: {
  title: string
  links: { label: string; to: string }[]
}) {
  return (
    <div>
      <p className="eyebrow text-gold">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-white/70 transition hover:text-gold-light"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
