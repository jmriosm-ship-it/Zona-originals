import { useMemo, useState } from 'react'
import { seriesOf, waLink } from '../lib/data'
import ProductCard from './ProductCard'
import Reveal from './Reveal'
import LogoBackdrop from './LogoBackdrop'
import MapEmbed, { mapLink } from './MapEmbed'

const SORTS = {
  recent: 'Más recientes',
  asc: 'Precio: menor a mayor',
  desc: 'Precio: mayor a menor',
}

export function PageHead({ eyebrow, title, subtitle }) {
  return (
    <section className="page-hero">
      <LogoBackdrop />
      <header className="wrap page-head">
        {eyebrow && (
          <p className="eyebrow rise" style={{ '--i': 0 }}>
            {eyebrow}
          </p>
        )}
        <h1 className="display display-md rise" style={{ '--i': 1 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="lead rise" style={{ '--i': 2 }}>
            {subtitle}
          </p>
        )}
      </header>
    </section>
  )
}

export function Grid({ products, onOpen, onAdd, empty = 'No encontramos productos con ese filtro.' }) {
  if (!products.length) return <p className="empty">{empty}</p>
  return (
    <div className="grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} onOpen={onOpen} onAdd={onAdd} />
      ))}
    </div>
  )
}

export function PhonesPage({ products, onOpen, onAdd, initialSerie }) {
  const [serie, setSerie] = useState(initialSerie || 'todos')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')

  const iphones = useMemo(() => products.filter((p) => !p.hidden && p.category === 'iphone'), [products])
  const series = useMemo(
    () => [...new Set(iphones.map(seriesOf).filter(Boolean))].sort((a, b) => b - a),
    [iphones],
  )

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = iphones.filter(
      (p) =>
        (serie === 'todos' || seriesOf(p) === serie) &&
        (!q || `${p.name} ${p.color} ${p.storage}`.toLowerCase().includes(q)),
    )
    if (sort === 'asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'desc') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [iphones, serie, query, sort])

  return (
    <>
      <PageHead eyebrow="Celulares" title="iPhone." subtitle="Del 13 en adelante, originales y listos para llevar." />

      {series.length > 0 && (
        <section className="section" aria-label="Elige tu generación">
          <div className="wrap">
            <div className="gens">
              {series.map((s, i) => (
                <Reveal
                  as="button"
                  key={s}
                  delay={i * 70}
                  className={`gen ${serie === s ? 'on' : ''}`}
                  aria-pressed={serie === s}
                  onClick={() => setSerie(serie === s ? 'todos' : s)}
                >
                  <span className="gen-num">{s}</span>
                  <span className="gen-label">iPhone {s}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <Reveal className="panel">
            <div className="toolbar">
              <div className="pills" role="group" aria-label="Filtrar por generación">
                {['todos', ...series].map((s) => (
                  <button key={s} className={`pill ${serie === s ? 'on' : ''}`} aria-pressed={serie === s} onClick={() => setSerie(s)}>
                    {s === 'todos' ? 'Todos' : `iPhone ${s}`}
                  </button>
                ))}
              </div>
              <div className="tools">
                <input className="search" type="search" placeholder="Buscar modelo" aria-label="Buscar modelo" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select className="select" aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {Object.entries(SORTS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Grid products={shown} onOpen={onOpen} onAdd={onAdd} />
          </Reveal>
        </div>
      </section>
    </>
  )
}

export function AccessoriesPage({ products, onOpen, onAdd }) {
  const list = products.filter((p) => !p.hidden && p.category === 'accesorio')
  return (
    <>
      <PageHead eyebrow="Accesorios" title="Todo original." subtitle="Cargadores, cables, audífonos y más para tu iPhone." />
      <section className="section">
        <div className="wrap">
          <Reveal className="panel">
            <Grid products={list} onOpen={onOpen} onAdd={onAdd} empty="Pronto tendremos accesorios disponibles." />
          </Reveal>
        </div>
      </section>
    </>
  )
}

const STEPS = [
  ['1', 'Elige tu iPhone', 'Revisa el catálogo y escoge el modelo que quieres, del 13 en adelante.'],
  ['2', 'Escríbenos', 'Cuéntanos por WhatsApp cuál te gusta y que lo quieres a crédito.'],
  ['3', 'Te asesoramos', 'Te explicamos los requisitos y cómo quedan tus cuotas.'],
]

export function CreditPage({ products, whatsapp, onOpen, onAdd }) {
  const link = waLink(whatsapp, 'Hola Zona Originals, quiero información sobre iPhone a crédito.')
  const credit = products.filter((p) => !p.hidden && p.credit && p.category === 'iphone')
  return (
    <>
      <PageHead eyebrow="Crédito" title="iPhone a crédito." subtitle="Estrena sin pagar todo de una vez." />

      <section className="section">
        <div className="wrap">
          <div className="steps">
            {STEPS.map(([n, t, d], i) => (
              <Reveal className="step" key={n} delay={i * 90}>
                <span className="gen-num">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="actions">
            <a className="btn btn-primary" href={link} target="_blank" rel="noreferrer">
              Consultar crédito por WhatsApp
            </a>
          </Reveal>
        </div>
      </section>

      {credit.length > 0 && (
        <section className="section">
          <div className="wrap">
            <Reveal className="panel">
              <header className="section-head">
                <h2 className="h2">Disponibles a crédito</h2>
              </header>
              <Grid products={credit} onOpen={onOpen} onAdd={onAdd} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  )
}

export function ContactPage({ settings }) {
  const { whatsapp, tiktok, city } = settings
  const cards = [
    ['Visítanos', city, 'Ver en el mapa', mapLink(settings)],
    ['WhatsApp', 'Escríbenos para pedidos, precios y crédito.', 'Abrir WhatsApp', waLink(whatsapp, 'Hola Zona Originals')],
    ['TikTok', `@${tiktok}`, 'Ver videos', `https://www.tiktok.com/@${tiktok}`],
  ]
  return (
    <>
      <PageHead eyebrow="Contacto" title="Habla con nosotros." subtitle="Estamos para ayudarte a elegir tu próximo iPhone." />
      <section className="section">
        <div className="wrap">
          <div className="steps">
            {cards.map(([t, d, cta, href], i) => (
              <Reveal className="step" key={t} delay={i * 90}>
                <h3>{t}</h3>
                <p>{d}</p>
                <a className="btn btn-ghost btn-sm" href={href} target="_blank" rel="noreferrer">
                  {cta}
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <MapEmbed settings={settings} />
          </Reveal>
        </div>
      </section>
    </>
  )
}
