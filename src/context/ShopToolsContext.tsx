import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '../data/catalog'

type ToolsContext = {
  saved: string[]
  compared: string[]
  toggleSaved: (slug: string) => void
  toggleCompared: (slug: string) => void
  savedProducts: (products: Product[]) => Product[]
  comparedProducts: (products: Product[]) => Product[]
}

const Context = createContext<ToolsContext | null>(null)

export function ShopToolsProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>(() => JSON.parse(localStorage.getItem('akaycee_saved') || '[]'))
  const [compared, setCompared] = useState<string[]>(() => JSON.parse(localStorage.getItem('akaycee_compare') || '[]'))
  useEffect(() => localStorage.setItem('akaycee_saved', JSON.stringify(saved)), [saved])
  useEffect(() => localStorage.setItem('akaycee_compare', JSON.stringify(compared)), [compared])
  const value = useMemo<ToolsContext>(() => ({
    saved, compared,
    toggleSaved: (slug) => setSaved((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]),
    toggleCompared: (slug) => setCompared((current) => current.includes(slug) ? current.filter((item) => item !== slug) : current.length >= 3 ? [...current.slice(1), slug] : [...current, slug]),
    savedProducts: (products) => products.filter((product) => saved.includes(product.slug)),
    comparedProducts: (products) => products.filter((product) => compared.includes(product.slug)),
  }), [saved, compared])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useShopTools() {
  const value = useContext(Context)
  if (!value) throw new Error('useShopTools must be used inside ShopToolsProvider')
  return value
}

