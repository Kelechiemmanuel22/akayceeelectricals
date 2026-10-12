const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })

export function formatPrice(value?: number | null): string | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? naira.format(value) : null
}

export function parsePrice(value: string): number | null {
  if (!value.trim()) return null
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Use a positive naira amount with at most two decimal places.')
  const price = Number(value)
  if (!Number.isFinite(price) || price > 9999999999.99) throw new Error('Price is outside the supported range.')
  return price
}
