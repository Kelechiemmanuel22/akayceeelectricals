import { ArrowRight, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeals } from '../context/DealsContext'
import '../deals.css'

export function HomeDealsBanner() {
  const { liveCollections } = useDeals()
  const collections = liveCollections.filter(collection => collection.featured).slice(0, 3)
  const collectionKey = collections.map(collection => collection.id).join('|')
  const region = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [touching, setTouching] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!region.current) return
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: 0.15 })
    observer.observe(region.current)
    return () => observer.disconnect()
  }, [collectionKey])
  if (!collections.length) return null
  return <section ref={region} className="home-deals-strip" id="deals" aria-label="Combo deals"
    onTouchStart={() => setTouching(true)} onTouchEnd={() => setTouching(false)} onTouchCancel={() => setTouching(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="home-deals-strip-window" id="home-deals-track">
      <div key={collectionKey} className="home-deals-strip-track" style={{ animationDuration: `${(collections.length + 1) * 10}s`, animationPlayState: paused || touching || focused || !visible || !pageVisible ? 'paused' : 'running' }}>
        {[0, 1].map(copy => <div key={copy} className="home-deals-strip-group" aria-hidden={copy === 1 ? true : undefined} inert={copy === 1}>
          <Link to="/deals" className="home-deals-strip-tile home-deals-strip-intro" tabIndex={copy === 1 ? -1 : undefined} aria-label={copy === 0 ? 'Explore all combo deals' : undefined}>
            <span className="eyebrow">Better together</span><h2>Combo Deals</h2><p>Thoughtful appliance packages for every kind of living.</p><span className="home-deals-strip-link">Find your package <ArrowRight size={16}/></span>
          </Link>
          {collections.map(collection => <Link key={collection.id} to={`/deals/${collection.id}`} className={`home-deals-strip-tile banner-theme-${collection.theme}`} tabIndex={copy === 1 ? -1 : undefined} aria-label={copy === 0 ? `Explore ${collection.name}` : undefined}>
            <img src={collection.image} alt="" loading="lazy"/><div className="home-deals-strip-shade"/><div className="home-deals-strip-copy"><span className="eyebrow">{collection.eyebrow}</span><h3>{collection.name}</h3><span className="home-deals-strip-link">Explore deals <ArrowRight size={16}/></span></div>
          </Link>)}
        </div>)}
      </div>
    </div>
    <button type="button" className="home-deals-strip-pause" aria-label={paused ? 'Resume scrolling deals' : 'Pause scrolling deals'} aria-pressed={paused} aria-controls="home-deals-track" onClick={() => setPaused(value => !value)}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button>
  </section>
}
