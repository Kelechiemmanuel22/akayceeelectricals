import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useCatalog } from './CatalogContext'
import { addPreviewPriceEstimates, collectionIsLive, comboIsAvailable, DEALS_PREVIEW_KEY, validDealsData, type DealsData } from '../lib/deals'
import { dealsError, fetchSharedDeals, publishSharedDeals } from '../lib/remoteDeals'
import { supabase } from '../lib/supabase'

type SaveResult = { success: boolean; message?: string }
type DealsContextValue = {
  data: DealsData; enabled: boolean; liveCollections: DealsData['collections']; liveCombos: DealsData['combos']
  isLoading: boolean; ready: boolean; saving: boolean; error: string; localDraft: DealsData | null; version: number | null
  reload: () => Promise<void>; saveData: (data: DealsData, expectedVersion?: number) => Promise<SaveResult>
}
const EMPTY_DEALS: DealsData = { enabled: false, collections: [], combos: [] }
const DealsContext = createContext<DealsContextValue | null>(null)

export function DealsProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog()
  const [data, setData] = useState<DealsData>(EMPTY_DEALS)
  const [localDraft] = useState<DealsData | null>(() => {
    try { const stored: unknown = JSON.parse(localStorage.getItem(DEALS_PREVIEW_KEY) || 'null'); return validDealsData(stored) ? addPreviewPriceEstimates(stored) : null } catch { return null }
  })
  const [isLoading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now)
  const revision = useRef<number | null>(null)
  const inSave = useRef(false)
  const loaded = useRef(false)
  const requestId = useRef(0)
  const mounted = useRef(true)
  const reload = useCallback(async () => {
    if (inSave.current) return
    const currentRequest = ++requestId.current
    if (!loaded.current) setLoading(true)
    try {
      const snapshot = await fetchSharedDeals()
      if (!mounted.current || currentRequest !== requestId.current || inSave.current) return
      revision.current = snapshot.revision; loaded.current = true; setVersion(snapshot.revision)
      setData(snapshot); setReady(true); setError(''); setNow(Date.now())
    } catch (failure) {
      if (!mounted.current || currentRequest !== requestId.current || inSave.current) return
      revision.current = null; loaded.current = false; setVersion(null)
      setData(EMPTY_DEALS); setReady(false); setError(dealsError(failure))
    } finally { if (mounted.current && currentRequest === requestId.current) setLoading(false) }
  }, [])
  useEffect(() => {
    mounted.current = true
    void reload()
    const refresh = () => { setNow(Date.now()); if (!document.hidden) void reload() }
    const timer = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    // Refresh on auth changes: an admin sees drafts; visitors only receive public rows.
    const auth = supabase?.auth.onAuthStateChange(() => { window.setTimeout(() => { if (mounted.current) void reload() }, 0) })
    const channel = supabase?.channel('shared-deals-settings').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deal_settings' }, () => { void reload() }).subscribe()
    return () => {
      mounted.current = false; ++requestId.current
      clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh)
      auth?.data.subscription.unsubscribe()
      if (channel) void supabase?.removeChannel(channel)
    }
  }, [reload])
  const enabled = ready && data.enabled !== false
  const liveCombos = useMemo(() => enabled ? data.combos.filter(combo => comboIsAvailable(combo, products)) : [], [enabled, data.combos, products])
  const liveCollections = useMemo(() => data.collections.filter(collection => enabled && collectionIsLive(collection, now) && liveCombos.some(combo => combo.collectionId === collection.id)).sort((a, b) => a.order - b.order), [enabled, data.collections, liveCombos, now])
  const saveData = async (next: DealsData, expectedVersion?: number): Promise<SaveResult> => {
    if (inSave.current) return { success: false, message: 'A save is already in progress. Please wait.' }
    if (!loaded.current || revision.current === null) return { success: false, message: 'Reload the shared deals database before saving. Nothing has been published.' }
    inSave.current = true; ++requestId.current; setSaving(true)
    let failure: unknown
    try {
      const confirmedRevision = await publishSharedDeals(next, expectedVersion ?? revision.current)
      revision.current = confirmedRevision; setVersion(confirmedRevision)
      setData(next); setNow(Date.now()); setError(''); setReady(true)
      return { success: true }
    } catch (caught) { failure = caught; return { success: false, message: dealsError(caught) } }
    finally {
      inSave.current = false; setSaving(false)
      // Reload authoritative rows after each save, including conflicts/expired sessions.
      if (mounted.current && (!failure || (failure as { code?: string }).code === '40001')) void reload()
    }
  }
  return <DealsContext.Provider value={{ data, enabled, liveCollections, liveCombos, isLoading, ready, saving, error, localDraft, version, reload, saveData }}>{children}</DealsContext.Provider>
}
export function useDeals() { const context = useContext(DealsContext); if (!context) throw new Error('DealsProvider is required'); return context }
