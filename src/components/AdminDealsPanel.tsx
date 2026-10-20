import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Gift, Pause, Pencil, Play, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { useDeals } from '../context/DealsContext'
import { collectionIsLive, comboIsAvailable, dealPrice, previewDeals, type ComboDeal, type DealCollection } from '../lib/deals'
import '../deals.css'

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const localTime = (value: string) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

export function AdminDealsPanel() {
  const { data, enabled, saveData, ready, saving, isLoading, error: databaseError, reload, localDraft, version } = useDeals()
  const { products } = useCatalog()
  const [tab, setTab] = useState<'collections' | 'combos'>('collections')
  const [collection, setCollection] = useState<DealCollection | null>(null)
  const [combo, setCombo] = useState<ComboDeal | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [editorVersion, setEditorVersion] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const toggleAllDeals = async () => {
    const result = await saveData({ ...data, enabled: !enabled })
    if (!result.success) { setNotice(result.message || 'Could not publish. Please try again.'); return }
    setNotice(enabled ? 'Combo deals turned off for all visitors. Packages and individual pause settings are kept.' : 'Combo deals turned on for all visitors. Individually paused deals remain paused.')
  }
  const importDeals = async () => {
    const result = await saveData(localDraft || previewDeals)
    setNotice(result.success ? 'Existing deals published to the shared store. Changes now apply on every device.' : result.message || 'Could not publish deals.')
  }
  const openCollection = (value?: DealCollection) => {
    setIsNew(!value); setError(''); setEditorVersion(version)
    setCollection(value ? { ...value } : { id: '', name: '', eyebrow: '', description: '', image: '/assets/deals/student-life-v1.jpg', theme: 'student', active: false, featured: false, order: data.collections.length + 1, startsAt: '', endsAt: '' })
  }
  const openCombo = (value?: ComboDeal) => {
    setIsNew(!value); setError(''); setEditorVersion(version); setProductQuery(''); setSelectedProduct('')
    setCombo(value ? { ...value, priceIsEstimate: value.priceIsEstimate ?? false, items: value.items.map(item => ({ ...item })) } : { id: '', collectionId: data.collections[0]?.id || '', name: '', description: '', items: [], price: null, priceIsEstimate: false, active: false })
  }
  const saveCollection = async (event: FormEvent) => {
    event.preventDefault()
    if (!collection) return
    const next = { ...collection, name: collection.name.trim(), id: collection.id || slugify(collection.name) }
    if (!next.id || !next.name) { setError('Enter a collection name.'); return }
    if (isNew && data.collections.some(item => item.id === next.id)) { setError('A collection with this name already exists.'); return }
    if ((next.startsAt && !Number.isFinite(Date.parse(next.startsAt))) || (next.endsAt && !Number.isFinite(Date.parse(next.endsAt))) || (next.startsAt && next.endsAt && Date.parse(next.endsAt) <= Date.parse(next.startsAt))) { setError('The end date must be after the start date.'); return }
    if (!next.image.startsWith('/') && !/^https?:\/\//.test(next.image)) { setError('Use an https image URL or a local /assets/ path.'); return }
    const result = await saveData({ ...data, collections: isNew ? [...data.collections, next] : data.collections.map(item => item.id === next.id ? next : item) }, editorVersion ?? undefined)
    if (!result.success) { setError(result.message || 'Could not publish this collection.'); return }
    setCollection(null); setNotice('Collection saved to the shared store. Active deals appear for all visitors.')
  }
  const saveCombo = async (event: FormEvent) => {
    event.preventDefault()
    if (!combo) return
    const next = { ...combo, name: combo.name.trim(), id: combo.id || slugify(combo.name) }
    if (!next.id || !next.name || !data.collections.some(item => item.id === next.collectionId)) { setError('Enter a name and choose a collection.'); return }
    if (isNew && data.combos.some(item => item.id === next.id)) { setError('A package with this name already exists.'); return }
    if (!comboIsAvailable({ ...next, active: true }, products)) { setError('Choose at least two available products, with a whole-number quantity of 1 or more for each.'); return }
    const result = await saveData({ ...data, combos: isNew ? [...data.combos, next] : data.combos.map(item => item.id === next.id ? next : item) }, editorVersion ?? undefined)
    if (!result.success) { setError(result.message || 'Could not publish this package.'); return }
    setCombo(null); setNotice('Package saved to the shared store. Its price and contents are updated for all visitors.')
  }
  const toggleCollection = async (item: DealCollection) => {
    const next = { ...data, collections: data.collections.map(collection => collection.id === item.id ? { ...collection, active: !item.active } : collection) }
    const result = await saveData(next)
    if (!result.success) { setNotice(result.message || 'Could not publish. Please try again.'); return }
    setNotice(item.active ? `${item.name} paused. Its banner and all its packages are hidden from all visitors.` : `${item.name} resumed. Available packages will appear during its scheduled dates.`)
  }
  const toggleCombo = async (item: ComboDeal) => {
    if (!item.active && !comboIsAvailable({ ...item, active: true }, products)) { setNotice('Fix the unavailable products or quantities before resuming this package.'); return }
    const next = { ...data, combos: data.combos.map(combo => combo.id === item.id ? { ...combo, active: !item.active } : combo) }
    const result = await saveData(next)
    if (!result.success) { setNotice(result.message || 'Could not publish. Please try again.'); return }
    setNotice(item.active ? `${item.name} paused and hidden from all visitors. Other packages stay as they are.` : `${item.name} resumed. It appears when its collection is active and within its scheduled dates.`)
  }
  const choices = products.filter(product => !combo?.items.some(item => item.slug === product.slug) && `${product.name} ${product.brand}`.toLowerCase().includes(productQuery.toLowerCase()))
  return <section className="admin-deals-panel">
    <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Better together</p><h1>Combo deals</h1><p>Create collections, then build fixed packages from existing products.</p></div><Link to="/deals" target="_blank" className="button button-light">Preview deals <ArrowUpRight size={17}/></Link></div>
    <div className="deals-admin-preview"><Gift size={21}/><div><strong>{ready ? 'Shared store publishing' : isLoading ? 'Connecting to your store…' : 'Store connection unavailable'}</strong><p>{ready ? 'Saved changes apply to every visitor and device. Only approved owners and administrators can publish.' : databaseError || 'Loading the latest deals from Supabase.'}</p>{!ready && !isLoading && <button type="button" className="button button-light" onClick={() => void reload()}>Retry connection</button>}</div></div>
    {ready && !data.collections.length && !data.combos.length && <div className="deals-admin-preview"><div><strong>Bring your existing deals online</strong><p>{localDraft ? 'Publish the saved deals from this browser, including their prices and pause settings.' : 'Start with the Student and Odogwu packages. Their prices remain clearly labelled estimates until you confirm them.'}</p><button type="button" className="button button-dark" disabled={saving} onClick={importDeals}>{saving ? 'Publishing…' : 'Publish existing deals'}</button></div></div>}
    {notice && <p className="owner-notice" role="status">{notice}</p>}
    <fieldset className="deals-publishing-controls" disabled={saving || !ready}>
    <div className="deals-master-control"><div><strong>Combo deals are {enabled ? 'on' : 'off'}</strong><p>{enabled ? 'Turn off to hide all deals from the homepage and customer navigation. Your packages stay saved.' : 'Hidden from the homepage, customer sidebar, footer and direct deal pages. Turn back on whenever you are ready.'}</p></div><button type="button" role="switch" aria-checked={enabled} aria-label="Show combo deals on website" className={`deals-master-switch ${enabled ? 'is-on' : ''}`} onClick={toggleAllDeals}><span/><strong>{enabled ? 'On' : 'Off'}</strong></button></div>

    <div className="deals-admin-tabs"><button className={tab === 'collections' ? 'active' : ''} onClick={() => setTab('collections')}>Deal collections ({data.collections.length})</button><button className={tab === 'combos' ? 'active' : ''} onClick={() => setTab('combos')}>Combo packages ({data.combos.length})</button></div>
    <div className="deals-admin-heading"><h2>{tab === 'collections' ? 'Student, Odogwu, festive…' : 'What goes in the package?'}</h2><button className="button button-dark" onClick={() => tab === 'collections' ? openCollection() : openCombo()} disabled={tab === 'combos' && !data.collections.length}><Plus size={17}/> {tab === 'collections' ? 'Add collection' : 'Add combo'}</button></div>
    {tab === 'collections' ? <div className="deals-admin-list">{[...data.collections].sort((a, b) => a.order - b.order).map(item => <article key={item.id}><img src={item.image} alt=""/><div><h3>{item.name}</h3><p>{data.combos.filter(combo => combo.collectionId === item.id).length} packages · Order {item.order}{item.featured ? ' · Homepage featured' : ''}</p><small>{!item.active ? 'Paused — hidden with all its packages' : !collectionIsLive(item) ? 'Outside scheduled dates' : 'Active — visible when it has an available package'}</small></div><div className="deals-admin-row-actions"><button className="button button-light" aria-label={`${item.active ? 'Pause' : 'Resume'} ${item.name}`} onClick={() => toggleCollection(item)}>{item.active ? <Pause size={15}/> : <Play size={15}/>} {item.active ? 'Pause' : 'Resume'}</button><button className="button button-light" aria-label={`Edit ${item.name}`} onClick={() => openCollection(item)}><Pencil size={15}/> Edit</button></div></article>)}</div> : <div className="deals-admin-list">{data.combos.map(item => <article key={item.id}><div className="deals-admin-icon"><Gift size={25}/></div><div><h3>{item.name}</h3><p>{data.collections.find(collection => collection.id === item.collectionId)?.name} · {item.items.length} products · {item.price === null ? 'Price on enquiry' : dealPrice(item.price)}</p><small>{!item.active ? 'Paused — hidden from customers' : !comboIsAvailable(item, products) ? 'Unavailable — check linked products' : 'Active — follows collection visibility and dates'}</small></div><div className="deals-admin-row-actions"><button className="button button-light" aria-label={`${item.active ? 'Pause' : 'Resume'} ${item.name}`} onClick={() => toggleCombo(item)}>{item.active ? <Pause size={15}/> : <Play size={15}/>} {item.active ? 'Pause' : 'Resume'}</button><button className="button button-light" aria-label={`Edit ${item.name}`} onClick={() => openCombo(item)}><Pencil size={15}/> Edit</button></div></article>)}</div>}
    </fieldset>
    {collection && <div className="owner-modal" role="dialog" aria-modal="true" aria-label="Deal collection editor"><form className="owner-editor" onSubmit={saveCollection}><fieldset className="deals-publishing-controls" disabled={saving}><div className="owner-editor-header"><div><p className="eyebrow">Shared store</p><h2>{isNew ? 'Add collection' : 'Edit collection'}</h2></div><button type="button" aria-label="Close editor" onClick={() => setCollection(null)}><X/></button></div><div className="owner-form-grid">
      <label>Collection name<input required maxLength={80} value={collection.name} onChange={event => setCollection({ ...collection, name: event.target.value })}/></label>
      <label>Short headline<input required maxLength={100} value={collection.eyebrow} onChange={event => setCollection({ ...collection, eyebrow: event.target.value })}/></label>
      <label className="owner-wide">Description<textarea required rows={3} maxLength={500} value={collection.description} onChange={event => setCollection({ ...collection, description: event.target.value })}/></label>
      <label className="owner-wide">Cover image URL<input required value={collection.image} onChange={event => setCollection({ ...collection, image: event.target.value })}/><small>Use an image URL or an existing /assets/ image. Images are illustrative; package contents are listed separately.</small></label>
      <label>Visual style<select value={collection.theme} onChange={event => setCollection({ ...collection, theme: event.target.value as DealCollection['theme'] })}><option value="student">Light / student</option><option value="odogwu">Dark / premium</option><option value="seasonal">Dark / seasonal</option></select></label>
      <label>Display order<input type="number" min={-2147483648} max={2147483647} step={1} required value={collection.order} onChange={event => setCollection({ ...collection, order: Number(event.target.value) })}/><small>Lower numbers appear first. Up to three featured collections appear on the homepage.</small></label>
      <label>Starts — optional<input type="datetime-local" value={localTime(collection.startsAt)} onChange={event => setCollection({ ...collection, startsAt: event.target.value ? new Date(event.target.value).toISOString() : '' })}/></label>
      <label>Ends — optional<input type="datetime-local" value={localTime(collection.endsAt)} onChange={event => setCollection({ ...collection, endsAt: event.target.value ? new Date(event.target.value).toISOString() : '' })}/><small>Uses this device’s timezone. Expired collections are hidden automatically.</small></label>
      <label className="owner-check"><input type="checkbox" checked={collection.active} onChange={event => setCollection({ ...collection, active: event.target.checked })}/> Enable collection on website</label>
      <label className="owner-check"><input type="checkbox" checked={collection.featured} onChange={event => setCollection({ ...collection, featured: event.target.checked })}/> Feature on homepage</label>
    </div><img className="owner-image-preview" src={collection.image} alt="Collection preview"/>{error && <p className="owner-error" role="alert">{error}</p>}<div className="owner-editor-actions"><button type="button" className="button button-light" onClick={() => setCollection(null)}>Cancel</button><button className="button button-dark" disabled={!ready}><Check size={16}/> {saving ? 'Publishing…' : 'Save changes'}</button></div></fieldset></form></div>}
    {combo && <div className="owner-modal" role="dialog" aria-modal="true" aria-label="Combo package editor"><form className="owner-editor" onSubmit={saveCombo}><fieldset className="deals-publishing-controls" disabled={saving}><div className="owner-editor-header"><div><p className="eyebrow">Shared store</p><h2>{isNew ? 'Add combo package' : 'Edit combo package'}</h2></div><button type="button" aria-label="Close editor" onClick={() => setCombo(null)}><X/></button></div><div className="owner-form-grid">
      <label>Package name<input required maxLength={100} value={combo.name} onChange={event => setCombo({ ...combo, name: event.target.value })}/></label><label>Deal collection<select required value={combo.collectionId} onChange={event => setCombo({ ...combo, collectionId: event.target.value })}>{data.collections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="owner-wide">Description<textarea required rows={3} maxLength={500} value={combo.description} onChange={event => setCombo({ ...combo, description: event.target.value })}/></label>
      <label>Bundle price (NGN) — optional<input type="number" min={0} max={9999999999} step={1} value={combo.price ?? ''} onChange={event => setCombo({ ...combo, price: event.target.value === '' ? null : Number(event.target.value) })}/><small>Price for the complete package. Keep the estimated label until the owner confirms the offer. Leave blank for enquiry.</small></label><label className="owner-check"><input type="checkbox" checked={Boolean(combo.priceIsEstimate)} onChange={event => setCombo({ ...combo, priceIsEstimate: event.target.checked })}/> Label price as an estimate</label><label className="owner-check"><input type="checkbox" checked={combo.active} onChange={event => setCombo({ ...combo, active: event.target.checked })}/> Enable package on website</label>
    </div><div className="deals-product-picker"><h3>Products in this package</h3><label>Find an existing product<input value={productQuery} onChange={event => { setProductQuery(event.target.value); setSelectedProduct('') }} placeholder="Search by name or brand"/></label><div className="deals-picker-row"><select aria-label="Choose a product for this combo" value={selectedProduct} onChange={event => setSelectedProduct(event.target.value)}><option value="">Choose a product</option>{choices.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select><button type="button" className="button button-dark" disabled={!selectedProduct} onClick={() => { setCombo({ ...combo, items: [...combo.items, { slug: selectedProduct, quantity: 1 }] }); setSelectedProduct(''); setProductQuery('') }}><Plus size={16}/> Add</button></div><small>Choose at least two distinct products. The public combo uses their existing catalogue images and names.</small>
      {combo.items.map(item => { const product = products.find(product => product.slug === item.slug); return <div className="deals-selected-product" key={item.slug}>{product && <img src={product.image} alt=""/>}<strong>{product?.name || `Unavailable product: ${item.slug}`}</strong><label>Quantity<input aria-label={`Quantity for ${product?.name || item.slug}`} type="number" min={1} max={99} step={1} required value={item.quantity} onChange={event => setCombo({ ...combo, items: combo.items.map(line => line.slug === item.slug ? { ...line, quantity: Number(event.target.value) } : line) })}/></label><button type="button" aria-label={`Remove ${product?.name || item.slug} from combo`} onClick={() => setCombo({ ...combo, items: combo.items.filter(line => line.slug !== item.slug) })}><X size={17}/></button></div> })}
    </div>{error && <p className="owner-error" role="alert">{error}</p>}<div className="owner-editor-actions"><button type="button" className="button button-light" onClick={() => setCombo(null)}>Cancel</button><button className="button button-dark" disabled={!ready}><Check size={16}/> {saving ? 'Publishing…' : 'Save changes'}</button></div></fieldset></form></div>}
  </section>
}
