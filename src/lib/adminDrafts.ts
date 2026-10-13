export const ADMIN_DRAFT_TTL = 10 * 60 * 1000
const prefix = 'akaycee:admin-drafts:v1:'

type Drafts = { expiresAt: number; values: Record<string, unknown> }
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
const key = (userId: string) => `${prefix}${encodeURIComponent(userId)}`

export function readAdminDrafts(userId: string, storage: Storage, now = Date.now()): Record<string, unknown> {
  try {
    const raw = storage.getItem(key(userId))
    if (!raw) return {}
    const draft = JSON.parse(raw) as Drafts
    if (!Number.isFinite(draft.expiresAt) || draft.expiresAt <= now || draft.expiresAt > now + ADMIN_DRAFT_TTL || !draft.values || typeof draft.values !== 'object' || Array.isArray(draft.values)) {
      storage.removeItem(key(userId))
      return {}
    }
    return draft.values
  } catch {
    try { storage.removeItem(key(userId)) } catch { /* Storage may be disabled. */ }
    return {}
  }
}

export function writeAdminDrafts(userId: string, values: Record<string, unknown>, storage: Storage, now = Date.now()) {
  try { storage.setItem(key(userId), JSON.stringify({ expiresAt: now + ADMIN_DRAFT_TTL, values })) } catch { /* Keep editing in memory if storage is unavailable. */ }
}

export function clearAdminDrafts(userId: string, storage: Storage) {
  try { storage.removeItem(key(userId)) } catch { /* Storage may be disabled. */ }
}
