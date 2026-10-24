import { useCallback, useEffect, useMemo, useState } from 'react'
import { BUILTIN_CATEGORIES, colorStock, DEFAULT_SETTINGS, SHOWCASES, firstInStock } from './lib/data'
import { useLocalState } from './lib/storage'
import { CATEGORIES_SPEC, PRODUCTS_SPEC, useCloudList, useCloudSettings, useReviews, useSession } from './lib/cloud'
import Header from './components/Header'
import Home from './components/Home'
import { AccessoriesPage, CategoryPage, ContactPage, CreditPage, PhonesPage } from './components/Pages'
import ProductPage from './components/ProductPage'
import Cart from './components/Cart'
import Admin from './components/Admin'
import Showcase from './components/Showcase'
import { Footer } from './components/Info'
import SocialFloat from './components/SocialFloat'

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  // Productos, categorías, ajustes y reseñas viven en la nube (Supabase). Solo el administrador puede escribir.
  const { session, isAdmin, ready: authReady } = useSession()
  const [baseProducts, setProducts, productsCloud] = useCloudList(PRODUCTS_SPEC, isAdmin, isAdmin)
  const [categories, setCategories, categoriesCloud] = useCloudList(CATEGORIES_SPEC, isAdmin, isAdmin)
  const [stored, setSettings] = useCloudSettings(DEFAULT_SETTINGS, isAdmin, isAdmin)
  const reviewsApi = useReviews(isAdmin)
  // Cada producto lleva sus reseñas (las aprobadas para los clientes; todas para el administrador).
  const products = useMemo(
    () => baseProducts.map((p) => ({ ...p, reviews: reviewsApi.reviews.filter((r) => r.productId === p.id) })),
    [baseProducts, reviewsApi.reviews],
  )
  const [cart, setCart] = useLocalState('zo-cart', [])
  const [cartOpen, setCartOpen] = useState(false)

  // Si el WhatsApp quedó vacío en una versión anterior, se usa el del local.
  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...stored, whatsapp: stored.whatsapp || DEFAULT_SETTINGS.whatsapp, instagram: stored.instagram || DEFAULT_SETTINGS.instagram, address: stored.address || DEFAULT_SETTINGS.address, warranty: stored.warranty || DEFAULT_SETTINGS.warranty, mapCoords: stored.mapCoords ?? DEFAULT_SETTINGS.mapCoords }),
    [stored],
  )

  // Las categorías fijas (MacBook, Relojes, Colonias) siempre existen, una sola vez, y quedan marcadas como fijas.
  // La actualización se calcula sobre la lista más reciente para que ejecutarla dos veces no duplique nada,
  // y de paso se quitan las repetidas que hayan quedado guardadas.
  useEffect(() => {
    const ids = categories.map((c) => c.id)
    const missing = BUILTIN_CATEGORIES.some((b) => !ids.includes(b.id))
    const dupes = new Set(ids).size !== ids.length
    const unlocked = BUILTIN_CATEGORIES.some((b) => categories.some((c) => c.id === b.id && !c.locked))
    if (!missing && !dupes && !unlocked) return
    setCategories((list) => {
      const have = new Set(list.map((c) => c.id))
      const seen = new Set()
      return [...BUILTIN_CATEGORIES.filter((b) => !have.has(b.id)), ...list]
        .filter((c) => !seen.has(c.id) && seen.add(c.id))
        .map((c) => (BUILTIN_CATEGORIES.some((b) => b.id === c.id) ? { ...c, locked: true } : c))
    })
  }, [categories, setCategories])

  const route = useMemo(() => {
    if (hash.startsWith('#/admin')) return { name: 'admin' }
    if (hash.startsWith('#/p/')) {
      const p = products.find((x) => x.id === decodeURIComponent(hash.slice(4)) && !x.hidden)
      if (p) return { name: 'product', product: p, section: p.category }
    }
    const c = /^#\/c\/([^/]+)/.exec(hash)
    if (c) return { name: 'category', id: decodeURIComponent(c[1]) }
    const m = /^#\/(celulares|accesorios|credito|contacto)(?:\/(\d{2}))?/.exec(hash)
    return { name: m ? m[1] : 'home', serie: m?.[2] }
  }, [hash, products])

  const routeKey = route.name === 'product' ? `p-${route.product.id}` : `${route.name}-${route.serie ?? route.id ?? ''}`

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [routeKey])

  const openProduct = useCallback((p) => {
    window.location.hash = `#/p/${encodeURIComponent(p.id)}`
  }, [])

  const addToCart = useCallback(
    (p, color = firstInStock(p)) => {
      const name = color?.name ?? ''
      const max = colorStock(p, color)
      setCart((c) => {
        const line = c.find((l) => l.id === p.id && (l.color ?? '') === name)
        if (!line) return max > 0 ? [...c, { id: p.id, color: name, qty: 1 }] : c
        return c.map((l) => (l === line ? { ...l, qty: Math.min(max, l.qty + 1) } : l))
      })
      setCartOpen(true)
    },
    [setCart],
  )

  const { submit: submitReview } = reviewsApi
  const addReview = useCallback((productId, review) => submitReview(productId, review), [submitReview])

  const lineKey = (l) => `${l.id}|${l.color ?? ''}`
  const setQty = (key, qty) => setCart((c) => (qty <= 0 ? c.filter((l) => lineKey(l) !== key) : c.map((l) => (lineKey(l) === key ? { ...l, qty } : l))))

  // Se descartan líneas de productos que ya no existen.
  const items = cart
    .map((l) => ({ key: lineKey(l), product: products.find((p) => p.id === l.id), color: l.color, qty: l.qty }))
    .filter((l) => l.product && !l.product.hidden)

  if (route.name === 'admin') {
    return (
      <Admin
        products={products}
        setProducts={setProducts}
        categories={categories}
        setCategories={setCategories}
        settings={settings}
        setSettings={setSettings}
        session={session}
        isAdmin={isAdmin}
        authReady={authReady}
        reviewsApi={reviewsApi}
        cloudError={productsCloud.error || categoriesCloud.error}
        onClearError={() => {
          productsCloud.clearError()
          categoriesCloud.clearError()
        }}
      />
    )
  }

  const shared = { products, categories, onOpen: openProduct, onAdd: addToCart }

  return (
    <>
      <Header route={route} products={products} categories={categories} cartCount={items.reduce((s, l) => s + l.qty, 0)} onCart={() => setCartOpen(true)} />
      <main key={routeKey} className="page">
        {route.name === 'home' && <Home {...shared} settings={settings} />}
        {route.name === 'celulares' && <PhonesPage {...shared} initialSerie={route.serie} />}
        {route.name === 'accesorios' && <AccessoriesPage {...shared} />}
        {route.name === 'category' && SHOWCASES[route.id] && categories.some((c) => c.id === route.id) && (
          <Showcase {...shared} category={categories.find((c) => c.id === route.id)} settings={settings} />
        )}
        {route.name === 'category' && !(SHOWCASES[route.id] && categories.some((c) => c.id === route.id)) && <CategoryPage {...shared} id={route.id} />}
        {route.name === 'credito' && <CreditPage {...shared} settings={settings} />}
        {route.name === 'contacto' && <ContactPage settings={settings} />}
        {route.name === 'product' && (
          <ProductPage product={route.product} category={categories.find((c) => c.id === route.section)} whatsapp={settings.whatsapp} warranty={settings.warranty} onAdd={addToCart} onReview={addReview} />
        )}
      </main>
      <Footer settings={settings} categories={categories} />
      <SocialFloat settings={settings} />

      {cartOpen && (
        <Cart
          items={items}
          whatsapp={settings.whatsapp}
          onClose={() => setCartOpen(false)}
          onQty={setQty}
          onClear={() => setCart([])}
        />
      )}
    </>
  )
}
