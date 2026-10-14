export const CATEGORIES = [
  { id: 'iphone', label: 'iPhone' },
  { id: 'accesorio', label: 'Accesorios' },
]

export const CONDITIONS = ['Nuevo', 'Open box', 'Usado']

export const DEFAULT_SETTINGS = {
  whatsapp: '573142757163',
  tiktok: 'zona_originals_co',
  city: 'Ocaña, Norte de Santander',
  address: '',
  pin: '',
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

export const has3d = (p) => p.category === 'iphone' && p.model3d !== false

const demo = (name, category, price, storage, colors, description, extra = {}) => ({
  id: uid(),
  name,
  category,
  price,
  storage,
  color: colors[0].name,
  colors,
  condition: 'Nuevo',
  description,
  stock: 3,
  credit: category === 'iphone',
  model3d: category === 'iphone',
  images: [],
  hidden: false,
  demo: true,
  createdAt: Date.now(),
  ...extra,
})

const pick = (...names) => COLOR_PRESETS.filter((c) => names.includes(c.name))

// Productos de ejemplo para que la tienda no se vea vacía. Se borran desde el panel.
export const SEED_PRODUCTS = [
  demo('iPhone 16 Pro Max', 'iphone', 6200000, '256 GB', pick('Titanio desierto', 'Titanio natural', 'Titanio blanco', 'Titanio negro'), 'Pantalla Super Retina XDR de 6,9", chip A18 Pro y sistema de cámaras Pro.', { highlights: ["Pantalla Super Retina XDR de 6,9\"","Chip A18 Pro","Cámara principal de 48 MP","Zoom óptico 5x","Puerto USB-C","Marco de titanio"] }),
  demo('iPhone 16 Pro', 'iphone', 5200000, '128 GB', pick('Titanio negro', 'Titanio blanco', 'Titanio natural', 'Titanio desierto'), 'Pantalla de 6,3", chip A18 Pro y control de cámara.', { highlights: ["Pantalla de 6,3\"","Chip A18 Pro","Cámara principal de 48 MP","Control de cámara","Puerto USB-C","Marco de titanio"] }),
  demo('iPhone 15 Pro Max', 'iphone', 5000000, '256 GB', pick('Titanio natural', 'Azul', 'Titanio blanco', 'Titanio negro'), 'Diseño en titanio, chip A17 Pro y zoom óptico 5x.', { highlights: ["Pantalla Super Retina XDR de 6,7\"","Chip A17 Pro","Zoom óptico 5x","Puerto USB-C","Marco de titanio","Botón de acción"] }),
  demo('iPhone 15', 'iphone', 3300000, '128 GB', pick('Negro', 'Azul claro', 'Verde', 'Amarillo', 'Rosa'), 'Dynamic Island, cámara principal de 48 MP y USB-C.', { highlights: ["Pantalla Super Retina XDR de 6,1\"","Chip A16 Bionic","Cámara principal de 48 MP","Dynamic Island","Puerto USB-C"] }),
  demo('iPhone 14 Pro', 'iphone', 3500000, '128 GB', pick('Morado', 'Negro', 'Blanco'), 'Chip A16 Bionic, pantalla ProMotion y Always-On.', { highlights: ["Pantalla ProMotion de 6,1\"","Chip A16 Bionic","Cámara principal de 48 MP","Dynamic Island","Pantalla siempre activa"] }),
  demo('iPhone 14', 'iphone', 2700000, '128 GB', pick('Negro', 'Azul', 'Morado', 'Rojo'), 'Chip A15 Bionic, modo Acción y detección de choques.', { highlights: ["Pantalla Super Retina XDR de 6,1\"","Chip A15 Bionic","Modo Acción","Detección de choques","Cámara dual de 12 MP"] }),
  demo('iPhone 13', 'iphone', 2200000, '128 GB', pick('Negro', 'Azul', 'Rosa', 'Rojo'), 'Chip A15 Bionic, modo Cine y batería para todo el día.', { highlights: ["Pantalla Super Retina XDR de 6,1\"","Chip A15 Bionic","Modo Cine","Cámara dual de 12 MP","Batería para todo el día"] }),
  demo('Cargador original 20W USB-C', 'accesorio', 90000, '', pick('Blanco'), 'Adaptador de corriente original para carga rápida.'),
  demo('Cable USB-C original 1 m', 'accesorio', 70000, '', pick('Blanco'), 'Cable original para carga y sincronización.'),
  demo('AirPods originales', 'accesorio', 780000, '', pick('Blanco'), 'Audio inalámbrico original con estuche de carga.'),
]
