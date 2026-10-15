import type { BrandItem, Product } from '../data/catalog'

export const brandKey = (name: string) => name.trim().toLowerCase()
export const brandPath = (name: string) => `/brand/${encodeURIComponent(brandKey(name))}`

export function filterBrandProducts(products: Product[], name: string, category = 'all', query = '') {
  const search = query.trim().toLowerCase()
  return products.filter(product => brandKey(product.brand) === brandKey(name)
    && (category === 'all' || product.category === category)
    && (!search || `${product.name} ${product.description} ${product.specs.join(' ')}`.toLowerCase().includes(search)))
}

// Match actual catalogue stock, never a brand's marketing tagline or name.
// Broad appliance families keep different fridge/AC variants comparable, while
// preventing unrelated small appliances (e.g. kettles) being suggested for irons.
function productFamily(product: Product) {
  const name = product.name.toLowerCase()
  const families: [string, RegExp][] = [
    ['iron', /\biron(?:s)?\b/], ['kettle', /\bkettle(?:s)?\b/],
    ['blender', /\bblender(?:s)?\b/], ['microwave', /\bmicrowave\b/],
    ['refrigerator', /\brefrigerator|\bfridge/], ['freezer', /\bfreezer\b/],
    ['television', /\btelevision|\btv\b/], ['audio', /\bsoundbar|\bspeaker|\bhome[ -]theat/],
    ['air-conditioner', /\bair[ -]?condition|\bac\b/], ['fan', /\bfan(?:s)?\b/],
    ['washer-dryer', /washer[ -]dryer/], ['dryer', /\bdryer\b/],
    ['washer', /\bwasher|washing machine/], ['cooker', /\bcooker|\bburner/],
  ]
  const family = families.find(([, pattern]) => pattern.test(name))?.[0]
  return `${product.category}:${family || product.subcategory || 'general'}`
}

export function relatedBrands(brands: BrandItem[], products: Product[], current: string, category = 'all', limit = 4) {
  const currentProducts = filterBrandProducts(products, current, category)
  const families = new Set(currentProducts.map(productFamily))
  const currentCategories = new Set(currentProducts.map(product => product.category))
  return brands.filter(brand => brandKey(brand.name) !== brandKey(current)).map(brand => {
    const matching = filterBrandProducts(products, brand.name, category).filter(product => {
      if (!currentCategories.has(product.category)) return false
      return families.has(productFamily(product))
    })
    return { brand, score:new Set(matching.map(productFamily)).size, count:matching.length }
  }).filter(item => item.score > 0)
    .sort((a,b) => b.score - a.score || b.count - a.count || a.brand.name.localeCompare(b.brand.name))
    .slice(0, Math.max(0, limit)).map(item => item.brand)
}
