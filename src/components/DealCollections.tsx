import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDeals } from '../context/DealsContext'
import type { DealCollection } from '../lib/deals'
import '../deals.css'

export function DealCollectionCard({ collection }: { collection: DealCollection }) {
  const { liveCombos } = useDeals()
  const count = liveCombos.filter(combo => combo.collectionId === collection.id).length
  return <Link to={`/deals/${collection.id}`} className={`deal-collection-card deal-theme-${collection.theme}`}>
    <img src={collection.image} alt={collection.theme === 'student' ? 'A comfortable student studio with a mini refrigerator and standing fan' : 'A modern home with premium entertainment and everyday comforts'} loading="lazy"/>
    <div className="deal-card-shade"/>
    <span className="deal-collection-count">{count} {count === 1 ? 'package' : 'packages'} to explore</span>
    <div className="deal-collection-copy"><p>{collection.eyebrow}</p><h3>{collection.name}</h3><span>Explore deals <ArrowRight size={19}/></span></div>
  </Link>
}
