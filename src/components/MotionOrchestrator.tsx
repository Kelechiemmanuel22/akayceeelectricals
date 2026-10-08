import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function MotionOrchestrator() {
  const { pathname } = useLocation()
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.section-heading-row, .section-intro, .product-card, .category-editorial-card, .brand-tile, .guide-grid article, .trust-list article, .owner-management-card, .project-banner, .tools-form, .saved-page > section')
    targets.forEach((element, index) => {
      element.classList.add('reveal-ready')
      element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 55}ms`)
    })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((element) => element.classList.add('reveal-visible'))
      return
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('reveal-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.08, rootMargin: '0px 0px -35px' })
    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pathname])
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      document.documentElement.style.setProperty('--scroll-progress', `${max > 0 ? (window.scrollY / max) * 100 : 0}%`)
    }
    update(); window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [pathname])
  return null
}
