import { useState } from 'react'
import Hero from './Hero'
import Modal from './Modal'
import Reveal from './Reveal'
import ProductCard from './ProductCard'
import { categoryHref, has3d, waLink } from '../lib/data'
import Visit from './Visit'
import { Testimonials, TikTokVideos } from './Social'


// Un acceso por categoría (las crea el administrador) más Celulares y Crédito.
const pathsFor = (categories) => [
  ...(categories.some((c) => c.id === 'iphone') ? [['#/celulares', 'Celulares', 'iPhone del 13 en adelante.']] : []),
  ...categories.filter((c) => c.id !== 'iphone').map((c) => [categoryHref(c.id), c.label, 'Todo original.']),
  ['#/credito', 'Crédito', 'Llévatelo con cuotas.'],
]


export default function Home({ products, categories, settings, onOpen, onAdd }) {
  const [warranty, setWarranty] = useState(false)
  // Portada: el producto marcado como "Más vendido"; si no hay, el primero con modelo 3D disponible.
  const visible = products.filter((p) => !p.hidden && p.stock > 0)
  const heroProduct =
    visible.find((p) => p.bestseller && (has3d(p) || p.boxImage || p.images[0])) ?? visible.find((p) => has3d(p))
  const featured = products.filter((p) => !p.hidden && p.category === 'iphone').slice(0, 4)
  const { whatsapp, city } = settings

  return (
    <>
      <Hero city={city} product={heroProduct} />

      <section className="section">
        <div className="wrap">
          <div className="paths">
            {pathsFor(categories).map(([href, t, d], i) => (
              <Reveal as="a" key={t} href={href} className="path" delay={i * 90}>
                <span className="path-t">{t}</span>
                <span className="path-d">{d}</span>
                <span className="path-go" aria-hidden="true">
                  →
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <Reveal className="panel">
              <header className="section-head">
                <h2 className="h2">Destacados</h2>
                <p className="sub">Los iPhone que más se llevan.</p>
              </header>
              <div className="grid">
                {featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} onOpen={onOpen} onAdd={onAdd} />
                ))}
              </div>
              <div className="actions">
                <a className="btn btn-ghost" href="#/celulares">
                  Ver todos los celulares
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="local">
        <div className="wrap">
          <Reveal className="panel local">
            <header className="section-head">
              <p className="eyebrow">El local</p>
              <h2 className="h2" id="local">
                Zona Originals
              </h2>
              <p className="sub">
                Tienda de iPhone y accesorios originales en {city}. Compra en el local o pide por WhatsApp.
              </p>
            </header>

            <div className="steps">
              <Reveal as="button" type="button" className="step step-link" onClick={() => setWarranty(true)} delay={0}>
                <h3>Garantía</h3>
                <p>Conoce cómo respaldamos cada producto. Toca para ver los detalles.</p>
                <span className="step-go" aria-hidden="true">Ver información →</span>
              </Reveal>
              <Reveal as="a" href="#/credito" className="step step-link" delay={90}>
                <h3>A crédito</h3>
                <p>Simula tu cuota: elige el celular, la cuota inicial y los meses.</p>
                <span className="step-go" aria-hidden="true">Ir al simulador →</span>
              </Reveal>
              <Reveal
                as="a"
                href={waLink(whatsapp, 'Hola Zona Originals, quiero hablar con un asesor.')}
                target="_blank"
                rel="noreferrer"
                className="step step-link"
                delay={180}
              >
                <h3>Atención directa</h3>
                <p>Hablas con el local por WhatsApp, sin intermediarios.</p>
                <span className="step-go" aria-hidden="true">Escribir por WhatsApp →</span>
              </Reveal>
            </div>
          </Reveal>
        </div>
      </section>

      <Testimonials products={products} />

      <TikTokVideos settings={settings} />

      <Visit settings={settings} />

      {warranty && (
        <Modal title="Garantía" onClose={() => setWarranty(false)}>
          {(settings.warranty || '').trim() ? (
            (settings.warranty || '')
              .split(/\n{2,}/)
              .map((para, i) => (
                <p key={i} className="modal-text">
                  {para}
                </p>
              ))
          ) : (
            <p className="modal-text">Estamos preparando la información de garantía. Mientras tanto, escríbenos por WhatsApp y te contamos.</p>
          )}
          <div className="actions">
            <a className="btn btn-primary" href={waLink(whatsapp, 'Hola Zona Originals, quiero información sobre la garantía.')} target="_blank" rel="noreferrer">
              Preguntar por WhatsApp
            </a>
          </div>
        </Modal>
      )}
    </>
  )
}
