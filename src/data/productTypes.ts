import type { Product } from './catalog'

export type ProductTypeFilter = { id: string; label: string; matches: (product: Product) => boolean }
const text = (product: Product) => `${product.name} ${product.specs.join(' ')}`.toLowerCase()
const test = (pattern: RegExp) => (product: Product) => pattern.test(text(product))
const semiAutomatic = test(/semi[ -]?automatic|twin[ -]?tub/)
const washerDryer = test(/washer[ -]?dryer|wash\s*\/\s*.*dry/)
const fan = test(/\bfan\b/)

// Names/specifications are used so future owner-added products work too.
export const categoryProductTypes: Record<string, ProductTypeFilter[]> = {
  laundry: [
    { id: 'front-load', label: 'Front load', matches: p => test(/front[ -]?load/)(p) || p.slug === 'lg-rh90v9pv8n-heat-pump-dryer' },
    { id: 'top-load', label: 'Top load', matches: p => test(/top[ -]?load/)(p) || semiAutomatic(p) },
    { id: 'semi-automatic', label: 'Semi-automatic', matches: semiAutomatic },
    { id: 'dryers', label: 'Dryers', matches: p => test(/\bdryer\b/)(p) && !washerDryer(p) },
    { id: 'washer-dryers', label: 'Washer-dryers', matches: washerDryer },
  ],
  refrigeration: [
    { id: 'single-door', label: 'Single door', matches: test(/single[ -]?door/) },
    { id: 'two-door', label: 'Two door', matches: test(/two[ -]?door|double[ -]?door|2[ -]?doors?/) },
    { id: 'top-freezer', label: 'Top freezer', matches: test(/top[ -]?(?:freezer|mount)/) },
    { id: 'bottom-freezer', label: 'Bottom freezer', matches: test(/bottom[ -]?(?:freezer|mount)/) },
    { id: 'side-by-side', label: 'Side-by-side', matches: test(/side[ -]?by[ -]?side/) },
    { id: 'four-door', label: 'Four door', matches: test(/four[ -]?door|4[ -]?door|cross[ -]?door/) },
    { id: 'mini', label: 'Mini refrigerators', matches: test(/mini|bar[ -]?fridge|compact refrigerator/) },
    { id: 'water-dispenser', label: 'Water dispenser', matches: test(/water(?:\s+and\s+ice)?\s+dispenser/) },
    { id: 'freezers', label: 'Standalone freezers', matches: p => test(/freezer/)(p) && !test(/refrigerator|fridge/)(p) },
  ],
  cooling: [
    { id: 'air-conditioners', label: 'All air conditioners', matches: p => !fan(p) && test(/\bac\b|air[ -]?conditioner/)(p) },
    { id: 'inverter-split', label: 'Inverter split AC', matches: p => !test(/non[ -]?inverter/)(p) && test(/inverter/)(p) && test(/split/)(p) },
    { id: 'portable', label: 'Portable AC', matches: test(/portable/) },
    { id: 'floor-standing', label: 'Floor-standing AC', matches: p => !fan(p) && test(/floor[ -]?standing|standing\s+ac/)(p) },
    { id: 'cassette', label: 'Cassette AC', matches: test(/cassette/) },
    { id: 'fans', label: 'Fans', matches: fan },
  ],
}

export function matchesProductType(product: Product, category: string, type: string) {
  if (type === 'all') return true
  return categoryProductTypes[category]?.find(filter => filter.id === type)?.matches(product) ?? true
}
