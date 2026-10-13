import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { SiteLayout } from './components/SiteLayout'
import { ContactPage, NotFoundPage, ServicesPage } from './pages/ContentPages'
import { HomePage } from './pages/HomePage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsPage } from './pages/ProductsPage'
import { QuoteCartProvider } from './context/QuoteCartContext'
import { CatalogProvider } from './context/CatalogContext'
import { ScrollToTop } from './components/ScrollToTop'
import { RouteMeta } from './components/RouteMeta'
import { ShopToolsProvider } from './context/ShopToolsContext'
import { SavedComparePage } from './pages/SavedComparePage'
import { UnsubscribePage } from './pages/UnsubscribePage'
import { MotionOrchestrator } from './components/MotionOrchestrator'
import { CategoryPage } from './pages/CategoryPages'
const OwnerPortalPage = lazy(() => import('./pages/OwnerPortalPage').then(module => ({ default: module.OwnerPortalPage })))

export default function App() {
  return (
    <CatalogProvider>
      <ShopToolsProvider><QuoteCartProvider>
        <ScrollToTop />
        <MotionOrchestrator />
        <RouteMeta />
        <Routes>
          <Route path="/ak-owner-portal" element={<Suspense fallback={<main className="owner-login-shell"><div className="owner-login-card" role="status">Loading your secure workspace…</div></main>}><OwnerPortalPage /></Suspense>} />
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/saved" element={<SavedComparePage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </QuoteCartProvider></ShopToolsProvider>
    </CatalogProvider>
  )
}
