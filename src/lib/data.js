// La tienda arranca sin categorías: se crean desde el panel de administración.
// Una categoría llamada "iPhone" activa la página de celulares y el modelo 3D del teléfono.
// Categorías fijas: siempre existen, tienen su propia página al estilo Apple y no se pueden eliminar.
export const BUILTIN_CATEGORIES = [
  { id: 'macbook', label: 'MacBook', specLabel: 'Chip', locked: true },
  { id: 'AppleWatch', label: 'AppleWatch', specLabel: 'Tamaño', locked: true },
  { id: 'Perfume', label: 'Perfumes', specLabel: 'Presentación (ml)', locked: true },
]

export const DEFAULT_CATEGORIES = [...BUILTIN_CATEGORIES]

// Ids de categorías fijas de versiones anteriores. Si siguen guardados y no tienen productos, la tienda los quita sola.
export const LEGACY_CATEGORY_IDS = ['reloj', 'colonias']

// Textos de la página de cada categoría fija.
export const SHOWCASES = {
  macbook: {
    eyebrow: 'MacBook',
    title: 'Hecha para rendir.',
    lead: 'MacBook originales con garantía, crédito y atención directa en el local.',
    models: 'Elige tu MacBook.',
    tilesTitle: 'Lo principal.',
  },
  AppleWatch : {
    eyebrow: 'Apple Watch',
    title: 'Tu día, en la muñeca.',
    lead: 'Relojes Apple originales para tu salud, tu actividad y tus notificaciones.',
    models: 'Elige tu reloj.',
    tilesTitle: 'Lo principal.',
  },
  // La clave debe ser el id interno de la categoría (Perfume); el nombre que se ve es el label de arriba y el eyebrow.
  Perfume: {
    eyebrow: 'Perfumes',
    title: 'Tu aroma, tu sello.',
    lead: 'Perfumes originales para cada ocasión, con atención directa en el local.',
    models: 'Elige tu perfume.',
    tilesTitle: 'Lo principal.',
  },
}

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// "#/celulares" para iPhone y "#/c/<id>" para el resto.
export const categoryHref = (id) => (id === 'iphone' ? '#/celulares' : id === 'accesorio' ? '#/accesorios' : `#/c/${id}`)

// Caras de la caja 3D. El frente se guarda en boxImage y el resto en boxFaces.
export const BOX_FACES = [
  ['front', 'Frente'],
  ['back', 'Atrás'],
  ['left', 'Lado izquierdo'],
  ['right', 'Lado derecho'],
  ['top', 'Arriba'],
  ['bottom', 'Abajo'],
]

// Grosor de la caja 3D respecto a su ancho.
export const BOX_DEPTHS = [
  { id: 'delgada', label: 'Delgada (reloj, cargador)', ratio: 0.16 },
  { id: 'normal', label: 'Normal (celular)', ratio: 0.34 },
  { id: 'gruesa', label: 'Gruesa (perfume, MacBook)', ratio: 0.7 },
]

export const CONDITIONS = ['Nuevo', 'Open box', 'Usado']

export const DEFAULT_SETTINGS = {
  whatsapp: '573142757163',
  tiktok: 'zona_originals_co',
  city: 'Ocaña, Norte de Santander',
  address: 'Cra. 12 # 11-34, Plaza Real',
  // Punto exacto del mapa (latitud, longitud): con esto Google muestra el marcador rojo.
  mapCoords: '8.234645, -73.35324',
  pin: '',
  // Simulador de crédito: valores de referencia que se ajustan en el panel (Ajustes).
  creditRates: '1, 2',
  creditDown: '30',
  warranty:
    'Nuestra garantía cubre:\n• Mal funcionamiento del equipo.\n• IMEI (no aplica en equipos no registrados).\n• Mal rendimiento de la batería con buen uso (solo si tiene el cargador original).\n\nNo hay garantía por:\n• Daños de display.\n• Humedad.\n• Golpes.\n• Bloqueos de teléfonos no registrados.\n• Daños físicos del equipo.\n• Batería por mal uso.\n• Teléfonos abiertos.',
  instagram: 'zona_originals_col_',
  tiktokVideos: '',
  // Datos del titular para los términos y la política de privacidad (se llenan en Ajustes).
  legalName: '',
  nit: '',
  contactEmail: '',
  hours: '',
}

// Tasas mensuales (%) disponibles en el simulador: "1, 2" -> [1, 2]. Acepta también la tasa única de versiones anteriores.
export const creditRatesOf = (settings) => {
  const list = String(settings.creditRates ?? settings.creditRate ?? '')
    .split(/[,;\s]+/)
    .map((n) => Number(n.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 20)
  return list.length ? [...new Set(list)] : [2]
}

// Cuota fija mensual (sistema francés) para un valor financiado a "months" cuotas con tasa mensual en %.
export const creditPlan = (price, downPct, months, ratePct) => {
  const down = Math.round((price * downPct) / 100)
  const financed = price - down
  const i = ratePct / 100
  const monthly = i > 0 ? (financed * i) / (1 - (1 + i) ** -months) : financed / months
  const total = down + monthly * months
  return { down, financed, monthly, total, interest: total - price }
}

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const fmtPrice = (n) => cop.format(Number(n) || 0)

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

// "iPhone 15 Pro Max" -> "15". Accesorios sin serie devuelven null.
export const seriesOf = (p) => {
  if (p.category !== 'iphone') return null
  const m = /iphone\s*(\d{2})/i.exec(p.name)
  return m ? m[1] : null
}

export const waLink = (number, text) => {
  const n = (number || '').replace(/\D/g, '')
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}

// Colores rápidos para el panel de administración (nombre + tono aproximado).
export const COLOR_PRESETS = [
  { name: 'Negro', hex: '#2b2b2d' },
  { name: 'Blanco', hex: '#ebebe8' },
  { name: 'Azul', hex: '#3f5668' },
  { name: 'Azul claro', hex: '#b6c8d6' },
  { name: 'Verde', hex: '#bccbb8' },
  { name: 'Rosa', hex: '#efd3d4' },
  { name: 'Amarillo', hex: '#efe6b9' },
  { name: 'Morado', hex: '#6b5b7b' },
  { name: 'Rojo', hex: '#b3202e' },
  { name: 'Titanio natural', hex: '#9a958b' },
  { name: 'Titanio desierto', hex: '#a98f78' },
  { name: 'Titanio negro', hex: '#34343a' },
  { name: 'Titanio blanco', hex: '#e4e2dc' },
]

const DEFAULT_HEX = '#2b2b2d'

// Colores del producto; si no tiene lista, se usa uno por defecto para el visor.
export const colorsOf = (p) =>
  p.colors?.length ? p.colors : [{ name: p.color || 'Estándar', hex: DEFAULT_HEX }]

// Cantidad disponible de un color; los productos viejos sin cantidad por color usan el stock general.
export const colorStock = (p, c) => Math.max(0, Number(c?.stock ?? p.stock) || 0)

// Color con unidades disponibles (el primero), o el primero si todos están agotados.
export const firstInStock = (p) => colorsOf(p).find((c) => colorStock(p, c) > 0) ?? colorsOf(p)[0]

// El celular 3D se arma con las fotos de pantalla y/o tapa que sube el administrador.
// Tipo de modelo 3D: celular, laptop o reloj. Si el producto no lo define, sale de su categoría.
// 'box' = sin modelo de dispositivo: solo se usa la caja en 3D (colonias).
// Si el administrador no eligió un tipo, se deduce del nombre ("iPhone 15", "MacBook Air", "Apple Watch") y,
// si el nombre no dice nada, de la categoría. Así un iPhone guardado por error en otra categoría no sale como laptop.
export const modelKind = (p) => {
  if (p.kind) return p.kind
  const name = p.name ?? ''
  if (/iphone|celular/i.test(name)) return 'phone'
  if (/mac\s?book|laptop|port[aá]til|\bmac\b/i.test(name)) return 'laptop'
  if (/watch|reloj/i.test(name)) return 'watch'
  if (p.category === 'macbook') return 'laptop'
  if (p.category === 'AppleWatch' || p.category === 'reloj') return 'watch'
  if (p.category === 'Perfume' || p.category === 'colonias') return 'box'
  return 'phone'
}

export const MODEL_LABELS = { phone: 'Celular 3D', laptop: 'MacBook 3D', watch: 'Reloj 3D' }

export const has3d = (p) => Boolean(p.phoneScreen || p.phoneBack) && modelKind(p) !== 'box'
export const creditkind = (p) => (!p.credit ? null : p.category === 'iphone' ? 'simulador' : 'addi')
