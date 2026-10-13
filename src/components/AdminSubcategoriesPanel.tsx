import { useState } from 'react'
import { Check, FolderPlus, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { canonicalCategory, type SubcategoryRow } from '../data/subcategories'
import { supabase } from '../lib/supabase'

type Category = { id: string; name: string }
type Product = { category_id: string; subcategory_id?: string | null }
const categoryName = (item: Category) => canonicalCategory(item.id) === 'cooling' ? 'Cooling' : canonicalCategory(item.id) === 'entertainment' ? 'Entertainment' : item.name
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function AdminSubcategoriesPanel({ categories, products, rows, enabled, onSaved }: { categories: Category[]; products: Product[]; rows: SubcategoryRow[]; enabled: boolean; onSaved: () => Promise<void> }) {
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<SubcategoryRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const [deleting, setDeleting] = useState(false)
  const options = categories.filter((item, index, all) => all.findIndex(other => canonicalCategory(other.id) === canonicalCategory(item.id)) === index)
  const count = (row: SubcategoryRow) => products.filter(item => canonicalCategory(item.category_id) === canonicalCategory(row.category_id) && item.subcategory_id === row.id).length
  const remove = async (row: SubcategoryRow) => {
    if (!supabase || deleting || count(row) || !window.confirm(`Delete "${row.name}"? This removes its product filter from the website.`)) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('product_subcategories').delete().eq('category_id', row.category_id).eq('id', row.id)
      if (error) throw error
      setNotice('Subcategory deleted.'); await onSaved()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not delete subcategory. Reassign its products first.') }
    finally { setDeleting(false) }
  }
  return <>
    <div className="owner-section-heading"><div><p className="eyebrow text-gold-dark">Catalogue structure</p><h2>Subcategories</h2><p>Choose a main category, then create the product groups underneath it.</p></div><button className="button button-dark" disabled={!enabled || !options.length} onClick={() => setCreating(true)}><FolderPlus size={17}/> Add subcategory</button></div>
    {!enabled && <div className="owner-error">Apply migration 007_managed_subcategories.sql to enable saved subcategories.</div>}
    {notice && <div className="owner-notice" role="status">{notice}</div>}
    <div className="owner-form-grid"><label>Main category<select value={filter} onChange={event => setFilter(event.target.value)}><option value="">All categories</option>{options.map(item => <option key={item.id} value={canonicalCategory(item.id)}>{categoryName(item)}</option>)}</select></label></div>
    <div className="owner-product-list">{rows.filter(row => !filter || canonicalCategory(row.category_id) === filter).map(row => <article className="owner-subcategory-row" key={`${row.category_id}/${row.id}`}><div><strong>{row.name}</strong><p>{categoryName(categories.find(item => item.id === row.category_id) || { id: row.category_id, name: row.category_id })} · {count(row)} assigned products</p></div><div className="owner-row-actions"><button type="button" aria-label={`Edit ${row.name}`} onClick={() => setEditing(row)}><Pencil size={18}/></button><button type="button" aria-label={`Delete ${row.name}`} title={count(row) ? 'Move its products to another subcategory before deleting.' : 'Delete subcategory'} disabled={deleting || count(row) > 0} onClick={() => void remove(row)}><Trash2 size={18}/></button></div></article>)}</div>
    {enabled && !rows.some(row => !filter || canonicalCategory(row.category_id) === filter) && <p>No subcategories yet. Add one to start organising products.</p>}
    {(creating || editing) && <SubcategoryEditor row={editing} initialCategory={options.find(item => canonicalCategory(item.id) === filter)?.id || ''} categories={options} rows={rows} onClose={() => { setCreating(false); setEditing(null) }} onSaved={async () => { setCreating(false); setEditing(null); setNotice('Subcategory saved. It is now available in the product editor and website filters.'); await onSaved() }}/ >}
  </>
}

function SubcategoryEditor({ row, initialCategory, categories, rows, onClose, onSaved }: { row: SubcategoryRow | null; initialCategory: string; categories: Category[]; rows: SubcategoryRow[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [category, setCategory] = useState(row?.category_id || initialCategory)
  const [name, setName] = useState(row?.name || '')
  const [order, setOrder] = useState(row?.sort_order ?? 100)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || saving) return
    const id = row?.id || slugify(name)
    if (!category || !name.trim() || !id) { setError('Choose a main category and enter a subcategory name.'); return }
    if (rows.some(item => canonicalCategory(item.category_id) === canonicalCategory(category) && item !== row && (item.id === id || item.name.toLowerCase() === name.trim().toLowerCase()))) { setError('This subcategory already exists under the selected category.'); return }
    setSaving(true); setError('')
    try {
      const result = row
        ? await supabase.from('product_subcategories').update({ name: name.trim(), sort_order: order }).eq('category_id', row.category_id).eq('id', row.id).select('id').single()
        : await supabase.from('product_subcategories').insert({ category_id: category, id, name: name.trim(), sort_order: order, filter_ids: [id] }).select('id').single()
      if (result.error) throw result.error
      await onSaved()
    } catch (error) { setError(typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Could not save subcategory.') }
    finally { setSaving(false) }
  }
  return <div className="owner-modal" role="dialog" aria-modal="true" aria-label="Subcategory editor"><form className="owner-editor" onSubmit={save}><div className="owner-editor-header"><div><p className="eyebrow text-gold-dark">Catalogue structure</p><h2>{row ? 'Edit subcategory' : 'Add subcategory'}</h2></div><button type="button" onClick={onClose} aria-label="Close editor"><X/></button></div><div className="owner-form-grid"><label>Main category<select required disabled={Boolean(row) || saving} value={category} onChange={event => setCategory(event.target.value)}><option value="">Choose main category first</option>{categories.map(item => <option key={item.id} value={item.id}>{categoryName(item)}</option>)}</select></label><label>Subcategory name<input required disabled={!category || saving} maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Coffee makers"/></label><label>Display order<input type="number" min="0" max="9999" required value={order} onChange={event => setOrder(Number(event.target.value))}/><small>Lower numbers appear first.</small></label></div><p>Products stay assigned when you rename a subcategory. To move a group, create it under the new category and reassign its products.</p>{error && <div className="owner-error" role="alert">{error}</div>}<div className="owner-editor-actions"><button type="button" className="button button-light" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={saving || !category}>{saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Save subcategory</button></div></form></div>
}
