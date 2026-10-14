import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_SETTINGS, SEED_PRODUCTS } from './lib/data'
import { useLocalState } from './lib/storage'
import Header from './components/Header'
import Home from './components/Home'
import { AccessoriesPage, ContactPage, CreditPage, PhonesPage } from './components/Pages'
import ProductPage from './components/ProductPage'
import Cart from './components/Cart'
import Admin from './components/Admin'
import { Footer } from './components/Info'

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
  const [products, setProducts, productsFull] = useLocalState('zo-products', () => SEED_PRODUCTS)
  const [stored, setSettings] = useLocalState('zo-settings', DEFAULT_SETTINGS)
  const [cart, setCart] = useLocalState('zo-cart', [])
  const [cartOpen, setCartOpen] = useState(false)

  // Si el WhatsApp quedó vacío en una versión anterior, se usa el del local.
  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...stored, whatsapp: stored.whatsapp || DEFAULT_SETTINGS.whatsapp }),
    [stored],
  )

  // Los productos de ejemplo guardados antes de que existieran los colores se renuevan una sola vez.
  useEffect(() => {
    if (products.some((p) => p.demo && (!p.colors || (p.category === 'iphone' && !p.highlights)))) {
      setProducts((list) => [...SEED_PRODUCTS, ...list.filter((p) => !p.demo)])
    }
  }, [products, setProducts])

  const route = useMemo(() => {
    if (hash.startsWith('#/admin')) return { name: 'admin' }
    if (hash.startsWith('#/p/')) {
      const p = products.find((x) => x.id === decodeURIComponent(hash.slice(4)) && !x.hidden)
      if (p) return { name: 'product', product: p, section: p.category === 'iphone' ? 'celulares' : 'accesorios' }
    }
    const m = /^#\/(celulares|accesorios|credito|contacto)(?:\/(\d{2}))?/.exec(hash)
    return { name: m ? m[1] : 'home', serie: m?.[2] }
  }, [hash, products])

  const routeKey = route.name === 'product' ? `p-${route.product.id}` : `${route.name}-${route.serie ?? ''}`

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [routeKey])

  const openProduct = useCallback((p) => {
    window.location.hash = `#/p/${encodeURIComponent(p.id)}`
  }, [])

  const addToCart = useCallback(
    (p) => {
      setCart((c) => {
        const line = c.find((l) => l.id === p.id)
        if (!line) return [...c, { id: p.id, qty: 1 }]
        return c.map((l) => (l.id === p.id ? { ...l, qty: Math.min(p.stock, l.qty + 1) } : l))
      })
      setCartOpen(true)
    },
    [setCart],
  )

  const addReview = useCallback(
    (productId, review) =>
      setProducts((list) => list.map((p) => (p.id === productId ? { ...p, reviews: [...(p.reviews ?? []), review] } : p))),
    [setProducts],
  )

  const setQty = (id, qty) => setCart((c) => (qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l))))

  // Se descartan líneas de productos que ya no existen.
  const items = cart
    .map((l) => ({ product: products.find((p) => p.id === l.id), qty: l.qty }))
    .filter((l) => l.product && !l.product.hidden)

  if (route.name === 'admin') {
    return (
      <Admin
        products={products}
        setProducts={setProducts}
        settings={settings}
        setSettings={setSettings}
        storageFull={productsFull}
      />
    )
  }

  const shared = { products, onOpen: openProduct, onAdd: addToCart }

  return (
    <>
      <Header route={route} products={products} cartCount={items.reduce((s, l) => s + l.qty, 0)} onCart={() => setCartOpen(true)} />
      <main key={routeKey} className="page">
        {route.name === 'home' && <Home {...shared} settings={settings} />}
        {route.name === 'celulares' && <PhonesPage {...shared} initialSerie={route.serie} />}
        {route.name === 'accesorios' && <AccessoriesPage {...shared} />}
        {route.name === 'credito' && <CreditPage {...shared} whatsapp={settings.whatsapp} />}
        {route.name === 'contacto' && <ContactPage settings={settings} />}
        {route.name === 'product' && (
          <ProductPage product={route.product} section={route.section} whatsapp={settings.whatsapp} onAdd={addToCart} onReview={addReview} />
        )}
      </main>
      <Footer settings={settings} />

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
