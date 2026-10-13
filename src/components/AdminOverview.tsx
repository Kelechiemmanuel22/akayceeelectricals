import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, CirclePlus, FileText, FolderTree, Image, Layers, Mail, Package, RefreshCw, Tags, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { activitySeries, dayKey, percentageChange, rankProductActivity, type ActivityPoint, type AdminEvent } from '../lib/adminInsights'
import { canonicalCategory } from '../data/subcategories'
import { WhatsAppIcon } from './SocialIcons'
import type { AdminSection } from './AdminWorkspace'

export type OverviewProduct = { id: string; slug: string; name: string; category_id: string; image_url: string; active: boolean; price?: number | null; price_is_estimate?: boolean }
export type OverviewInsights = { events: AdminEvent[]; views: number | null; previousViews: number | null; whatsapp: number | null; previousWhatsapp: number | null; subscribers: number | null; loading: boolean; error: string; truncated: boolean }
const emptyInsights: OverviewInsights = { events: [], views: null, previousViews: null, whatsapp: null, previousWhatsapp: null, subscribers: null, loading: true, error: '', truncated: false }

function useOverviewInsights(days: number, enabled: boolean) {
  const [data, setData] = useState<OverviewInsights>(emptyInsights)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!enabled || !supabase) { setData({ ...emptyInsights, loading: false }); return }
    const client = supabase
    let active = true
    setData({ ...emptyInsights })
    const load = async () => {
      const now = new Date()
      const start = new Date(`${dayKey(now)}T00:00:00Z`)
      start.setUTCDate(start.getUTCDate() - days + 1)
      const previous = new Date(start.getTime() - days * 86400000)
      const count = async (event: string, from: Date, to: Date) => {
        const result = await client.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_name', event).not('page_path', 'like', '/ak-owner-portal%').gte('created_at', from.toISOString()).lt('created_at', to.toISOString())
        if (result.error) throw result.error
        return result.count ?? 0
      }
      try {
        const [views, previousViews, whatsapp, previousWhatsapp, subscriberResult] = await Promise.all([
          count('page_view', start, now), count('page_view', previous, start), count('whatsapp_click', start, now), count('whatsapp_click', previous, start),
          client.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
        ])
        if (subscriberResult.error) throw subscriberResult.error
        const events: AdminEvent[] = []
        let truncated = false
        for (let offset = 0; offset < 20000; offset += 1000) {
          if (!active) return
          const result = await client.from('analytics_events').select('id,event_name,page_path,product_slug,metadata,created_at').not('page_path', 'like', '/ak-owner-portal%').gte('created_at', start.toISOString()).lt('created_at', now.toISOString()).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 999)
          if (result.error) throw result.error
          events.push(...(result.data || []) as AdminEvent[])
          if ((result.data?.length || 0) < 1000) break
          if (offset === 19000) truncated = true
        }
        if (active) setData({ events, views, previousViews, whatsapp, previousWhatsapp, subscribers: subscriberResult.count ?? 0, loading: false, error: '', truncated })
      } catch { if (active) setData({ ...emptyInsights, loading: false, error: 'We couldn’t load analytics. Your catalogue is still available. Check your connection and try again.' }) }
    }
    void load()
    return () => { active = false }
  }, [days, enabled, revision])
  return { data, retry: useCallback(() => setRevision(value => value + 1), []) }
}

export function AdminOverview({ products, categories, brandCount, subcategoryCount, isOwner, busy, onNavigate, onAddProduct, onEditProduct }: { products: OverviewProduct[]; categories: { id: string; name: string; active?: boolean }[]; brandCount: number; subcategoryCount: number; isOwner: boolean; busy: boolean; onNavigate: (section: AdminSection) => void; onAddProduct: () => void; onEditProduct: (id: string) => void }) {
  const [days, setDays] = useState(30)
  const { data, retry } = useOverviewInsights(days, isOwner)
  return <AdminOverviewView products={products} categories={categories} brandCount={brandCount} subcategoryCount={subcategoryCount} isOwner={isOwner} busy={busy} insights={data} days={days} onDaysChange={setDays} onRetry={retry} onNavigate={onNavigate} onAddProduct={onAddProduct} onEditProduct={onEditProduct}/>
}

// Kept separate from authenticated data fetching for focused layout/accessibility tests.
export function AdminOverviewView({ products, categories, brandCount, subcategoryCount, isOwner, busy, insights, days, onDaysChange, onRetry, onNavigate, onAddProduct, onEditProduct }: { products: OverviewProduct[]; categories: { id: string; name: string; active?: boolean }[]; brandCount: number; subcategoryCount: number; isOwner: boolean; busy: boolean; insights: OverviewInsights; days: number; onDaysChange: (days: number) => void; onRetry: () => void; onNavigate: (section: AdminSection) => void; onAddProduct: () => void; onEditProduct: (id: string) => void }) {
  const published = products.filter(product => product.active).length
  const categoryCount = new Set(categories.filter(item => item.active !== false).map(item => canonicalCategory(item.id))).size
  const rows = useMemo(() => rankProductActivity(insights.events, products), [insights.events, products])
  const points = useMemo(() => activitySeries(insights.events, days), [insights.events, days])
  const label = (id: string) => canonicalCategory(id) === 'cooling' ? 'Cooling' : canonicalCategory(id) === 'entertainment' ? 'Entertainment' : categories.find(item => item.id === id)?.name || id.replace(/-/g, ' ')
  const missingImages = products.filter(product => !product.image_url.trim()).length
  const pricesToReview = products.filter(product => product.price == null || product.price_is_estimate).length
  const hidden = products.length - published
  const available = !insights.loading && !insights.error
  const quickActions = [{ label: 'Add a product', icon: CirclePlus, action: onAddProduct }, { label: 'Create a subcategory', icon: FolderTree, action: () => onNavigate('subcategories') }, ...(isOwner ? [{ label: 'Create a newsletter', icon: Mail, action: () => onNavigate('newsletter') }] : []), { label: 'Manage brands', icon: Tags, action: () => onNavigate('brands') }]
  return <div className="admin-overview">
    <div className="admin-page-heading"><div><h1>Your store, at a glance.</h1><p>Manage your catalogue. Understand your customers.</p></div><div className="admin-page-actions"><a className="admin-button admin-button-outline" href="/" target="_blank" rel="noreferrer"><ArrowUpRight size={17}/> View website</a><button className="admin-button admin-button-primary" onClick={onAddProduct}><CirclePlus size={17}/> Add product</button>{isOwner && <label className="admin-date-filter"><span className="sr-only">Analytics date range</span><select value={days} onChange={event => onDaysChange(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label>}</div></div>
    {insights.error && isOwner && <div className="admin-data-error" role="alert"><span>{insights.error}</span><button type="button" onClick={onRetry}><RefreshCw size={15}/> Retry</button></div>}
    <div className="admin-summary-grid">
      {isOwner ? <><SummaryCard icon={<BarChart3/>} label="Website visits" value={available ? insights.views : null} change={percentageChange(insights.views, insights.previousViews)} note="Tracked page views"/><SummaryCard icon={<WhatsAppIcon/>} label="WhatsApp clicks" value={available ? insights.whatsapp : null} change={percentageChange(insights.whatsapp, insights.previousWhatsapp)} note="Enquiries started, not sales" green/></> : <><SummaryCard icon={<Layers/>} label="Active categories" value={busy ? null : categoryCount} note="Your catalogue departments"/><SummaryCard icon={<FolderTree/>} label="Subcategories" value={busy ? null : subcategoryCount} note="Product groups you manage"/></>}
      <SummaryCard icon={<Package/>} label="Published products" value={busy ? null : published} note={`Across ${categoryCount} categories`}/>
      {isOwner ? <SummaryCard icon={<Users/>} label="Newsletter subscribers" value={available ? insights.subscribers : null} note="Confirmed subscriptions, all time"/> : <SummaryCard icon={<Tags/>} label="Brands" value={busy ? null : brandCount} note="Brands in your catalogue"/>}
    </div>
    <div className={`admin-overview-grid ${!isOwner ? 'admin-overview-catalogue-only' : ''}`}>
      {isOwner && <section className="admin-panel admin-interest"><div className="admin-panel-heading"><div><h2>Customer interest</h2><p>Website visits and WhatsApp enquiries</p></div><div className="admin-chart-legend"><span><i/> Website visits</span><span><i/> WhatsApp clicks</span></div></div>{insights.loading ? <div className="admin-chart-placeholder" role="status">Loading customer activity…</div> : insights.error ? <div className="admin-chart-placeholder">Activity is temporarily unavailable.</div> : <InterestChart points={points}/>}</section>}
      <section className="admin-panel admin-quick-actions"><h2>Quick actions</h2><div>{quickActions.map(item => <button type="button" key={item.label} onClick={item.action}><item.icon size={22}/><span>{item.label}</span><ChevronRight size={17}/></button>)}</div></section>
      <section className="admin-panel admin-popular-products"><div className="admin-panel-heading"><h2>{isOwner ? 'Most viewed products' : 'Your latest products'}</h2><button type="button" className="admin-text-button" onClick={() => onNavigate('products')}>View all <ChevronRight size={14}/></button></div><div className="admin-table-scroll"><table><thead><tr><th>Product</th><th>Category</th>{isOwner && <><th>Views</th><th>WhatsApp clicks</th></>}</tr></thead><tbody>{(isOwner ? rows : products.slice(0, 5).map(product => ({ slug: product.slug, views: 0, whatsapp: 0 }))).map(row => { const product = products.find(item => item.slug === row.slug)!; return <tr key={row.slug}><td><button className="admin-product-link" type="button" onClick={() => onEditProduct(product.id)}>{product.image_url ? <img src={product.image_url} alt="" loading="lazy"/> : <Image size={24}/>}<span>{product.name}</span></button></td><td>{label(product.category_id)}</td>{isOwner && <><td>{row.views.toLocaleString()}</td><td>{row.whatsapp.toLocaleString()}</td></>}</tr> })}</tbody></table></div>{isOwner && !rows.length && <div className="admin-inline-empty">{insights.loading ? 'Loading product activity…' : insights.error ? 'Product analytics are temporarily unavailable.' : 'Your most viewed products will appear as customers explore the website.'}</div>}{!isOwner && !products.length && <div className="admin-inline-empty">Add your first product to get started.</div>}</section>
      <section className="admin-panel admin-catalogue-checklist"><h2>Catalogue checklist</h2><div>{[{ icon: Image, label: `${missingImages} ${missingImages === 1 ? 'product needs' : 'products need'} an image`, count: missingImages, target: 'media' }, { icon: Tags, label: `${pricesToReview} ${pricesToReview === 1 ? 'price needs' : 'prices need'} reviewing`, count: pricesToReview, target: 'products' }, { icon: FileText, label: `${hidden} hidden ${hidden === 1 ? 'product' : 'products'} to review`, count: hidden, target: 'products' }].map(item => <button key={item.target + item.label} type="button" onClick={() => onNavigate(item.target as AdminSection)}><item.icon size={20}/><span>{busy ? 'Checking catalogue…' : item.label}</span><ChevronRight size={16}/></button>)}</div><button type="button" className="admin-text-button" onClick={() => onNavigate('products')}>Review catalogue <ArrowUpRight size={16}/></button></section>
    </div>
    {isOwner && <p className="admin-insights-note">Anonymous website activity · Daily chart dates in UTC · No payment or sales tracking.{insights.truncated && ' Chart and rankings show the latest 20,000 events; headline counts cover the full period.'}</p>}
  </div>
}

function SummaryCard({ icon, label, value, note, change, green }: { icon: React.ReactNode; label: string; value: number | null; note: string; change?: number | null; green?: boolean }) {
  return <article className="admin-summary-card"><span className={`admin-summary-icon ${green ? 'is-green' : ''}`}>{icon}</span><div><h2>{label}</h2><strong>{value === null ? '—' : value.toLocaleString()}</strong>{change != null ? <p className={change >= 0 ? 'admin-trend up' : 'admin-trend down'}>{change >= 0 ? <ArrowUpRight size={15}/> : <ArrowDownRight size={15}/>}<b>{change > 0 ? '+' : ''}{change}%</b><span>vs previous period</span></p> : <p>{note}</p>}</div></article>
}

function InterestChart({ points }: { points: ActivityPoint[] }) {
  const peak = Math.max(1, ...points.flatMap(point => [point.views, point.whatsapp]))
  const maximum = Math.max(4, Math.ceil(peak / 4) * 4)
  const x = (index: number) => 48 + index / Math.max(1, points.length - 1) * 710
  const y = (value: number) => 214 - value / maximum * 180
  const line = (key: 'views' | 'whatsapp') => points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point[key])}`).join(' ')
  const active = points.some(point => point.views || point.whatsapp)
  return <div className="admin-interest-chart"><svg viewBox="0 0 786 260" role="img" aria-label="Daily website visits and WhatsApp clicks"><title>Customer interest</title><desc>{active ? `${points.reduce((sum, point) => sum + point.views, 0)} tracked page views and ${points.reduce((sum, point) => sum + point.whatsapp, 0)} WhatsApp clicks across ${points.length} days.` : 'No tracked activity in the selected period.'}</desc>{[0, 1, 2, 3, 4].map(index => <g key={index}><line x1="48" x2="758" y1={y(maximum * index / 4)} y2={y(maximum * index / 4)} stroke="#e9eef6"/><text x="37" y={y(maximum * index / 4) + 4} textAnchor="end">{maximum * index / 4}</text></g>)}{points.filter((_, index) => index % Math.ceil(points.length / 6) === 0 || index === points.length - 1).map(point => { const index = points.indexOf(point); return <g key={point.date}><line x1={x(index)} x2={x(index)} y1="34" y2="214" stroke="#f0f3f9"/><text x={x(index)} y="246" textAnchor="middle">{new Date(point.date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</text></g>})}{active && <><path d={line('views')} fill="none" stroke="#0764ed" strokeWidth="2.5"/><path d={line('whatsapp')} fill="none" stroke="#f99408" strokeWidth="2.5"/>{points.length <= 31 && points.map((point, index) => <g key={point.date}><circle cx={x(index)} cy={y(point.views)} r="3" fill="#0764ed"/><circle cx={x(index)} cy={y(point.whatsapp)} r="3" fill="#f99408"/></g>)}</>}</svg>{!active && <div className="admin-chart-empty">No tracked activity yet.<small>Customer visits and enquiries will appear here.</small></div>}</div>
}
