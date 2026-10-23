import { useEffect, useRef } from 'react'
import { LOGO } from '../lib/assets'

// Logo gigante de fondo: sigue el mouse en 3D, gira despacio y se desplaza al hacer scroll.
export default function LogoBackdrop({ className = '', drift = 0.28 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf = 0
    let visible = true

    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const tick = (t) => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      const y = window.scrollY
      el.style.transform =
        `translate3d(${cx * -36}px, ${cy * -26 + y * drift}px, 0) ` +
        `rotateY(${cx * 16}deg) rotateX(${-cy * 12}deg) rotateZ(${t * 0.004 + y * 0.03}deg)`
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(el.parentElement)

    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [drift])

  return (
    <div className={`backdrop ${className}`} aria-hidden="true">
      <img ref={ref} src={LOGO} alt="" draggable="false" />
    </div>
  )
}
