import { useState } from 'react'
import { ArrowRight, Layers } from 'lucide-react'
import type { Product } from '../data/catalog'
import { categoryGroups, firstGroupProduct } from '../data/categoryGroups'
import type { ManagedSubcategory } from '../data/subcategories'

export function CategoryGroupCards({ category, products, definitions, selected, onSelect }: { category: string; products: Product[]; definitions: ManagedSubcategory[]; selected: string; onSelect: (id: string) => void }) {
  const groups = categoryGroups(category, definitions)
  return <div className="cooling-choice-grid">{groups.map(group => {
    const product = firstGroupProduct(products, category, group.id, definitions)
    return <a key={group.id} href="#cooling-collection" className={`cooling-choice ${selected === group.id ? 'selected' : ''}`} onClick={() => onSelect(group.id)}>
      <div><h3>{group.name}</h3>{group.text && <p>{group.text}</p>}<span>Explore {category === 'cooling' ? group.name.toLowerCase() : ''}<ArrowRight size={18}/></span></div>
      <GroupImage key={`${group.id}:${product?.slug}:${product?.image}`} product={product} name={group.name}/>
    </a>
  })}</div>
}

function GroupImage({ product, name }: { product?: Product; name: string }) {
  const [failed, setFailed] = useState(false)
  if (!product?.image?.trim() || failed) return <div className="category-choice-placeholder"><Layers size={48} strokeWidth={1}/><span>Ask about {name.toLowerCase()}</span></div>
  return <img src={product.image} alt={product.name} loading="lazy" onError={() => setFailed(true)}/>
}
