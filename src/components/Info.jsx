import { waLink } from '../lib/data'

const YEAR = new Date().getFullYear()

export function Footer({ settings }) {
  const { whatsapp, tiktok, city } = settings
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <a className="brand" href="#/">
              <img src="/logo.png" alt="" width="28" height="28" />
              <span>Zona Originals</span>
            </a>
            <p className="footer-text">iPhone y accesorios originales.</p>
          </div>
          <div>
            <h4>Tienda</h4>
            <p>
              <a href="#/celulares">Celulares</a>
            </p>
            <p>
              <a href="#/accesorios">Accesorios</a>
            </p>
            <p>
              <a href="#/credito">Crédito</a>
            </p>
          </div>
          <div>
            <h4>Escríbenos</h4>
            <p>{city}</p>
            <p>
              <a href={waLink(whatsapp, 'Hola Zona Originals')} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </p>
            <p>
              <a href={`https://www.tiktok.com/@${tiktok}`} target="_blank" rel="noreferrer">
                TikTok @{tiktok}
              </a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {YEAR} Zona Originals. Todos los derechos reservados.</p>
          <a href="#/admin">Administrar tienda</a>
        </div>
      </div>
    </footer>
  )
}
