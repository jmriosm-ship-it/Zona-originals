// Mapa de Google sin clave de API. Usa la dirección si existe; si no, la ciudad.
export const mapQuery = (settings) => settings.address?.trim() || settings.city

export const mapLink = (settings) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(settings))}`

export default function MapEmbed({ settings }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(settings))}&hl=es&z=15&output=embed`
  return (
    <div className="map">
      <iframe title={`Mapa de ${settings.city}`} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <a className="btn btn-primary btn-sm map-link" href={mapLink(settings)} target="_blank" rel="noreferrer">
        Abrir en Google Maps
      </a>
    </div>
  )
}
