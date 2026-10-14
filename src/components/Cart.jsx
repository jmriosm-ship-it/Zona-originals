import { useEffect, useState } from 'react'
import { fmtPrice, waLink } from '../lib/data'
import { LOGO } from '../lib/assets'

export default function Cart({ items, whatsapp, onClose, onQty, onClear }) {
  const [financed, setFinanced] = useState(false)
  const total = items.reduce((s, { product, qty }) => s + product.price * qty, 0)
  const canFinance = items.some(({ product }) => product.credit)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const message = () => {
    const lines = items.map(
      ({ product: p, qty }) =>
        `• ${qty} x ${p.name}${p.storage ? ` ${p.storage}` : ''}${p.color ? ` ${p.color}` : ''} — ${fmtPrice(p.price * qty)}`,
    )
    return [
      'Hola Zona Originals, quiero hacer este pedido:',
      ...lines,
      `Total: ${fmtPrice(total)}`,
      financed && canFinance ? 'Me interesa pagarlo a crédito, ¿qué requisitos hay?' : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  return (
    <div className="overlay overlay-right" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h2 className="h3">Tu carrito</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar carrito" autoFocus>
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <p className="empty">Aún no has agregado nada.</p>
        ) : (
          <>
            <ul className="lines">
              {items.map(({ product: p, qty }) => (
                <li key={p.id} className="line">
                  <div className="line-img">
                    {p.images[0] ? <img src={p.images[0]} alt="" /> : <img src={LOGO} alt="" className="dim" />}
                  </div>
                  <div className="line-info">
                    <p className="line-name">{p.name}</p>
                    <p className="card-spec">{[p.storage, p.color].filter(Boolean).join(' · ')}</p>
                    <div className="qty">
                      <button onClick={() => onQty(p.id, qty - 1)} aria-label="Quitar uno">
                        −
                      </button>
                      <span aria-live="polite">{qty}</span>
                      <button onClick={() => onQty(p.id, qty + 1)} disabled={qty >= p.stock} aria-label="Agregar uno">
                        +
                      </button>
                    </div>
                  </div>
                  <p className="line-price">{fmtPrice(p.price * qty)}</p>
                </li>
              ))}
            </ul>

            <footer className="drawer-foot">
              {canFinance && (
                <label className="check">
                  <input type="checkbox" checked={financed} onChange={(e) => setFinanced(e.target.checked)} />
                  Quiero consultar el pago a crédito
                </label>
              )}
              <div className="total">
                <span>Total</span>
                <strong>{fmtPrice(total)}</strong>
              </div>
              <a className="btn btn-primary btn-block" href={waLink(whatsapp, message())} target="_blank" rel="noreferrer">
                Pedir por WhatsApp
              </a>
              <button className="link-btn" onClick={onClear}>
                Vaciar carrito
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
