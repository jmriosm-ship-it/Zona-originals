import { useEffect, useRef, useState } from 'react'
import { BOX_DEPTHS } from '../lib/data'

// Visor 3D de la caja del producto, armada con la foto que sube el administrador.
// mode 'phone': celular armado con la foto de la pantalla y de la tapa; el marco toma el color elegido.
export default function BoxViewer({ product, mode = 'box', color }) {
  const solid = mode !== 'box'
  const phone = mode === 'phone'
  // Celular: si falta la pantalla se usa la tapa. Laptop y reloj dibujan una pantalla por defecto si falta.
  const front = phone ? product.phoneScreen || product.phoneBack : solid ? product.phoneScreen || '' : product.boxImage
  const back = solid ? product.phoneBack || '' : ''
  const mountRef = useRef(null)
  const apiRef = useRef(null)
  const colorRef = useRef(color)
  const [state, setState] = useState('loading') // loading | ready | failed
  const depth = solid ? 0.1 : (BOX_DEPTHS.find((d) => d.id === product.boxDepth)?.ratio ?? 0.34)

  useEffect(() => {
    colorRef.current = color
    apiRef.current?.setColor(color)
  }, [color])

  useEffect(() => {
    let disposed = false
    let api = null
    import('../lib/box3d')
      .then(({ createBoxScene }) => {
        if (disposed) return
        api = createBoxScene(mountRef.current, {
          image: front,
          faces: phone ? { ...product.phoneFaces, back } : solid ? { back, deck: product.laptopDeck } : (product.boxFaces ?? {}),
          depth,
          name: product.name,
          mode,
          color: colorRef.current,
          camera: phone ? product.phoneCamera : null,
        })
        apiRef.current = api
        setState('ready')
      })
      .catch(() => !disposed && setState('failed'))
    return () => {
      disposed = true
      apiRef.current = null
      api?.dispose()
    }
  }, [front, back, solid, phone, mode, product.boxFaces, product.phoneFaces, product.phoneCamera, product.laptopDeck, product.name, depth])

  if (state === 'failed') {
    return (
      <div className="viewer viewer-fallback">
        <div className="photo-stage">
          <img src={front} alt={product.name} />
        </div>
        <p className="hint">Tu navegador no puede mostrar el modelo 3D.</p>
      </div>
    )
  }

  return (
    <div className="viewer">
      <div ref={mountRef} className="viewer-mount" />
      {state === 'loading' && <div className="viewer-skeleton" aria-label="Cargando modelo 3D" role="status" />}
      {state === 'ready' && <p className="hint">Arrastra para girar {mode === 'laptop' ? 'la MacBook' : mode === 'watch' ? 'el reloj' : phone ? 'el celular' : 'la caja'}</p>}
      {state === 'ready' && (
        <div className="viewer-zoom">
          <button type="button" aria-label="Acercar" onClick={() => apiRef.current?.zoom(-0.15)}>
            +
          </button>
          <button type="button" aria-label="Alejar" onClick={() => apiRef.current?.zoom(0.15)}>
            −
          </button>
        </div>
      )}
    </div>
  )
}
