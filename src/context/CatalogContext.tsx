import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import {
  categories as defaultCategories,
  brandList as defaultBrandList,
  products as defaultProducts,
  type Product,
  type Category,
  type BrandItem,
} from '../data/catalog'
import { fetchRemoteCatalogue } from '../lib/supabaseCatalog'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

// Bump this namespace whenever the shipped demo catalogue changes so an old
// browser-only admin draft cannot override the public release data.
const STORAGE_KEY_PRODUCTS = 'akaycee_catalog_products_v5'
const STORAGE_KEY_CATEGORIES = 'akaycee_catalog_categories_v5'
const STORAGE_KEY_BRANDS = 'akaycee_catalog_brands_v5'
const STORAGE_KEY_SETTINGS = 'akaycee_site_settings_v5'
const SYNC_CHANNEL_NAME = 'akaycee_catalog_sync_v5'

export type SiteSettings = {
  logo: string
  siteName: string
  tagline: string
  phone?: string
  whatsapp?: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logo: '/assets/business/instagram-logo.jpg',
  siteName: 'A KAYCEE',
  tagline: 'ELECTRICALS',
}

type CatalogContextType = {
  // Products
  products: Product[]
  addProduct: (product: Omit<Product, 'slug'> & { slug?: string }) => { success: boolean; message?: string }
  updateProduct: (slug: string, updated: Partial<Product>) => { success: boolean; message?: string }
  deleteProduct: (slug: string) => { success: boolean; message?: string }
  toggleFeaturedProduct: (slug: string) => { success: boolean; featured: boolean }

  // Categories / Sections
  categories: Category[]
  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => { success: boolean; message?: string; category?: Category }
  updateCategory: (id: string, updated: Partial<Category>) => { success: boolean; message?: string }
  deleteCategory: (id: string) => { success: boolean; message?: string; productCount?: number }
  getCategoryById: (id: string) => Category

  // Brands
  brands: BrandItem[]
  brandNames: string[]
  addBrand: (brand: BrandItem) => { success: boolean; message?: string }
  updateBrand: (name: string, updated: Partial<BrandItem>) => { success: boolean; message?: string }
  deleteBrand: (name: string) => { success: boolean; message?: string; productCount?: number }
  getBrandByName: (name: string) => BrandItem | undefined

  // Site Settings & Logo
  siteSettings: SiteSettings
  updateSiteLogo: (logo: string) => { success: boolean }
  updateSiteSettings: (settings: Partial<SiteSettings>) => { success: boolean }
  resetSiteLogo: () => void
  resetSiteSettings: () => void

  // Reset & Backup
  resetToDefaults: () => void
  resetAllToDefaults: () => void
  exportCatalogTypeScript: () => string
  exportCatalogJson: () => string
  exportFullBackupJson: () => string
  importCatalogJson: (jsonStr: string) => { success: boolean; count?: number; error?: string }
  importFullBackupJson: (jsonStr: string) => { success: boolean; summary?: string; error?: string }
}

const CatalogContext = createContext<CatalogContextType | null>(null)

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  // 1. Products State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error loading stored products:', e)
    }
    return defaultProducts
  })

  // 2. Categories State
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error loading stored categories:', e)
    }
    return defaultCategories
  })

  // 3. Brands State
  const [brands, setBrands] = useState<BrandItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BRANDS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error loading stored brands:', e)
    }
    return defaultBrandList
  })

  // 4. Site Settings State (Logo, Site Name, etc.)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_SITE_SETTINGS, ...parsed }
        }
      }
    } catch (e) {
      console.error('Error loading stored site settings:', e)
    }
    return DEFAULT_SITE_SETTINGS
  })

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const client = supabase

    let active = true

    const refreshCatalogue = async () => {
      try {
        const remote = await fetchRemoteCatalogue()
        if (!active || !remote) return
        if (remote.products.length) setProducts(remote.products)
        if (remote.categories.length) setCategories(remote.categories)
        if (remote.brands.length) setBrands(remote.brands)
        if (remote.settings) setSiteSettings((current) => ({ ...current, ...remote.settings }))
      } catch (error) {
        console.error('Unable to load the Supabase catalogue. Using the local catalogue fallback.', error)
      }
    }

    void refreshCatalogue()

    const channel = client
      .channel('public-catalogue-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refreshCatalogue)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, refreshCatalogue)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, refreshCatalogue)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, refreshCatalogue)
      .subscribe()

    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [])

  // Broadcast channel for instantaneous cross-tab synchronization
  const broadcastSync = useCallback((type: string) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(SYNC_CHANNEL_NAME)
        bc.postMessage({ type, timestamp: Date.now() })
        bc.close()
      }
    } catch {
      // BroadcastChannel optional fallback
    }
  }, [])

  // Listen for storage changes from other tabs or windows
  useEffect(() => {
    const reloadFromStorage = () => {
      try {
        const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS)
        if (storedProducts) {
          const parsed = JSON.parse(storedProducts)
          if (Array.isArray(parsed)) setProducts(parsed)
        }
        const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES)
        if (storedCategories) {
          const parsed = JSON.parse(storedCategories)
          if (Array.isArray(parsed)) setCategories(parsed)
        }
        const storedBrands = localStorage.getItem(STORAGE_KEY_BRANDS)
        if (storedBrands) {
          const parsed = JSON.parse(storedBrands)
          if (Array.isArray(parsed)) setBrands(parsed)
        }
        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings)
          if (parsed && typeof parsed === 'object') setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...parsed })
        }
      } catch (err) {
        console.error('Error syncing storage:', err)
      }
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY_PRODUCTS ||
        event.key === STORAGE_KEY_CATEGORIES ||
        event.key === STORAGE_KEY_BRANDS ||
        event.key === STORAGE_KEY_SETTINGS
      ) {
        reloadFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageEvent)

    let bc: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(SYNC_CHANNEL_NAME)
        bc.onmessage = () => reloadFromStorage()
      }
    } catch {
      // BroadcastChannel optional fallback
    }

    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      if (bc) bc.close()
    }
  }, [])

  // Persistent storage synchronizers with quota protection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products))
      broadcastSync('products')
    } catch (e) {
      console.error('Error saving products to localStorage:', e)
    }
  }, [products, broadcastSync])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories))
      broadcastSync('categories')
    } catch (e) {
      console.error('Error saving categories to localStorage:', e)
    }
  }, [categories, broadcastSync])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands))
      broadcastSync('brands')
    } catch (e) {
      console.error('Error saving brands to localStorage:', e)
    }
  }, [brands, broadcastSync])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(siteSettings))
      broadcastSync('settings')
    } catch (e) {
      console.error('Error saving site settings to localStorage:', e)
    }
  }, [siteSettings, broadcastSync])

  // Helper for generating URL slugs
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

  // --- PRODUCT ACTIONS ---
  const addProduct = (newProd: Omit<Product, 'slug'> & { slug?: string }) => {
    let baseSlug = newProd.slug || slugify(newProd.name)
    if (!baseSlug) baseSlug = `product-${Date.now()}`

    let uniqueSlug = baseSlug
    let counter = 1
    while (products.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`
      counter++
    }

    const created: Product = {
      ...newProd,
      slug: uniqueSlug,
      specs: Array.isArray(newProd.specs) ? newProd.specs.filter(Boolean) : [],
    }

    setProducts((prev) => [created, ...prev])
    return { success: true, message: 'Product added successfully!' }
  }

  const updateProduct = (slug: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.slug === slug) {
          return {
            ...item,
            ...updated,
            specs: Array.isArray(updated.specs) ? updated.specs.filter(Boolean) : item.specs,
          }
        }
        return item
      })
    )
    return { success: true, message: 'Product updated successfully!' }
  }

  const deleteProduct = (slug: string) => {
    setProducts((prev) => prev.filter((p) => p.slug !== slug))
    return { success: true, message: 'Product removed from catalog.' }
  }

  const toggleFeaturedProduct = (slug: string) => {
    let nowFeatured = false
    setProducts((prev) =>
      prev.map((p) => {
        if (p.slug === slug) {
          nowFeatured = !p.featured
          return { ...p, featured: nowFeatured }
        }
        return p
      })
    )
    return { success: true, featured: nowFeatured }
  }

  // --- CATEGORY / SECTION ACTIONS ---
  const getCategoryById = (id: string): Category => {
    const found = categories.find((c) => c.id.toLowerCase() === id.toLowerCase())
    if (found) return found
    return {
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      shortName: id.replace(/-/g, ' '),
      description: 'Quality electricals, appliances & accessories at A Kaycee Electricals.',
      image: '/assets/products/hisense-1-5hp-ac.jpg',
    }
  }

  const addCategory = (catData: Omit<Category, 'id'> & { id?: string }) => {
    let baseId = catData.id ? slugify(catData.id) : slugify(catData.name)
    if (!baseId) baseId = `category-${Date.now()}`

    let uniqueId = baseId
    let counter = 1
    while (categories.some((c) => c.id === uniqueId)) {
      uniqueId = `${baseId}-${counter}`
      counter++
    }

    const created: Category = {
      id: uniqueId,
      name: catData.name.trim(),
      shortName: (catData.shortName || catData.name).trim(),
      description: catData.description.trim() || 'Explore quality items in this section.',
      image: catData.image || '/assets/products/hisense-1-5hp-ac.jpg',
    }

    setCategories((prev) => [...prev, created])
    return { success: true, message: 'New section created successfully!', category: created }
  }

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...updated,
            name: updated.name ? updated.name.trim() : c.name,
            shortName: updated.shortName ? updated.shortName.trim() : c.shortName,
          }
        }
        return c
      })
    )
    return { success: true, message: 'Category section updated successfully!' }
  }

  const deleteCategory = (id: string) => {
    const attachedCount = products.filter((p) => p.category === id).length
    setCategories((prev) => prev.filter((c) => c.id !== id))
    return {
      success: true,
      message: `Section deleted. (${attachedCount} product(s) were under this category)`,
      productCount: attachedCount,
    }
  }

  // --- BRAND ACTIONS ---
  const getBrandByName = (name: string): BrandItem | undefined => {
    return brands.find((b) => b.name.toLowerCase() === name.toLowerCase())
  }

  const brandNames = useMemo(() => brands.map((b) => b.name), [brands])

  const addBrand = (newBrand: BrandItem) => {
    const trimmedName = newBrand.name.trim()
    if (!trimmedName) {
      return { success: false, message: 'Please provide a valid brand name.' }
    }
    if (brands.some((b) => b.name.toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, message: `Brand "${trimmedName}" already exists.` }
    }

    const created: BrandItem = {
      name: trimmedName,
      logo: newBrand.logo || '/assets/brands/hisense logo.png',
      logoDark: newBrand.logoDark,
      tagline: newBrand.tagline || 'Available product options',
      categories: Array.isArray(newBrand.categories) ? newBrand.categories.filter(Boolean) : [],
    }

    setBrands((prev) => [...prev, created])
    return { success: true, message: 'Brand added successfully!' }
  }

  const updateBrand = (originalName: string, updated: Partial<BrandItem>) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.name.toLowerCase() === originalName.toLowerCase()) {
          const newName = updated.name ? updated.name.trim() : b.name
          return {
            ...b,
            ...updated,
            name: newName,
            categories: updated.categories ? updated.categories.filter(Boolean) : b.categories,
          }
        }
        return b
      })
    )

    // If brand name was renamed, optionally cascade to products
    if (updated.name && updated.name.trim() !== originalName) {
      const newName = updated.name.trim()
      setProducts((prev) =>
        prev.map((p) => {
          if (p.brand.toLowerCase() === originalName.toLowerCase()) {
            return { ...p, brand: newName }
          }
          return p
        })
      )
    }

    return { success: true, message: 'Brand updated successfully!' }
  }

  const deleteBrand = (name: string) => {
    const attachedCount = products.filter((p) => p.brand.toLowerCase() === name.toLowerCase()).length
    setBrands((prev) => prev.filter((b) => b.name.toLowerCase() !== name.toLowerCase()))
    return {
      success: true,
      message: `Brand removed. (${attachedCount} product(s) were under this brand)`,
      productCount: attachedCount,
    }
  }

  // --- SITE SETTINGS & LOGO ACTIONS ---
  const updateSiteLogo = (logo: string) => {
    setSiteSettings((prev) => ({ ...prev, logo }))
    return { success: true }
  }

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => ({ ...prev, ...settings }))
    return { success: true }
  }

  const resetSiteLogo = () => {
    setSiteSettings((prev) => ({ ...prev, logo: DEFAULT_SITE_SETTINGS.logo }))
  }

  const resetSiteSettings = () => {
    setSiteSettings(DEFAULT_SITE_SETTINGS)
    localStorage.removeItem(STORAGE_KEY_SETTINGS)
  }

  // --- RESET & EXPORT / IMPORT ACTIONS ---
  const resetToDefaults = () => {
    setProducts(defaultProducts)
    localStorage.removeItem(STORAGE_KEY_PRODUCTS)
  }

  const resetAllToDefaults = () => {
    setProducts(defaultProducts)
    setCategories(defaultCategories)
    setBrands(defaultBrandList)
    setSiteSettings(DEFAULT_SITE_SETTINGS)
    localStorage.removeItem(STORAGE_KEY_PRODUCTS)
    localStorage.removeItem(STORAGE_KEY_CATEGORIES)
    localStorage.removeItem(STORAGE_KEY_BRANDS)
    localStorage.removeItem(STORAGE_KEY_SETTINGS)
  }

  const exportCatalogJson = () => {
    return JSON.stringify(products, null, 2)
  }

  const exportFullBackupJson = () => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      siteSettings,
      categories,
      brands,
      products,
    }
    return JSON.stringify(fullBackup, null, 2)
  }

  const exportCatalogTypeScript = () => {
    return `// Exported from A Kaycee Electricals Admin Portal
// Generated on ${new Date().toLocaleString()}

import { type Category, type BrandItem, type Product } from './catalog'

export const siteSettings = ${JSON.stringify(siteSettings, null, 2)};

export const categories: Category[] = ${JSON.stringify(categories, null, 2)};

export const brandList: BrandItem[] = ${JSON.stringify(brands, null, 2)};

export const products: Product[] = ${JSON.stringify(products, null, 2)};
`
  }

  const importCatalogJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const isValid = parsed.every((item) => item.name && item.category && item.brand)
        if (!isValid) {
          return { success: false, error: 'Invalid product format in JSON. Must contain name, category, and brand.' }
        }
        setProducts(parsed)
        return { success: true, count: parsed.length }
      }
      return { success: false, error: 'JSON does not contain a valid product array.' }
    } catch (e: any) {
      return { success: false, error: e.message || 'Invalid JSON string' }
    }
  }

  const importFullBackupJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid backup file format.' }
      }

      let restoredParts: string[] = []

      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        setProducts(parsed.products)
        restoredParts.push(`${parsed.products.length} products`)
      }

      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        setCategories(parsed.categories)
        restoredParts.push(`${parsed.categories.length} sections`)
      }

      if (Array.isArray(parsed.brands) && parsed.brands.length > 0) {
        setBrands(parsed.brands)
        restoredParts.push(`${parsed.brands.length} brands`)
      }

      if (parsed.siteSettings && typeof parsed.siteSettings === 'object') {
        setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...parsed.siteSettings })
        restoredParts.push('site branding')
      }

      if (restoredParts.length === 0) {
        return { success: false, error: 'No recognizable catalog data found in backup.' }
      }

      return {
        success: true,
        summary: `Restored ${restoredParts.join(', ')} successfully!`,
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Invalid JSON string' }
    }
  }

  return (
    <CatalogContext.Provider
      value={{
        // Products
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleFeaturedProduct,

        // Categories / Sections
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,

        // Brands
        brands,
        brandNames,
        addBrand,
        updateBrand,
        deleteBrand,
        getBrandByName,

        // Site Settings & Logo
        siteSettings,
        updateSiteLogo,
        updateSiteSettings,
        resetSiteLogo,
        resetSiteSettings,

        // Reset & Backups
        resetToDefaults,
        resetAllToDefaults,
        exportCatalogTypeScript,
        exportCatalogJson,
        exportFullBackupJson,
        importCatalogJson,
        importFullBackupJson,
      }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider')
  }
  return context
}
