export type Subcategory = { id: string; name: string; filters: string[] }
export type ManagedSubcategory = Subcategory & { category: string; sortOrder?: number }
export type SubcategoryRow = { category_id: string; id: string; name: string; filter_ids: string[]; sort_order: number }
export const mapSubcategory = (row: SubcategoryRow): ManagedSubcategory => ({ category: row.category_id, id: row.id, name: row.name, filters: row.filter_ids, sortOrder: row.sort_order })
const option = (id: string, name: string, filters = [id]): Subcategory => ({ id, name, filters })

export function canonicalCategory(id: string) {
  return ({ 'air-conditioners': 'cooling', fans: 'cooling', televisions: 'entertainment', audio: 'entertainment' } as Record<string, string>)[id] || id
}

export const subcategories: Record<string, Subcategory[]> = {
  cooling: [
    option('air-conditioners', 'Standard split / other ACs'),
    option('inverter-split', 'Inverter split AC', ['air-conditioners', 'inverter-split']),
    option('portable', 'Portable AC', ['air-conditioners', 'portable']),
    option('floor-standing', 'Floor-standing AC', ['air-conditioners', 'floor-standing']),
    option('cassette', 'Cassette AC', ['air-conditioners', 'cassette']),
    option('fans', 'Fans'),
  ],
  entertainment: [option('televisions', 'Televisions'), option('audio', 'Speakers & soundbars')],
  kitchen: [option('cooking', 'Cookers & burners'), option('small-appliances', 'Kitchen essentials')],
  laundry: [
    option('front-load', 'Front load'), option('top-load', 'Top load'),
    option('semi-automatic', 'Semi-automatic', ['semi-automatic', 'top-load']),
    option('dryers', 'Dryers', ['dryers', 'front-load']),
    option('washer-dryers', 'Washer-dryers', ['washer-dryers', 'front-load']),
  ],
  refrigeration: [
    option('refrigerators', 'Other refrigerators'),
    option('single-door', 'Single door', ['refrigerators', 'single-door']),
    option('two-door', 'Two door', ['refrigerators', 'two-door']),
    option('top-freezer', 'Top freezer', ['refrigerators', 'two-door', 'top-freezer']),
    option('bottom-freezer', 'Bottom freezer', ['refrigerators', 'two-door', 'bottom-freezer']),
    option('side-by-side', 'Side-by-side', ['refrigerators', 'side-by-side']),
    option('four-door', 'Four door', ['refrigerators', 'four-door']),
    option('mini', 'Mini refrigerators', ['refrigerators', 'single-door', 'mini']),
    option('water-dispenser', 'Refrigerator with water dispenser', ['refrigerators', 'water-dispenser']),
    option('freezers', 'Standalone freezers'),
  ],
  lighting: [option('indoor', 'Indoor lighting'), option('outdoor', 'Outdoor & decorative')],
  'electrical-materials': [option('cables', 'Wires & cables'), option('fittings', 'Switches & fittings')],
}

export function defaultSubcategoryDefinitions(): ManagedSubcategory[] {
  return Object.entries(subcategories).flatMap(([category, items]) => items.map((item, index) => ({ ...item, category, sortOrder: index })))
}

export function getSubcategories(category: string, definitions?: ManagedSubcategory[]): Subcategory[] {
  if (definitions) return definitions.filter(item => canonicalCategory(item.category) === canonicalCategory(category))
  return subcategories[canonicalCategory(category)] || [option('general', 'General')]
}

export function validSubcategory(category: string, id: string, definitions?: ManagedSubcategory[]) {
  return getSubcategories(category, definitions).some(item => item.id === id)
}

// Used only to suggest/backfill older products. Owner selection is authoritative.
export function suggestSubcategory(category: string, name: string, specs: string[] = []) {
  const text = `${name} ${specs.join(' ')}`.toLowerCase()
  const match = (pattern: RegExp) => pattern.test(text)
  switch (canonicalCategory(category)) {
    case 'cooling':
      if (match(/\bfan\b/)) return 'fans'
      if (match(/portable/)) return 'portable'
      if (match(/cassette/)) return 'cassette'
      if (match(/floor[ -]?standing|standing\s+ac/)) return 'floor-standing'
      if (match(/inverter/) && !match(/non[ -]?inverter/) && match(/split/)) return 'inverter-split'
      if (match(/\bac\b|air[ -]?conditioner/)) return 'air-conditioners'
      break
    case 'laundry':
      if (match(/washer[ -]?dryer|wash\s*\/\s*.*dry/)) return 'washer-dryers'
      if (match(/semi[ -]?automatic|twin[ -]?tub/)) return 'semi-automatic'
      if (match(/\bdryer\b/)) return 'dryers'
      if (match(/top[ -]?load/)) return 'top-load'
      if (match(/front[ -]?load/)) return 'front-load'
      break
    case 'kitchen':
      if (match(/microwave|fryer|blender|kettle|dispenser|toaster/)) return 'small-appliances'
      if (match(/cooker|burner|oven|hob/)) return 'cooking'
      break
    case 'entertainment':
      if (match(/speaker|soundbar|audio|theatre|theater/)) return 'audio'
      if (match(/television|\btv\b/)) return 'televisions'
      break
    case 'refrigeration':
      if (match(/freezer/) && !match(/refrigerator|fridge/)) return 'freezers'
      if (match(/side[ -]?by[ -]?side/)) return 'side-by-side'
      if (match(/four[ -]?door|4[ -]?door/)) return 'four-door'
      if (match(/bottom[ -]?(?:freezer|mount)/)) return 'bottom-freezer'
      if (match(/top[ -]?(?:freezer|mount)/)) return 'top-freezer'
      if (match(/mini|bar[ -]?fridge|compact refrigerator/)) return 'mini'
      if (match(/water(?:\s+and\s+ice)?\s+dispenser/)) return 'water-dispenser'
      if (match(/single[ -]?door/)) return 'single-door'
      if (match(/two[ -]?door|double[ -]?door|2[ -]?door/)) return 'two-door'
      if (match(/refrigerator|fridge/)) return 'refrigerators'
      break
    case 'lighting':
      if (match(/outdoor|rope|decorative|flood|garden/)) return 'outdoor'
      if (match(/indoor|ceiling|panel|bulb|pendant/)) return 'indoor'
      break
    case 'electrical-materials':
      if (match(/switch|socket|changeover|adapter|clip/)) return 'fittings'
      if (match(/wire|cable/)) return 'cables'
      break
    default: return 'general'
  }
  return '' // Ask the owner instead of silently guessing an unrecognised item.
}
