import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Aparece con una animación suave cuando entra en pantalla y se desvanece al volver a subir.
// Los bloques muy altos (listas largas de productos) no se animan: en el celular, animar una capa de miles de píxeles
// gasta tanta memoria que Safari cierra la página.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  const [tall, setTall] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const isTall = entry.boundingClientRect.height > window.innerHeight * 1.5
        if (isTall) {
          setTall(true)
          setShown(true)
        } else if (entry.isIntersecting) setShown(true)
        // Al subir, lo que queda debajo de la pantalla se desvanece; lo que ya pasó por arriba se queda visible.
        else if (entry.boundingClientRect.top > 0) setShown(false)
      },
      // threshold 0: basta con que asome un poco; con un porcentaje, un bloque muy alto nunca aparecería.
      { threshold: 0, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${tall ? 'reveal-tall' : ''} ${className}`}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
