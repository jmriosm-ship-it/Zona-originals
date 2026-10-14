import LogoBackdrop from './LogoBackdrop'

export default function Hero({ city }) {
  return (
    <>
      <div className="strip">
        <p>
          iPhone a crédito · {city}. <a href="#/credito">Conoce cómo funciona</a>
        </p>
      </div>

      <section className="hero">
        <LogoBackdrop />
        <div className="wrap hero-in">
          <p className="eyebrow rise" style={{ '--i': 0 }}>
            iPhone 13 en adelante
          </p>
          <h1 className="display">
            <span className="line rise" style={{ '--i': 1 }}>
              Originales.
            </span>
            <span className="line rise" style={{ '--i': 2 }}>
              A tu alcance.
            </span>
          </h1>
          <p className="lead rise" style={{ '--i': 3 }}>
            Los mejores iPhone y accesorios originales, con la opción de llevártelo a crédito.
          </p>
          <div className="actions rise" style={{ '--i': 4 }}>
            <a className="btn btn-primary" href="#/celulares">
              Ver celulares
            </a>
            <a className="btn btn-ghost" href="#/credito">
              Quiero a crédito
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
