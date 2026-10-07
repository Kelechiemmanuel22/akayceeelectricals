import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Product } from '../data/catalog'
import { contact } from '../lib/site'

export type QuoteItem = {
  product: Product
  quantity: number
}

type QuoteCartContextType = {
  items: QuoteItem[]
  addItem: (product: Product) => void
  removeItem: (slug: string) => void
  updateQuantity: (slug: string, delta: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  totalCount: number
  generateWhatsAppUrl: (customerNote?: string) => string
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(undefined)

const STORAGE_KEY = 'akaycee_quote_cart_v1'

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }, [items])

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.slug === product.slug)
      if (existing) {
        return prev.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setIsOpen(true)
  }

  const removeItem = (slug: string) => {
    setItems((prev) => prev.filter((item) => item.product.slug !== slug))
  }

  const updateQuantity = (slug: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.product.slug === slug) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as QuoteItem[]
    )
  }

  const clearCart = () => setItems([])

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const generateWhatsAppUrl = (customerNote?: string) => {
    let message = `Hello A Kaycee Electricals,\n\nI would like to request a quote / availability check for the following items:\n\n`
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}* (Brand: ${item.product.brand}) — Qty: ${item.quantity}\n`
    })

    if (customerNote && customerNote.trim()) {
      message += `\n*Additional Requirements / Delivery Location:*\n${customerNote.trim()}\n`
    }

    message += `\nPlease share current prices, availability and any delivery options that apply to my location in Lagos.`

    return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`
  }

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        totalCount,
        generateWhatsAppUrl,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  )
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext)
  if (!context) {
    throw new Error('useQuoteCart must be used within a QuoteCartProvider')
  }
  return context
}
