import { ArrowDownWideNarrow, Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export type CollectionSortValue = 'featured' | 'az' | 'za'
const choices: {value:CollectionSortValue; label:string; detail:string}[] = [
  {value:'featured', label:'Featured first', detail:'Our highlighted products'},
  {value:'az', label:'Name A–Z', detail:'Browse alphabetically'},
  {value:'za', label:'Name Z–A', detail:'Reverse alphabetical order'},
]

export function CollectionSort({value,onChange}: {value:CollectionSortValue; onChange:(value:CollectionSortValue)=>void}) {
  const [open,setOpen] = useState(false)
  const [active,setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement|null)[]>([])
  const id = useId()
  const selected = Math.max(0,choices.findIndex(item=>item.value===value))
  useEffect(()=>{if(open) optionRefs.current[active]?.focus()},[open,active])
  useEffect(()=>{
    if(!open) return
    const outside = (event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)}
    document.addEventListener('pointerdown',outside)
    return ()=>document.removeEventListener('pointerdown',outside)
  },[open])
  const close = ()=>{setOpen(false);trigger.current?.focus()}
  return <div className="collection-sort" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
    <span id={`${id}-label`} className="sr-only">Sort products</span>
    <button ref={trigger} type="button" className="collection-sort-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open?`${id}-options`:undefined} aria-labelledby={`${id}-label ${id}-value`}
      onClick={()=>{setActive(selected);setOpen(current=>!current)}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setActive(selected);setOpen(true)}}}>
      <ArrowDownWideNarrow size={18}/><span id={`${id}-value`}>{choices[selected].label}</span><ChevronDown size={16} className={open?'sort-chevron is-open':'sort-chevron'}/>
    </button>
    {open&&<div className="collection-sort-menu" id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`} onKeyDown={event=>{
      if(event.key==='Escape'){event.preventDefault();close()}
      if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>(index+1)%choices.length)}
      if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>(index-1+choices.length)%choices.length)}
      if(event.key==='Home'){event.preventDefault();setActive(0)}
      if(event.key==='End'){event.preventDefault();setActive(choices.length-1)}
    }}>
      <p>Arrange the collection</p>
      {choices.map((item,index)=><button key={item.value} ref={element=>{optionRefs.current[index]=element}} type="button" role="option" aria-selected={value===item.value} tabIndex={index===active?0:-1} onFocus={()=>setActive(index)} onClick={()=>{onChange(item.value);close()}}><span><strong>{item.label}</strong><small>{item.detail}</small></span>{value===item.value&&<Check size={17}/>}</button>)}
    </div>}
  </div>
}
