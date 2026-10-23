import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Ventana centrada con fondo oscuro: se cierra con Escape, con la X o tocando afuera.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Se dibuja directamente en <body> para que siempre cubra la pantalla, sin importar dónde se use.
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h2 className="h3">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar" autoFocus>
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
