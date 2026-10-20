import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCatalog } from './CatalogContext'
import { addPreviewPriceEstimates, collectionIsLive, comboIsAvailable, DEALS_PREVIEW_KEY, previewDeals, validDealsData, type DealsData } from '../lib/deals'

type DealsContextValue = { data: DealsData; enabled: boolean; liveCollections: DealsData['collections']; liveCombos: DealsData['combos']; saveData: (data: DealsData) => boolean }
const DealsContext = createContext<DealsContextValue | null>(null)

export function DealsProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog()
  const [data, setData] = useState<DealsData>(() => {
    try { const stored: unknown = JSON.parse(localStorage.getItem(DEALS_PREVIEW_KEY) || 'null'); if (validDealsData(stored)) return addPreviewPriceEstimates(stored) } catch { /* Keep the preview usable if storage is unavailable. */ }
    return previewDeals
  })
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    const sync = (event: StorageEvent) => {
      if (event.key !== DEALS_PREVIEW_KEY) return
      try { const next: unknown = JSON.parse(event.newValue || 'null'); if (validDealsData(next)) setData(next) } catch { /* Ignore invalid preview data. */ }
    }
    window.addEventListener('storage', sync)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('storage', sync) }
  }, [])
  const enabled = data.enabled !== false
  const liveCombos = useMemo(() => enabled ? data.combos.filter(combo => comboIsAvailable(combo, products)) : [], [enabled, data.combos, products])
  const liveCollections = useMemo(() => data.collections.filter(collection => collectionIsLive(collection, now) && liveCombos.some(combo => combo.collectionId === collection.id)).sort((a, b) => a.order - b.order), [data.collections, liveCombos, now])
  const saveData = (next: DealsData) => {
    if (!validDealsData(next)) return false
    try { localStorage.setItem(DEALS_PREVIEW_KEY, JSON.stringify(next)); setData(next); setNow(Date.now()); return true } catch { return false }
  }
  return <DealsContext.Provider value={{ data, enabled, liveCollections, liveCombos, saveData }}>{children}</DealsContext.Provider>
}
export function useDeals() { const context = useContext(DealsContext); if (!context) throw new Error('DealsProvider is required'); return context }
