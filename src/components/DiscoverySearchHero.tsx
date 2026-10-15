import { ArrowRight, Search, X } from 'lucide-react'
import type { Category } from '../data/catalog'

export function DiscoverySearchHero({query,onChange,categories,onCategory}: {query:string;onChange:(value:string)=>void;categories:Category[];onCategory:(id:string)=>void}) {
  const jump = ()=>document.getElementById('search-results')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
  return <section className="discovery-search-hero">
    <img src="/assets/heroes/search-kitchen-v1.webp" alt="Illustrative sage-green kitchen with modern everyday appliances" fetchPriority="high"/><div className="discovery-search-shade"/>
    <div className="container discovery-search-copy"><p className="eyebrow">Find your everyday upgrade</p><h1>What’s next<br/><span>for your space?</span></h1><p>Search appliances, electronics and electrical essentials.</p>
      <form className="discovery-search-box" role="search" onSubmit={event=>{event.preventDefault();jump()}}><Search size={23}/><input type="search" value={query} onChange={event=>onChange(event.target.value)} placeholder="Try ‘washing machine’ or ‘LG’" aria-label="Search products"/>{query&&<button type="button" aria-label="Clear search" onClick={()=>onChange('')}><X size={18}/></button>}<button type="submit" aria-label="Show search results"><ArrowRight size={22}/></button></form>
      <div className="discovery-popular"><span>Explore</span>{categories.slice(0,3).map(item=><button type="button" key={item.id} onClick={()=>{onCategory(item.id);jump()}}>{item.shortName}<ArrowRight size={13}/></button>)}</div>
    </div><small className="editorial-photo-note">Illustrative home setting</small>
  </section>
}
