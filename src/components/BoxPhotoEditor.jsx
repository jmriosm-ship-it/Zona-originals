import { useEffect, useRef, useState } from 'react'
import { rectify } from '../lib/rectify'

const START = [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]]
const REGION_START = [[0.08, 0.04], [0.55, 0.04], [0.55, 0.3], [0.08, 0.3]]

// El administrador marca las 4 esquinas de la tapa de la caja y se genera la textura plana para el 3D.
export default function BoxPhotoEditor({ src, onDone, onCancel, region = false, hint = 'Arrastra los 4 puntos hasta las esquinas de la tapa de la caja (solo el frente, sin el fondo). Con eso se arma la caja en 3D.' }) {
  const start = region ? REGION_START : START
  const [corners, setCorners] = useState(start)
  const [busy, setBusy] = useState(false)
  const imgRef = useRef(null)
  const boxRef = useRef(null)
  const drag = useRef(-1)

  useEffect(() => setCorners(start), [src, start])

  const move = (e) => {
    if (drag.current < 0) return
    const r = boxRef.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    setCorners((c) => c.map((p, i) => (i === drag.current ? [x, y] : p)))
  }

  const apply = () => {
    setBusy(true)
    // Deja pintar el estado "Procesando" antes del cálculo.
    setTimeout(() => {
      if (region) {
        const xs = corners.map((c) => c[0])
        const ys = corners.map((c) => c[1])
        onDone({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) })
        setBusy(false)
        return
      }
      onDone(rectify(imgRef.current, corners))
      setBusy(false)
    }, 30)
  }

  const poly = corners.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')

  return (
    <div className="box-editor">
      <p className="label">{hint}</p>
      <div className="box-editor-stage" ref={boxRef} onPointerMove={move} onPointerUp={() => (drag.current = -1)} onPointerCancel={() => (drag.current = -1)}>
        <img ref={imgRef} src={src} alt="Foto de la caja para marcar" draggable="false" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points={poly} />
        </svg>
        {corners.map(([x, y], i) => (
          <button
            key={i}
            type="button"
            className="box-handle"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            aria-label={`Esquina ${i + 1}`}
            onPointerDown={(e) => {
              drag.current = i
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
          />
        ))}
      </div>
      <div className="actions actions-left">
        <button type="button" className="btn btn-primary btn-sm" onClick={apply} disabled={busy}>
          {busy ? 'Procesando…' : region ? 'Guardar cámara' : 'Convertir a 3D'}
        </button>
        {!region && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDone(src)} disabled={busy}>
            Usar la foto completa
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
