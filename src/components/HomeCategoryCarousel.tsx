import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category, Product } from '../data/catalog'

export function HomeCategoryCarousel({ categories, products }: { categories: Category[]; products: Product[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  function move(direction: 1 | -1, automatic = false) {
    const element = track.current
    if (!element || (automatic && document.hidden)) return
    const card = element.firstElementChild as HTMLElement | null
    if (!card) return
    const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(element).gap || '0')
    const end = element.scrollWidth - element.clientWidth
    const target = direction === 1 ? (element.scrollLeft >= end - 4 ? 0 : Math.min(end, element.scrollLeft + step)) : (element.scrollLeft <= 4 ? end : Math.max(0, element.scrollLeft - step))
    element.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' })
  }
  useEffect(() => {
    if (paused || hovered || focused || reducedMotion || categories.length < 2) return
    const timer = window.setInterval(() => move(1, true), 5000)
    return () => window.clearInterval(timer)
  }, [paused, hovered, focused, reducedMotion, categories.length])

  return <section className="showroom-categories" id="categories" role="region" aria-roledescription="carousel" aria-label="Shop by category"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={() => setPaused(true)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="container showroom-section-heading">
      <div><p className="showroom-kicker showroom-kicker-blue">Explore the range</p><h2>Shop by category</h2></div>
      <div className="category-carousel-controls">
        <button type="button" onClick={() => { setPaused(true); move(-1) }} aria-label="Previous categories" aria-controls="home-category-track" disabled={categories.length < 2}><ArrowLeft size={21}/></button>
        {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Start automatic category carousel' : 'Pause automatic category carousel'} aria-pressed={paused}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button>}
        <button type="button" onClick={() => { setPaused(true); move(1) }} aria-label="Next categories" aria-controls="home-category-track" disabled={categories.length < 2}><ArrowRight size={21}/></button>
      </div>
    </div>
    <div className="container"><div className="home-category-carousel-track" ref={track} id="home-category-track">
      {categories.map((category, index) => {
        const count = products.filter(product => product.category === category.id).length
        return <Link key={category.id} to={`/category/${category.id}`} className="showroom-category-card" aria-label={`${category.name} — category ${index + 1} of ${categories.length}`}>
          <img src={category.image} alt={`${category.name} at A Kaycee Electricals`} loading={index > 2 ? 'lazy' : 'eager'}/>
          <div className="showroom-category-overlay"/>
          <span className="showroom-category-count">{count || 'New'} {count === 1 ? 'product' : count ? 'products' : ''}</span>
          <div><h3>{category.name}</h3><span>Explore <ArrowRight size={17}/></span></div>
        </Link>
      })}
    </div></div>
  </section>
}
