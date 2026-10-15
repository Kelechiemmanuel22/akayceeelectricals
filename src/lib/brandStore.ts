import type { Product } from '../data/catalog'

export const brandKey = (name: string) => name.trim().toLowerCase()
export const brandPath = (name: string) => `/brand/${encodeURIComponent(brandKey(name))}`

export function filterBrandProducts(products: Product[], name: string, category = 'all', query = '') {
  const search = query.trim().toLowerCase()
  return products.filter(product => brandKey(product.brand) === brandKey(name)
    && (category === 'all' || product.category === category)
    && (!search || `${product.name} ${product.description} ${product.specs.join(' ')}`.toLowerCase().includes(search)))
}
