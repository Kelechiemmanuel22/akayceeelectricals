import { ArrowLeft, Check, MapPin, Plus, ShieldCheck, Truck, ArrowUpRight } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { WhatsAppLink } from '../components/WhatsAppLink'
import { WhatsAppIcon, InstagramIcon } from '../components/SocialIcons'
import { contact, setPageMeta } from '../lib/site'
import { useQuoteCart } from '../context/QuoteCartContext'
import { useCatalog } from '../context/CatalogContext'
import { trackEvent } from '../lib/engagement'

export function ProductDetailPage() {
  const { slug } = useParams()
  const { products, getCategoryById } = useCatalog()
  const { addItem, items } = useQuoteCart()
  const product = products.find((entry) => entry.slug === slug)

  useEffect(() => {
    if (product) {
      trackEvent('product_view', { product_slug: product.slug, category_id: product.category })
      setPageMeta(
        `${product.name} | Lagos Electricals & Appliances`,
        `${product.description} Enquire with A Kaycee Electricals for current availability, pricing and product details.`
      )
    }
  }, [product])

  if (!product) return <Navigate to="/not-found" replace />

  const category = getCategoryById(product.category)
  const related = products
    .filter((entry) => entry.category === product.category && entry.slug !== product.slug)
    .slice(0, 3)

  const isInCart = items.some((item) => item.product.slug === product.slug)


  return (
    <>
      {/* Product Detail Main Section */}
      <section className="section pt-10 pb-16">
        <div className="container">
          {/* Breadcrumbs */}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-gold-dark transition hover:text-ink"
          >
            <ArrowLeft size={16} /> Back to All Products
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start">
            {/* Left: Product Image Showcase */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-3xl border border-ink/10 bg-sand shadow-lg shadow-ink/5">
                <img
                  src={product.image}
                  alt={`${product.name} - A Kaycee Electricals Ogba Lagos`}
                  className="size-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/assets/products/copper-cable-coil.jpg'
                  }}
                />
                <span className="absolute left-4 top-4 rounded-full bg-ink/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gold-light backdrop-blur-xs">
                  Demo catalogue item
                </span>
              </div>

              {/* Instagram Unboxing / Showcase Link */}
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-4 text-xs font-bold text-ink transition hover:border-gold hover:bg-gold/5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white">
                    <InstagramIcon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-ink font-bold">Watch unboxings on our Instagram</p>
                    <p className="text-[11px] text-ink/55">@a_kaycee_electricals</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-gold-dark" />
              </a>
            </div>

            {/* Right: Product Details & Buying Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-gold-dark">{product.brand}</span>
                  <span className="text-ink/30">•</span>
                  <span className="eyebrow text-ink/60">{category.name}</span>
                </div>

                <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl leading-tight">
                  {product.name}
                </h1>

                <p className="mt-4 text-base leading-relaxed text-ink/70">
                  {product.description}
                </p>

                {/* Key Specifications & Features */}
                <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 shadow-xs">
                  <h2 className="eyebrow text-ink/50">Technical Specifications</h2>
                  <ul className="mt-4 space-y-3">
                    {product.specs.map((spec) => (
                      <li key={spec} className="flex items-center gap-3 text-sm font-semibold text-ink">
                        <span className="grid size-5 place-items-center rounded-full bg-gold/15 text-gold-dark">
                          <Check size={13} />
                        </span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trust & Guarantee Badges */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ink/75">
                  <div className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-cream p-3">
                    <ShieldCheck size={18} className="text-gold-dark shrink-0" />
                    <span>Ask the store to confirm product details</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-cream p-3">
                    <Truck size={18} className="text-gold-dark shrink-0" />
                    <span>Ask about delivery options for your location</span>
                  </div>
                </div>
              </div>

              {/* Buying CTAs */}
              <div className="mt-8 border-t border-ink/10 pt-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <WhatsAppLink
                    subject={product.name}
                    className="flex-1 !py-3.5 !text-sm"
                  >
                    Inquire Price on WhatsApp
                  </WhatsAppLink>

                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    className={`button flex-1 !py-3.5 !text-sm ${
                      isInCart
                        ? 'bg-ink text-gold-light'
                        : 'button-dark'
                    }`}
                  >
                    {isInCart ? <Check size={16} className="text-gold" /> : <Plus size={16} />}
                    <span>{isInCart ? 'Item in Quote List' : 'Add to Quote List'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-ink/60">
                  <a
                    href={contact.directions}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-ink hover:text-gold-dark"
                  >
                    <MapPin size={15} className="text-gold-dark" />
                    <span>Inspect at Ogba Store</span>
                  </a>
                  <span>Call: <a href={contact.phoneHref} className="font-bold text-ink hover:underline">{contact.phone}</a></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="section bg-sand">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-gold-dark">Explore Similar Items</p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  More in {category.name}
                </h2>
              </div>
              <Link to={`/category/${category.id}`} className="button button-ghost button-compact hidden sm:inline-flex">
                View All {category.name}
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {related.map((entry) => (
                <ProductCard key={entry.slug} product={entry} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
