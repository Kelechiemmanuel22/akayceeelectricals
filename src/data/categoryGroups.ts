import type { Product } from './catalog'
import { categoryPresentations } from './categoryPresentation'
import { matchesProductType } from './productTypes'
import { canonicalCategory, type ManagedSubcategory } from './subcategories'

export type CategoryGroup = { id: string; name: string; text: string }
const coolingGroups: CategoryGroup[] = [
  { id: 'air-conditioners', name: 'Air conditioners', text: 'Make every room your comfort zone.' },
  { id: 'fans', name: 'Fans', text: 'A little breeze. A big difference.' },
]

export function categoryGroups(category: string, definitions: ManagedSubcategory[]): CategoryGroup[] {
  const key = canonicalCategory(category)
  // Main departments keep their two broad groups; detailed filters remain separate.
  if (key === 'cooling') return coolingGroups
  if (categoryPresentations[key]) return categoryPresentations[key].choices.slice(0, 2).map(({ id, name, text }) => ({ id, name, text }))
  // Newly created departments use their first two saved groups, without invented groups.
  return definitions.filter(item => canonicalCategory(item.category) === key).map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.sortOrder ?? a.index) - (b.item.sortOrder ?? b.index) || a.index - b.index)
    .slice(0, 2).map(({ item }) => ({ id: item.id, name: item.name, text: '' }))
}

export function firstGroupProduct(products: Product[], category: string, group: string, definitions: ManagedSubcategory[]): Product | undefined {
  const key = canonicalCategory(category)
  return products.filter(product => canonicalCategory(product.category) === key && matchesProductType(product, key, group, definitions))
    .map((product, index) => ({ product, index, time: product.createdAt ? Date.parse(product.createdAt) : NaN }))
    .sort((a, b) => {
      const aHasTime = Number.isFinite(a.time), bHasTime = Number.isFinite(b.time)
      if (aHasTime && bHasTime) return a.time - b.time || a.product.slug.localeCompare(b.product.slug)
      if (aHasTime !== bHasTime) return aHasTime ? -1 : 1
      return a.index - b.index // Legacy/demo rows retain their original order.
    })[0]?.product
}
