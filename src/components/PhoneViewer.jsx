import { useEffect, useRef, useState } from 'react'
import Placeholder from './Placeholder'

// Visor 3D del teléfono. Three.js se descarga solo cuando se abre una ficha de producto.
export default function PhoneViewer({ product, color, variant }) {
  const mountRef = useRef(null)
  const apiRef = useRef(null)
  const colorRef = useRef(color)
  const [state, setState] = useState('loading') // loading | ready | failed

  useEffect(() => {
    colorRef.current = color
    apiRef.current?.setColor(color)
  }, [color])

  useEffect(() => {
    let disposed = false
    let api = null
    import('../lib/phone3d')
      .then(({ createPhoneScene }) => {
        if (disposed) return
        api = createPhoneScene(mountRef.current, { color: colorRef.current, variant, name: product.name })
        apiRef.current = api
        setState('ready')
      })
      .catch(() => !disposed && setState('failed'))
    return () => {
      disposed = true
      apiRef.current = null
      api?.dispose()
    }
  }, [variant, product.name])

  if (state === 'failed') {
    return (
      <div className="viewer viewer-fallback">
        <Placeholder product={product} color={color} />
        <p className="hint">Tu navegador no puede mostrar el modelo 3D.</p>
      </div>
    )
  }

  return (
    <div className="viewer">
      <div ref={mountRef} className="viewer-mount" />
      {state === 'loading' && <p className="hint viewer-loading">Cargando modelo 3D…</p>}
      {state === 'ready' && <p className="hint">Arrastra para girar el {product.name}</p>}
    </div>
  )
}
