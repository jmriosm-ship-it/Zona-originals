import { useEffect, useRef, useState } from 'react'
import { BUILTIN_CATEGORIES, categoryHref, seriesOf } from '../lib/data'
import { LOGO } from '../lib/assets'

const LINKS = [
  ['#/', 'Inicio', 'home'],
  ['#/celulares', 'IPHONE', 'celulares'],
  ['#/accesorios', 'Tienda', 'tienda'],
  ['#/credito', 'Crédito', 'credito'],
  ['#/contacto', 'Contacto', 'contacto'],
]

// Contenido del menú desplegable de cada sección (como en Apple: enlaces grandes + más enlaces).
function buildMega(key, products, categories) {
  const visible = products.filter((p) => !p.hidden)
  if (key === 'celulares') {
    const series = [...new Set(visible.filter((p) => p.category === 'iphone').map(seriesOf).filter(Boolean))].sort((a, b) => b - a)
    return {
      label: 'Conoce los iPhone',
      big: [['#/celulares', 'Ver todos los iPhone'], ...series.map((s) => [`#/celulares/${s}`, `iPhone ${s}`])],
      moreLabel: 'Más para celulares',
      more: [
        ['#/credito', 'iPhone a crédito'],
        ['#/accesorios', 'Accesorios originales'],
        ['#/contacto', 'Ubicación del local'],
      ],
    }
  }
  return {
    label: 'Compra por categoría',
    big: categories.filter((c) => c.id !== 'iphone' && !BUILTIN_IDS.includes(c.id)).map((c) => [categoryHref(c.id), c.label]),
    moreLabel: 'Más para tu iPhone',
    more: [
      ['#/celulares', 'IPHONE'],
      ['#/credito', 'iPhone a crédito'],
      ['#/contacto', 'Contacto'],
    ],
  }
}

const MEGA_KEYS = ['celulares', 'tienda']
const BUILTIN_IDS = BUILTIN_CATEGORIES.map((b) => b.id)

export default function Header({ route, products, categories, cartCount, onCart }) {
  const hasPhones = categories.some((c) => c.id === 'iphone')
  const hasStore = categories.some((c) => c.id !== 'iphone' && !BUILTIN_IDS.includes(c.id))
  const base = LINKS.filter(([, , key]) => (key === 'tienda' ? hasStore : key !== 'celulares' || hasPhones))
  // MacBook y Relojes tienen su propio acceso en el menú, justo después de Celulares.
  const fixed = categories.filter((c) => BUILTIN_IDS.includes(c.id)).map((c) => [categoryHref(c.id), c.label, c.id])
  const at = base.findIndex(([, , key]) => key === 'celulares')
  const links = at >= 0 ? [...base.slice(0, at + 1), ...fixed, ...base.slice(at + 1)] : [base[0], ...fixed, ...base.slice(1)]
  const [open, setOpen] = useState(false)
  const [mega, setMega] = useState(null)
  const timer = useRef(0)

  useEffect(() => {
    if (!open && !mega) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      setMega(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, mega])

  useEffect(() => () => clearTimeout(timer.current), [])

  const showMega = (key) => {
    clearTimeout(timer.current)
    setMega(key)
  }
  const hideMega = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMega(null), 140)
  }
  const closeAll = () => {
    clearTimeout(timer.current)
    setMega(null)
    setOpen(false)
  }

  // En la ficha de producto se resalta la sección a la que pertenece.
  const sectionOf = (id) => (id === 'iphone' ? 'celulares' : BUILTIN_IDS.includes(id) ? id : 'tienda')
  const active = route.name === 'product' ? sectionOf(route.section) : route.name === 'category' ? sectionOf(route.id) : route.name === 'accesorios' ? 'tienda' : route.name
  const content = mega ? buildMega(mega, products, categories) : null

  return (
    <header className={`topbar ${open ? 'is-open' : ''}`} onMouseLeave={hideMega}>
      <div className="wrap topbar-in">
        <a className="brand" href="#/" aria-label="Zona Originals, inicio" onClick={closeAll}>
          <img src={LOGO} alt="" width="28" height="28" />
          <span>Zona Originals</span>
        </a>

        <nav className="topnav" id="menu" aria-label="Principal">
          {links.map(([href, label, key]) => {
            const hasMega = MEGA_KEYS.includes(key)
            return (
              <a
                key={key}
                href={href}
                aria-current={active === key ? 'page' : undefined}
                aria-haspopup={hasMega ? 'true' : undefined}
                aria-expanded={hasMega ? mega === key : undefined}
                onMouseEnter={() => (hasMega ? showMega(key) : hideMega())}
                onFocus={() => (hasMega ? showMega(key) : setMega(null))}
                onClick={closeAll}
              >
                {label}
              </a>
            )
          })}
        </nav>

        <div className="topbar-end">
          <button className="cart-btn" onClick={onCart} aria-label={`Abrir carrito, ${cartCount} productos`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            {cartCount > 0 && (
              <span className="cart-count" key={cartCount}>
                {cartCount}
              </span>
            )}
          </button>
          <button className="menu-btn" aria-expanded={open} aria-controls="menu" aria-label="Menú" onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`scrim ${mega ? 'on' : ''}`} aria-hidden="true" />
      <div className={`mega ${mega ? 'open' : ''}`} onMouseEnter={() => clearTimeout(timer.current)}>
        {content && (
          <div className="wrap mega-in" key={mega}>
            <div>
              <p className="mega-label">{content.label}</p>
              <ul className="mega-big">
                {content.big.map(([href, label], i) => (
                  <li key={href} style={{ '--i': i }}>
                    <a href={href} onClick={closeAll}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mega-label">{content.moreLabel}</p>
              <ul className="mega-small">
                {content.more.map(([href, label], i) => (
                  <li key={href} style={{ '--i': i + 2 }}>
                    <a href={href} onClick={closeAll}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
