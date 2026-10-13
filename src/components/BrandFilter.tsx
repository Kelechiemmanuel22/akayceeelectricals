import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export function BrandFilter({ value, brands, onChange }: { value: string; brands: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()
  const options = [{ value: 'all', label: 'All brands' }, ...brands.map(name => ({ value: name, label: name }))]
  const selected = Math.max(0, options.findIndex(option => option.value === value))
  const [active, setActive] = useState(selected)

  useEffect(() => {
    if (open) optionsRef.current[active]?.focus()
  }, [open, active])
  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  return <div className="collection-brand-select" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <span id={`${id}-label`}>Filter by brand</span>
    <div className="brand-filter-control">
      <button ref={trigger} type="button" className="brand-filter-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-options` : undefined} aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => { setActive(selected); setOpen(current => !current) }}
        onKeyDown={event => {
          if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setActive(selected); setOpen(true) }
        }}>
        <span id={`${id}-value`}>{options[selected].label}</span><ChevronDown size={16} className={open ? 'brand-filter-chevron open' : 'brand-filter-chevron'}/>
      </button>
      {open && <div className="brand-filter-menu" id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
          if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => (index + 1) % options.length) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => (index - 1 + options.length) % options.length) }
          if (event.key === 'Home') { event.preventDefault(); setActive(0) }
          if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1) }
        }}>
        {options.map((option, index) => <button key={option.value} ref={element => { optionsRef.current[index] = element }} type="button" role="option" aria-selected={value === option.value} tabIndex={active === index ? 0 : -1}
          onFocus={() => setActive(index)} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus() }}>
          <span>{option.label}</span>{value === option.value && <Check size={15}/>}</button>)}
      </div>}
    </div>
  </div>
}
