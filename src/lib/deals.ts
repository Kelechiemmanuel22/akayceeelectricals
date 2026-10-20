import type { Product } from '../data/catalog'

export type DealCollection = {
  id: string; name: string; eyebrow: string; description: string; image: string
  theme: 'student' | 'odogwu' | 'seasonal'; active: boolean; featured: boolean
  order: number; startsAt: string; endsAt: string
}
export type ComboDeal = {
  id: string; collectionId: string; name: string; description: string
  items: { slug: string; quantity: number }[]; price: number | null; priceIsEstimate?: boolean; active: boolean
}
export type DealsData = { enabled?: boolean; collections: DealCollection[]; combos: ComboDeal[] }
export const DEALS_PREVIEW_KEY = 'akaycee_deals_local_preview_v1'
export const previewDeals: DealsData = {
  enabled: true,
  collections: [
    { id: 'student-deals', name: 'Student Deals', eyebrow: 'Small space. Big possibilities.', description: 'Your own space, your own little comforts. Thoughtful essentials for campus life and that first apartment.', image: '/assets/deals/student-life-v1.jpg', theme: 'student', active: true, featured: true, order: 1, startsAt: '', endsAt: '' },
    { id: 'odogwu-deals', name: 'Odogwu Deals', eyebrow: 'Go big. Live well.', description: 'For the home you have in mind. Bring your favourite comforts together in one considered package.', image: '/assets/deals/odogwu-home-v1.jpg', theme: 'odogwu', active: true, featured: true, order: 2, startsAt: '', endsAt: '' },
    { id: 'festive-deals', name: 'Festive Deals', eyebrow: 'A little more to celebrate.', description: 'Special packages for the season. Turn this collection on when your festive offers are ready.', image: '/assets/deals/odogwu-home-v1.jpg', theme: 'seasonal', active: false, featured: false, order: 3, startsAt: '', endsAt: '' },
  ],
  combos: [
    { id: 'campus-comfort', collectionId: 'student-deals', name: 'Campus comfort', description: 'Keep your drinks cool, your room breezy and your evenings easy.', items: [{ slug: 'bruhm-bfs100md-mini-refrigerator', quantity: 1 }, { slug: 'royal-standing-fan', quantity: 1 }], price: 245000, priceIsEstimate: true, active: true },
    { id: 'first-space', collectionId: 'student-deals', name: 'First space, sorted', description: 'A practical little set-up for moving into a space of your own.', items: [{ slug: 'bruhm-bfs100md-mini-refrigerator', quantity: 1 }, { slug: 'bruhm-microwave', quantity: 1 }, { slug: 'royal-standing-fan', quantity: 1 }], price: 340000, priceIsEstimate: true, active: true },
    { id: 'the-odogwu-lounge', collectionId: 'odogwu-deals', name: 'The Odogwu lounge', description: 'A bigger picture. Fuller sound. Comfort that completes the room.', items: [{ slug: 'samsung-65-qled-smart-tv', quantity: 1 }, { slug: 'soundbar', quantity: 1 }, { slug: 'hisense-1-5hp-inverter-split-ac', quantity: 1 }], price: 2390000, priceIsEstimate: true, active: true },
    { id: 'home-upgrade', collectionId: 'odogwu-deals', name: 'The home upgrade', description: 'Freshness, entertainment and an easier laundry day. All together.', items: [{ slug: 'lg-55-smart-4k-uhd-tv', quantity: 1 }, { slug: 'hisense-double-door-refrigerator', quantity: 1 }, { slug: 'midea-front-load-washing-machine', quantity: 1 }], price: 1600000, priceIsEstimate: true, active: true },
  ],
}

// Upgrade the original blank-price samples without replacing edited packages or prices.
export function addPreviewPriceEstimates(data: DealsData): DealsData {
  return { ...data, combos: data.combos.map(combo => {
    const sample = previewDeals.combos.find(sample => sample.id === combo.id && sample.collectionId === combo.collectionId)
    if (combo.price !== null || combo.priceIsEstimate !== undefined || !sample || JSON.stringify(combo.items) !== JSON.stringify(sample.items)) return combo
    return { ...combo, price: sample.price, priceIsEstimate: true }
  }) }
}

export function collectionIsLive(collection: DealCollection, now = Date.now()) {
  if (!collection.active) return false
  const start = collection.startsAt ? Date.parse(collection.startsAt) : -Infinity
  const end = collection.endsAt ? Date.parse(collection.endsAt) : Infinity
  return !Number.isNaN(start) && !Number.isNaN(end) && start <= now && now < end
}
export function resolveCombo(combo: ComboDeal, products: Product[]) {
  return combo.items.flatMap(item => {
    const product = products.find(product => product.slug === item.slug)
    return product ? [{ product, quantity: item.quantity }] : []
  })
}
export function comboIsAvailable(combo: ComboDeal, products: Product[]) {
  return combo.active && combo.items.length >= 2 && combo.items.length <= 50 && new Set(combo.items.map(item => item.slug)).size === combo.items.length && combo.items.every(item => Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99) && resolveCombo(combo, products).length === combo.items.length
}
export function validDealsData(value: unknown): value is DealsData {
  if (!value || typeof value !== 'object') return false
  const data = value as DealsData
  return (data.enabled === undefined || typeof data.enabled === 'boolean') && Array.isArray(data.collections) && Array.isArray(data.combos) &&
    data.collections.every(c => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.description === 'string' && typeof c.eyebrow === 'string' && typeof c.image === 'string' && ['student', 'odogwu', 'seasonal'].includes(c.theme) && typeof c.active === 'boolean' && typeof c.featured === 'boolean' && Number.isFinite(c.order) && typeof c.startsAt === 'string' && typeof c.endsAt === 'string') &&
    data.combos.every(c => c && typeof c.id === 'string' && typeof c.collectionId === 'string' && typeof c.name === 'string' && typeof c.description === 'string' && typeof c.active === 'boolean' && (c.priceIsEstimate === undefined || typeof c.priceIsEstimate === 'boolean') && (c.price === null || (Number.isFinite(c.price) && c.price >= 0 && c.price <= 9999999999)) && Array.isArray(c.items) && c.items.every(item => item && typeof item.slug === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99))
}
export const dealPrice = (price: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(price)

export function comboQuoteProduct(combo: ComboDeal, collection: DealCollection, products: Product[]): Product {
  return { slug: `combo:${combo.id}`, name: `${combo.name} — ${collection.name}`, category: 'combo-deals', brand: 'A Kaycee', image: collection.image, description: combo.description, price: combo.price, priceIsEstimate: Boolean(combo.priceIsEstimate), specs: resolveCombo(combo, products).map(item => `${item.quantity} × ${item.product.name}`) }
}
