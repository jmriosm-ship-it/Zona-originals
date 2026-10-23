import { useMemo, useState } from 'react'
import { colorsOf, fmtPrice } from '../lib/data'
import Modal from './Modal'
import ProductCard from './ProductCard'

const SORTS = {
  recent: 'Más recientes',
  asc: 'Precio: menor a mayor',
  desc: 'Precio: mayor a menor',
}

const MAX_COMPARE = 2

const specsOf = (p) =>
  (p.specs ?? '')
    .split('\n')
    .map((l) => l.split(/:(.*)/s))
    .filter(([k, v]) => k?.trim() && v?.trim())
    .map(([k, v]) => [k.trim(), v.trim()])

export function Grid({ products, onOpen, onAdd, compare, empty = 'No encontramos productos con ese filtro.' }) {
  if (!products.length) return <p className="empty">{empty}</p>
  return (
    <div className="grid">
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          index={i}
          onOpen={onOpen}
          onAdd={onAdd}
          compare={compare && { on: compare.ids.includes(p.id), full: compare.ids.length >= MAX_COMPARE, toggle: () => compare.toggle(p.id) }}
        />
      ))}
    </div>
  )
}

function CompareTable({ items }) {
  const keys = [...new Set(items.flatMap((p) => specsOf(p).map(([k]) => k)))]
  const rows = [
    ['Precio', (p) => fmtPrice(p.price)],
    ['Estado', (p) => p.condition || '—'],
    ['Detalle', (p) => p.storage || '—'],
    ['Colores', (p) => colorsOf(p).map((c) => c.name).join(', ')],
    ['Crédito', (p) => (p.credit ? 'Disponible' : 'No')],
    ['Disponibles', (p) => (p.stock > 0 ? p.stock : 'Agotado')],
    ...keys.map((k) => [k, (p) => specsOf(p).find(([x]) => x === k)?.[1] ?? '—']),
  ]
  return (
    <div className="compare-wrap">
      <table className="compare">
        <thead>
          <tr>
            <th />
            {items.map((p) => (
              <th key={p.id} scope="col">
                {p.images[0] && <img src={p.images[0]} alt="" />}
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, get]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {items.map((p) => (
                <td key={p.id}>{get(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Lista de productos con búsqueda, orden, filtros (detalle, color, precio, disponibles) y comparación de dos productos.
export default function Catalog({ products, onOpen, onAdd, empty, lead }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [storage, setStorage] = useState('')
  const [color, setColor] = useState('')
  const [onlyStock, setOnlyStock] = useState(false)
  const [maxPrice, setMaxPrice] = useState(null)
  const [ids, setIds] = useState([])
  const [open, setOpen] = useState(false)

  const storages = useMemo(() => [...new Set(products.map((p) => p.storage).filter(Boolean))], [products])
  const colorNames = useMemo(() => [...new Set(products.flatMap((p) => (p.colors ?? []).map((c) => c.name)).filter(Boolean))], [products])
  const prices = products.map((p) => p.price)
  const lo = prices.length ? Math.min(...prices) : 0
  const hi = prices.length ? Math.max(...prices) : 0
  const cap = maxPrice === null || maxPrice >= hi ? hi : Math.max(maxPrice, lo)
  const filtered = cap < hi || storage || color || onlyStock

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter(
      (p) =>
        (!q || `${p.name} ${p.storage} ${(p.colors ?? []).map((c) => c.name).join(' ')}`.toLowerCase().includes(q)) &&
        (!storage || p.storage === storage) &&
        (!color || (p.colors ?? []).some((c) => c.name === color)) &&
        (!onlyStock || p.stock > 0) &&
        p.price <= cap,
    )
    if (sort === 'asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'desc') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [products, query, sort, storage, color, onlyStock, cap])

  const toggle = (id) => setIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= MAX_COMPARE ? l : [...l, id]))
  const picked = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)

  const clear = () => {
    setStorage('')
    setColor('')
    setOnlyStock(false)
    setMaxPrice(null)
  }

  return (
    <>
      <div className="toolbar">
        {lead ?? <span />}
        <div className="tools">
          <input className="search" type="search" placeholder="Buscar" aria-label="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="select" aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(storages.length > 1 || colorNames.length > 1 || hi > lo) && (
        <div className="filters" aria-label="Filtros">
          {storages.length > 1 && (
            <div className="pills" role="group" aria-label="Filtrar por detalle">
              {storages.map((s) => (
                <button key={s} type="button" className={`pill ${storage === s ? 'on' : ''}`} aria-pressed={storage === s} onClick={() => setStorage(storage === s ? '' : s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {colorNames.length > 1 && (
            <div className="pills" role="group" aria-label="Filtrar por color">
              {colorNames.map((c) => (
                <button key={c} type="button" className={`pill ${color === c ? 'on' : ''}`} aria-pressed={color === c} onClick={() => setColor(color === c ? '' : c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="filters-row">
            {hi > lo && (
              <label className="price-filter">
                <span>Hasta {fmtPrice(cap)}</span>
                <input type="range" min={lo} max={hi} step="50000" value={cap} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Precio máximo" />
              </label>
            )}
            <label className="check">
              <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
              Solo disponibles
            </label>
            {filtered && (
              <button type="button" className="link-btn" onClick={clear}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      <p className="results" role="status">
        {shown.length} {shown.length === 1 ? 'producto' : 'productos'}
      </p>
      <Grid products={shown} onOpen={onOpen} onAdd={onAdd} compare={{ ids, toggle }} empty={products.length ? undefined : empty} />

      {picked.length > 0 && (
        <div className="comparebar" role="region" aria-label="Comparar productos">
          <span>
            {picked.map((p) => p.name).join(' · ')}
            {picked.length < MAX_COMPARE && <em> — elige otro para comparar</em>}
          </span>
          <button type="button" className="btn btn-primary btn-buy btn-sm" disabled={picked.length < 2} onClick={() => setOpen(true)}>
            Comparar
          </button>
          <button type="button" className="link-btn" onClick={() => setIds([])}>
            Quitar
          </button>
        </div>
      )}

      {open && picked.length === 2 && (
        <Modal title="Comparar" onClose={() => setOpen(false)}>
          <CompareTable items={picked} />
        </Modal>
      )}
    </>
  )
}
