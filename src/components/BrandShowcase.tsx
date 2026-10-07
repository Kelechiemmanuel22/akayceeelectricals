import { Link } from 'react-router-dom'
import type { BrandItem } from '../data/catalog'
import { BrandLogo } from './BrandLogos'

export function BrandShowcase({ brands }: { brands: BrandItem[] }) {
  return (
    <div className="brand-wall" aria-label="Available brands">
      {brands.map((brand, index) => (
        <Link
          key={brand.name}
          to={`/products?brand=${encodeURIComponent(brand.name)}`}
          className="brand-tile"
          aria-label={`Browse ${brand.name} products`}
        >
          <span className="brand-tile-index">{String(index + 1).padStart(2, '0')}</span>
          <div className="brand-tile-logo">
            <BrandLogo
              brand={brand.name}
              logo={brand.logo}
              logoDark={brand.logoDark}
              variant="dark"
              className={`brand-logo-asset brand-logo-${brand.name.toLowerCase()}`}
            />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">{brand.name}</h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/60">{brand.tagline}</p>
          </div>
          <span className="brand-tile-link">View products</span>
        </Link>
      ))}
    </div>
  )
}
