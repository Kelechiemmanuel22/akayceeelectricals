import { useState } from 'react'
import { X, Trash2, Plus, Minus, FileText, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuoteCart } from '../context/QuoteCartContext'
import { WhatsAppIcon } from './SocialIcons'
import { trackEvent } from '../lib/engagement'

export function QuoteDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, totalCount, generateWhatsAppUrl } = useQuoteCart()
  const [note, setNote] = useState('')

  if (!isOpen) return null

  const handleSend = () => {
    trackEvent('quote_sent', { metadata: { item_count: totalCount } })
    const url = generateWhatsAppUrl(note)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Quote Request Drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/70 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white text-ink shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold-dark">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">Request a Quote</h2>
              <p className="text-xs text-ink/60">{totalCount} {totalCount === 1 ? 'item' : 'items'} in your inquiry list</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="grid size-10 place-items-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:bg-sand hover:text-ink"
            aria-label="Close quote drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid size-16 place-items-center rounded-full bg-sand text-ink/40">
                <FileText size={28} />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight">Your quote list is empty</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
                Browse our appliances, electrical materials and electronics, and click <strong>"Add to Quote"</strong> to request a consolidated price list.
              </p>
              <Link
                to="/products"
                onClick={() => setIsOpen(false)}
                className="button button-dark mt-6"
              >
                Browse Product Catalog <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/50">Selected Items</span>
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-cream">
                {items.map(({ product, quantity }) => (
                  <div key={product.slug} className="flex items-center gap-4 p-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="size-16 rounded-xl object-cover border border-ink/10 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gold-dark">{product.brand}</span>
                      <h4 className="truncate font-display text-sm font-bold tracking-tight text-ink">{product.name}</h4>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-ink/15 bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.slug, -1)}
                            className="p-1 text-ink/70 hover:text-ink"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.slug, 1)}
                            className="p-1 text-ink/70 hover:text-ink"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(product.slug)}
                          className="p-1 text-ink/40 transition-colors hover:text-rose-600"
                          aria-label="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Customer Notes / Delivery Location */}
              <div>
                <label htmlFor="quote-note" className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Project Notes / Delivery Area in Lagos (Optional)
                </label>
                <textarea
                  id="quote-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Delivery to Oregun, Ikeja. Also need installation support and 3 bundles of 2.5mm copper cable."
                  className="mt-2 w-full rounded-xl border border-ink/15 bg-cream p-3 text-xs leading-relaxed text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>

              {/* Trust Callouts */}
              <div className="rounded-xl border border-gold/30 bg-gold/10 p-3.5 text-xs text-ink/80">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold-dark" />
                  <p className="leading-relaxed">
                    The store team can confirm current availability, model specifications and pricing for your list on WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="border-t border-ink/10 bg-sand/60 p-6">
            <button
              onClick={handleSend}
              className="button button-whatsapp w-full !py-3.5 !text-sm !font-bold shadow-lg shadow-whatsapp/25"
            >
              <WhatsAppIcon className="size-5" />
              Send Quote Request to WhatsApp
            </button>
            <p className="mt-2 text-center text-[11px] text-ink/50">
              Direct connection with A Kaycee Electricals store representatives
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
