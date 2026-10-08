import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'

export function BrandMark({ light = false }: { light?: boolean }) {
  const { siteSettings } = useCatalog()
  const configuredLogo = siteSettings?.logo
  const logoSrc = !configuredLogo || configuredLogo === '/assets/business/instagram-logo.jpg' || configuredLogo === '/assets/brand/akaycee-logo.png'
    ? '/assets/brand/akaycee-logo-transparent.png'
    : configuredLogo
  const siteName = siteSettings?.siteName || 'A KAYCEE'
  const tagline = siteSettings?.tagline || 'ELECTRICALS'

  return (
    <Link
      to="/"
      className={`brand-mark ${light ? 'brand-mark-light' : ''}`}
      aria-label={`${siteName} ${tagline} home`}
    >
      <span className="brand-mark-image">
        <img
          src={logoSrc}
          alt={`${siteName} logo`}
          className="size-full object-contain"
        />
      </span>
      <span className="sr-only">{siteName} {tagline}</span>
    </Link>
  )
}
