import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { trackEvent } from '../lib/engagement'

const defaultDescription =
  'Explore electrical materials, home appliances and electronics from A Kaycee Electricals in Ogba, Lagos.'

const routeMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'A Kaycee Electricals | Appliances & Electrical Materials in Lagos',
    description: defaultDescription,
  },
  '/products': {
    title: 'Product Catalogue | A Kaycee Electricals',
    description: 'Browse demo catalogue options across cooling, televisions, refrigeration, laundry, lighting and electrical materials.',
  },
  '/about': {
    title: 'About A Kaycee Electricals | Ogba, Lagos',
    description: 'Learn about A Kaycee Electricals, a Lagos-based electrical, electronics and appliance supplier with over 10 years of experience.',
  },
  '/services': {
    title: 'Supply & Services | A Kaycee Electricals',
    description: 'Explore appliance supply, electrical-material supply, project enquiries and installation support where applicable.',
  },
  '/contact': {
    title: 'Contact A Kaycee Electricals | Ogba, Lagos',
    description: 'Contact A Kaycee Electricals by WhatsApp, phone, email or visit 12 Ajayi Road, Ogba Okeira, Lagos.',
  },
}

function setMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

function setOpenGraph(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.content = content
}

export function RouteMeta() {
  const { pathname } = useLocation()
  const { products } = useCatalog()

  useEffect(() => {
    trackEvent('page_view')
    const productSlug = pathname.startsWith('/products/') ? pathname.slice('/products/'.length) : ''
    const product = productSlug ? products.find((item) => item.slug === productSlug) : undefined
    const meta = product
      ? {
          title: `${product.name} | A Kaycee Electricals`,
          description: `${product.description} Enquire with the Ogba store team for current pricing and availability.`,
        }
      : routeMeta[pathname] || {
          title: 'Page Not Found | A Kaycee Electricals',
          description: defaultDescription,
        }

    document.title = meta.title
    setMeta('description', meta.description)
    setOpenGraph('og:title', meta.title)
    setOpenGraph('og:description', meta.description)
  }, [pathname, products])

  return null
}
