import Hero from './Hero'
import Reveal from './Reveal'
import ProductCard from './ProductCard'
import { waLink } from '../lib/data'
import MapEmbed, { mapLink } from './MapEmbed'


const PATHS = [
  ['#/celulares', 'Celulares', 'iPhone del 13 en adelante.'],
  ['#/accesorios', 'Accesorios', 'Cargadores, cables y más.'],
  ['#/credito', 'Crédito', 'Llévatelo con cuotas.'],
]

const PILLARS = [
  ['Originales', 'iPhone y accesorios originales, sin sorpresas.'],
  ['A crédito', 'Te asesoramos con los requisitos y las cuotas.'],
  ['Atención directa', 'Hablas con el local por WhatsApp, sin intermediarios.'],
]

export default function Home({ products, settings, onOpen, onAdd }) {
  const featured = products.filter((p) => !p.hidden && p.category === 'iphone').slice(0, 4)
  const { whatsapp, tiktok, city } = settings

  return (
    <>
      <Hero city={city} />

      <section className="section">
        <div className="wrap">
          <div className="paths">
            {PATHS.map(([href, t, d], i) => (
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
              {PILLARS.map(([t, d], i) => (
                <Reveal className="step" key={t} delay={i * 90}>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </Reveal>
              ))}
            </div>

            <MapEmbed settings={settings} />

            <div className="actions">
              <a className="btn btn-primary" href={waLink(whatsapp, 'Hola Zona Originals')} target="_blank" rel="noreferrer">
                Escribir por WhatsApp
              </a>
              <a className="btn btn-ghost" href={mapLink(settings)} target="_blank" rel="noreferrer">
                Cómo llegar
              </a>
              <a className="btn btn-ghost" href={`https://www.tiktok.com/@${tiktok}`} target="_blank" rel="noreferrer">
                TikTok
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
