import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MODEL_LABELS, categoryHref, colorStock, colorsOf, creditkind, fmtPrice, has3d, modelKind, waLink } from '../lib/data'
import BoxViewer from './BoxViewer'
import Placeholder from './Placeholder'
import LogoBackdrop from './LogoBackdrop'
import Modal from './Modal'
import Reveal from './Reveal'
import ReviewForm from './ReviewForm'

const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

export default function ProductPage({ product, category, whatsapp, warranty, onAdd, onReview }) {
  const colors = colorsOf(product)
  const [colorIdx, setColorIdx] = useState(0)
  const [shot, setShot] = useState(0)
  const canSpin = has3d(product)
  const hasPhotos = product.images.length > 0
  const hasBox = Boolean(product.boxImage)
  // Vistas disponibles: el celular 3D (cambia de color), la caja 3D (a partir de su foto) y las fotos.
  const views = [
    canSpin && ['3d', MODEL_LABELS[modelKind(product)]],
    hasBox && ['caja', 'Caja 3D'],
    (hasPhotos || (!canSpin && !hasBox)) && ['fotos', 'Fotos'],
  ].filter(Boolean)
  const [view, setView] = useState(views[0][0])
  const [showWarranty, setShowWarranty] = useState(false)
  const [barVisible, setBarVisible] = useState(false)
  const buyRef = useRef(null)

  // La barra de compra aparece cuando el bloque de compra ya salió de la pantalla hacia arriba.
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const el = buyRef.current
      if (el) setBarVisible(el.getBoundingClientRect().bottom < 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [product.id])

  // Sube los botones de redes para que no queden detrás de la barra.
  useEffect(() => {
    document.body.classList.toggle('has-buybar', barVisible)
    return () => document.body.classList.remove('has-buybar')
  }, [barVisible])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [product.id])

  const color = colors[Math.min(colorIdx, colors.length - 1)]
  const left = colorStock(product, color)
  const out = left <= 0
  const soldOut = product.stock <= 0 // todos los colores en 0
  const hasColors = Boolean(product.colors?.length)
  const highlights = (product.highlights ?? []).filter((h) => h.trim())
  // Los productos de ejemplo muestran una reseña de muestra para ver el diseño; desaparece al guardarlos.
  const all = product.reviews ?? []
  const reviews = all.length || !product.demo ? all.filter((r) => r.status !== 'pending') : [{ name: 'Cliente de ejemplo', rating: 5, text: 'Así se verá una reseña de un cliente. Puedes escribir las reales desde el panel de administración.', demo: true }]
  const average = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0

  // Una por línea: "Pantalla: 6,9 pulgadas". Las líneas sin dos puntos se ignoran.
  const specs = (product.specs ?? '')
    .split('\n')
    .map((l) => l.split(/:(.*)/s))
    .filter(([k, v]) => k?.trim() && v?.trim())
    .map(([k, v]) => [k.trim(), v.trim()])

  const facts = [
    [product.storage, category?.specLabel || 'Detalle'],
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
        <a className="back" href={category ? categoryHref(category.id) : '#/'}>
          ‹ Volver a la tienda
        </a>

        <header className="pdp-head">
          {soldOut && <span className="tag tag-solo tag-out">Agotado</span>}
          {!soldOut && product.credit && <span className="tag tag-solo">Crédito disponible</span>}
          <h1 className="display display-md">{product.name}</h1>
          {product.description && <p className="lead">{product.description}</p>}
        </header>
      </div>

      <div className="stage-wrap">
      <section className="stage" style={{ "--tint": color.hex }} aria-label={`Vista de ${product.name}`}>
        {views.length > 1 && (
          <div className="seg" role="tablist" aria-label="Tipo de vista">
            {views.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'on' : ''} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {view === '3d' && canSpin ? (
          <BoxViewer product={product} mode={modelKind(product)} color={color.hex} />
        ) : view === 'caja' && hasBox ? (
          <BoxViewer product={product} />
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
        <LogoBackdrop className="backdrop-corner backdrop-tl" drift={0.06} />
        <LogoBackdrop className="backdrop-corner backdrop-br" drift={0.06} />
      </div>

      <div className="wrap buy" ref={buyRef}>
        {colors.length > 1 && (
          <div className="swatches" role="radiogroup" aria-label="Color">
            {colors.map((c, i) => (
              <button
                key={c.name}
                role="radio"
                aria-checked={i === colorIdx}
                aria-label={c.name}
                title={c.name}
                className={`swatch ${i === colorIdx ? 'on' : ''} ${colorStock(product, c) <= 0 ? 'soldout' : ''}`}
                style={{ '--c': c.hex }}
                onClick={() => setColorIdx(i)}
              />
            ))}
          </div>
        )}
        <p className="color-name">{color.name}</p>
        <p className={`stock-left ${out ? 'out' : left <= 3 ? 'low' : ''}`}>
          {out ? (hasColors ? 'Agotado en este color' : 'Agotado') : `${left} ${left === 1 ? 'disponible' : 'disponibles'}${hasColors ? ` en ${color.name}` : ''}`}
        </p>
        <p className="price price-xl">{fmtPrice(product.price)}</p>

        <div className="actions">
          <button className="btn btn-primary btn-buy" disabled={out} onClick={() => onAdd(product, color)}>
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

      <div className="wrap">
        <div className="trust">
          <div className="trust-tile">
            <strong>Original</strong>
            <span>Producto 100% original, sin sorpresas.</span>
          </div>
          <button type="button" className="trust-tile trust-link" onClick={() => setShowWarranty(true)}>
            <strong>Garantía</strong>
            <span>Toca para ver qué cubre.</span>
          </button>
          
          {creditkind(product)=== 'simulador' ? (
            <a className="trust-tile trust-link" href="#/credito">
              <strong>Crédito</strong>
              <span>Simula tu cuota con este equipo.</span>
            </a>
          ) : creditkind(product) === 'addi' ? (
            <div className="trust-tile credit-partners">
              <strong>Págalo a cuotas</strong>
              <span>Con Addi o Sistecrédito.</span>
              <span className="credit-logos">
                <img src={`${import.meta.env.BASE_URL}addi.jpg`} alt="Addi" />
                <img src={`${import.meta.env.BASE_URL}sistecredito.png`} alt="Sistecrédito"/>
              </span>
            </div>
          ) : (
            <a className="trust-tile trust-link" href={ask} target="_blank" rel="noreferrer">
              <strong>Atención directa</strong>
              <span>Pregunta por whatsapp, sin intermediarios.</span>
            </a>
          )}
          
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

      {specs.length > 0 && (
        <Reveal className="wrap" as="section" aria-labelledby="specs">
          <div className="panel specs">
            <h2 className="h2" id="specs">
              Especificaciones
            </h2>
            <dl>
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      )}

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
      {createPortal(
      <div className={`buybar ${barVisible ? 'on' : ''}`} aria-hidden={!barVisible}>
        <div className="buybar-info">
          <strong>{product.name}</strong>
          <span>{color.name}</span>
        </div>
        <span className="buybar-price">{fmtPrice(product.price)}</span>
        <button className="btn btn-primary btn-buy btn-sm" tabIndex={barVisible ? 0 : -1} disabled={out} onClick={() => onAdd(product, color)}>
          {out ? 'Agotado' : 'Agregar'}
        </button>
      </div>,
      document.body,
      )}

      {showWarranty && (
        <Modal title="Garantía" onClose={() => setShowWarranty(false)}>
          {(warranty || '').trim() ? (
            warranty.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="modal-text">
                {para}
              </p>
            ))
          ) : (
            <p className="modal-text">Estamos preparando la información de garantía. Escríbenos por WhatsApp y te contamos.</p>
          )}
        </Modal>
      )}
    </article>
  )
}
