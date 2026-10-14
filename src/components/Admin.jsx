import { useRef, useState } from 'react'
import { CATEGORIES, COLOR_PRESETS, CONDITIONS, fmtPrice, uid } from '../lib/data'
import { fileToDataUrl } from '../lib/storage'
import { LOGO } from '../lib/assets'

const EMPTY = {
  name: '',
  category: 'iphone',
  price: '',
  storage: '',
  color: '',
  colors: [],
  model3d: true,
  about: '',
  highlights: [],
  reviews: [],
  condition: 'Nuevo',
  description: '',
  stock: 1,
  credit: true,
  images: [],
  hidden: false,
}

const MAX_IMAGES = 4

function Lock({ settings, onUnlock, onCreatePin }) {
  const creating = !settings.pin
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (creating) {
      if (pin.length < 4) return setError('Usa al menos 4 caracteres.')
      if (pin !== pin2) return setError('Las claves no coinciden.')
      onCreatePin(pin)
    } else if (pin === settings.pin) {
      onUnlock()
    } else {
      setError('Clave incorrecta.')
    }
  }

  return (
    <form className="lock panel" onSubmit={submit}>
      <img src={LOGO} alt="" width="72" height="72" className="lock-logo" />
      <h1 className="h3">{creating ? 'Crea tu clave de administrador' : 'Administrar tienda'}</h1>
      <p className="sub">
        {creating ? 'Será la clave para subir y editar productos.' : 'Ingresa tu clave para continuar.'}
      </p>
      <input className="field" type="password" placeholder="Clave" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} aria-label="Clave" />
      {creating && (
        <input className="field" type="password" placeholder="Repite la clave" value={pin2} onChange={(e) => setPin2(e.target.value)} aria-label="Repite la clave" />
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" type="submit">
        {creating ? 'Guardar clave' : 'Entrar'}
      </button>
      <a className="link-btn" href="#/">Volver a la tienda</a>
    </form>
  )
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, price: initial?.price ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const setReview = (i, patch) =>
    setForm((f) => ({ ...f, reviews: f.reviews.map((r, j) => (j === i ? { ...r, ...patch } : r)) }))

  const setColor = (i, patch) =>
    setForm((f) => ({ ...f, colors: f.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) }))

  const addImages = async (e) => {
    const files = [...e.target.files].slice(0, MAX_IMAGES - form.images.length)
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    try {
      const urls = await Promise.all(files.map((f) => fileToDataUrl(f)))
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, MAX_IMAGES) }))
    } catch {
      setError('No se pudo leer una de las imágenes.')
    }
    setBusy(false)
  }

  const move = (i) =>
    setForm((f) => {
      const images = [...f.images]
      images.unshift(images.splice(i, 1)[0])
      return { ...f, images }
    })

  const submit = (e) => {
    e.preventDefault()
    const price = parseInt(String(form.price).replace(/\D/g, ''), 10)
    if (!form.name.trim()) return setError('Escribe el nombre del producto.')
    if (!price) return setError('Escribe un precio válido.')
    onSave({
      ...form,
      id: form.id ?? uid(),
      name: form.name.trim(),
      color: form.colors[0]?.name ?? form.color,
      colors: form.colors.filter((c) => c.name.trim()),
      highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
      reviews: form.reviews.filter((r) => r.text.trim()).map((r) => ({ ...r, rating: Number(r.rating) || 5 })),
      price,
      stock: Math.max(0, parseInt(form.stock, 10) || 0),
      createdAt: form.createdAt ?? Date.now(),
      demo: false,
    })
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2 className="h3">{initial ? 'Editar producto' : 'Nuevo producto'}</h2>

      <div className="form-grid">
        <label>
          Nombre
          <input className="field" value={form.name} onChange={set('name')} placeholder="iPhone 15 Pro Max" autoFocus />
        </label>
        <label>
          Categoría
          <select className="field" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Precio (COP)
          <input className="field" inputMode="numeric" value={form.price} onChange={set('price')} placeholder="3500000" />
        </label>
        <label>
          Stock
          <input className="field" type="number" min="0" value={form.stock} onChange={set('stock')} />
        </label>
        <label>
          Almacenamiento
          <input className="field" value={form.storage} onChange={set('storage')} placeholder="128 GB" />
        </label>
        <label>
          Estado
          <select className="field" value={form.condition} onChange={set('condition')}>
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="checks">
          <label className="check">
            <input type="checkbox" checked={form.credit} onChange={set('credit')} />
            Disponible a crédito
          </label>
          <label className="check">
            <input type="checkbox" checked={form.hidden} onChange={set('hidden')} />
            Ocultar de la tienda
          </label>
          {form.category === 'iphone' && (
            <label className="check">
              <input type="checkbox" checked={form.model3d} onChange={set('model3d')} />
              Mostrar modelo 3D giratorio
            </label>
          )}
        </div>
      </div>


      <label>
        Descripción larga (sección "Sobre este iPhone")
        <textarea className="field" rows="4" value={form.about ?? ''} onChange={set('about')} placeholder="Cuenta con más detalle cómo es el equipo, qué incluye, garantía…" />
      </label>

      <label>
        Características destacadas (una por línea)
        <textarea
          className="field"
          rows="5"
          value={(form.highlights ?? []).join('\n')}
          onChange={(e) => setForm((f) => ({ ...f, highlights: e.target.value.split('\n') }))}
          placeholder={'Pantalla de 6,1"\nChip A15 Bionic\nCámara dual de 12 MP'}
        />
      </label>

      <div>
        <p className="label">Reseñas de clientes (solo escribe reseñas reales)</p>
        <ul className="review-rows">
          {form.reviews.map((r, i) => (
            <li key={i} className="review-row">
              <input className="field" value={r.name} placeholder="Nombre del cliente" aria-label="Nombre del cliente" onChange={(e) => setReview(i, { name: e.target.value })} />
              <select className="field" value={r.rating} aria-label="Estrellas" onChange={(e) => setReview(i, { rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
              <textarea className="field" rows="2" value={r.text} placeholder="Lo que dijo el cliente" aria-label="Reseña" onChange={(e) => setReview(i, { text: e.target.value })} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, reviews: f.reviews.filter((_, j) => j !== i) }))}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="pill" onClick={() => setForm((f) => ({ ...f, reviews: [...f.reviews, { name: '', rating: 5, text: '' }] }))}>
          + Agregar reseña
        </button>
      </div>

      <div>
        <p className="label">Colores (el cliente los elige y el teléfono 3D cambia de color)</p>
        <ul className="color-rows">
          {form.colors.map((c, i) => (
            <li key={i} className="color-row">
              <input
                type="color"
                value={c.hex}
                aria-label={`Tono de ${c.name || 'color'}`}
                onChange={(e) => setColor(i, { hex: e.target.value })}
              />
              <input
                className="field"
                value={c.name}
                placeholder="Nombre del color"
                aria-label="Nombre del color"
                onChange={(e) => setColor(i, { name: e.target.value })}
              />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <div className="pills presets">
          {COLOR_PRESETS.filter((p) => !form.colors.some((c) => c.name === p.name)).map((p) => (
            <button
              type="button"
              key={p.name}
              className="pill"
              onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, p] }))}
            >
              <i className="dot" style={{ background: p.hex }} /> {p.name}
            </button>
          ))}
          <button type="button" className="pill" onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, { name: '', hex: '#888888' }] }))}>
            + Personalizado
          </button>
        </div>
      </div>

      <label>
        Descripción
        <textarea className="field" rows="3" value={form.description} onChange={set('description')} placeholder="Detalles del equipo, batería, accesorios incluidos…" />
      </label>

      <div>
        <p className="label">Fotos (hasta {MAX_IMAGES}, la primera es la principal)</p>
        <div className="shots">
          {form.images.map((src, i) => (
            <div className="shot" key={i}>
              <img src={src} alt={`Foto ${i + 1}`} />
              <div className="shot-actions">
                {i > 0 && <button type="button" onClick={() => move(i)}>Principal</button>}
                <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {form.images.length < MAX_IMAGES && (
            <button type="button" className="shot shot-add" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? 'Procesando…' : '+ Subir foto'}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addImages} />
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions actions-left">
        <button className="btn btn-primary" type="submit" disabled={busy}>Guardar producto</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

function Settings({ settings, setSettings }) {
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const submit = (e) => {
    e.preventDefault()
    setSettings({ ...form, whatsapp: form.whatsapp.replace(/\D/g, ''), tiktok: form.tiktok.replace(/^@/, '').trim() })
    setSaved(true)
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2 className="h3">Datos de la tienda</h2>
      <div className="form-grid">
        <label>
          WhatsApp (con indicativo)
          <input className="field" inputMode="numeric" value={form.whatsapp} onChange={set('whatsapp')} placeholder="573001234567" />
        </label>
        <label>
          Usuario de TikTok
          <input className="field" value={form.tiktok} onChange={set('tiktok')} />
        </label>
        <label>
          Ciudad
          <input className="field" value={form.city} onChange={set('city')} />
        </label>
        <label>
          Dirección del local (para el mapa)
          <input className="field" value={form.address ?? ''} onChange={set('address')} placeholder="Calle 10 # 12-34, Ocaña" />
        </label>
        <label>
          Clave de administrador
          <input className="field" type="password" value={form.pin} onChange={set('pin')} />
        </label>
      </div>
      <p className="sub">Los pedidos del carrito llegan a este WhatsApp.</p>
      <div className="actions actions-left">
        <button className="btn btn-primary" type="submit">Guardar</button>
        {saved && <span className="ok" role="status">Guardado</span>}
      </div>
    </form>
  )
}


function ReviewsTab({ products, setProducts }) {
  const [filter, setFilter] = useState('pendientes')
  const [editing, setEditing] = useState(null) // "productId:index"

  const rows = products.flatMap((p) => (p.reviews ?? []).map((r, i) => ({ p, r, i })))
  const shown = rows.filter(({ r }) => filter === 'todas' || r.status === 'pending')

  const update = (pid, idx, patch) =>
    setProducts((list) =>
      list.map((p) => {
        if (p.id !== pid) return p
        const reviews = patch === null ? p.reviews.filter((_, j) => j !== idx) : p.reviews.map((r, j) => (j === idx ? { ...r, ...patch } : r))
        return { ...p, reviews }
      }),
    )

  return (
    <section className="panel">
      <div className="admin-bar">
        <h2 className="h3">Reseñas</h2>
        <div className="pills">
          {[
            ['pendientes', 'Pendientes'],
            ['todas', 'Todas'],
          ].map(([k, label]) => (
            <button key={k} className={`pill ${filter === k ? 'on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="empty">{filter === 'pendientes' ? 'No hay reseñas por revisar.' : 'Todavía no hay reseñas.'}</p>
      ) : (
        <ul className="rows">
          {shown.map(({ p, r, i }) => {
            const key = `${p.id}:${i}`
            const isEditing = editing === key
            return (
              <li className="rev-row" key={key}>
                <div className="rev-head">
                  <p className="line-name">
                    {p.name}
                    {r.status === 'pending' && <span className="tag">Pendiente</span>}
                  </p>
                  <p className="stars" aria-label={`${r.rating} de 5`}>
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </p>
                </div>

                {isEditing ? (
                  <div className="rev-edit">
                    <input className="field" value={r.name} aria-label="Nombre" onChange={(e) => update(p.id, i, { name: e.target.value })} />
                    <select className="field" value={r.rating} aria-label="Estrellas" onChange={(e) => update(p.id, i, { rating: Number(e.target.value) })}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                    <textarea className="field" rows="3" value={r.text} aria-label="Reseña" onChange={(e) => update(p.id, i, { text: e.target.value })} />
                  </div>
                ) : (
                  <>
                    <blockquote className="rev-text">{r.text}</blockquote>
                    <p className="card-spec">{r.name || 'Cliente'}</p>
                  </>
                )}

                <div className="row-actions">
                  {r.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => update(p.id, i, { status: 'approved' })}>
                      Aprobar
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(isEditing ? null : key)}>
                    {isEditing ? 'Listo' : 'Editar'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => window.confirm('¿Eliminar esta reseña?') && (setEditing(null), update(p.id, i, null))}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function Admin({ products, setProducts, settings, setSettings, storageFull }) {
  const [ok, setOk] = useState(() => sessionStorage.getItem('zo-admin') === '1')
  const [tab, setTab] = useState('productos')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const importRef = useRef(null)

  const unlock = () => {
    sessionStorage.setItem('zo-admin', '1')
    setOk(true)
  }

  if (!ok) {
    return (
      <main className="wrap admin">
        <Lock
          settings={settings}
          onUnlock={unlock}
          onCreatePin={(pin) => {
            setSettings({ ...settings, pin })
            unlock()
          }}
        />
      </main>
    )
  }

  const save = (p) => {
    setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]))
    setEditing(null)
  }
  const remove = (p) => window.confirm(`¿Eliminar "${p.name}"?`) && setProducts((l) => l.filter((x) => x.id !== p.id))
  const demoCount = products.filter((p) => p.demo).length
  const pending = products.reduce((n, p) => n + (p.reviews ?? []).filter((r) => r.status === 'pending').length, 0)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(products)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `zona-originals-productos-${new Date().toISOString().slice(0, 10)}.json`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data) || !data.every((p) => p.id && p.name)) throw new Error()
      if (window.confirm(`Esto reemplaza tus ${products.length} productos por los ${data.length} de la copia. ¿Continuar?`)) setProducts(data)
    } catch {
      window.alert('El archivo no es una copia válida.')
    }
  }

  return (
    <main className="wrap admin">
      <header className="admin-head">
        <a className="brand" href="#/">
          <img src={LOGO} alt="" width="28" height="28" />
          <span>Panel de administración</span>
        </a>
        <a className="btn btn-ghost btn-sm" href="#/">Ver tienda</a>
      </header>

      {storageFull && (
        <p className="alert" role="alert">
          El navegador se quedó sin espacio y los últimos cambios no se guardaron. Elimina productos o sube fotos más livianas.
        </p>
      )}

      <div className="pills" role="tablist">
        {['productos', 'resenas', 'ajustes'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`pill ${tab === t ? 'on' : ''}`} onClick={() => { setTab(t); setEditing(null) }}>
            {t === 'productos' ? 'Productos' : t === 'resenas' ? `Reseñas${pending ? ` (${pending})` : ''}` : 'Ajustes'}
          </button>
        ))}
      </div>

      {tab === 'resenas' && <ReviewsTab products={products} setProducts={setProducts} />}

      {tab === 'ajustes' && <Settings settings={settings} setSettings={setSettings} />}

      {tab === 'productos' && editing && (
        <ProductForm initial={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} />
      )}

      {tab === 'productos' && !editing && (
        <section className="panel">
          <div className="admin-bar">
            <h2 className="h3">{products.length} productos</h2>
            <div className="actions actions-left">
              <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>+ Nuevo producto</button>
              <button className="btn btn-ghost btn-sm" onClick={exportJson}>Descargar copia</button>
              <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>Restaurar copia</button>
              <input ref={importRef} type="file" accept="application/json" hidden onChange={importJson} />
            </div>
          </div>

          {demoCount > 0 && (
            <p className="note">
              Hay {demoCount} productos de ejemplo.{' '}
              <button className="link-btn" onClick={() => window.confirm('¿Eliminar todos los productos de ejemplo?') && setProducts((l) => l.filter((p) => !p.demo))}>
                Eliminar ejemplos
              </button>
            </p>
          )}

          {products.length === 0 ? (
            <p className="empty">Todavía no hay productos. Sube el primero.</p>
          ) : (
            <ul className="rows">
              {products.map((p) => (
                <li className="row" key={p.id}>
                  <div className="row-img">
                    <img src={p.images[0] || LOGO} alt="" className={p.images[0] ? '' : 'dim'} />
                  </div>
                  <div className="row-info">
                    <p className="line-name">{p.name}{p.demo && <span className="tag">Ejemplo</span>}{p.hidden && <span className="tag">Oculto</span>}</p>
                    <p className="card-spec">
                      {CATEGORIES.find((c) => c.id === p.category)?.label} · {fmtPrice(p.price)} · Stock {p.stock}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(p)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}
