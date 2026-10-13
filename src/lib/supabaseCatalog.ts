import type { BrandItem, Category, Product } from '../data/catalog'
import type { SiteSettings } from '../context/CatalogContext'
import { supabase } from './supabase'
import { mapSubcategory, type ManagedSubcategory, type SubcategoryRow } from '../data/subcategories'

type CategoryRow = {
  id: string
  name: string
  short_name: string
  description: string
  image_url: string
  sort_order: number
}

type BrandRow = {
  name: string
  logo_url: string
  logo_dark_url: string | null
  tagline: string
  category_tags: string[]
  sort_order: number
}

type ProductRow = {
  created_at?: string
  subcategory_id?: string | null
  price?: number | null
  price_is_estimate?: boolean
  price_note?: string
  slug: string
  name: string
  category_id: string
  brand_name: string
  description: string
  specs: string[]
  image_url: string
  featured: boolean
  sort_order: number
}

type SettingsRow = {
  logo_url: string
  site_name: string
  tagline: string
  phone: string
  whatsapp: string
}

export type RemoteCatalogue = {
  subcategoryDefinitions?: ManagedSubcategory[]
  products: Product[]
  categories: Category[]
  brands: BrandItem[]
  settings?: SiteSettings
}

export async function fetchRemoteCatalogue(): Promise<RemoteCatalogue | null> {
  if (!supabase) return null

  const [categoryResult, brandResult, productResult, settingsResult, subcategoryResult] = await Promise.all([
    supabase.from('categories').select('id,name,short_name,description,image_url,sort_order').eq('active', true).order('sort_order'),
    supabase.from('brands').select('name,logo_url,logo_dark_url,tagline,category_tags,sort_order').eq('active', true).order('sort_order'),
    // Remains compatible before the optional price-column migration is applied.
    supabase.from('products').select('*').eq('active', true).order('sort_order'),
    supabase.from('site_settings').select('logo_url,site_name,tagline,phone,whatsapp').eq('id', 1).maybeSingle(),
    supabase.from('product_subcategories').select('*').order('sort_order').order('name'),
  ])

  const error = categoryResult.error || brandResult.error || productResult.error || settingsResult.error
  if (error) throw error
  if (subcategoryResult.error && !['42P01', 'PGRST205'].includes(subcategoryResult.error.code)) throw subcategoryResult.error
  const subcategoryDefinitions = subcategoryResult.error ? undefined : ((subcategoryResult.data || []) as SubcategoryRow[]).map(mapSubcategory)

  const categories = ((categoryResult.data || []) as CategoryRow[]).filter((row) => row.id !== 'audio').map((row) => ({
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    description: row.description,
    image: row.image_url,
  }))

  const brands = ((brandResult.data || []) as BrandRow[]).map((row) => ({
    name: row.name,
    logo: row.logo_url,
    logoDark: row.logo_dark_url || undefined,
    tagline: row.tagline,
    categories: row.category_tags || [],
  }))

  const products = ((productResult.data || []) as ProductRow[]).map((row) => ({
    createdAt: row.created_at,
    slug: row.slug,
    name: row.name,
    category: row.category_id === 'audio' ? 'televisions' : row.category_id,
    brand: row.brand_name,
    description: row.description,
    specs: row.specs || [],
    image: row.image_url,
    featured: row.featured,
    price: row.price ?? null,
    priceIsEstimate: row.price_is_estimate ?? false,
    priceNote: row.price_note || undefined,
    subcategory: row.subcategory_id || undefined,
  }))

  const settingsRow = settingsResult.data as SettingsRow | null
  const settings = settingsRow
    ? {
        logo: settingsRow.logo_url,
        siteName: settingsRow.site_name,
        tagline: settingsRow.tagline,
        phone: settingsRow.phone,
        whatsapp: settingsRow.whatsapp,
      }
    : undefined

  return { products, categories, brands, settings, subcategoryDefinitions }
}
