// Mapa de Google sin clave de API. Usa las coordenadas si existen; si no, la dirección o la ciudad.
// Latitud y longitud escritas como "8.2346, -73.3532"; devuelve null si no tienen ese formato.
const coordsOf = (settings) => {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(settings.mapCoords || '')
  return m ? `${m[1]},${m[2]}` : null
}

export const mapQuery = (settings) => {
  const coords = coordsOf(settings)
  if (coords) return coords
  const address = settings.address?.trim()
  if (!address) return settings.city
  // Se agrega la ciudad para que el mapa ubique la dirección en el lugar correcto.
  return address.toLowerCase().includes((settings.city || '').split(',')[0].trim().toLowerCase()) ? address : `${address}, ${settings.city}`
}

export const mapLink = (settings) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(settings))}`

export default function MapEmbed({ settings }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(settings))}&hl=es&z=17&output=embed`
  return (
    <div className="map">
      <iframe title={`Mapa de ${settings.city}`} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <a className="btn btn-primary btn-sm map-link" href={mapLink(settings)} target="_blank" rel="noreferrer">
        Abrir en Google Maps
      </a>
    </div>
  )
}
