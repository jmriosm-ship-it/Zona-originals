import { useState } from 'react'
import { uid } from '../lib/data'

const COOLDOWN_MS = 60_000

// Formulario para que el cliente deje su reseña. Queda "pendiente" hasta que el administrador la apruebe.
export default function ReviewForm({ onSubmit }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [trap, setTrap] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (trap) return // campo oculto: solo lo llenan los bots
    if (name.trim().length < 2) return setError('Escribe tu nombre.')
    if (text.trim().length < 10) return setError('Cuéntanos un poco más (mínimo 10 letras).')

    try {
      const last = Number(localStorage.getItem('zo-last-review') || 0)
      if (Date.now() - last < COOLDOWN_MS) return setError('Espera un momento antes de enviar otra reseña.')
      localStorage.setItem('zo-last-review', String(Date.now()))
    } catch {
      /* sin localStorage: se omite el límite */
    }

    onSubmit({
      id: uid(),
      name: name.trim().slice(0, 60),
      rating,
      text: text.trim().slice(0, 600),
      status: 'pending',
      createdAt: Date.now(),
    })
    setDone(true)
  }

  if (done) {
    return (
      <p className="review-thanks" role="status">
        ¡Gracias! Tu reseña se publicará cuando la revisemos.
      </p>
    )
  }

  if (!open) {
    return (
      <div className="actions">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Escribir una reseña
        </button>
      </div>
    )
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <h3>Tu reseña</h3>
      <label>
        Nombre
        <input className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      </label>

      <div>
        <p className="label">Calificación</p>
        <div className="star-input" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              className={n <= rating ? 'on' : ''}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label>
        Tu experiencia
        <textarea className="field" rows="4" value={text} maxLength={600} onChange={(e) => setText(e.target.value)} placeholder="¿Qué tal el equipo y la atención?" />
      </label>

      {/* Trampa para bots: las personas no ven este campo */}
      <input className="trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="legal-note">
        Al enviar tu reseña aceptas el tratamiento de tu nombre y comentario según nuestra <a href="#/privacidad">política de privacidad</a>.
      </p>
      <div className="actions actions-left">
        <button className="btn btn-primary" type="submit">
          Enviar reseña
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
