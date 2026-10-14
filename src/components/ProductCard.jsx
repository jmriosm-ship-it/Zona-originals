import { colorsOf, fmtPrice } from '../lib/data'
import Placeholder from './Placeholder'

export default function ProductCard({ product, index = 0, onOpen, onAdd }) {
  const out = product.stock <= 0
  const colors = colorsOf(product)
  const spec = [product.storage, colors.length > 1 ? `${colors.length} colores` : colors[0].name]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="card" style={{ "--i": Math.min(index, 8) }}>
      <button className="card-open" onClick={() => onOpen(product)} aria-label={`Ver ${product.name}`}>
        <div className="card-media">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} loading="lazy" />
          ) : (
            <Placeholder product={product} color={colors[0].hex} />
          )}
        </div>
        <div className="card-info">
          <p className="card-meta">
            {product.condition}
            {product.credit && <span className="tag">Crédito disponible</span>}
          </p>
          <h3>{product.name}</h3>
          {spec && <p className="card-spec">{spec}</p>}
          {colors.length > 1 && (
            <span className="dots" aria-hidden="true">
              {colors.map((c) => (
                <i key={c.name} style={{ background: c.hex }} />
              ))}
            </span>
          )}
        </div>
      </button>
      <div className="card-foot">
        <p className="price">{fmtPrice(product.price)}</p>
        <button className="btn btn-primary btn-sm" disabled={out} onClick={() => onAdd(product)}>
          {out ? 'Agotado' : 'Agregar'}
        </button>
      </div>
    </article>
  )
}
