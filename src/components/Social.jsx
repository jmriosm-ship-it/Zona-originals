import Reveal from './Reveal'

const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

// Reseñas reales y aprobadas de todos los productos (las de ejemplo nunca se cuentan). Muestra las mejores.
export function Testimonials({ products }) {
  const reviews = products
    .filter((p) => !p.hidden)
    .flatMap((p) => (p.reviews ?? []).filter((r) => r.status !== 'pending' && r.text?.trim() && Number(r.rating) >= 4).map((r) => ({ ...r, product: p.name })))
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 3)

  if (!reviews.length) return null

  return (
    <section className="section" aria-labelledby="clientes">
      <div className="wrap">
        <Reveal className="panel">
          <header className="section-head">
            <p className="eyebrow">Clientes</p>
            <h2 className="h2" id="clientes">
              Lo que dicen de nosotros
            </h2>
          </header>
          <div className="reviews">
            {reviews.map((r, i) => (
              <Reveal as="figure" className="review" key={`${r.product}-${i}`} delay={i * 80}>
                <p className="stars" role="img" aria-label={`${r.rating} de 5 estrellas`}>
                  {stars(r.rating)}
                </p>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  {r.name || 'Cliente'} · {r.product}
                </figcaption>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// De "https://www.tiktok.com/@usuario/video/7312345678901234567" saca el número del video.
export const tiktokId = (url) => /\/video\/(\d{8,25})/.exec(url)?.[1] ?? null

// Videos de TikTok incrustados: solo aparecen si el administrador pegó enlaces en Ajustes.
export function TikTokVideos({ settings }) {
  const ids = (settings.tiktokVideos || '')
    .split('\n')
    .map((l) => tiktokId(l.trim()))
    .filter(Boolean)
    .slice(0, 3)

  if (!ids.length) return null

  return (
    <section className="section" aria-labelledby="tiktok">
      <div className="wrap">
        <Reveal className="panel">
          <header className="section-head">
            <p className="eyebrow">TikTok</p>
            <h2 className="h2" id="tiktok">
              Míranos en acción
            </h2>
          </header>
          <div className="videos">
            {ids.map((id) => (
              <iframe
                key={id}
                className="video"
                src={`https://www.tiktok.com/embed/v2/${id}`}
                title="Video de TikTok de Zona Originals"
                loading="lazy"
                allow="encrypted-media; fullscreen"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ))}
          </div>
          <div className="actions">
            <a className="btn btn-ghost" href={`https://www.tiktok.com/@${settings.tiktok}`} target="_blank" rel="noreferrer">
              Ver más en TikTok
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
