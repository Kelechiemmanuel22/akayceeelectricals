export type AdminEvent = { event_name: string; created_at: string; page_path: string; product_slug: string | null; metadata?: { subject?: string } | null }
export type ActivityPoint = { date: string; views: number; whatsapp: number }
export function dayKey(date: Date) { return date.toISOString().slice(0, 10) }
export function activitySeries(events: AdminEvent[], days: number, now = new Date()): ActivityPoint[] {
  const end = new Date(`${dayKey(now)}T00:00:00Z`)
  const points = Array.from({ length: days }, (_, i) => ({ date: dayKey(new Date(end.getTime() - (days - 1 - i) * 86400000)), views: 0, whatsapp: 0 }))
  const index = new Map(points.map(point => [point.date, point]))
  for (const event of events) {
    if (event.page_path.startsWith('/ak-owner-portal')) continue
    const point = index.get(event.created_at.slice(0, 10))
    if (!point) continue
    if (event.event_name === 'page_view') point.views++
    if (event.event_name === 'whatsapp_click') point.whatsapp++
  }
  return points
}
export function rankProductActivity(events: AdminEvent[], products: { slug: string; name: string }[]) {
  const byName = new Map(products.map(product => [product.name.toLowerCase(), product.slug]))
  const counts = new Map<string, { slug: string; views: number; whatsapp: number }>()
  for (const event of events) {
    if (event.page_path.startsWith('/ak-owner-portal') || !['product_view', 'whatsapp_click'].includes(event.event_name)) continue
    const subject = typeof event.metadata?.subject === 'string' ? event.metadata.subject.toLowerCase() : ''
    const slug = event.product_slug || (event.event_name === 'whatsapp_click' ? byName.get(subject) : undefined)
    if (!slug) continue
    const row = counts.get(slug) || { slug, views: 0, whatsapp: 0 }
    if (event.event_name === 'product_view') row.views++
    if (event.event_name === 'whatsapp_click') row.whatsapp++
    counts.set(slug, row)
  }
  return [...counts.values()].filter(row => products.some(product => product.slug === row.slug)).sort((a, b) => b.views - a.views || b.whatsapp - a.whatsapp).slice(0, 5)
}
export function percentageChange(current: number | null, previous: number | null) {
  return current === null || previous === null || previous === 0 ? null : Math.round((current - previous) / previous * 100)
}
