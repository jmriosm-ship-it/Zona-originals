import { useMemo } from 'react'
import { SHOWCASES, colorsOf, fmtPrice, has3d, modelKind, waLink } from '../lib/data'
import BoxViewer from './BoxViewer'
import Catalog from './Catalog'
import LogoBackdrop from './LogoBackdrop'
import Placeholder from './Placeholder'
import Reveal from './Reveal'

const specsOf = (p) =>
  (p.specs ?? '')
    .split('\n')
    .map((l) => l.split(/:(.*)/s))
    .filter(([k, v]) => k?.trim() && v?.trim())
    .map(([k, v]) => [k.trim(), v.trim()])

// Página de una categoría fija (MacBook, Relojes) al estilo de Apple: escenario negro, titular grande,
// producto en un marco de 28px, datos principales y los modelos disponibles.
export default function Showcase({ category, products, settings, onOpen, onAdd }) {
  const text = SHOWCASES[category.id]
  const list = useMemo(() => products.filter((p) => !p.hidden && p.category === category.id), [products, category.id])
  const featured = list.find((p) => p.stock > 0) ?? list[0]
  const tiles = featured ? specsOf(featured).slice(0, 4) : []
  const href = featured ? `#/p/${encodeURIComponent(featured.id)}` : null
  const ask = waLink(settings.whatsapp, `Hola Zona Originals, quiero información sobre ${category.label}.`)

  return (
    <>
      <section className="showcase-hero">
        <LogoBackdrop />
        <div className="wrap showcase-in">
          <p className="showcase-eyebrow rise" style={{ '--i': 0 }}>
            {text.eyebrow}
          </p>
          <h1 className="display rise" style={{ '--i': 1 }}>
            {text.title}
          </h1>
          <p className="lead rise" style={{ '--i': 2 }}>
            {text.lead}
          </p>

          {featured ? (
            <div className="showcase-stage rise" style={{ '--i': 3 }}>
              <a href={href} className="showcase-media" aria-label={`Ver ${featured.name}`}>
                {has3d(featured) ? (
                  <BoxViewer product={featured} mode={modelKind(featured)} color={colorsOf(featured)[0].hex} />
                ) : featured.boxImage ? (
                  <BoxViewer product={featured} />
                ) : featured.images[0] ? (
                  <img src={featured.images[0]} alt={featured.name} />
                ) : (
                  <Placeholder product={featured} color={colorsOf(featured)[0].hex} />
                )}
              </a>
              <div className="showcase-bar">
                <span className="showcase-name">{featured.name}</span>
                <span className="glass-pill">{fmtPrice(featured.price)}</span>
                <a className="btn btn-primary btn-buy btn-sm" href={href}>
                  Comprar
                </a>
              </div>
            </div>
          ) : (
            <div className="showcase-empty rise" style={{ '--i': 3 }}>
              <p>Pronto tendremos {category.label.toLowerCase()} disponibles.</p>
              <a className="btn btn-primary btn-buy" href={ask} target="_blank" rel="noreferrer">
                Preguntar por WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {tiles.length > 0 && (
        <section className="section" aria-labelledby="principal">
          <div className="wrap">
            <Reveal>
              <h2 className="showcase-h2" id="principal">
                {text.tilesTitle}
              </h2>
            </Reveal>
            <div className="tiles">
              {tiles.map(([k, v], i) => (
                <Reveal className="tile" key={k} delay={i * 80}>
                  <strong>{v}</strong>
                  <span>{k}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="modelos">
        <div className="wrap">
          <Reveal className="panel">
            <header className="section-head">
              <h2 className="h2" id="modelos">
                {text.models}
              </h2>
              <p className="sub">Compara dos modelos, filtra por precio y mira cuáles hay disponibles.</p>
            </header>
            <Catalog products={list} onOpen={onOpen} onAdd={onAdd} empty={`Pronto tendremos ${category.label.toLowerCase()} disponibles.`} />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="panel showcase-cta">
            <h2 className="h2">¿Lo quieres a crédito?</h2>
            <p className="sub">Simula tu cuota o escríbenos y te asesoramos con los requisitos.</p>
            <div className="actions">
              <a className="btn btn-primary btn-buy" href="#/credito">
                Simular crédito
              </a>
              <a className="btn btn-ghost" href={ask} target="_blank" rel="noreferrer">
                Escribir por WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
