import { LOGO } from '../lib/assets'

// Se muestra cuando un producto todavía no tiene foto. En iPhone toma el color elegido.
export default function Placeholder({ product, color }) {
  if (product.category === 'iphone') {
    const body = color || '#333336'
    return (
      <svg className="ph" viewBox="0 0 120 240" role="img" aria-label={`${product.name} (sin foto)`}>
        <rect x="8" y="6" width="104" height="228" rx="22" fill={body} stroke="#333336" strokeWidth="2" />
        <rect x="14" y="12" width="92" height="216" rx="17" fill="#000" />
        <rect x="46" y="20" width="28" height="8" rx="4" fill="#1d1d1f" />
        <circle cx="60" cy="120" r="16" fill="none" stroke="#333336" strokeWidth="2" />
      </svg>
    )
  }
  return <img className="ph ph-logo" src={LOGO} alt={`${product.name} (sin foto)`} />
}
