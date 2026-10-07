import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'

export function BrandMark({ light = false }: { light?: boolean }) {
  const { siteSettings } = useCatalog()
  const logoSrc = siteSettings?.logo || '/assets/business/instagram-logo.jpg'
  const siteName = siteSettings?.siteName || 'A KAYCEE'
  const tagline = siteSettings?.tagline || 'ELECTRICALS'

  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-3 ${light ? 'text-white' : 'text-ink'}`}
      aria-label={`${siteName} ${tagline} home`}
    >
      <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-gold/30 shadow-xs shrink-0">
        <img
          src={logoSrc}
          alt={`${siteName} logo`}
          className="size-full object-cover"
        />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-xl font-bold tracking-tight">
          {siteName}
        </span>
        <span
          className={`block text-[0.65rem] font-extrabold uppercase tracking-[0.2em] ${
            light ? 'text-gold-light' : 'text-gold-dark'
          }`}
        >
          {tagline}
        </span>
      </span>
    </Link>
  )
}