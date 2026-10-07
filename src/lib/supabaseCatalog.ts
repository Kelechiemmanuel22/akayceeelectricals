import type { BrandItem, Category, Product } from '../data/catalog'
import type { SiteSettings } from '../context/CatalogContext'
import { supabase } from './supabase'

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
  products: Product[]
  categories: Category[]
  brands: BrandItem[]
  settings?: SiteSettings
}

export async function fetchRemoteCatalogue(): Promise<RemoteCatalogue | null> {
  if (!supabase) return null

  const [categoryResult, brandResult, productResult, settingsResult] = await Promise.all([
    supabase.from('categories').select('id,name,short_name,description,image_url,sort_order').eq('active', true).order('sort_order'),
    supabase.from('brands').select('name,logo_url,logo_dark_url,tagline,category_tags,sort_order').eq('active', true).order('sort_order'),
    supabase.from('products').select('slug,name,category_id,brand_name,description,specs,image_url,featured,sort_order').eq('active', true).order('sort_order'),
    supabase.from('site_settings').select('logo_url,site_name,tagline,phone,whatsapp').eq('id', 1).maybeSingle(),
  ])

  const error = categoryResult.error || brandResult.error || productResult.error || settingsResult.error
  if (error) throw error

  const categories = ((categoryResult.data || []) as CategoryRow[]).map((row) => ({
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
    slug: row.slug,
    name: row.name,
    category: row.category_id,
    brand: row.brand_name,
    description: row.description,
    specs: row.specs || [],
    image: row.image_url,
    featured: row.featured,
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

  return { products, categories, brands, settings }
}
