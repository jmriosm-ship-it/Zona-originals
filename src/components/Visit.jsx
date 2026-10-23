import { waLink } from '../lib/data'
import MapEmbed from './MapEmbed'
import Reveal from './Reveal'

// Sección "Pasa por la tienda": dirección, horarios y redes a la izquierda, mapa a la derecha.
export default function Visit({ settings }) {
  const { whatsapp, tiktok, instagram, city } = settings
  const hours = (settings.hours || '').split('\n').map((h) => h.trim()).filter(Boolean)
  const links = [
    ['WhatsApp', waLink(whatsapp, 'Hola Zona Originals')],
    tiktok && ['TikTok', `https://www.tiktok.com/@${tiktok}`],
    instagram && ['Instagram', `https://www.instagram.com/${instagram}`],
  ].filter(Boolean)

  return (
    <section className="section" aria-labelledby="visita">
      <div className="wrap">
        <Reveal className="panel visit">
          <div className="visit-info">
            <p className="eyebrow">Visítanos</p>
            <h2 className="display visit-title" id="visita">
              Pasa por la tienda
            </h2>
            <p className="visit-address">{settings.address?.trim() || city}</p>
            {settings.address?.trim() && <p className="sub">{city}</p>}
            {hours.length > 0 && (
              <ul className="visit-hours">
                {hours.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <div className="visit-links">
              {links.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <MapEmbed settings={settings} />
        </Reveal>
      </div>
    </section>
  )
}
