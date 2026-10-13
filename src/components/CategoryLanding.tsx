import { ArrowRight, Layers, MessageCircle, SlidersHorizontal } from 'lucide-react'
import type { Category, Product } from '../data/catalog'
import { categoryPresentations } from '../data/categoryPresentation'
import { categoryHeroes } from '../data/categoryHeroes'
import { WhatsAppLink } from './WhatsAppLink'
import { categoryGroups } from '../data/categoryGroups'
import { CategoryGroupCards } from './CategoryGroupCards'
import { useCatalog } from '../context/CatalogContext'

export function CategoryLanding({ category, products, selected, onSelect }: { category: Category; products: Product[]; selected: string; onSelect: (id: string) => void }) {
  const { subcategoryDefinitions } = useCatalog()
  const presentation = categoryPresentations[category.id]
  const hero = categoryHeroes[category.id]
  const groups = categoryGroups(category.id, subcategoryDefinitions)
  return <>
    <section className={`cooling-hero category-range-hero category-photo-hero category-photo-${category.id}`}>
      <img className={`category-photo-image ${hero?.mirror ? 'category-photo-mirrored' : ''}`} src={hero?.image || category.image} alt={hero?.alt || category.name} style={{ objectPosition: hero?.position || 'center' }} fetchPriority="high"/>
      <div className="cooling-hero-shade"/>
      <div className="container cooling-hero-copy">
        <p className="eyebrow">A Kaycee {category.shortName}</p>
        <h1>{presentation?.title || 'More for your everyday.'}<br/><span>{presentation?.accent || category.name}</span></h1>
        <p>{presentation?.subtitle || category.description}</p>
        <div className="cooling-hero-actions"><a href="#cooling-collection" className="button button-dark">Explore the collection <ArrowRight size={17}/></a><WhatsAppLink subject={category.name} variant="ghost">Enquire now</WhatsAppLink></div>
      </div>
      <span className="cooling-hero-caption">{category.name}</span>
    </section>
    {groups.length > 0 && <section className="cooling-choices"><div className="container">
      <div className="cooling-section-title">{category.id === 'laundry' ? <h2>Washing machines</h2> : <><p className="eyebrow">Explore the possibilities</p><h2>Find your kind of {category.shortName.toLowerCase()}.</h2></>}</div>
      <CategoryGroupCards category={category.id} products={products} definitions={subcategoryDefinitions} selected={selected} onSelect={onSelect}/>
    </div></section>}
  </>
}

export function CategoryGuidance({ category }: { category: Category }) {
  return <section className="cooling-guidance"><div className="container">
    <div className="cooling-guidance-title"><p className="eyebrow">Made for your everyday</p><h2>A little guidance.<br/>The right choice.</h2><WhatsAppLink subject={`Help choosing ${category.name.toLowerCase()}`} variant="gold">Help me choose</WhatsAppLink></div>
    <div className="cooling-guidance-grid">{[
      {icon:Layers,title:'Explore the options',text:`Discover ${category.name.toLowerCase()} from our catalogue and ask about other options.`},
      {icon:SlidersHorizontal,title:'Find your right fit',text:'Tell us about your space, your needs and your budget so we can help you choose.'},
      {icon:MessageCircle,title:'Speak with the store',text:'Confirm model details, current pricing and availability directly on WhatsApp.'},
    ].map((item) => <article key={item.title}><item.icon size={28} strokeWidth={1.5}/><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
  </div></section>
}
