import { createContext, useContext, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { readAdminDrafts, writeAdminDrafts } from '../lib/adminDrafts'

type DraftContext = { initial: Record<string, unknown>; put: (name: string, value: unknown) => void; discard: (prefix: string) => void }
const Context = createContext<DraftContext | null>(null)

export function AdminDraftProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [initial] = useState(() => {
    try { return readAdminDrafts(userId, window.localStorage) } catch { return {} }
  })
  const values = useRef({ ...initial })
  const persist = () => {
    try { writeAdminDrafts(userId, values.current, window.localStorage) } catch { /* In-memory editing still works. */ }
  }
  const context = useRef<DraftContext>({
    initial,
    put: (name, value) => { values.current[name] = value; initial[name] = value; persist() },
    discard: (prefix) => {
      for (const name of Object.keys(values.current)) {
        if (name.startsWith(prefix)) { delete values.current[name]; delete initial[name] }
      }
      persist()
    },
  })
  return <Context.Provider value={context.current}>{children}</Context.Provider>
}

export function useAdminDraftState<T>(name: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const context = useContext(Context)
  if (!context) throw new Error('Admin drafts require a signed-in draft provider.')
  const [value, setValue] = useState<T>(() => {
    const saved = context.initial[name]
    if (saved === undefined || (fallback !== null && typeof saved !== typeof fallback)) return fallback
    return saved as T
  })
  const current = useRef(value)
  const update: Dispatch<SetStateAction<T>> = (next) => {
    const result = typeof next === 'function' ? (next as (previous: T) => T)(current.current) : next
    current.current = result
    context.put(name, result)
    setValue(result)
  }
  return [value, update]
}

export function useDiscardAdminDraft() {
  const context = useContext(Context)
  if (!context) throw new Error('Admin drafts require a signed-in draft provider.')
  return context.discard
}
