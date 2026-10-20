import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, BarChart3, Bell, ChevronRight, FolderTree, Grid2X2, Home, Image, Layers, LogOut, Mail, Menu, MessageSquare, Package, Search, Settings, ShieldCheck, X } from 'lucide-react'

export type AdminSection = 'overview' | 'products' | 'categories' | 'subcategories' | 'brands' | 'deals' | 'analytics' | 'newsletter' | 'requests' | 'media' | 'team' | 'settings'
const items = [
  { id: 'overview', label: 'Overview', icon: Home, group: '' },
  { id: 'products', label: 'Products', icon: Package, group: 'Catalogue' },
  { id: 'categories', label: 'Categories', icon: Layers, group: 'Catalogue' },
  { id: 'subcategories', label: 'Subcategories', icon: FolderTree, group: 'Catalogue' },
  { id: 'brands', label: 'Brands', icon: Grid2X2, group: 'Catalogue' },
  { id: 'deals', label: 'Combo deals', icon: Package, group: 'Catalogue' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Connect & grow', owner: true },
  { id: 'requests', label: 'Customer requests', icon: MessageSquare, group: 'Connect & grow', owner: true },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, group: 'Connect & grow', owner: true },
  { id: 'media', label: 'Media library', icon: Image, group: 'Connect & grow' },
  { id: 'team', label: 'Team & access', icon: ShieldCheck, group: 'Workspace', owner: true },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'Workspace' },
] as const
export type WorkspaceSearchItem = { id: string; label: string; kind: string; section: AdminSection; onSelect?: () => void }

export function AdminWorkspace({ section, onNavigate, isOwner, email, logo, searchItems, children, onSignOut }: { section: AdminSection; onNavigate: (section: AdminSection) => void; isOwner: boolean; email?: string; logo?: string; searchItems: WorkspaceSearchItem[]; children: ReactNode; onSignOut: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(() => window.matchMedia('(max-width: 1050px)').matches)
  const searchRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const closeMenu = () => { setMenuOpen(false); requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true })) }
  const title = items.find(item => item.id === section)?.label || 'Overview'
  const initials = (email?.split('@')[0] || 'Owner').slice(0, 2).toUpperCase()
  const logoSrc = !logo || ['/assets/business/instagram-logo.jpg', '/assets/brand/akaycee-logo.png'].includes(logo) ? '/assets/brand/akaycee-logo-transparent.png' : logo
  const results = search.trim() ? searchItems.filter(item => item.label.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 7) : []
  const navigate = (next: AdminSection) => { onNavigate(next); setMenuOpen(false); setSearchOpen(false); setSearch(''); window.scrollTo({ top: 0, behavior: 'instant' }); requestAnimationFrame(() => { if (!document.querySelector('.owner-modal')) document.getElementById('admin-main')?.focus({ preventScroll: true }) }) }
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1050px)')
    const update = () => { setMobileNav(media.matches); if (!media.matches) setMenuOpen(false) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAccountOpen(false); setSearchOpen(false) } }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [])
  useEffect(() => {
    let current: HTMLElement | null = null
    let restore: (() => void) | undefined
    const observe = () => {
      const dialog = document.querySelector<HTMLElement>('.admin-workspace .owner-modal')
      if (dialog === current) return
      restore?.(); restore = undefined; current = dialog
      if (!dialog) return
      const previous = document.activeElement as HTMLElement | null
      const overflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const background: { element: HTMLElement; inert: boolean }[] = []
      let branch: HTMLElement | null = dialog
      // Nested editors (such as subcategories) must never inert their own ancestor.
      while (branch && !branch.classList.contains('admin-workspace')) {
        const parent: HTMLElement | null = branch.parentElement
        if (!parent) break
        for (const element of parent.children) {
          if (element !== branch && element instanceof HTMLElement) background.push({ element, inert: element.inert })
        }
        branch = parent
      }
      background.forEach(item => { item.element.inert = true })
      const controls = () => [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(item => item.getClientRects().length)
      // Do not summon the phone keyboard before the admin chooses a field.
      const focus = window.matchMedia('(max-width: 760px)').matches
        ? controls()[0]
        : dialog.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled])') || controls()[0]
      focus?.focus({ preventScroll: true })
      const viewport = window.visualViewport
      const fitViewport = () => {
        dialog.style.setProperty('--editor-viewport-height', `${viewport?.height || window.innerHeight}px`)
        dialog.style.setProperty('--editor-viewport-top', `${viewport?.offsetTop || 0}px`)
      }
      fitViewport()
      viewport?.addEventListener('resize', fitViewport)
      viewport?.addEventListener('scroll', fitViewport)
      const key = (event: KeyboardEvent) => {
        if (event.key === 'Escape') { event.preventDefault(); dialog.querySelector<HTMLButtonElement>('button[aria-label="Close editor"]')?.click() }
        if (event.key === 'Tab') {
          const items = controls(), first = items[0], last = items[items.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
      }
      document.addEventListener('keydown', key)
      restore = () => {
        viewport?.removeEventListener('resize', fitViewport)
        viewport?.removeEventListener('scroll', fitViewport)
        document.body.style.overflow = overflow
        background.forEach(item => { item.element.inert = item.inert })
        document.removeEventListener('keydown', key)
        if (previous?.isConnected) previous.focus({ preventScroll: true })
      }
    }
    const observer = new MutationObserver(observe)
    observer.observe(document.body, { childList: true, subtree: true })
    observe()
    return () => { observer.disconnect(); restore?.() }
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
      if (event.key === 'Tab') {
        const controls = [...(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') || [])].filter(item => item.getClientRects().length)
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key) }
  }, [menuOpen])
  return <div className="admin-workspace">
    <a className="admin-skip" href="#admin-main">Skip to content</a>
    {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close navigation" onClick={closeMenu}/ >}
    <aside ref={sidebarRef} inert={mobileNav && !menuOpen} role={mobileNav && menuOpen ? 'dialog' : undefined} aria-modal={mobileNav && menuOpen ? true : undefined} className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Admin navigation" id="admin-sidebar">
      <div className="admin-brand"><a href="/" aria-label="A Kaycee Electricals website"><img src={logoSrc} alt="A Kaycee Electricals"/><span>OWNER PORTAL</span></a><button ref={closeRef} className="admin-mobile-close" onClick={closeMenu} aria-label="Close navigation"><X size={22}/></button></div>
      <nav>{items.filter(item => !('owner' in item) || !item.owner || isOwner).map((item, index, visible) => <div key={item.id}>{item.group && item.group !== visible[index - 1]?.group && <p className="admin-nav-label">{item.group}</p>}<button type="button" aria-current={section === item.id ? 'page' : undefined} className={section === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><item.icon size={20} strokeWidth={1.7}/><span>{item.label}</span></button></div>)}</nav>
      <div className="admin-sidebar-profile"><span className="admin-avatar">{initials}</span><div><strong>{isOwner ? 'Store owner' : 'Administrator'}</strong><small title={email}>{email}</small></div><button type="button" onClick={onSignOut} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button></div>
    </aside>
    <div className="admin-workspace-body" inert={mobileNav && menuOpen}><header className="admin-topbar">
      <button ref={triggerRef} type="button" className="admin-menu-trigger" aria-label="Open admin navigation" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(true)}><Menu size={24}/></button>
      <p className="admin-breadcrumb">Workspace <span>/</span> <strong>{title}</strong></p>
      <div className="admin-global-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchOpen(false) }}><Search size={18}/><input ref={searchRef} type="search" value={search} placeholder="Search products, categories, brands…" aria-label="Search admin workspace" aria-expanded={searchOpen && Boolean(search)} aria-controls="admin-search-results" onFocus={() => setSearchOpen(true)} onChange={event => { setSearch(event.target.value); setSearchOpen(true) }} onKeyDown={event => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter' && results[0]) { event.preventDefault(); const first = results[0]; navigate(first.section); first.onSelect?.() } }}/ >
        {searchOpen && search.trim() && <div id="admin-search-results" className="admin-search-results">{results.length ? results.map(item => <button key={item.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => { navigate(item.section); item.onSelect?.() }}><span><strong>{item.label}</strong><small>{item.kind}</small></span><ChevronRight size={16}/></button>) : <p>No matching items.</p>}</div>}
      </div>
      {isOwner && <button type="button" className="admin-top-icon" aria-label="Open customer requests" title="Customer requests" onClick={() => navigate('requests')}><Bell size={21}/></button>}
      <div className="admin-account"><button type="button" aria-label="Account options" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}><span className="admin-avatar">{initials}</span><span>{isOwner ? 'Store owner' : 'Administrator'}</span><ChevronRight size={14} className="admin-account-chevron"/></button>{accountOpen && <div className="admin-account-menu"><a href="/" target="_blank" rel="noreferrer"><ArrowUpRight size={16}/> View website</a><button type="button" onClick={onSignOut}><LogOut size={16}/> Sign out</button></div>}</div>
    </header><main id="admin-main" className="admin-main" tabIndex={-1}>{children}</main></div>
  </div>
}
