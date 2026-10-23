import BoxViewer from './BoxViewer'
import LogoBackdrop from './LogoBackdrop'
import { colorsOf, fmtPrice, has3d, modelKind } from '../lib/data'

// Si hay un celular con fotos 3D disponible, la portada lo muestra girando al lado del título.
export default function Hero({ city, product }) {
  const color = product ? colorsOf(product)[0] : null

  return (
    <>
      <div className="strip">
        <p>
          iPhone a crédito · {city}. <a href="#/credito">Conoce cómo funciona</a>
        </p>
      </div>

      <section className={`hero ${product ? 'hero-split' : ''}`}>
        <LogoBackdrop />
        <div className="wrap hero-in">
          <div className="hero-copy">
            <p className="eyebrow rise" style={{ '--i': 0 }}>
              Productos Apple
            </p>
            <h1 className="display">
              <span className="line rise" style={{ '--i': 1 }}>
                Tecnologia sin
              </span>
              <span className="line rise" style={{ '--i': 2 }}>
                complicaciones.
              </span>
            </h1>
            <p className="lead rise" style={{ '--i': 3 }}>
              Los mejores iPhone y accesorios originales, con la opción de llevártelo a crédito.
            </p>
            <div className="actions rise" style={{ '--i': 4 }}>
              <a className="btn btn-primary" href="#/celulares">
                Ver celulares
              </a>
              <a className="btn btn-ghost" href="#/credito">
                Quiero a crédito
              </a>
            </div>
          </div>

          {product && (
            <a className="hero-stage rise" style={{ '--i': 3 }} href={`#/p/${encodeURIComponent(product.id)}`} aria-label={`Ver ${product.name}`}>
              {has3d(product) ? (
                <BoxViewer product={product} mode={modelKind(product)} color={color.hex} />
              ) : product.boxImage ? (
                <BoxViewer product={product} />
              ) : (
                <img className="hero-photo" src={product.images[0]} alt={product.name} />
              )}
              <span className="hero-stage-tag">
                {product.bestseller && <em>Más vendido</em>}
                {product.name} · {fmtPrice(product.price)}
              </span>
            </a>
          )}
        </div>
      </section>
    </>
  )
}
