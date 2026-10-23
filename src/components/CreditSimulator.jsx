import { useState } from 'react'
import { creditPlan, creditRatesOf, fmtPrice, waLink } from '../lib/data'

const TERMS = [6, 12, 18, 24, 36]

const termLabel = (m) => (m >= 12 && m % 12 === 0 ? `${m / 12} ${m === 12 ? 'año' : 'años'}` : `${m} meses`)

// Simulador de crédito: se elige el celular, la cuota inicial y el plazo, y calcula la cuota mensual.
export default function CreditSimulator({ products, settings }) {
  const options = products.filter((p) => !p.hidden && p.credit && p.stock > 0)
  const [id, setId] = useState('')
  const [down, setDown] = useState(Math.min(80, Math.max(0, Number(settings.creditDown) || 30)))
  const [months, setMonths] = useState(12)
  const rates = creditRatesOf(settings)
  const [pickedRate, setPickedRate] = useState(null)

  const product = options.find((p) => p.id === id) ?? options[0]
  const rate = rates.includes(pickedRate) ? pickedRate : rates[0]

  if (!product) {
    return <p className="empty">Cuando haya equipos disponibles a crédito podrás simular tu cuota aquí.</p>
  }

  const plan = creditPlan(product.price, down, months, rate)
  const label = `${product.name}${product.storage ? ` ${product.storage}` : ''}`
  const message = [
    'Hola Zona Originals, hice una simulación de crédito:',
    `• Equipo: ${label} (${fmtPrice(product.price)})`,
    `• Cuota inicial: ${down}% (${fmtPrice(plan.down)})`,
    `• Plazo: ${months} cuotas (${termLabel(months)})`,
    `• Interés: ${rate}% mensual`,
    `• Cuota mensual estimada: ${fmtPrice(plan.monthly)}`,
    '¿Qué requisitos necesito para aplicar?',
  ].join('\n')

  const stats = [
    [fmtPrice(plan.monthly), `Cuota mensual (${months} cuotas)`],
    [fmtPrice(plan.down), `Cuota inicial (${down}%)`],
    [fmtPrice(plan.total), 'Total a pagar'],
    [fmtPrice(plan.interest), `Intereses (${rate}% mensual)`],
  ]

  return (
    <div className="sim">
      <div className="form-grid">
        <label>
          Elige el celular
          <select className="field" value={product.id} onChange={(e) => setId(e.target.value)}>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.storage ? ` ${p.storage}` : ''} — {fmtPrice(p.price)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cuota inicial: {down}% ({fmtPrice(plan.down)})
          <input type="range" min="0" max="80" step="5" value={down} onChange={(e) => setDown(Number(e.target.value))} aria-label="Cuota inicial en porcentaje" />
        </label>
      </div>

      <div>
        <p className="label">Plazo (cuotas mensuales)</p>
        <div className="pills" role="group" aria-label="Plazo">
          {TERMS.map((m) => (
            <button key={m} type="button" className={`pill ${months === m ? 'on' : ''}`} aria-pressed={months === m} onClick={() => setMonths(m)}>
              {m} cuotas · {termLabel(m)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Interés mensual</p>
        <div className="pills" role="group" aria-label="Interés mensual">
          {rates.map((x) => (
            <button key={x} type="button" className={`pill ${rate === x ? 'on' : ''}`} aria-pressed={rate === x} onClick={() => setPickedRate(x)}>
              {x}% mensual
            </button>
          ))}
        </div>
      </div>

      <div className="facts sim-facts">
        {stats.map(([v, l], i) => (
          <div className={`fact ${i === 0 ? 'fact-main' : ''}`} key={l}>
            <strong>{v}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <p className="sub sim-note">
        Valores estimados con un interés de {rate}% mensual. La cuota final depende del estudio y la aprobación del crédito.
      </p>

      <div className="actions">
        <a className="btn btn-primary" href={waLink(settings.whatsapp, message)} target="_blank" rel="noreferrer">
          Quiero este crédito por WhatsApp
        </a>
      </div>
    </div>
  )
}
