import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BarChart3, Check, FolderPlus, ImagePlus, Loader2, LogOut, PackagePlus, Pencil, ShieldCheck, Tags, Trash2, X } from 'lucide-react'
import { CATALOG_BUCKET, isSupabaseConfigured, supabase } from '../lib/supabase'
import { AdminGrowthPanel } from '../components/AdminGrowthPanel'
import { AdminNewsletterPanel } from '../components/AdminNewsletterPanel'
import { researchedProducts } from '../data/researchedProducts'
import { AdminTeamPanel, AdminPasswordSetup } from '../components/AdminTeamPanel'
import { parsePrice } from '../lib/pricing'
import { canonicalCategory, getSubcategories, suggestSubcategory, validSubcategory, mapSubcategory, type SubcategoryRow, type ManagedSubcategory } from '../data/subcategories'
import { AdminSubcategoriesPanel } from '../components/AdminSubcategoriesPanel'
import { AdminWorkspace, type AdminSection, type WorkspaceSearchItem } from '../components/AdminWorkspace'
import { AdminOverview } from '../components/AdminOverview'
import { AdminMediaPanel, type AdminMediaItem } from '../components/AdminMediaPanel'
import { AdminDraftProvider, useAdminDraftState, useDiscardAdminDraft } from '../components/AdminDraftProvider'
import { clearAdminDrafts } from '../lib/adminDrafts'
import { AdminForgotPassword } from '../components/AdminForgotPassword'
import { AdminDealsPanel } from '../components/AdminDealsPanel'
import '../admin.css'

type ProductRow = {
  subcategory_id?: string | null
  price?: number | null
  price_is_estimate?: boolean
  price_note?: string
  id: string
  slug: string
  name: string
  category_id: string
  brand_name: string
  description: string
  specs: string[]
  image_url: string
  featured: boolean
  active: boolean
  sort_order: number
}

type CategoryRow = {
  id: string
  name: string
  short_name: string
  description: string
  image_url: string
  sort_order: number
  active: boolean
}

type BrandRow = {
  id: string
  name: string
  logo_url: string
  logo_dark_url: string | null
  tagline: string
  category_tags: string[]
  sort_order: number
  active: boolean
}

type SettingsRow = {
  id: number
  site_name: string
  tagline: string
  logo_url: string
  phone: string
  whatsapp: string
  email: string
  address: string
  instagram_url: string
}

const emptyProduct: Omit<ProductRow, 'id'> = {
  price_is_estimate: false,
  price_note: '',
  slug: '',
  name: '',
  category_id: 'air-conditioners',
  brand_name: 'Hisense',
  description: '',
  specs: [],
  image_url: '',
  featured: false,
  active: true,
  sort_order: 100,
}

const emptyCategory: CategoryRow = { id: '', name: '', short_name: '', description: '', image_url: '', sort_order: 100, active: true }
const emptyBrand: Omit<BrandRow, 'id'> = { name: '', logo_url: '', logo_dark_url: null, tagline: '', category_tags: [], sort_order: 100, active: true }

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function OwnerPortalPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [setupPassword, setSetupPassword] = useState(() => new URLSearchParams(window.location.search).get('setup') === '1')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetPassword, setResetPassword] = useState(() => new URLSearchParams(window.location.search).get('reset') === '1')
  const [authNotice, setAuthNotice] = useState('')
  const [invalidRecovery, setInvalidRecovery] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const query = new URLSearchParams(window.location.search)
    return Boolean(hash.get('error') || query.get('error'))
  })

  const userId = session?.user.id
  const authUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setChecking(false)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      authUserId.current = data.session?.user.id || null
      setSession(data.session)
      if (!data.session) setChecking(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setResetPassword(true)
      if (event === 'SIGNED_OUT' && authUserId.current) {
        try { clearAdminDrafts(authUserId.current, window.localStorage) } catch { /* Storage may be disabled. */ }
      }
      if (nextSession && nextSession.user.id !== authUserId.current) setChecking(true)
      authUserId.current = nextSession?.user.id || null
      setSession(nextSession)
      if (!nextSession) setChecking(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !userId) {
      setIsOwner(false)
      setIsAdmin(false)
      return
    }

    let cancelled = false
    setChecking(true)
    void supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        setIsOwner(!error && data?.role === 'owner')
        setIsAdmin(!error && ['owner', 'admin'].includes(data?.role || ''))
        setChecking(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setPassword('')
    setLoading(false)
  }

  if (!isSupabaseConfigured) return <PortalMessage title="Supabase is not connected" text="Add the project URL and public anon key to the local environment before using the owner portal." />
  if (checking) return <PortalMessage title="Checking secure access" text="Verifying your Supabase session and owner role." loading />

  if (forgotPassword) return <AdminForgotPassword initialEmail={email} onBack={() => {
    setForgotPassword(false); setResetPassword(false); setInvalidRecovery(false)
    window.history.replaceState(null, '', '/ak-owner-portal')
  }}/>

  if (!session) {
    return (
      <main className="owner-login-shell">
        <form className="owner-login-card" onSubmit={signIn}>
          <div className="owner-lock"><ShieldCheck size={28} /></div>
          <p className="eyebrow text-gold-dark">Private owner access</p>
          <h1>Manage the A Kaycee catalogue.</h1>
          <p>This page is protected by Supabase authentication and database security rules.</p>
          {(invalidRecovery || resetPassword) && <p className="owner-error" role="alert">This reset link is invalid or has expired. Use “Forgot password?” to request a new one.</p>}
          {authNotice && <p className="owner-notice" role="status">{authNotice}</p>}
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          {authError && <div className="owner-error">{authError}</div>}
          <button className="button button-dark" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />} Sign in securely</button>
          <button type="button" className="owner-back-link" disabled={loading} onClick={() => { setAuthError(''); setPassword(''); setForgotPassword(true) }}>Forgot password?</button>
          <a href="/" className="owner-back-link">Return to public website</a>
        </form>
      </main>
    )
  }

  if (resetPassword && invalidRecovery) return <PortalMessage title="Request a new reset link" text="This password-reset link is invalid or has expired. Request a fresh link and open the newest email." action={<button className="button button-dark" onClick={() => setForgotPassword(true)}>Request reset link</button>}/>

  if (resetPassword) return <AdminPasswordSetup recovery onComplete={() => {
    void supabase?.auth.signOut().then(({ error }) => {
      if (error) { setAuthError('Your password was updated, but signing out failed. Please try signing out again.'); return }
      setResetPassword(false); setSetupPassword(false); setAuthNotice('Password updated. Sign in using your new password.'); setAuthError('')
      window.history.replaceState(null, '', '/ak-owner-portal')
    })
  }}/>

  if (setupPassword) return <AdminPasswordSetup onComplete={() => { setSetupPassword(false); window.history.replaceState(null, '', '/ak-owner-portal') }} />

  if (!isAdmin) {
    return <PortalMessage title="Administrator access required" text="This account is signed in, but the owner has not granted it access to manage the website." action={<button className="button button-dark" onClick={() => void supabase?.auth.signOut()}>Sign out</button>} />
  }

  return <AdminDraftProvider key={session.user.id} userId={session.user.id}><OwnerDashboard session={session} isOwner={isOwner} /></AdminDraftProvider>
}

function PortalMessage({ title, text, loading, action }: { title: string; text: string; loading?: boolean; action?: React.ReactNode }) {
  return <main className="owner-login-shell"><div className="owner-login-card owner-message-card">{loading ? <Loader2 className="animate-spin text-gold-dark" size={30} /> : <ShieldCheck className="text-gold-dark" size={30} />}<h1>{title}</h1><p>{text}</p>{action}<a href="/" className="owner-back-link">Return to public website</a></div></main>
}

function OwnerDashboard({ session, isOwner }: { session: Session; isOwner: boolean }) {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [brands, setBrands] = useState<BrandRow[]>([])
  const [settings, setSettings] = useState<SettingsRow | null>(null)
  const discardDraft = useDiscardAdminDraft()
  const [section, setSection] = useAdminDraftState<AdminSection>('section', 'overview')
  const [managedSubcategories, setManagedSubcategories] = useState<SubcategoryRow[]>([])
  const subcategoryDefinitions = useMemo(() => managedSubcategories.map(mapSubcategory), [managedSubcategories])
  const [editing, setEditing] = useAdminDraftState<ProductRow | null>('editing', null)
  const [creating, setCreating] = useAdminDraftState('creating', false)
  const [editingCategory, setEditingCategory] = useAdminDraftState<CategoryRow | null>('editingCategory', null)
  const [creatingCategory, setCreatingCategory] = useAdminDraftState('creatingCategory', false)
  const [editingBrand, setEditingBrand] = useAdminDraftState<BrandRow | null>('editingBrand', null)
  const [creatingBrand, setCreatingBrand] = useAdminDraftState('creatingBrand', false)
  const [query, setQuery] = useAdminDraftState('query', '')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(true)
  const [importingModels, setImportingModels] = useState(false)
  const [pricesEnabled, setPricesEnabled] = useState(false)
  const [subcategoriesEnabled, setSubcategoriesEnabled] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setBusy(true)
    const [productResult, categoryResult, brandResult, settingsResult, priceResult, subcategoryResult, definitionResult] = await Promise.all([
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('brands').select('*').order('sort_order'),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('products').select('price').limit(1),
      supabase.from('products').select('subcategory_id').limit(1),
      supabase.from('product_subcategories').select('*').order('sort_order').order('name'),
    ])
    if (productResult.error) setNotice(productResult.error.message)
    else setProducts((productResult.data || []) as ProductRow[])
    if (categoryResult.error) setNotice(categoryResult.error.message)
    else setCategories((categoryResult.data || []) as CategoryRow[])
    if (brandResult.error) setNotice(brandResult.error.message)
    else setBrands((brandResult.data || []) as BrandRow[])
    setSettings(settingsResult.data as SettingsRow | null)
    setPricesEnabled(!priceResult.error)
    setSubcategoriesEnabled(!subcategoryResult.error && !definitionResult.error)
    setManagedSubcategories((definitionResult.data || []) as SubcategoryRow[])
    setBusy(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const restoredEditorsChecked = useRef(false)
  useEffect(() => {
    if (busy || restoredEditorsChecked.current) return
    restoredEditorsChecked.current = true
    if (editing && !products.some(item => item.id === editing.id)) { discardDraft('product:'); setEditing(null); setNotice('The product you were editing is no longer available.') }
    if (editingCategory && !categories.some(item => item.id === editingCategory.id)) { discardDraft('category:'); setEditingCategory(null); setNotice('The category you were editing is no longer available.') }
    if (editingBrand && !brands.some(item => item.id === editingBrand.id)) { discardDraft('brand:'); setEditingBrand(null); setNotice('The brand you were editing is no longer available.') }
  }, [busy, products, categories, brands, editing, editingCategory, editingBrand, discardDraft, setEditing, setEditingCategory, setEditingBrand])

  const importModelExamples = async () => {
    if (!supabase || importingModels || busy) return
    setImportingModels(true)
    try {
      const missing = researchedProducts.filter(model => !products.some(product => product.slug === model.slug))
      if (!missing.length) { setNotice('All researched model examples are already in the catalogue. Existing edits were kept.'); return }
      const rows = missing.map((model, index) => {
        const category = categories.find(item => item.id === model.category) || categories.find(item => model.category === 'cooling' && item.id === 'air-conditioners')
        if (!category) throw new Error(`Create the ${model.category} category before importing model examples.`)
        return {
          slug: model.slug, name: model.name, category_id: category.id, brand_name: model.brand,
          ...(subcategoriesEnabled ? { subcategory_id: validSubcategory(model.category, suggestSubcategory(model.category, model.name, model.specs), subcategoryDefinitions) ? suggestSubcategory(model.category, model.name, model.specs) : null } : {}),
          description: model.description, specs: [...model.specs, `Manufacturer reference: ${model.sourceUrl}`],
          image_url: model.image, featured: false, active: true, sort_order: 200 + index,
        }
      })
      const { error } = await supabase.from('products').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
      if (error) throw error
      setNotice(`${rows.length} manufacturer model examples imported into Supabase. Existing products were not overwritten. Confirm store stock and image permissions before launch.`)
      await load()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not import model examples. Try again. Keep the existing catalogue unchanged.') }
    finally { setImportingModels(false) }
  }

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => !needle || `${product.name} ${product.brand_name} ${product.category_id}`.toLowerCase().includes(needle))
  }, [products, query])

  const toggleProduct = async (product: ProductRow, field: 'active' | 'featured') => {
    if (!supabase) return
    const { error } = await supabase.from('products').update({ [field]: !product[field] }).eq('id', product.id)
    setNotice(error ? error.message : `${product.name} updated.`)
    if (!error) await load()
  }

  const deleteProduct = async (product: ProductRow) => {
    if (!supabase || !window.confirm(`Delete ${product.name}? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    setNotice(error ? error.message : `${product.name} deleted.`)
    if (!error) await load()
  }

  const toggleCategory = async (category: CategoryRow) => {
    if (!supabase) return
    const { error } = await supabase.from('categories').update({ active: !category.active }).eq('id', category.id)
    setNotice(error ? error.message : `${category.name} is now ${category.active ? 'hidden' : 'visible'}.`)
    if (!error) await load()
  }

  const deleteCategory = async (category: CategoryRow) => {
    if (!supabase) return
    const usedBy = products.filter((product) => product.category_id === category.id).length
    if (usedBy) {
      setNotice(`${category.name} still contains ${usedBy} product${usedBy === 1 ? '' : 's'}. Move or remove those products before deleting the category.`)
      return
    }
    if (!window.confirm(`Delete the empty category ${category.name}?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    setNotice(error ? error.message : `${category.name} deleted.`)
    if (!error) await load()
  }

  const toggleBrand = async (brand: BrandRow) => {
    if (!supabase) return
    const { error } = await supabase.from('brands').update({ active: !brand.active }).eq('id', brand.id)
    setNotice(error ? error.message : `${brand.name} is now ${brand.active ? 'hidden' : 'visible'}.`)
    if (!error) await load()
  }

  const deleteBrand = async (brand: BrandRow) => {
    if (!supabase) return
    const usedBy = products.filter((product) => product.brand_name === brand.name).length
    if (usedBy) {
      setNotice(`${brand.name} is assigned to ${usedBy} product${usedBy === 1 ? '' : 's'}. Reassign those products before deleting the brand.`)
      return
    }
    if (!window.confirm(`Delete ${brand.name} from the brand list?`)) return
    const { error } = await supabase.from('brands').delete().eq('id', brand.id)
    setNotice(error ? error.message : `${brand.name} deleted.`)
    if (!error) await load()
  }

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !settings) return
    const { error } = await supabase.from('site_settings').update(settings).eq('id', 1)
    setNotice(error ? error.message : 'Business details saved and published.')
  }

  const searchItems: WorkspaceSearchItem[] = [
    ...products.map(item => ({ id: `product-${item.id}`, label: item.name, kind: 'Product', section: 'products' as const, onSelect: () => setEditing(item) })),
    ...categories.map(item => ({ id: `category-${item.id}`, label: item.name, kind: 'Category', section: 'categories' as const, onSelect: () => setEditingCategory(item) })),
    ...managedSubcategories.map(item => ({ id: `subcategory-${item.category_id}-${item.id}`, label: item.name, kind: 'Subcategory', section: 'subcategories' as const })),
    ...brands.map(item => ({ id: `brand-${item.id}`, label: item.name, kind: 'Brand', section: 'brands' as const, onSelect: () => setEditingBrand(item) })),
  ]
  const mediaItems: AdminMediaItem[] = [
    ...products.map(item => ({ id: `product-${item.id}`, name: item.name, kind: 'Product' as const, image: item.image_url, onEdit: () => setEditing(item) })),
    ...categories.map(item => ({ id: `category-${item.id}`, name: item.name, kind: 'Category' as const, image: item.image_url, onEdit: () => setEditingCategory(item) })),
    ...brands.map(item => ({ id: `brand-${item.id}`, name: item.name, kind: 'Brand' as const, image: item.logo_url, onEdit: () => setEditingBrand(item) })),
  ]
  const addProduct = () => { if (busy) { setNotice('Please wait for the catalogue to finish loading.'); return } setCreating(true) }

  return (
    <AdminWorkspace section={section} onNavigate={setSection} isOwner={isOwner} email={session.user.email} logo={settings?.logo_url} searchItems={searchItems} onSignOut={() => void supabase?.auth.signOut()}>
      <div className="admin-section-content">
        {notice && <div className="owner-notice"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}
        {section === 'overview' && <AdminOverview products={products} categories={categories} brandCount={brands.length} subcategoryCount={managedSubcategories.length} isOwner={isOwner} busy={busy} onNavigate={setSection} onAddProduct={addProduct} onEditProduct={id => setEditing(products.find(item => item.id === id) || null)}/>}
        {section === 'newsletter' && isOwner && <AdminNewsletterPanel/>}
        {(['analytics', 'requests'] as AdminSection[]).includes(section) && isOwner && <AdminGrowthPanel key={section} initialTab={section as 'analytics' | 'requests'} hideTabs/>}
        {section === 'media' && <AdminMediaPanel items={mediaItems}/>}
        {section === 'team' && isOwner && <AdminTeamPanel />}
        {section === 'subcategories' && <AdminSubcategoriesPanel categories={categories} products={products} rows={managedSubcategories} enabled={subcategoriesEnabled} onSaved={load}/>}
        {section === 'deals' && <AdminDealsPanel/>}

        {section === 'products' && <>
          <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Products</p><h1>Published catalogue</h1><p>Add stock examples and assign each one to a category and brand.</p></div><button className="button button-dark" onClick={() => setCreating(true)}><PackagePlus size={17} /> Add product</button></div>
          <input className="owner-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or brands" aria-label="Search admin products" />
          <div className="owner-model-import"><div><strong>Researched appliance models</strong><p>Add 14 manufacturer-sourced examples for laundry, refrigerators and air conditioners. Existing entries are skipped. These are examples, not verified stock.</p></div><button type="button" className="button button-dark" disabled={busy || importingModels} onClick={() => void importModelExamples()}>{importingModels ? <Loader2 className="animate-spin" size={17}/> : <PackagePlus size={17}/>} {importingModels ? 'Importing…' : 'Import model examples'}</button></div>
          <div className="owner-product-table">
            {busy ? <div className="owner-loading"><Loader2 className="animate-spin" /> Loading catalogue…</div> : visibleProducts.map((product) => (
              <article key={product.id} className="owner-product-row">
                <img src={product.image_url} alt="" />
                <div className="owner-product-copy"><strong>{product.name}</strong><span>{product.brand_name} · {categories.find((item) => item.id === product.category_id)?.name || product.category_id.replace(/-/g, ' ')}</span></div>
                <button className={product.featured ? 'owner-pill active' : 'owner-pill'} onClick={() => void toggleProduct(product, 'featured')}>{product.featured ? 'Featured' : 'Not featured'}</button>
                <button className={product.active ? 'owner-pill active' : 'owner-pill'} onClick={() => void toggleProduct(product, 'active')}>{product.active ? 'Visible' : 'Hidden'}</button>
                <div className="owner-row-actions"><button onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button><button onClick={() => void deleteProduct(product)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button></div>
              </article>
            ))}
          </div>
        </>}

        {section === 'categories' && <>
          <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Catalogue structure</p><h1>Product categories</h1><p>Create departments such as Phones & Tablets, Solar Systems, or Small Appliances.</p></div><button className="button button-dark" onClick={() => setCreatingCategory(true)}><FolderPlus size={17} /> Add category</button></div>
          <div className="owner-management-grid">{categories.map((category) => <article className="owner-management-card" key={category.id}><img src={category.image_url} alt="" /><div><p className="owner-card-kicker">{category.short_name}</p><h3>{category.name}</h3><p>{category.description}</p><small>{products.filter((product) => product.category_id === category.id).length} products</small></div><div className="owner-card-footer"><button className={category.active ? 'owner-pill active' : 'owner-pill'} onClick={() => void toggleCategory(category)}>{category.active ? 'Visible' : 'Hidden'}</button><div className="owner-row-actions"><button onClick={() => setEditingCategory(category)} aria-label={`Edit ${category.name}`}><Pencil size={16} /></button><button onClick={() => void deleteCategory(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button></div></div></article>)}</div>
        </>}

        {section === 'brands' && <>
          <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Suppliers</p><h1>Brands you stock</h1><p>Add or remove brands and upload the logos customers see on the website.</p></div><button className="button button-dark" onClick={() => setCreatingBrand(true)}><Tags size={17} /> Add brand</button></div>
          <div className="owner-management-grid owner-brand-admin-grid">{brands.map((brand) => <article className="owner-management-card" key={brand.id}><div className="owner-brand-logo"><img src={brand.logo_url} alt={`${brand.name} logo`} /></div><div><h3>{brand.name}</h3><p>{brand.tagline}</p><small>{products.filter((product) => product.brand_name === brand.name).length} products</small></div><div className="owner-card-footer"><button className={brand.active ? 'owner-pill active' : 'owner-pill'} onClick={() => void toggleBrand(brand)}>{brand.active ? 'Visible' : 'Hidden'}</button><div className="owner-row-actions"><button onClick={() => setEditingBrand(brand)} aria-label={`Edit ${brand.name}`}><Pencil size={16} /></button><button onClick={() => void deleteBrand(brand)} aria-label={`Delete ${brand.name}`}><Trash2 size={16} /></button></div></div></article>)}</div>
        </>}

        {section === 'settings' && settings && <form className="owner-settings-card owner-settings-standalone" onSubmit={saveSettings}><div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Business details</p><h1>Public contact information</h1></div><button className="button button-dark">Save details</button></div><div className="owner-form-grid"><label>Phone<input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} /></label><label>WhatsApp number<input value={settings.whatsapp} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} /></label><label>Email<input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} /></label><label>Instagram URL<input value={settings.instagram_url} onChange={(event) => setSettings({ ...settings, instagram_url: event.target.value })} /></label><label className="owner-wide">Address<input value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} /></label></div></form>}
      </div>

      {(creating || editing) && <ProductEditor product={editing || emptyProduct} categories={categories} brands={brands} pricesEnabled={pricesEnabled} subcategoriesEnabled={subcategoriesEnabled} definitions={subcategoryDefinitions} onClose={() => { discardDraft('product:'); setCreating(false); setEditing(null) }} onSaved={async (message) => { discardDraft('product:'); setNotice(message); setCreating(false); setEditing(null); await load() }} />}
      {(creatingCategory || editingCategory) && <CategoryEditor category={editingCategory || emptyCategory} isNew={creatingCategory} onClose={() => { discardDraft('category:'); setCreatingCategory(false); setEditingCategory(null) }} onSaved={async (message) => { discardDraft('category:'); setNotice(message); setCreatingCategory(false); setEditingCategory(null); await load() }} />}
      {(creatingBrand || editingBrand) && <BrandEditor brand={editingBrand || emptyBrand} isNew={creatingBrand} onClose={() => { discardDraft('brand:'); setCreatingBrand(false); setEditingBrand(null) }} onSaved={async (message) => { discardDraft('brand:'); setNotice(message); setCreatingBrand(false); setEditingBrand(null); await load() }} />}
    </AdminWorkspace>
  )
}

function ProductEditor({ product, categories, brands, pricesEnabled, subcategoriesEnabled, definitions, onClose, onSaved }: { product: ProductRow | Omit<ProductRow, 'id'>; categories: CategoryRow[]; brands: BrandRow[]; pricesEnabled: boolean; subcategoriesEnabled: boolean; definitions: ManagedSubcategory[]; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const draftKey = `product:${'id' in product ? product.id : 'new'}:`
  const [form, setForm] = useAdminDraftState(draftKey + 'form', product)
  const [specText, setSpecText] = useAdminDraftState(draftKey + 'specText', product.specs.join('\n'))
  const [priceText, setPriceText] = useAdminDraftState(draftKey + 'priceText', product.price == null ? '' : String(product.price))
  const [priceIsEstimate, setPriceIsEstimate] = useAdminDraftState(draftKey + 'priceIsEstimate', product.price_is_estimate ?? false)
  const [priceNote, setPriceNote] = useAdminDraftState(draftKey + 'priceNote', product.price_note || '')
  const [subcategory, setSubcategory] = useAdminDraftState(draftKey + 'subcategory', product.subcategory_id || suggestSubcategory(product.category_id, product.name, product.specs))
  const mainCategory = canonicalCategory(form.category_id)
  const categoryOptions = categories.filter((item, index, all) => all.findIndex(other => canonicalCategory(other.id) === canonicalCategory(item.id)) === index)
  const subcategoryOptions = getSubcategories(form.category_id, definitions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !supabase) return
    setSaving(true)
    try { setForm({ ...form, image_url: await uploadCatalogueImage(file, 'products') }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Image upload failed.') }
    setSaving(false)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    if (subcategoriesEnabled && !validSubcategory(form.category_id, subcategory, definitions)) { setError('Choose a subcategory under the selected main category. Add one in Subcategories if this category has none.'); return }
    let price: number | null
    try { price = parsePrice(priceText) } catch (error) { setError(error instanceof Error ? error.message : 'Invalid price.'); return }
    setSaving(true)
    setError('')
    const { id: _ignoredId, ...editable } = 'id' in form ? form : { ...form, id: '' }
    const payload = { ...editable, ...(subcategoriesEnabled ? { subcategory_id: subcategory } : {}), ...(pricesEnabled ? { price } : {}), ...('price_is_estimate' in product ? { price_is_estimate: price != null && priceIsEstimate, price_note: price != null ? priceNote.trim() : '' } : {}), slug: form.slug || slugify(form.name), specs: specText.split('\n').map((item) => item.trim()).filter(Boolean) }
    const result = 'id' in product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (result.error) setError(result.error.message)
    else await onSaved(`Saved ${payload.name}. The public catalogue will update automatically.`)
  }

  return <div className="owner-modal" role="dialog" aria-modal="true" aria-label="Product editor"><form className="owner-editor" onSubmit={save}><div className="owner-editor-header"><div><p className="eyebrow text-gold-dark">Catalogue editor</p><h2>{'id' in product ? 'Edit product' : 'Add product'}</h2></div><button type="button" onClick={onClose} aria-label="Close editor"><X /></button></div><div className="owner-form-grid"><label>Product name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.slug || slugify(event.target.value) })} required /></label><label>URL slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} required /></label><label>Main category<select value={mainCategory} required onChange={event => { const selected = categoryOptions.find(item => canonicalCategory(item.id) === event.target.value); if (selected) { setForm({ ...form, category_id: selected.id }); setSubcategory('') } }}>{categoryOptions.map(item => <option key={item.id} value={canonicalCategory(item.id)}>{canonicalCategory(item.id) === 'cooling' ? 'Cooling' : canonicalCategory(item.id) === 'entertainment' ? 'Entertainment' : item.name}</option>)}</select></label><label>Subcategory<select value={subcategory} required={subcategoriesEnabled} disabled={!subcategoriesEnabled} onChange={event => setSubcategory(event.target.value)}><option value="">Choose subcategory</option>{subcategoryOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Brand<select value={form.brand_name} onChange={(event) => setForm({ ...form, brand_name: event.target.value })}>{brands.map((item) => <option key={item.name}>{item.name}</option>)}<option>Generic</option></select></label><label>Price (NGN) — optional<input type="number" min="0" max="9999999999.99" step="0.01" disabled={!pricesEnabled} value={priceText} onChange={(event) => setPriceText(event.target.value)} placeholder="Leave blank for enquiry" /><small>{pricesEnabled ? 'Shown only on category listings and product details. Leave blank to hide the amount.' : 'Apply Supabase migration 004_product_prices.sql to enable pricing. Other product edits still work.'}</small></label>{'price_is_estimate' in product && <><label className="owner-check"><input type="checkbox" checked={priceIsEstimate} onChange={event => setPriceIsEstimate(event.target.checked)} /> Label as estimated price</label><label>Price note / variant basis<input value={priceNote} maxLength={300} onChange={event => setPriceNote(event.target.value)} placeholder="e.g. Per 100m roll, 1.5mm²" /><small>Uncheck estimated only after confirming the store selling price.</small></label></>}<label className="owner-wide">Description<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label><label className="owner-wide">Specifications — one per line<textarea rows={5} value={specText} onChange={(event) => setSpecText(event.target.value)} /></label><label className="owner-wide">Image URL<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} required /></label><label className="owner-upload"><ImagePlus size={20} /> Upload product image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadImage(event)} /></label><label className="owner-check"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured product</label><label className="owner-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible publicly</label></div>{form.image_url && <img className="owner-image-preview" src={form.image_url} alt="Product preview" />}{error && <div className="owner-error">{error}</div>}<div className="owner-editor-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save product</button></div></form></div>
}

async function uploadCatalogueImage(file: File, folder: string) {
  if (!supabase) throw new Error('Supabase is not connected.')
  if (import.meta.env.VITE_IMAGE_UPLOAD_PROVIDER === 'cloudinary') {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', { body: form })
    if (error) throw error
    if (!data?.url) throw new Error(data?.error || 'Cloudinary did not return an image URL.')
    return data.url as string
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${extension}`
  const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  return supabase.storage.from(CATALOG_BUCKET).getPublicUrl(path).data.publicUrl
}

function CategoryEditor({ category, isNew, onClose, onSaved }: { category: CategoryRow; isNew: boolean; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const [form, setForm] = useAdminDraftState(`category:${isNew ? 'new' : category.id}:form`, category)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    try { setForm({ ...form, image_url: await uploadCatalogueImage(file, 'categories') }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Image upload failed.') }
    setSaving(false)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    const payload = { ...form, id: form.id || slugify(form.name), short_name: form.short_name || form.name, sort_order: Number(form.sort_order) }
    const result = isNew ? await supabase.from('categories').insert(payload) : await supabase.from('categories').update(payload).eq('id', category.id)
    setSaving(false)
    if (result.error) setError(result.error.message)
    else await onSaved(`${payload.name} saved. Products can now be assigned to this category.`)
  }

  return <div className="owner-modal" role="dialog" aria-modal="true" aria-label="Category editor"><form className="owner-editor" onSubmit={save}><div className="owner-editor-header"><div><p className="eyebrow text-gold-dark">Catalogue structure</p><h2>{isNew ? 'Add category' : 'Edit category'}</h2></div><button type="button" onClick={onClose} aria-label="Close editor"><X /></button></div><div className="owner-form-grid"><label>Category name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, id: isNew ? slugify(event.target.value) : form.id, short_name: form.short_name || event.target.value })} required /></label><label>URL identifier<input value={form.id} onChange={(event) => setForm({ ...form, id: slugify(event.target.value) })} disabled={!isNew} required /></label><label>Short label<input value={form.short_name} onChange={(event) => setForm({ ...form, short_name: event.target.value })} required /></label><label>Display order<input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} /></label><label className="owner-wide">Description<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label><label className="owner-wide">Category image URL<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} required /></label><label className="owner-upload"><ImagePlus size={20} /> Upload category image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void upload(event)} /></label><label className="owner-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible publicly</label></div>{form.image_url && <img className="owner-image-preview" src={form.image_url} alt="Category preview" />}{error && <div className="owner-error">{error}</div>}<div className="owner-editor-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save category</button></div></form></div>
}

function BrandEditor({ brand, isNew, onClose, onSaved }: { brand: BrandRow | Omit<BrandRow, 'id'>; isNew: boolean; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const draftKey = `brand:${'id' in brand ? brand.id : 'new'}:`
  const [form, setForm] = useAdminDraftState(draftKey + 'form', brand)
  const [tags, setTags] = useAdminDraftState(draftKey + 'tags', brand.category_tags.join('\n'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    try { setForm({ ...form, logo_url: await uploadCatalogueImage(file, 'brands') }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Logo upload failed.') }
    setSaving(false)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    const payload = { name: form.name.trim(), logo_url: form.logo_url, logo_dark_url: form.logo_dark_url || null, tagline: form.tagline, category_tags: tags.split('\n').map((tag) => tag.trim()).filter(Boolean), sort_order: Number(form.sort_order), active: form.active }
    const result = isNew ? await supabase.from('brands').insert(payload) : await supabase.from('brands').update(payload).eq('id', 'id' in brand ? brand.id : '')
    if (!result.error && !isNew && 'id' in brand && brand.name !== payload.name) await supabase.from('products').update({ brand_name: payload.name }).eq('brand_name', brand.name)
    setSaving(false)
    if (result.error) setError(result.error.message)
    else await onSaved(`${payload.name} saved and available in the product editor.`)
  }

  return <div className="owner-modal" role="dialog" aria-modal="true" aria-label="Brand editor"><form className="owner-editor" onSubmit={save}><div className="owner-editor-header"><div><p className="eyebrow text-gold-dark">Brand manager</p><h2>{isNew ? 'Add brand' : 'Edit brand'}</h2></div><button type="button" onClick={onClose} aria-label="Close editor"><X /></button></div><div className="owner-form-grid"><label>Brand name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Display order<input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} /></label><label className="owner-wide">Short description<input value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} required /></label><label className="owner-wide">Logo URL<input value={form.logo_url} onChange={(event) => setForm({ ...form, logo_url: event.target.value })} required /></label><label className="owner-wide">Products or strengths — one per line<textarea rows={4} value={tags} onChange={(event) => setTags(event.target.value)} /></label><label className="owner-upload"><ImagePlus size={20} /> Upload brand logo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void upload(event)} /></label><label className="owner-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible publicly</label></div>{form.logo_url && <img className="owner-image-preview owner-logo-preview" src={form.logo_url} alt="Brand logo preview" />}{error && <div className="owner-error">{error}</div>}<div className="owner-editor-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save brand</button></div></form></div>
}
