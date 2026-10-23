import { useMemo, useState } from 'react'
import { seriesOf, waLink } from '../lib/data'
import Catalog, { Grid } from './Catalog'
import Reveal from './Reveal'
import LogoBackdrop from './LogoBackdrop'
import { mapLink } from './MapEmbed'
import Visit from './Visit'
import CreditSimulator from './CreditSimulator'

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

export function PhonesPage({ products, onOpen, onAdd, initialSerie }) {
  const [serie, setSerie] = useState(initialSerie || 'todos')

  const iphones = useMemo(() => products.filter((p) => !p.hidden && p.category === 'iphone'), [products])
  const series = useMemo(
    () => [...new Set(iphones.map(seriesOf).filter(Boolean))].sort((a, b) => b - a),
    [iphones],
  )
  const bySerie = useMemo(() => iphones.filter((p) => serie === 'todos' || seriesOf(p) === serie), [iphones, serie])

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
            <Catalog
              products={bySerie}
              onOpen={onOpen}
              onAdd={onAdd}
              lead={
                <div className="pills" role="group" aria-label="Filtrar por generación">
                  {['todos', ...series].map((s) => (
                    <button key={s} className={`pill ${serie === s ? 'on' : ''}`} aria-pressed={serie === s} onClick={() => setSerie(s)}>
                      {s === 'todos' ? 'Todos' : `iPhone ${s}`}
                    </button>
                  ))}
                </div>
              }
            />
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
            <Catalog products={list} onOpen={onOpen} onAdd={onAdd} empty="Pronto tendremos accesorios disponibles." />
          </Reveal>
        </div>
      </section>
    </>
  )
}

// Página genérica de una categoría creada desde el panel (perfumes, MacBook, relojes…).
export function CategoryPage({ id, categories, products, onOpen, onAdd }) {
  const category = categories.find((c) => c.id === id)
  const list = useMemo(() => products.filter((p) => !p.hidden && p.category === id), [products, id])

  if (!category) {
    return (
      <>
        <PageHead eyebrow="Tienda" title="No encontramos esa categoría." />
        <section className="section">
          <div className="wrap">
            <a className="btn btn-ghost" href="#/">Volver al inicio</a>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow="Tienda" title={`${category.label}.`} subtitle="Todo original, disponible en el local o por WhatsApp." />
      <section className="section">
        <div className="wrap">
          <Reveal className="panel">
            <Catalog products={list} onOpen={onOpen} onAdd={onAdd} empty={`Pronto tendremos ${category.label.toLowerCase()} disponibles.`} />
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

export function CreditPage({ products, settings, onOpen, onAdd }) {
  const { whatsapp } = settings
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

      <section className="section" aria-labelledby="simulador">
        <div className="wrap">
          <Reveal className="panel">
            <header className="section-head">
              <p className="eyebrow">Simulador</p>
              <h2 className="h2" id="simulador">
                Calcula tu cuota
              </h2>
              <p className="sub">Elige el celular, la cuota inicial y el plazo.</p>
            </header>
            <CreditSimulator products={products} settings={settings} />
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
        </div>
      </section>

      <Visit settings={settings} />
    </>
  )
}
