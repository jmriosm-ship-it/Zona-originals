import { useEffect, useState } from 'react'
import { colorsOf, fmtPrice, has3d, waLink } from '../lib/data'
import { variantOf } from '../lib/variant'
import PhoneViewer from './PhoneViewer'
import Placeholder from './Placeholder'
import Reveal from './Reveal'
import ReviewForm from './ReviewForm'

const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

export default function ProductPage({ product, section, whatsapp, onAdd, onReview }) {
  const colors = colorsOf(product)
  const [colorIdx, setColorIdx] = useState(0)
  const [shot, setShot] = useState(0)
  const canSpin = has3d(product)
  const hasPhotos = product.images.length > 0
  const [view, setView] = useState(canSpin ? '3d' : 'fotos')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [product.id])

  const color = colors[Math.min(colorIdx, colors.length - 1)]
  const out = product.stock <= 0
  const highlights = (product.highlights ?? []).filter((h) => h.trim())
  // Los productos de ejemplo muestran una reseña de muestra para ver el diseño; desaparece al guardarlos.
  const all = product.reviews ?? []
  const reviews = all.length || !product.demo ? all.filter((r) => r.status !== 'pending') : [{ name: 'Cliente de ejemplo', rating: 5, text: 'Así se verá una reseña de un cliente. Puedes escribir las reales desde el panel de administración.', demo: true }]
  const average = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0

  const facts = [
    [product.storage, 'Almacenamiento'],
    [product.condition, 'Estado'],
    [product.credit ? 'Sí' : 'No', 'Pago a crédito'],
    [out ? 'Agotado' : `${product.stock}`, 'Disponibles'],
  ].filter(([v]) => v)

  const ask = waLink(
    whatsapp,
    `Hola Zona Originals, me interesa el ${product.name}${product.storage ? ` ${product.storage}` : ''} en ${color.name}. ¿Sigue disponible?`,
  )

  return (
    <article className="pdp">
      <div className="wrap">
        <a className="back" href={section === 'celulares' ? '#/celulares' : '#/accesorios'}>
          ‹ Volver a la tienda
        </a>

        <header className="pdp-head">
          {product.credit && <span className="tag tag-solo">Crédito disponible</span>}
          <h1 className="display display-md">{product.name}</h1>
          {product.description && <p className="lead">{product.description}</p>}
        </header>
      </div>

      <section className="stage" style={{ "--tint": color.hex }} aria-label={`Vista de ${product.name}`}>
        {canSpin && hasPhotos && (
          <div className="seg" role="tablist" aria-label="Tipo de vista">
            <button role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'on' : ''} onClick={() => setView('3d')}>
              3D
            </button>
            <button role="tab" aria-selected={view === 'fotos'} className={view === 'fotos' ? 'on' : ''} onClick={() => setView('fotos')}>
              Fotos
            </button>
          </div>
        )}

        {view === '3d' && canSpin ? (
          <PhoneViewer product={product} color={color.hex} variant={variantOf(product.name)} />
        ) : (
          <div className="viewer">
            <div className="photo-stage">
              {hasPhotos ? <img src={product.images[shot]} alt={product.name} /> : <Placeholder product={product} color={color.hex} />}
            </div>
            {product.images.length > 1 && (
              <div className="thumbs thumbs-center">
                {product.images.map((src, i) => (
                  <button key={i} className={`thumb ${i === shot ? 'on' : ''}`} onClick={() => setShot(i)} aria-label={`Foto ${i + 1}`}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="wrap buy">
        {colors.length > 1 && (
          <div className="swatches" role="radiogroup" aria-label="Color">
            {colors.map((c, i) => (
              <button
                key={c.name}
                role="radio"
                aria-checked={i === colorIdx}
                aria-label={c.name}
                title={c.name}
                className={`swatch ${i === colorIdx ? 'on' : ''}`}
                style={{ '--c': c.hex }}
                onClick={() => setColorIdx(i)}
              />
            ))}
          </div>
        )}
        <p className="color-name">{color.name}</p>
        <p className="price price-xl">{fmtPrice(product.price)}</p>

        <div className="actions">
          <button className="btn btn-primary" disabled={out} onClick={() => onAdd(product)}>
            {out ? 'Agotado' : 'Agregar al carrito'}
          </button>
          <a className="btn btn-ghost" href={ask} target="_blank" rel="noreferrer">
            Preguntar por WhatsApp
          </a>
        </div>
      </div>

      <div className="wrap">
        <div className="facts">
          {facts.map(([v, l]) => (
            <div className="fact" key={l}>
              <strong>{v}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <Reveal className="wrap section-about" as="section" aria-labelledby="sobre">
        <div className="panel about">
          <div>
            <p className="eyebrow">Sobre este {product.category === 'iphone' ? 'iPhone' : 'producto'}</p>
            <h2 className="h2" id="sobre">
              {product.name}
            </h2>
            <p className="about-text">{product.about?.trim() || product.description || 'Producto original disponible en Zona Originals.'}</p>
          </div>
          {highlights.length > 0 && (
            <ul className="ticks">
              {highlights.map((h, i) => (
                <li key={h} style={{ '--i': i }}>
                  <span aria-hidden="true">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Reveal className="wrap section-reviews" as="section" aria-labelledby="resenas">
        <div className="panel">
          <header className="section-head">
            <h2 className="h2" id="resenas">
              Reseñas
            </h2>
            {reviews.length > 0 ? (
              <p className="sub">
                <span className="stars" aria-hidden="true">
                  {stars(average)}
                </span>{' '}
                {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
              </p>
            ) : (
              <p className="sub">Aún no hay reseñas de este producto.</p>
            )}
          </header>

          {reviews.length > 0 && (
            <div className="reviews">
              {reviews.map((r, i) => (
                <Reveal as="figure" className="review" key={i} delay={i * 80}>
                  <p className="stars" role="img" aria-label={`${r.rating} de 5 estrellas`}>
                    {stars(r.rating)}
                  </p>
                  <blockquote>{r.text}</blockquote>
                  <figcaption>
                    {r.name || 'Cliente'}
                    {r.demo && <span className="tag">Ejemplo</span>}
                  </figcaption>
                </Reveal>
              ))}
            </div>
          )}

          <ReviewForm onSubmit={(r) => onReview(product.id, r)} />
        </div>
      </Reveal>
    </article>
  )
}
