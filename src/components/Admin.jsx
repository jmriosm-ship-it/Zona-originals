import { useEffect, useRef, useState } from 'react'
import { BOX_DEPTHS, BOX_FACES, COLOR_PRESETS, MODEL_LABELS, modelKind, CONDITIONS, fmtPrice, slugify, uid } from '../lib/data'
import { fileToDataUrl } from '../lib/storage'
import { signIn, signOut, uploadProductImages } from '../lib/cloud'
import { LOGO } from '../lib/assets'
import BoxPhotoEditor from './BoxPhotoEditor'

const EMPTY = {
  name: '',
  category: '',
  price: '',
  storage: '',
  color: '',
  colors: [],
  about: '',
  highlights: [],
  specs: '',
  reviews: [],
  condition: 'Nuevo',
  description: '',
  stock: 1,
  credit: true,
  images: [],
  boxImage: '',
  boxFaces: {},
  phoneScreen: '',
  phoneBack: '',
  phoneFaces: {},
  phoneCamera: null,
  kind: '',
  laptopDeck: '',
  boxDepth: 'normal',
  hidden: false,
  bestseller: false,
}

const MAX_IMAGES = 4

function Login({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await signIn(email, password)
    setBusy(false)
    if (err) setError('Correo o contraseña incorrectos.')
  }

  return (
    <form className="lock panel" onSubmit={submit}>
      <img src={LOGO} alt="" width="72" height="72" className="lock-logo" />
      <h1 className="h3">Administrar tienda</h1>
      <p className="sub">Entra con tu correo y contraseña de administrador.</p>
      <input className="field" type="email" placeholder="Correo" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Correo" />
      <input className="field" type="password" placeholder="Contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Contraseña" />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || !email || !password}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
      <a className="link-btn" href="#/" onClick={onBack}>Volver a la tienda</a>
    </form>
  )
}

function ProductForm({ initial, categories, defaultCategory, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    category: defaultCategory ?? categories[0]?.id ?? '',
    ...initial,
    // Productos anteriores sin cantidad por color: cada color parte con el stock general.
    colors: (initial?.colors ?? []).map((c) => ({ ...c, stock: c.stock ?? initial.stock ?? 1 })),
    price: initial?.price ?? '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const boxRef = useRef(null)
  const [boxDraft, setBoxDraft] = useState(null) // { face, src }
  const phoneRef = useRef(null)
  const phoneField = useRef('phoneScreen')
  const [phoneDraft, setPhoneDraft] = useState(null) // { field, src }
  const [camDraft, setCamDraft] = useState(false)
  const boxFace = useRef('front')
  const category = categories.find((c) => c.id === form.category)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

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

  const addBox = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      setBoxDraft({ face: boxFace.current, src: await fileToDataUrl(file, 1400, 0.9) })
    } catch {
      setError('No se pudo leer la foto de la caja.')
    }
    setBusy(false)
  }

  const move = (i) =>
    setForm((f) => {
      const images = [...f.images]
      images.unshift(images.splice(i, 1)[0])
      return { ...f, images }
    })

  const addPhonePhoto = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      setPhoneDraft({ field: phoneField.current, src: await fileToDataUrl(file, 1400, 0.9) })
    } catch {
      setError('No se pudo leer la foto del celular.')
    }
    setBusy(false)
  }

  // phoneScreen y phoneBack son el frente y la tapa; el resto de caras va en phoneFaces.
  const direct = (field) => /^(phone|laptop)/.test(field)
  const phoneUrl = (field) => (direct(field) ? form[field] : form.phoneFaces?.[field])
  const setPhoneUrl = (field, url) =>
    setForm((f) => (direct(field) ? { ...f, [field]: url } : { ...f, phoneFaces: { ...f.phoneFaces, [field]: url } }))

  // Tipo de modelo 3D y las fotos que pide cada uno.
  const kind = form.kind || modelKind(form)
  const slotsByKind = {
    phone: [['phoneScreen', 'Frente (pantalla)'], ['phoneBack', 'Atrás (tapa)']],
    laptop: [['phoneScreen', 'Pantalla (prendida)'], ['phoneBack', 'Tapa (por fuera)'], ['laptopDeck', 'Teclado (base vista desde arriba)']],
    watch: [['phoneScreen', 'Pantalla (carátula)'], ['phoneBack', 'Atrás (sensores)']],
    box: [],
  }
  const kindText = {
    phone: 'Celular en 3D (opcional): sube una foto por cada cara del celular (el frente es lo principal; las demás son opcionales), marca las 4 esquinas y la tienda arma el celular girando en 3D. Las caras sin foto toman el color que elija el cliente.',
    laptop: 'MacBook en 3D (opcional): sube la foto de la pantalla, de la tapa por fuera y del teclado, marcando las 4 esquinas de cada una. La tienda arma la laptop abierta y girando. Si no subes teclado, se dibuja uno. El color que elija el cliente tiñe la base y la tapa.',
    box: 'Los perfumes usan solo la caja en 3D: sube las fotos en la sección "Caja en 3D" de más abajo. Aquí no hace falta nada.',
    watch: 'Reloj en 3D (opcional): sube la foto de la pantalla (carátula) y de la parte de atrás, marcando las 4 esquinas. La tienda arma el reloj con correa girando. El color que elija el cliente cambia la correa y la caja.',
  }

  const phoneSlot = ([field, label]) => (
    <div className="face-slot" key={field}>
      <p className="card-spec">{label}</p>
      {phoneUrl(field) ? (
        <div className="shot">
          <img src={phoneUrl(field)} alt={label} />
          <div className="shot-actions">
            <button type="button" onClick={() => setPhoneUrl(field, '')}>Quitar</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="shot shot-add"
          disabled={busy}
          onClick={() => {
            phoneField.current = field
            phoneRef.current?.click()
          }}
        >
          {busy ? 'Procesando…' : '+ Foto'}
        </button>
      )}
    </div>
  )

  const faceSlot = ([face, label]) => {
    const url = face === 'front' ? form.boxImage : form.boxFaces?.[face]
    return (
      <div className="face-slot" key={face}>
        <p className="card-spec">{label}</p>
        {url ? (
          <div className="shot">
            <img src={url} alt={`Caja: ${label}`} />
            <div className="shot-actions">
              <button
                type="button"
                onClick={() =>
                  setForm((f) =>
                    face === 'front'
                      ? { ...f, boxImage: '' }
                      : { ...f, boxFaces: { ...f.boxFaces, [face]: '' } },
                  )
                }
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="shot shot-add"
            disabled={busy}
            onClick={() => {
              boxFace.current = face
              boxRef.current?.click()
            }}
          >
            {busy ? 'Procesando…' : '+ Foto'}
          </button>
        )}
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    const price = parseInt(String(form.price).replace(/\D/g, ''), 10)
    if (!categories.length) return setError('Primero crea una categoría en la pestaña Categorías.')
    if (!form.name.trim()) return setError('Escribe el nombre del producto.')
    if (!price) return setError('Escribe un precio válido.')
    setBusy(true)
    setError('')
    try {
      await onSave({
      ...form,
      reviews: undefined,
      id: form.id ?? uid(),
      name: form.name.trim(),
      color: form.colors[0]?.name ?? form.color,
      colors: form.colors.filter((c) => c.name.trim()).map((c) => ({ ...c, stock: Math.max(0, parseInt(c.stock, 10) || 0) })),
      highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
      price,
      stock: form.colors.some((c) => c.name.trim())
        ? form.colors.filter((c) => c.name.trim()).reduce((n, c) => n + Math.max(0, parseInt(c.stock, 10) || 0), 0)
        : Math.max(0, parseInt(form.stock, 10) || 0),
      createdAt: form.createdAt ?? Date.now(),
      demo: false,
      })
    } catch (err) {
      setError(err?.message ? `No se pudo guardar: ${err.message}` : 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
    }
    setBusy(false)
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
          Categoría {!categories.length && '(crea una primero en la pestaña Categorías)'}
          <select className="field" value={form.category} onChange={set('category')}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Precio (COP)
          <input className="field" inputMode="numeric" value={form.price} onChange={set('price')} placeholder="3500000" />
        </label>
        <label>
          {form.colors.length ? 'Cantidad total (suma de los colores)' : 'Cantidad disponible'}
          <input
            className="field"
            type="number"
            min="0"
            readOnly={form.colors.length > 0}
            value={form.colors.length ? form.colors.reduce((n, c) => n + (parseInt(c.stock, 10) || 0), 0) : form.stock}
            onChange={set('stock')}
          />
        </label>
        <label>
          {category?.specLabel || 'Detalle'}
          <input className="field" value={form.storage} onChange={set('storage')} placeholder={form.category === 'iphone' ? '128 GB' : form.category === 'perfume' ? '100 ml' : ''} />
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
          <label className="check">
            <input type="checkbox" checked={Boolean(form.bestseller)} onChange={set('bestseller')} />
            Más vendido (sale en la portada)
          </label>
        </div>
      </div>


      <label>
        Descripción larga (sección "Sobre este producto")
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

      <label>
        Especificaciones (una por línea, con el formato "Nombre: valor")
        <textarea className="field" rows="5" value={form.specs ?? ''} onChange={set('specs')} placeholder={'Pantalla: 6,9 pulgadas Super Retina XDR\nChip: A18 Pro\nCámara: 48 MP\nBatería: hasta 33 h de video'} />
      </label>

      <div>
        <p className="label">Colores y cantidad disponible de cada uno (el cliente elige el color y el teléfono 3D cambia)</p>
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
              <input
                className="field color-qty"
                type="number"
                min="0"
                value={c.stock ?? 0}
                aria-label={`Cantidad disponible en ${c.name || 'este color'}`}
                title="Cantidad disponible"
                onChange={(e) => setColor(i, { stock: e.target.value })}
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
              onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, { ...p, stock: 1 }] }))}
            >
              <i className="dot" style={{ background: p.hex }} /> {p.name}
            </button>
          ))}
          <button type="button" className="pill" onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, { name: '', hex: '#888888', stock: 1 }] }))}>
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

      <div>
          <label>
            Tipo de modelo 3D
            <select className="field" value={form.kind ?? ''} onChange={set('kind')}>
              <option value="">Automático (según la categoría): {{ ...MODEL_LABELS, box: 'Ninguno (solo caja 3D)' }[modelKind(form)]}</option>
              {Object.entries({ ...MODEL_LABELS, box: 'Ninguno (solo caja 3D)' }).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <p className="label">{kindText[kind]}</p>
          {camDraft ? (
            <BoxPhotoEditor
              region
              src={form.phoneBack}
              hint="Arrastra los 4 puntos para encerrar el módulo de cámaras (solo el bloque de las lentes). Se levantará en relieve en el 3D."
              onCancel={() => setCamDraft(false)}
              onDone={(box) => {
                setForm((f) => ({ ...f, phoneCamera: box }))
                setCamDraft(false)
              }}
            />
          ) : phoneDraft ? (
            <BoxPhotoEditor
              src={phoneDraft.src}
              hint="Arrastra los 4 puntos hasta las esquinas de esta parte en la foto (sin el fondo). Con eso se arma en 3D."
              onCancel={() => setPhoneDraft(null)}
              onDone={(url) => {
                setPhoneUrl(phoneDraft.field, url)
                setPhoneDraft(null)
              }}
            />
          ) : (
            <>
              <div className="shots">{slotsByKind[kind].map(phoneSlot)}</div>
              {kind === 'phone' && form.phoneBack && (
                <div className="actions actions-left">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCamDraft(true)}>
                    {form.phoneCamera ? 'Cambiar la cámara en relieve' : 'Marcar la cámara en relieve'}
                  </button>
                  {form.phoneCamera && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, phoneCamera: null }))}>
                      Detectar automática
                    </button>
                  )}
                  <span className="card-spec">{form.phoneCamera ? 'Cámara marcada a mano' : 'Cámara: detección automática'}</span>
                </div>
              )}
              {kind === 'phone' && (
              <details className="more-faces">
                <summary>Agregar más caras del celular (opcional)</summary>
                <div className="shots">{[['left', 'Lado izquierdo'], ['right', 'Lado derecho'], ['top', 'Arriba'], ['bottom', 'Abajo']].map(phoneSlot)}</div>
              </details>
              )}
            </>
          )}
          <input ref={phoneRef} type="file" accept="image/*" hidden onChange={addPhonePhoto} />
      </div>

      <div>
        <p className="label">Caja en 3D (opcional): sube una foto por cada cara de la caja (el frente es lo principal; las demás son opcionales). La tienda la muestra girando en 3D. El color del producto no cambia la caja.</p>
        {boxDraft && (
          <BoxPhotoEditor
            src={boxDraft.src}
            onCancel={() => setBoxDraft(null)}
            onDone={(url) => {
              setForm((f) =>
                boxDraft.face === 'front'
                  ? { ...f, boxImage: url }
                  : { ...f, boxFaces: { ...f.boxFaces, [boxDraft.face]: url } },
              )
              setBoxDraft(null)
            }}
          />
        )}
        {!boxDraft && (
          <>
          <div className="shots">{BOX_FACES.slice(0, 1).map(faceSlot)}</div>
          <details className="more-faces">
            <summary>Agregar más caras de la caja (opcional)</summary>
            <div className="shots">{BOX_FACES.slice(1).map(faceSlot)}</div>
          </details>
          </>
        )}
        <input ref={boxRef} type="file" accept="image/*" hidden onChange={addBox} />
        {(form.boxImage || Object.values(form.boxFaces ?? {}).some(Boolean)) && !boxDraft && (
          <label>
            Grosor de la caja
            <select className="field" value={form.boxDepth} onChange={set('boxDepth')}>
              {BOX_DEPTHS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions actions-left">
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar producto'}</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

function Settings({ settings, setSettings, onMigrate, email }) {
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const submit = (e) => {
    e.preventDefault()
    setSettings({ ...form, whatsapp: form.whatsapp.replace(/\D/g, ''), tiktok: form.tiktok.replace(/^@/, '').trim(), instagram: (form.instagram ?? '').replace(/^@/, '').trim() })
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
          Nombre o razón social del titular (para términos y privacidad)
          <input className="field" value={form.legalName ?? ''} onChange={set('legalName')} placeholder="Nombre legal de la tienda o del dueño" />
        </label>
        <label>
          NIT o cédula
          <input className="field" value={form.nit ?? ''} onChange={set('nit')} placeholder="900.123.456-7" />
        </label>
        <label>
          Correo de contacto
          <input className="field" type="email" value={form.contactEmail ?? ''} onChange={set('contactEmail')} placeholder="tienda@correo.com" />
        </label>
        <label>
          Usuario de Instagram
          <input className="field" value={form.instagram ?? ''} onChange={set('instagram')} placeholder="zona_originals" />
        </label>
        <label>
          Dirección del local
          <input className="field" value={form.address ?? ''} onChange={set('address')} placeholder="Calle 10 # 12-34, Ocaña" />
        </label>
        <label>
          Coordenadas del pin rojo (latitud, longitud)
          <input className="field" value={form.mapCoords ?? ''} onChange={set('mapCoords')} placeholder="8.234645, -73.35324" />
        </label>
      </div>
      <label>
        Horarios (una línea por horario)
        <textarea className="field" rows="3" value={form.hours ?? ''} onChange={set('hours')} placeholder={'Lunes a sábado: 9am a 7pm\nDomingos: 9am a 12:30pm'} />
      </label>

      <label>
        Videos de TikTok para el inicio (un enlace por línea, hasta 3)
        <textarea className="field" rows="3" value={form.tiktokVideos ?? ''} onChange={set('tiktokVideos')} placeholder={'https://www.tiktok.com/@zona_originals_co/video/7312345678901234567'} />
      </label>

      <h2 className="h3">Simulador de crédito</h2>
      <div className="form-grid">
        <label>
          Tasas de interés mensual disponibles (%), separadas por coma
          <input className="field" value={form.creditRates ?? form.creditRate ?? ''} onChange={set('creditRates')} placeholder="1, 2" />
        </label>
        <label>
          Cuota inicial por defecto (%)
          <input className="field" inputMode="numeric" value={form.creditDown ?? ''} onChange={set('creditDown')} placeholder="30" />
        </label>
      </div>
      <p className="sub">Son valores de referencia para que el cliente simule su cuota; el crédito final lo define el estudio.</p>

      <h2 className="h3">Información de garantía</h2>
      <label>
        Texto que se muestra al tocar "Garantía" en el inicio (separa los párrafos con una línea en blanco)
        <textarea className="field" rows="8" value={form.warranty ?? ''} onChange={set('warranty')} placeholder="Escribe aquí las condiciones de la garantía…" />
      </label>
      <p className="sub">Los pedidos del carrito llegan a este WhatsApp.</p>
      <div className="actions actions-left">
        <button className="btn btn-primary" type="submit">Guardar</button>
        {saved && <span className="ok" role="status">Guardado</span>}
      </div>

      <h2 className="h3">Cuenta y datos</h2>
      <p className="sub">Administrador: {email}. Para cambiar la contraseña, hazlo en Supabase (Authentication → Users).</p>
      <div className="actions actions-left">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onMigrate}>
          Subir a la nube los datos de este navegador
        </button>
      </div>
      <p className="sub">Úsalo una sola vez si ya tenías productos cargados aquí antes de conectar la base de datos.</p>
    </form>
  )
}


function CategoriesTab({ categories, setCategories, products }) {
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [error, setError] = useState('')

  const count = (id) => products.filter((p) => p.category === id).length

  const add = (e) => {
    e.preventDefault()
    const label = name.trim()
    const id = slugify(label)
    if (!label || !id) return setError('Escribe el nombre de la categoría.')
    if (categories.some((c) => c.id === id)) return setError('Ya existe una categoría con ese nombre.')
    setCategories((l) => [...l, { id, label, specLabel: spec.trim() || 'Detalle' }])
    setName('')
    setSpec('')
    setError('')
  }

  const rename = (id, patch) => setCategories((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const remove = (c) => {
    if (count(c.id)) return window.alert(`"${c.label}" tiene ${count(c.id)} productos. Muévelos o elimínalos primero.`)
    if (window.confirm(`¿Eliminar la categoría "${c.label}"?`)) setCategories((l) => l.filter((x) => x.id !== c.id))
  }

  return (
    <section className="panel">
      <div className="admin-bar">
        <h2 className="h3">{categories.length} categorías</h2>
      </div>
      <p className="note">Una categoría llamada "iPhone" activa la página de celulares con el modelo 3D del teléfono. Cada categoría aparece en el menú de la tienda y tiene su propia página. Cuando creas una, ya puedes elegirla al subir productos.</p>

      <ul className="rows">
        {categories.map((c) => (
          <li className="row cat-row" key={c.id}>
            <div className="row-info">
              <label>
                <span className="card-spec">Nombre ({count(c.id)} productos)</span>
                <input className="field" value={c.label} disabled={c.locked} title={c.locked ? 'Las categorías fijas no se renombran' : undefined} onChange={(e) => rename(c.id, { label: e.target.value })} />
              </label>
              <label>
                <span className="card-spec">Dato extra del producto</span>
                <input className="field" value={c.specLabel ?? ''} onChange={(e) => rename(c.id, { specLabel: e.target.value })} />
              </label>
            </div>
            <div className="row-actions">
              {c.locked ? <span className="tag">Fija</span> : <button className="btn btn-ghost btn-sm" onClick={() => remove(c)}>Eliminar</button>}
            </div>
          </li>
        ))}
      </ul>

      <form className="form" onSubmit={add}>
        <h3 className="h3">Nueva categoría</h3>
        <div className="form-grid">
          <label>
            Nombre
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Gafas, Audífonos…" />
          </label>
          <label>
            Dato extra del producto
            <input className="field" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Presentación, Talla, Capacidad…" />
          </label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions actions-left">
          <button className="btn btn-primary btn-sm" type="submit">+ Crear categoría</button>
        </div>
      </form>
    </section>
  )
}

function ReviewsTab({ products, reviews, api }) {
  const [filter, setFilter] = useState('pendientes')
  const [draft, setDraft] = useState(null) // { id, name, rating, text }
  const [add, setAdd] = useState({ productId: '', name: '', rating: 5, text: '' })
  const [msg, setMsg] = useState('')

  const nameOf = (id) => products.find((p) => p.id === id)?.name ?? 'Producto eliminado'
  const shown = reviews.filter((r) => filter === 'todas' || r.status === 'pending')

  const create = async (e) => {
    e.preventDefault()
    if (!add.productId || add.text.trim().length < 3) return setMsg('Elige el producto y escribe la reseña.')
    const ok = await api.create(add.productId, { name: add.name.trim(), rating: Number(add.rating), text: add.text.trim() })
    setMsg(ok ? 'Reseña agregada.' : 'No se pudo agregar la reseña.')
    if (ok) setAdd({ productId: add.productId, name: '', rating: 5, text: '' })
  }

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
          {shown.map((r) => {
            const isEditing = draft?.id === r.id
            return (
              <li className="rev-row" key={r.id}>
                <div className="rev-head">
                  <p className="line-name">
                    {nameOf(r.productId)}
                    {r.status === 'pending' && <span className="tag">Pendiente</span>}
                  </p>
                  <p className="stars" aria-label={`${r.rating} de 5`}>
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </p>
                </div>

                {isEditing ? (
                  <div className="rev-edit">
                    <input className="field" value={draft.name} aria-label="Nombre" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    <select className="field" value={draft.rating} aria-label="Estrellas" onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                    <textarea className="field" rows="3" value={draft.text} aria-label="Reseña" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
                  </div>
                ) : (
                  <>
                    <blockquote className="rev-text">{r.text}</blockquote>
                    <p className="card-spec">{r.name || 'Cliente'}</p>
                  </>
                )}

                <div className="row-actions">
                  {r.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => api.update(r.id, { status: 'approved' })}>
                      Aprobar
                    </button>
                  )}
                  {isEditing ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        api.update(r.id, { name: draft.name, rating: draft.rating, text: draft.text })
                        setDraft(null)
                      }}
                    >
                      Listo
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setDraft({ id: r.id, name: r.name, rating: r.rating, text: r.text })}>
                      Editar
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => window.confirm('¿Eliminar esta reseña?') && (setDraft(null), api.remove(r.id))}>
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form className="form" onSubmit={create}>
        <h3 className="h3">Agregar una reseña real (por ejemplo, la que te dieron por WhatsApp)</h3>
        <div className="form-grid">
          <label>
            Producto
            <select className="field" value={add.productId} onChange={(e) => setAdd({ ...add, productId: e.target.value })}>
              <option value="">Elige…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nombre del cliente
            <input className="field" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
          </label>
          <label>
            Estrellas
            <select className="field" value={add.rating} onChange={(e) => setAdd({ ...add, rating: e.target.value })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Lo que dijo el cliente
          <textarea className="field" rows="3" value={add.text} onChange={(e) => setAdd({ ...add, text: e.target.value })} />
        </label>
        <div className="actions actions-left">
          <button className="btn btn-primary btn-sm" type="submit">+ Agregar reseña</button>
          {msg && <span className="ok" role="status">{msg}</span>}
        </div>
      </form>
    </section>
  )
}

export default function Admin({ products, setProducts, categories, setCategories, settings, setSettings, session, isAdmin, authReady, reviewsApi, cloudError, onClearError }) {
  const [tab, setTab] = useState('productos')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const importRef = useRef(null)

  // Solo puede haber un producto "Más vendido": si por cualquier motivo quedaron varios, se conserva el más reciente.
  useEffect(() => {
    if (!isAdmin || products.filter((p) => p.bestseller).length < 2) return
    setProducts((list) => {
      let kept = false
      return list.map((p) => (p.bestseller ? (kept ? { ...p, bestseller: false } : ((kept = true), p)) : p))
    })
  }, [isAdmin, products, setProducts])

  if (!authReady) {
    return (
      <main className="wrap admin">
        <p className="empty">Cargando…</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="wrap admin">
        <Login onBack={() => {}} />
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="wrap admin">
        <section className="lock panel">
          <img src={LOGO} alt="" width="72" height="72" className="lock-logo" />
          <h1 className="h3">Este usuario no es administrador</h1>
          <p className="sub">
            Entraste como {session.user?.email}, pero ese correo no está autorizado. Debe estar registrado en la tabla de administradores de la base de datos.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => signOut()}>Cerrar sesión</button>
          <a className="link-btn" href="#/">Volver a la tienda</a>
        </section>
      </main>
    )
  }

  const save = async (p) => {
    // Las fotos nuevas se suben a la nube y el producto queda con sus direcciones públicas.
    const clean = await uploadProductImages(p)
    // Solo un producto puede ser el "Más vendido" a la vez: al marcar uno, se desmarcan los demás.
    setProducts((list) => {
      const base = clean.bestseller ? list.map((x) => (x.bestseller && x.id !== clean.id ? { ...x, bestseller: false } : x)) : list
      return base.some((x) => x.id === clean.id) ? base.map((x) => (x.id === clean.id ? clean : x)) : [clean, ...base]
    })
    setEditing(null)
  }
    const remove = (p) => window.confirm(`¿Eliminar "${p.name}"?`) && setProducts((l) => l.filter((x) => x.id !== p.id))
  const demoCount = products.filter((p) => p.demo).length
  // Categorías fijas (MacBook, Relojes, Perfumes): cada una tiene su pestaña con sus productos.
  const fixed = categories.filter((c) => c.locked)
  const catTab = tab.startsWith('cat:') ? fixed.find((c) => c.id === tab.slice(4)) : null
  const showProducts = tab === 'productos' || Boolean(catTab)
  const listed = catTab ? products.filter((p) => p.category === catTab.id) : products
  const pending = reviewsApi.reviews.filter((r) => r.status === 'pending').length

  // Sube a la nube lo que este navegador tenía guardado antes de conectar la base de datos.
  const migrateLocal = async () => {
    const read = (k) => {
      try {
        return JSON.parse(localStorage.getItem(k) ?? 'null')
      } catch {
        return null
      }
    }
    const lp = read('zo-products') ?? []
    const lc = read('zo-categories') ?? []
    const ls = read('zo-settings')
    if (!lp.length && !lc.length && !ls) return window.alert('Este navegador no tiene datos guardados de antes.')
    if (!window.confirm(`Se subirán ${lp.length} productos y ${lc.length} categorías de este navegador a la nube (con sus fotos). ¿Continuar?`)) return
    try {
      const uploaded = []
      for (const p of lp) {
        const clean = await uploadProductImages({ ...p, reviews: undefined })
        uploaded.push(clean)
      }
      let flagged = false
      const single = uploaded.map((p) => (p.bestseller ? (flagged ? { ...p, bestseller: false } : ((flagged = true), p)) : p))
      setProducts((list) => [...single, ...list.filter((x) => !single.some((u) => u.id === x.id))])
      setCategories((list) => [...list, ...lc.filter((c) => !list.some((x) => x.id === c.id))])
      for (const p of lp) {
        for (const r of p.reviews ?? []) {
          if (r?.text?.trim()) await reviewsApi.create(p.id, { name: r.name ?? '', rating: Number(r.rating) || 5, text: r.text }, r.status === 'pending' ? 'pending' : 'approved')
        }
      }
      if (ls) setSettings({ ...settings, ...ls })
      window.alert('Listo: los datos de este navegador ya están en la nube.')
    } catch (err) {
      window.alert(`No se pudo subir todo: ${err?.message ?? 'error desconocido'}`)
    }
  }

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
      if (!window.confirm(`Esto reemplaza tus ${products.length} productos por los ${data.length} de la copia. ¿Continuar?`)) return
      const uploaded = []
      for (const p of data) uploaded.push(await uploadProductImages({ ...p, reviews: undefined }))
      setProducts(uploaded)
    } catch {
      window.alert('El archivo no es una copia válida o no se pudo subir.')
    }
  }

  return (
    <main className="wrap admin">
      <header className="admin-head">
        <a className="brand" href="#/">
          <img src={LOGO} alt="" width="28" height="28" />
          <span>Panel de administración</span>
        </a>
        <div className="actions actions-left">
          <a className="btn btn-ghost btn-sm" href="#/">Ver tienda</a>
          <button className="btn btn-ghost btn-sm" onClick={() => signOut()}>Cerrar sesión</button>
        </div>
      </header>

      {cloudError && (
        <p className="alert" role="alert">
          No se pudo guardar en la nube: {cloudError}{' '}
          <button className="link-btn" onClick={onClearError}>Cerrar aviso</button>
        </p>
      )}

      <div className="pills" role="tablist">
        {['productos', 'categorias', ...fixed.map((c) => `cat:${c.id}`), 'resenas', 'ajustes'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`pill ${tab === t ? 'on' : ''}`} onClick={() => { setTab(t); setEditing(null) }}>
            {t === 'productos'
              ? 'Productos'
              : t === 'categorias'
                ? 'Categorías'
                : t.startsWith('cat:')
                  ? fixed.find((c) => c.id === t.slice(4))?.label
                  : t === 'resenas'
                    ? `Reseñas${pending ? ` (${pending})` : ''}`
                    : 'Ajustes'}
          </button>
        ))}
      </div>

      {tab === 'categorias' && <CategoriesTab categories={categories} setCategories={setCategories} products={products} />}

      {tab === 'resenas' && <ReviewsTab products={products} reviews={reviewsApi.reviews} api={reviewsApi} />}

      {tab === 'ajustes' && <Settings settings={settings} setSettings={setSettings} onMigrate={migrateLocal} email={session.user?.email} />}

      {showProducts && editing && (
        <ProductForm initial={editing === 'new' ? null : editing} categories={categories} defaultCategory={catTab?.id} onSave={save} onCancel={() => setEditing(null)} />
      )}

      {showProducts && !editing && (
        <section className="panel">
          <div className="admin-bar">
            <h2 className="h3">
              {listed.length} {catTab ? `en ${catTab.label}` : 'productos'}
            </h2>
            <div className="actions actions-left">
              <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>{catTab ? `+ Nuevo producto de ${catTab.label}` : '+ Nuevo producto'}</button>
              {!catTab && <button className="btn btn-ghost btn-sm" onClick={exportJson}>Descargar copia</button>}
              {!catTab && <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>Restaurar copia</button>}
              <input ref={importRef} type="file" accept="application/json" hidden onChange={importJson} />
            </div>
          </div>

          {!catTab && demoCount > 0 && (
            <p className="note">
              Hay {demoCount} productos de ejemplo.{' '}
              <button className="link-btn" onClick={() => window.confirm('¿Eliminar todos los productos de ejemplo?') && setProducts((l) => l.filter((p) => !p.demo))}>
                Eliminar ejemplos
              </button>
            </p>
          )}

          {listed.length === 0 ? (
            <p className="empty">{catTab ? `Todavía no hay productos de ${catTab.label}. Sube el primero.` : 'Todavía no hay productos. Sube el primero.'}</p>
          ) : (
            <ul className="rows">
              {listed.map((p) => (
                <li className="row" key={p.id}>
                  <div className="row-img">
                    <img src={p.images[0] || LOGO} alt="" className={p.images[0] ? '' : 'dim'} />
                  </div>
                  <div className="row-info">
                    <p className="line-name">{p.name}{p.demo && <span className="tag">Ejemplo</span>}{p.hidden && <span className="tag">Oculto</span>}{p.bestseller && <span className="tag">Más vendido</span>}</p>
                    <p className="card-spec">
                      {categories.find((c) => c.id === p.category)?.label ?? 'Sin categoría'} · {fmtPrice(p.price)} · Disponibles {p.stock}
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
