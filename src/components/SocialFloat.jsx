import { waLink } from '../lib/data'

const ICONS = {
  TikTok: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 6.7a4.8 4.8 0 0 1-3.7-4.2h-3.4v13.2a2.9 2.9 0 1 1-2-2.8V9.4a6.3 6.3 0 1 0 5.4 6.3V9.6a8.1 8.1 0 0 0 4.7 1.5V7.7a4.8 4.8 0 0 1-1-.1Z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 20.5 5 16A8.5 8.5 0 1 1 8 19l-4.5 1.5Z" />
      <path d="M9.2 8.6c.3-.8 1-.9 1.4-.2l.6 1.1c.2.4 0 .8-.3 1.1l-.4.4c.8 1.5 1.9 2.4 3.3 3l.5-.5c.3-.3.7-.4 1-.2l1.100.6c.7.4.6 1.100-.1 1.600-1 .7-2.500.4-4.100-.6-1.800-1.100-3.100-2.800-3.400-4.400-.1-.7.100-1.300.4-1.900Z" />
    </svg>
  ),
}

// Tres botones redondos flotantes en una esquina: llevan a las redes del local.
export default function SocialFloat({ settings }) {
  const { whatsapp, tiktok, instagram } = settings
  const links = [
    tiktok && ['TikTok', `https://www.tiktok.com/@${tiktok}`],
    instagram && ['Instagram', `https://www.instagram.com/${instagram}`],
    ['WhatsApp', waLink(whatsapp, 'Hola Zona Originals')],
  ].filter(Boolean)

  return (
    <nav className="social-float" aria-label="Redes sociales">
      {links.map(([label, href], i) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} style={{ '--i': i }}>
          {ICONS[label]}
        </a>
      ))}
    </nav>
  )
}
