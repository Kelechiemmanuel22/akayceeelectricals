import { supabase } from './supabase'
import { validDealsData, type DealsData } from './deals'

export type DealsSnapshot = DealsData & { revision: number }
export function dealsError(error: unknown) {
  const detail = error as { code?: string; message?: string }
  if (detail?.code === '40001') return 'Another administrator changed the deals. Close and reopen the editor to review the latest saved version before saving again.'
  if (detail?.code === '42501' || detail?.code === 'PGRST301') return 'Your session cannot publish deals. Sign in with an approved owner or administrator account.'
  if (detail?.code === 'PGRST202' || detail?.code === '42P01') return 'The shared deals database is not ready. Apply the shared_combo_deals migration before publishing.'
  if (detail?.code === '23503') return 'A linked product or collection no longer exists. Refresh the catalogue and update this package.'
  return detail?.message || 'Could not reach the shared deals database. Check your connection and try again.'
}
export async function fetchSharedDeals(): Promise<DealsSnapshot> {
  if (!supabase) throw new Error('Supabase is not configured. Shared deal publishing is unavailable.')
  const { data, error } = await supabase.rpc('read_deals_catalog')
  if (error) throw error
  const revision = (data as DealsSnapshot | null)?.revision
  if (!validDealsData(data) || !Number.isSafeInteger(revision) || revision! < 0) throw new Error('The shared deals database returned an invalid response.')
  return data as DealsSnapshot
}
export async function publishSharedDeals(data: DealsData, revision: number): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured. Nothing was published.')
  if (!validDealsData(data)) throw new Error('Check the deal details before saving.')
  const result = await supabase.rpc('save_deals_catalog', { payload: { ...data, enabled: data.enabled !== false }, expected_revision: revision })
  if (result.error) throw result.error
  if (!Number.isSafeInteger(result.data) || result.data <= revision) throw new Error('The database did not confirm this save. Refresh before trying again.')
  return result.data as number
}
