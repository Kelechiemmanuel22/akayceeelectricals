import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Star,
  Layers,
  Tag,
  Palette,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileJson,
  Copy,
  RefreshCw,
  ShieldAlert,
  Zap,
  Loader2,
} from 'lucide-react'
import { useCatalog } from '../context/CatalogContext'
import { type Category, type BrandItem, type Product } from '../data/catalog'
import { BrandLogo } from '../components/BrandLogos'
import { compressImageFile } from '../lib/imageUtils'

const DEFAULT_PIN = '8556'
const ADMIN_AUTH_KEY = 'akaycee_admin_auth_v1'

type AdminTab = 'products' | 'categories' | 'brands' | 'branding' | 'backup'

export function AdminPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFeaturedProduct,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    siteSettings,
    updateSiteSettings,
    resetSiteLogo,
    resetAllToDefaults,
    exportCatalogTypeScript,
    exportFullBackupJson,
    importFullBackupJson,
  } = useCatalog()

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  })
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<{
    name: string
    brand: string
    category: string
    description: string
    image: string
    specs: string[]
    featured: boolean
  }>({
    name: '',
    brand: 'Hisense',
    category: 'air-conditioners',
    description: '',
    image: '/assets/products/hisense-1-5hp-ac.jpg',
    specs: [''],
    featured: false,
  })

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState<{
    name: string
    shortName: string
    description: string
    image: string
  }>({
    name: '',
    shortName: '',
    description: '',
    image: '/assets/products/hisense-1-5hp-ac.jpg',
  })

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null)
  const [brandForm, setBrandForm] = useState<{
    name: string
    logo: string
    logoDark: string
    tagline: string
    categoriesStr: string
  }>({
    name: '',
    logo: '/assets/brands/hisense logo.png',
    logoDark: '',
    tagline: '',
    categoriesStr: '',
  })

  const [brandingForm, setBrandingForm] = useState<{
    logo: string
    siteName: string
    tagline: string
  }>({
    logo: siteSettings.logo,
    siteName: siteSettings.siteName,
    tagline: siteSettings.tagline,
  })

  React.useEffect(() => {
    setBrandingForm({
      logo: siteSettings.logo,
      siteName: siteSettings.siteName,
      tagline: siteSettings.tagline,
    })
  }, [siteSettings])

  const [importJsonText, setImportJsonText] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === DEFAULT_PIN) {
      setIsAuthenticated(true)
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
      setPinError(false)
      showToast('Welcome back! Dashboard unlocked.')
    } else {
      setPinError(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem(ADMIN_AUTH_KEY)
    setPinInput('')
  }

  const openAddProductModal = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      brand: brands[0]?.name || 'Hisense',
      category: categories[0]?.id || 'air-conditioners',
      description: '',
      image: '/assets/products/hisense-1-5hp-ac.jpg',
      specs: [''],
      featured: false,
    })
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      image: product.image,
      specs: product.specs.length > 0 ? [...product.specs] : [''],
      featured: !!product.featured,
    })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanSpecs = productForm.specs.map((s) => s.trim()).filter(Boolean)
    if (!productForm.name.trim()) return

    if (editingProduct) {
      updateProduct(editingProduct.slug, {
        name: productForm.name.trim(),
        brand: productForm.brand,
        category: productForm.category,
        description: productForm.description.trim(),
        image: productForm.image,
        specs: cleanSpecs,
        featured: productForm.featured,
      })
      showToast(`Updated product "${productForm.name.trim()}"`)
    } else {
      addProduct({
        name: productForm.name.trim(),
        brand: productForm.brand,
        category: productForm.category,
        description: productForm.description.trim(),
        image: productForm.image,
        specs: cleanSpecs,
        featured: productForm.featured,
      })
      showToast(`Added new product "${productForm.name.trim()}"`)
    }
    setIsProductModalOpen(false)
    setEditingProduct(null)
  }

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct(product.slug)
      showToast(`Deleted "${product.name}"`)
    }
  }

  const openAddCategoryModal = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      shortName: '',
      description: '',
      image: '/assets/products/hisense-1-5hp-ac.jpg',
    })
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryForm({
      name: cat.name,
      shortName: cat.shortName,
      description: cat.description,
      image: cat.image,
    })
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) return

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryForm.name.trim(),
        shortName: categoryForm.shortName.trim() || categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        image: categoryForm.image,
      })
      showToast(`Updated section "${categoryForm.name.trim()}"`)
    } else {
      const res = addCategory({
        name: categoryForm.name.trim(),
        shortName: categoryForm.shortName.trim() || categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        image: categoryForm.image,
      })
      if (res.success) showToast(`Created new section "${categoryForm.name.trim()}"`)
      else showToast(res.message || 'Failed to add section', 'error')
    }
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }

  const handleDeleteCategory = (cat: Category) => {
    if (window.confirm(`Delete section "${cat.name}"?`)) {
      deleteCategory(cat.id)
      showToast(`Deleted section "${cat.name}"`)
    }
  }

  const openAddBrandModal = () => {
    setEditingBrand(null)
    setBrandForm({
      name: '',
      logo: '/assets/brands/hisense logo.png',
      logoDark: '',
      tagline: '',
      categoriesStr: '',
    })
    setIsBrandModalOpen(true)
  }

  const openEditBrandModal = (b: BrandItem) => {
    setEditingBrand(b)
    setBrandForm({
      name: b.name,
      logo: b.logo,
      logoDark: b.logoDark || '',
      tagline: b.tagline || '',
      categoriesStr: (b.categories || []).join(', '),
    })
    setIsBrandModalOpen(true)
  }

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandForm.name.trim()) return

    const catArray = brandForm.categoriesStr.split(',').map((s) => s.trim()).filter(Boolean)

    if (editingBrand) {
      updateBrand(editingBrand.name, {
        name: brandForm.name.trim(),
        logo: brandForm.logo,
        logoDark: brandForm.logoDark.trim() || undefined,
        tagline: brandForm.tagline.trim(),
        categories: catArray,
      })
      showToast(`Updated brand "${brandForm.name.trim()}"`)
    } else {
      const res = addBrand({
        name: brandForm.name.trim(),
        logo: brandForm.logo,
        logoDark: brandForm.logoDark.trim() || undefined,
        tagline: brandForm.tagline.trim() || 'Authorized brand partner',
        categories: catArray,
      })
      if (res.success) showToast(`Added brand partner "${brandForm.name.trim()}"`)
      else showToast(res.message || 'Brand already exists', 'error')
    }
    setIsBrandModalOpen(false)
    setEditingBrand(null)
  }

  const handleDeleteBrand = (b: BrandItem) => {
    if (window.confirm(`Remove brand partner "${b.name}"?`)) {
      deleteBrand(b.name)
      showToast(`Removed brand "${b.name}"`)
    }
  }

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault()
    updateSiteSettings({
      logo: brandingForm.logo,
      siteName: brandingForm.siteName.trim() || 'A KAYCEE',
      tagline: brandingForm.tagline.trim() || 'ELECTRICALS',
    })
    showToast('Store branding settings saved live!')
  }

  const handleResetLogo = () => {
    if (window.confirm('Reset store logo back to default?')) {
      resetSiteLogo()
      showToast('Store logo reset to default.')
    }
  }

  const [isCompressing, setIsCompressing] = useState(false)

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (dataUrl: string) => void,
    options?: { maxWidth?: number; maxHeight?: number; quality?: number; mimeType?: 'image/webp' | 'image/jpeg' | 'image/png' }
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        showToast('Image file too large (max 20MB).', 'error')
        return
      }
      try {
        setIsCompressing(true)
        const compressedDataUrl = await compressImageFile(file, {
          maxWidth: options?.maxWidth || 1200,
          maxHeight: options?.maxHeight || 1200,
          quality: options?.quality || 0.82,
          mimeType: options?.mimeType || 'image/webp',
        })
        callback(compressedDataUrl)
        showToast('Image uploaded and optimized for web!')
      } catch (err) {
        console.error('Image compression failed:', err)
        showToast('Could not process image.', 'error')
      } finally {
        setIsCompressing(false)
      }
    }
  }

  const updateSpecItem = (index: number, val: string) => {
    const updated = [...productForm.specs]
    updated[index] = val
    setProductForm({ ...productForm, specs: updated })
  }

  const addSpecItem = () => setProductForm({ ...productForm, specs: [...productForm.specs, ''] })

  const removeSpecItem = (index: number) => {
    const updated = productForm.specs.filter((_, i) => i !== index)
    setProductForm({ ...productForm, specs: updated.length > 0 ? updated : [''] })
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = `${p.name} ${p.brand} ${p.description} ${p.specs.join(' ')}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      const matchesBrand = brandFilter === 'all' || p.brand.toLowerCase() === brandFilter.toLowerCase()
      return matchesSearch && matchesCategory && matchesBrand
    })
  }, [products, searchQuery, categoryFilter, brandFilter])

  const handleDownloadFullBackup = () => {
    const json = exportFullBackupJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `akaycee-full-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded full store backup JSON!')
  }

  const handleDownloadTypeScript = () => {
    const code = exportCatalogTypeScript()
    const blob = new Blob([code], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog.ts'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded catalog.ts source file!')
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportFullBackupJson())
    setCopiedCode(true)
    showToast('Full backup JSON copied to clipboard!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleImportJson = () => {
    if (!importJsonText.trim()) return
    const res = importFullBackupJson(importJsonText)
    if (res.success) {
      showToast(res.summary || 'Restored backup successfully!')
      setImportJsonText('')
    } else {
      showToast(res.error || 'Failed to restore backup.', 'error')
    }
  }

  const handleResetAllFactory = () => {
    if (window.confirm('⚠️ DANGER: This will reset ALL data to factory defaults. Are you sure?')) {
      resetAllToDefaults()
      showToast('Reset all store data to factory defaults.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-slate-50">
        <div className="wix-card p-8 sm:p-10 max-w-md w-full bg-white shadow-xl text-center border border-slate-200/80">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 mb-5 ring-4 ring-amber-500/10">
            <Lock size={28} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">Store Owner Portal</h1>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false) }}
              placeholder="Enter PIN (Default: 8556)"
              className="w-full text-center tracking-widest text-2xl font-bold py-3.5 px-4 border border-slate-300 rounded-xl outline-none focus:border-amber-500 transition"
              autoFocus
            />
            {pinError && <p className="text-xs font-semibold text-rose-600">Incorrect PIN.</p>}
            <button type="submit" className="button button-primary w-full py-3">
              <Unlock size={16} /> Unlock Dashboard
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-1">
              ← Return to Live Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-bold text-white ${toastMessage.type === 'error' ? 'bg-rose-600' : toastMessage.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
            {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="container py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg overflow-hidden bg-white p-0.5 shrink-0 ring-1 ring-amber-400/40">
              <img src={siteSettings.logo} alt="Store logo" className="size-full object-cover rounded-md" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-none flex items-center gap-2">
                <span>{siteSettings.siteName}</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Admin Hub</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <Zap size={12} className="text-emerald-400 animate-pulse" /> Live Sync Active
            </div>
            <Link to="/products" target="_blank" className="button button-secondary !bg-white !text-slate-900 !text-xs !py-1.5 !px-3">
              <ExternalLink size={13} /> View Live Store
            </Link>
            <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition" title="Lock Dashboard">
              <Lock size={16} />
            </button>
          </div>
        </div>
        <div className="container flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none border-t border-slate-800/80 pt-2 pb-1 text-xs font-bold">
          {['products', 'categories', 'brands', 'branding', 'backup'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as AdminTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition border-b-2 ${activeTab === tab ? 'bg-slate-800 text-amber-400 border-amber-400' : 'text-slate-400 border-transparent'}`}
            >
              {tab === 'products' ? <Layers size={14} /> : tab === 'categories' ? <FolderPlus size={14} /> : tab === 'brands' ? <Tag size={14} /> : tab === 'branding' ? <Palette size={14} /> : <Download size={14} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container mt-6">
        {activeTab === 'products' && (
          <div>
            <div className="wix-card p-4 mb-6">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name, brand, specs..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500 focus:bg-white"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">All Sections ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>

                  <button onClick={openAddProductModal} className="button button-primary !py-2 !text-xs whitespace-nowrap">
                    <Plus size={15} /> Add Product
                  </button>
                </div>
              </div>
            </div>

            <div className="wix-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Product Details</th>
                      <th className="py-3.5 px-4">Section / Category</th>
                      <th className="py-3.5 px-4 text-center">Homepage Featured</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-400 font-medium">
                          No products found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const cat = getCategoryById(p.category)
                        return (
                          <tr key={p.slug} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="size-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                  <img src={p.image} alt={p.name} className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/products/copper-cable-coil.jpg' }} />
                                </div>
                                <div>
                                  <Link to={`/products/${p.slug}`} target="_blank" className="font-bold text-slate-900 hover:text-amber-600 transition flex items-center gap-1 group">
                                    <span>{p.name}</span>
                                    <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition text-amber-600" />
                                  </Link>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {p.brand}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono">/{p.slug}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200/60">
                                {cat?.name || p.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const res = toggleFeaturedProduct(p.slug)
                                  showToast(res.featured ? `Featured "${p.name}" on homepage` : `Removed "${p.name}" from homepage highlights`)
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                                  p.featured
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                                title={p.featured ? 'Featured on Homepage Highlights (Click to unfeature)' : 'Click to feature on Homepage Highlights'}
                              >
                                <Star size={13} className={p.featured ? 'fill-amber-500 text-amber-500' : ''} />
                                <span>{p.featured ? 'Featured' : 'Standard'}</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Link
                                  to={`/products/${p.slug}`}
                                  target="_blank"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="View on Live Store"
                                >
                                  <ExternalLink size={15} />
                                </Link>
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Product"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Product"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: CATEGORIES ==================== */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">Store Sections & Categories</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Add departments like Phone Cords, AirPods, Laptops, Mobile Accessories.</p>
              </div>
              <button onClick={openAddCategoryModal} className="button button-primary !py-2.5 !text-xs">
                <Plus size={15} /> Add New Section
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat, idx) => {
                const count = products.filter((p) => p.category === cat.id).length
                return (
                  <div key={cat.id} className="wix-card overflow-hidden flex flex-col justify-between border border-slate-200/80 hover:shadow-lg transition-shadow">
                    <div>
                      <div className="relative h-40 overflow-hidden bg-slate-100">
                        <img src={cat.image} alt={cat.name} className="size-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-900 font-extrabold text-[11px]">
                          Section #{idx + 1}
                        </span>
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white font-bold text-xs">
                          {count} Products
                        </span>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="font-display text-lg font-bold text-white leading-tight">{cat.name}</h3>
                          <p className="text-amber-300 text-xs font-semibold">Tab: {cat.shortName}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-slate-600 line-clamp-2">{cat.description}</p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <Link to={`/category/${cat.id}`} target="_blank" className="text-xs font-bold text-amber-600 inline-flex items-center gap-1">
                        View Products <ExternalLink size={12} />
                      </Link>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditCategoryModal(cat)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: BRANDS ==================== */}
        {activeTab === 'brands' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">Authorized Brand Partners</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Add new brand partners or update logos, names, and taglines.</p>
              </div>
              <button onClick={openAddBrandModal} className="button button-primary !py-2.5 !text-xs">
                <Plus size={15} /> Add New Brand
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {brands.map((b) => {
                const count = products.filter((p) => p.brand.toLowerCase() === b.name.toLowerCase()).length
                return (
                  <div key={b.name} className="wix-card p-5 flex flex-col justify-between border border-slate-200/80 hover:shadow-lg transition-shadow">
                    <div>
                      <div className="h-24 rounded-xl bg-slate-900 p-4 flex items-center justify-center relative overflow-hidden">
                        <BrandLogo brand={b.name} logo={b.logo} logoDark={b.logoDark} variant="light" className="max-h-12 w-auto max-w-[80%]" />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                          {count} items
                        </span>
                      </div>

                      <div className="mt-4">
                        <h3 className="font-display text-lg font-bold text-slate-900">{b.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.tagline || 'Authorized brand partner'}</p>
                        {b.categories && b.categories.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {b.categories.map((c) => (
                              <span key={c} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link to={`/products?brand=${encodeURIComponent(b.name)}`} target="_blank" className="text-xs font-bold text-amber-600 inline-flex items-center gap-1">
                        View Products <ExternalLink size={12} />
                      </Link>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditBrandModal(b)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteBrand(b)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: STORE BRANDING ==================== */}
        {activeTab === 'branding' && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">Store Logo & Website Branding</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Customize the main store logo, store title, and tagline displayed across the website.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-[#fdfbf7] border border-slate-300 shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-3">Preview in Light Navigation</span>
                <div className="inline-flex items-center gap-3 p-3 bg-white/90 rounded-xl border border-slate-200">
                  <span className="grid size-12 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-amber-500/30">
                    <img src={brandingForm.logo} alt="Logo" className="size-full object-cover" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-xl font-bold text-slate-900">{brandingForm.siteName || 'A KAYCEE'}</span>
                    <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-amber-700">{brandingForm.tagline || 'ELECTRICALS'}</span>
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-sm">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 block mb-3">Preview in Dark Footer & Drawer</span>
                <div className="inline-flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="grid size-12 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-amber-400/40">
                    <img src={brandingForm.logo} alt="Logo" className="size-full object-cover" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-xl font-bold text-white">{brandingForm.siteName || 'A KAYCEE'}</span>
                    <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-amber-300">{brandingForm.tagline || 'ELECTRICALS'}</span>
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBranding} className="wix-card p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Store Logo Image</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="size-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 grid place-items-center shrink-0">
                    <img src={brandingForm.logo} alt="Current logo" className="size-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`button button-secondary !text-xs !py-2 cursor-pointer ${isCompressing ? 'opacity-70 pointer-events-none' : ''}`}>
                        {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>{isCompressing ? 'Optimizing...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isCompressing}
                          onChange={(e) => handleFileUpload(e, (dataUrl) => setBrandingForm((prev) => ({ ...prev, logo: dataUrl })), { maxWidth: 600, maxHeight: 600, quality: 0.85 })}
                        />
                      </label>
                      <button type="button" onClick={handleResetLogo} className="button button-ghost !text-xs !py-2">
                        <RotateCcw size={14} /> Reset to Default
                      </button>
                    </div>
                    <input
                      type="text"
                      value={brandingForm.logo}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logo: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 font-mono"
                      placeholder="Or paste image URL"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Store Main Title</label>
                  <input
                    type="text"
                    value={brandingForm.siteName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, siteName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={brandingForm.tagline}
                    onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button type="submit" className="button button-primary !py-2.5 !text-sm">
                  <Check size={16} /> Save Live Branding Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== TAB 5: BACKUP & SYNC ==================== */}
        {activeTab === 'backup' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">Backup, Export & Data Restoration</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Download full backups of products, sections, brands, and store logo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="wix-card p-5 flex flex-col justify-between">
                <div>
                  <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 mb-3"><FileJson size={20} /></div>
                  <h3 className="font-bold text-slate-900 text-sm">Full Store JSON Backup</h3>
                  <p className="text-xs text-slate-500 mt-1">Complete snapshot of {products.length} products, {categories.length} sections, and {brands.length} brands.</p>
                </div>
                <button onClick={handleDownloadFullBackup} className="mt-4 button button-primary !w-full !text-xs !py-2">
                  <Download size={14} /> Download JSON
                </button>
              </div>

              <div className="wix-card p-5 flex flex-col justify-between">
                <div>
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700 mb-3"><FileCode size={20} /></div>
                  <h3 className="font-bold text-slate-900 text-sm">TypeScript Source File</h3>
                  <p className="text-xs text-slate-500 mt-1">Export compiled catalog.ts file to commit into repository.</p>
                </div>
                <button onClick={handleDownloadTypeScript} className="mt-4 button button-secondary !w-full !text-xs !py-2">
                  <Download size={14} /> Download catalog.ts
                </button>
              </div>

              <div className="wix-card p-5 flex flex-col justify-between">
                <div>
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 mb-3"><Copy size={20} /></div>
                  <h3 className="font-bold text-slate-900 text-sm">Copy Backup to Clipboard</h3>
                  <p className="text-xs text-slate-500 mt-1">Copy all store data to easily paste and share.</p>
                </div>
                <button onClick={handleCopyJson} className="mt-4 button button-secondary !w-full !text-xs !py-2">
                  <Copy size={14} /> {copiedCode ? 'Copied to Clipboard!' : 'Copy JSON'}
                </button>
              </div>
            </div>

            <div className="wix-card p-6 sm:p-7">
              <h3 className="font-display text-base font-bold text-slate-900 mb-1">Restore Store From Backup JSON</h3>
              <p className="text-xs text-slate-500 mb-4">Paste JSON data from a previously downloaded backup file to restore.</p>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste backup JSON content here..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white"
              />
              <div className="mt-3 flex items-center justify-end">
                <button onClick={handleImportJson} disabled={!importJsonText.trim()} className="button button-primary !py-2 !text-xs disabled:opacity-50">
                  <Upload size={14} /> Restore Store Data
                </button>
              </div>
            </div>

            <div className="wix-card p-6 border-rose-200 bg-rose-50/30 flex items-start gap-4">
              <div className="grid size-10 place-items-center rounded-xl bg-rose-100 text-rose-600 shrink-0"><ShieldAlert size={20} /></div>
              <div className="flex-1">
                <h3 className="font-bold text-rose-900 text-sm">Reset All to Factory Defaults</h3>
                <p className="text-xs text-rose-700 mt-1">Reset all custom products, custom sections, added brands, and custom logo to original state.</p>
                <button onClick={handleResetAllFactory} className="mt-3 button !bg-rose-600 !text-white !py-1.5 !text-xs">
                  <RefreshCw size={13} /> Reset Factory Defaults
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL: ADD / EDIT PRODUCT ==================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="wix-card p-6 sm:p-8 max-w-2xl w-full bg-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-xl font-extrabold text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g., Hisense 1.5HP Inverter Split AC"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Store Section / Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Brand Partner *</label>
                  <select
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {brands.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Provide features, specifications, and warranty details..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  <img src={productForm.image} alt="Preview" className="size-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/products/copper-cable-coil.jpg' }} />
                  <div className="flex-1 space-y-1.5">
                    <label className={`button button-secondary !text-xs !py-1.5 cursor-pointer inline-flex ${isCompressing ? 'opacity-70 pointer-events-none' : ''}`}>
                      {isCompressing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{isCompressing ? 'Optimizing...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isCompressing}
                        onChange={(e) => handleFileUpload(e, (dataUrl) => setProductForm((prev) => ({ ...prev, image: dataUrl })), { maxWidth: 1200, maxHeight: 1200, quality: 0.82 })}
                      />
                    </label>
                    <input
                      type="text"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="Or image URL"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specifications & Highlights</label>
                  <button type="button" onClick={addSpecItem} className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1">
                    <Plus size={13} /> Add Spec
                  </button>
                </div>
                <div className="space-y-2">
                  {productForm.specs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec}
                        onChange={(e) => updateSpecItem(idx, e.target.value)}
                        placeholder={`Spec #${idx + 1} (e.g. Copper Condenser, 1 Year Warranty)`}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                      />
                      {productForm.specs.length > 1 && (
                        <button type="button" onClick={() => removeSpecItem(idx)} className="p-2 text-slate-400 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="size-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Feature this product on Homepage Highlights</span>
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="button button-ghost !py-2 !text-xs">Cancel</button>
                <button type="submit" className="button button-primary !py-2 !text-xs">
                  <Check size={14} /> {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT CATEGORY ==================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="wix-card p-6 sm:p-8 max-w-lg w-full bg-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-xl font-extrabold text-slate-900">{editingCategory ? 'Edit Store Section' : 'Add New Store Section'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Section Full Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Phone Cords & Fast Chargers"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Short Name / Tab Label</label>
                <input
                  type="text"
                  value={categoryForm.shortName}
                  onChange={(e) => setCategoryForm({ ...categoryForm, shortName: e.target.value })}
                  placeholder="e.g., Phone Cords"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Section Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Original Type-C, Lightning & braided fast charging cables..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Section Banner Image</label>
                <div className="flex items-center gap-3">
                  <img src={categoryForm.image} alt="Banner" className="size-16 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/products/hisense-1-5hp-ac.jpg' }} />
                  <div className="flex-1 space-y-1.5">
                    <label className={`button button-secondary !text-xs !py-1.5 cursor-pointer inline-flex ${isCompressing ? 'opacity-70 pointer-events-none' : ''}`}>
                      {isCompressing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{isCompressing ? 'Optimizing...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isCompressing}
                        onChange={(e) => handleFileUpload(e, (dataUrl) => setCategoryForm((prev) => ({ ...prev, image: dataUrl })), { maxWidth: 1200, maxHeight: 800, quality: 0.82 })}
                      />
                    </label>
                    <input
                      type="text"
                      value={categoryForm.image}
                      onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                      placeholder="Or paste image URL"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="button button-ghost !py-2 !text-xs">Cancel</button>
                <button type="submit" className="button button-primary !py-2 !text-xs">
                  <Check size={14} /> {editingCategory ? 'Save Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT BRAND ==================== */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="wix-card p-6 sm:p-8 max-w-lg w-full bg-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900">{editingBrand ? 'Edit Brand Partner' : 'Add Brand Partner'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure brand name, logo image, and categories.</p>
              </div>
              <button onClick={() => setIsBrandModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveBrand} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g., Anker, Apple, Sony, Panasonic"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={brandForm.tagline}
                  onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                  placeholder="e.g., Premium audio accessories, fast chargers & power banks"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Brand Logo Image</label>
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-xl bg-slate-900 p-2 flex items-center justify-center border border-slate-300 shrink-0 overflow-hidden">
                    <img src={brandForm.logo} alt="Brand logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className={`button button-secondary !text-xs !py-1.5 cursor-pointer inline-flex ${isCompressing ? 'opacity-70 pointer-events-none' : ''}`}>
                      {isCompressing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      <span>{isCompressing ? 'Optimizing...' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isCompressing}
                        onChange={(e) => handleFileUpload(e, (dataUrl) => setBrandForm((prev) => ({ ...prev, logo: dataUrl })), { maxWidth: 600, maxHeight: 600, quality: 0.85 })}
                      />
                    </label>
                    <input
                      type="text"
                      value={brandForm.logo}
                      onChange={(e) => setBrandForm({ ...brandForm, logo: e.target.value })}
                      placeholder="Or paste logo URL"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Sub-category Tags (Comma separated)</label>
                <input
                  type="text"
                  value={brandForm.categoriesStr}
                  onChange={(e) => setBrandForm({ ...brandForm, categoriesStr: e.target.value })}
                  placeholder="e.g. Fast Chargers, Phone Cords, AirPods, Power Banks"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Shown as quick badges on homepage brand cards.</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="button button-ghost !py-2 !text-xs">Cancel</button>
                <button type="submit" className="button button-primary !py-2 !text-xs">
                  <Check size={14} /> {editingBrand ? 'Save Brand' : 'Add Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
