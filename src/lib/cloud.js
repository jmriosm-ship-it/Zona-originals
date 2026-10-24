import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

// La URL y la clave "publishable" son públicas por diseño: la seguridad la dan las reglas (RLS) de la base de datos.
// Nunca pongas aquí la clave "secret" ni la "service_role".
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dqeawmgipaqbrdavpmgo.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_FxJkHEe8PNDgOC4o7p8RRA_wGgIlSBj'

export const supabase = createClient(SUPABASE_URL, KEY)
export const BUCKET = 'productos'

// ---------- Caché local: la tienda aparece al instante y se refresca con lo de la nube ----------
const readCache = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* sin acceso a localStorage: se parte de cero */
  }
  return fallback
}

const writeCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* si no cabe, no pasa nada: los datos reales están en la nube */
  }
}

// ---------- Sesión del administrador ----------
export function useSession() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    const check = async (s) => {
      if (!s) {
        if (alive) {
          setIsAdmin(false)
          setReady(true)
        }
        return
      }
      const { data, error } = await supabase.rpc('is_admin')
      if (alive) {
        setIsAdmin(!error && data === true)
        setReady(true)
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      check(data.session)
    })
    // No se hacen llamadas a Supabase dentro del callback: se difieren para evitar bloqueos.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setTimeout(() => check(s), 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, isAdmin, ready }
}

export const signIn = (email, password) => supabase.auth.signInWithPassword({ email: email.trim(), password })
export const signOut = () => supabase.auth.signOut()

// ---------- Listas sincronizadas (productos y categorías) ----------
// Funciona como un useState: setItems acepta un valor o una función. Lo que cambia se guarda en la nube
// (solo si quien lo hace es el administrador); los visitantes únicamente leen.
export const PRODUCTS_SPEC = {
  table: 'products',
  cacheKey: 'zo-cache-products',
  order: [['created_at', false]],
  fromRow: (row) => ({ ...row.data, id: row.id }),
  toRow: (item) => {
    // Las reseñas viven en su propia tabla y no se guardan dentro del producto.
    const data = { ...item }
    delete data.id
    delete data.reviews
    const row = { id: item.id, data, updated_at: new Date().toISOString() }
    // Se conserva la fecha de creación del producto para que el orden (más recientes primero) no cambie.
    if (item.createdAt) row.created_at = new Date(item.createdAt).toISOString()
    return row
  },
}

export const CATEGORIES_SPEC = {
  table: 'categories',
  cacheKey: 'zo-cache-categories',
  order: [['position', true], ['created_at', true]],
  fromRow: (row) => ({ ...row.data, id: row.id }),
  toRow: (item, index) => {
    const data = { ...item }
    delete data.id
    return { id: item.id, data, position: index }
  },
}

export function useCloudList(spec, canWrite, reloadKey) {
  const [items, setState] = useState(() => readCache(spec.cacheKey, []))
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(items)
  const writable = useRef(canWrite)
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    writable.current = canWrite
  }, [canWrite])

  const load = useCallback(async () => {
    let q = supabase.from(spec.table).select('*')
    for (const [col, asc] of spec.order) q = q.order(col, { ascending: asc })
    const { data, error: err } = await q
    if (err) {
      setError(err.message)
      setReady(true)
      return
    }
    const next = data.map(spec.fromRow)
    ref.current = next
    setState(next)
    writeCache(spec.cacheKey, next)
    setError('')
    setReady(true)
  }, [spec])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const setItems = useCallback(
    (updater) => {
      const prev = ref.current
      const next = typeof updater === 'function' ? updater(prev) : updater
      ref.current = next
      setState(next)
      writeCache(spec.cacheKey, next)
      if (!writable.current) return

      const before = new Map(prev.map((x) => [x.id, JSON.stringify(x)]))
      const after = new Set(next.map((x) => x.id))
      const upserts = next.map((x, i) => [x, i]).filter(([x]) => before.get(x.id) !== JSON.stringify(x))
      const removed = prev.filter((x) => !after.has(x.id)).map((x) => x.id)
      if (!upserts.length && !removed.length) return

      queue.current = queue.current
        .then(async () => {
          if (upserts.length) {
            const { error: err } = await supabase.from(spec.table).upsert(upserts.map(([x, i]) => spec.toRow(x, i)))
            if (err) throw err
          }
          if (removed.length) {
            const { error: err } = await supabase.from(spec.table).delete().in('id', removed)
            if (err) throw err
          }
          setError('')
        })
        .catch((e) => {
          setError(e.message || 'No se pudo guardar en la nube.')
          return load() // se vuelve a lo que realmente hay guardado
        })
    },
    [spec, load],
  )

  return [items, setItems, { ready, error, reload: load, clearError: () => setError('') }]
}

// ---------- Ajustes de la tienda (una sola fila) ----------
export function useCloudSettings(defaults, canWrite, reloadKey) {
  const [value, setState] = useState(() => readCache('zo-cache-settings', defaults))
  const writable = useRef(canWrite)
  const [error, setError] = useState('')

  useEffect(() => {
    writable.current = canWrite
  }, [canWrite])

  useEffect(() => {
    let alive = true
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'store')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!alive) return
        if (err) return setError(err.message)
        if (data?.value) {
          setState(data.value)
          writeCache('zo-cache-settings', data.value)
        }
      })
    return () => {
      alive = false
    }
  }, [reloadKey])

  const setSettings = useCallback(async (next) => {
    const clean = { ...next }
    delete clean.pin // la clave del admin ya no existe: ahora se entra con correo y contraseña
    setState(clean)
    writeCache('zo-cache-settings', clean)
    if (!writable.current) return
    const { error: err } = await supabase.from('settings').upsert({ key: 'store', value: clean, updated_at: new Date().toISOString() })
    setError(err ? err.message : '')
  }, [])

  return [value, setSettings, error]
}

// ---------- Reseñas ----------
const reviewFromRow = (r) => ({
  id: r.id,
  productId: r.product_id,
  name: r.name,
  rating: r.rating,
  text: r.text,
  status: r.status,
  createdAt: r.created_at,
})

export function useReviews(reloadKey) {
  const [reviews, setReviews] = useState(() => readCache('zo-cache-reviews', []))

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (error) return
    const next = data.map(reviewFromRow)
    setReviews(next)
    writeCache('zo-cache-reviews', next)
  }, [])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  // Cualquier cliente puede enviar una reseña; siempre queda pendiente hasta que el administrador la apruebe.
  const submit = useCallback(async (productId, r) => {
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      name: r.name,
      rating: r.rating,
      text: r.text,
      status: 'pending',
    })
    return !error
  }, [])

  // Acciones del administrador
  const update = useCallback(
    async (id, patch) => {
      setReviews((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      const { error } = await supabase.from('reviews').update(patch).eq('id', id)
      if (error) load()
    },
    [load],
  )

  const remove = useCallback(
    async (id) => {
      setReviews((l) => l.filter((r) => r.id !== id))
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) load()
    },
    [load],
  )

  const create = useCallback(
    async (productId, r, status = 'approved') => {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        name: r.name,
        rating: r.rating,
        text: r.text,
        status,
      })
      await load()
      return !error
    },
    [load],
  )

  return { reviews, submit, update, remove, create }
}

// ---------- Fotos en Supabase Storage ----------
const isData = (v) => typeof v === 'string' && v.startsWith('data:')

async function uploadDataUrl(path, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
  const full = `${path}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(full, blob, {
    contentType: blob.type || 'image/webp',
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(full).data.publicUrl
}

const SINGLE_IMAGES = ['boxImage', 'phoneScreen', 'phoneBack', 'laptopDeck']
const IMAGE_GROUPS = ['boxFaces', 'phoneFaces']

// Sube a la nube las fotos nuevas del producto (las que están en base64) y deja en su lugar la dirección pública.
export async function uploadProductImages(product) {
  const stamp = Date.now().toString(36)
  const up = (v, slot) => (isData(v) ? uploadDataUrl(`${product.id}/${slot}-${stamp}`, v) : v)
  const out = { ...product }
  out.images = await Promise.all((product.images ?? []).map((v, i) => up(v, `foto${i}`)))
  for (const f of SINGLE_IMAGES) if (product[f]) out[f] = await up(product[f], f)
  for (const g of IMAGE_GROUPS) {
    if (!product[g]) continue
    out[g] = {}
    for (const [k, v] of Object.entries(product[g])) out[g][k] = v ? await up(v, `${g}-${k}`) : v
  }
  return out
}
