import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { SiteLayout } from './components/SiteLayout'
import { NotFoundPage } from './pages/ContentPages'
import { ContactPage, ServicesPage } from './pages/SupportPages'
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
import { AuthRecoveryBridge } from './components/AuthRecoveryBridge'
import { BrandPage } from './pages/BrandPage'
const OwnerPortalPage = lazy(() => import('./pages/OwnerPortalPage').then(module => ({ default: module.OwnerPortalPage })))

export default function App() {
  return (
    <CatalogProvider>
      <AuthRecoveryBridge />
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
            <Route path="/brand/:brandId" element={<BrandPage />} />
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
