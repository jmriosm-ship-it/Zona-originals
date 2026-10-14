import { useEffect, useState } from 'react'

const read = (key, initial) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw)
  } catch {
    /* sin acceso a localStorage: se usa el valor inicial */
  }
  return typeof initial === 'function' ? initial() : initial
}

// useState persistido en localStorage. El tercer valor es true si el navegador no pudo guardar
// (por ejemplo, cuando las imágenes ocupan demasiado espacio).
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [key, value])

  return [value, setValue, failed]
}

// Reduce la foto a máx. 1000 px y la guarda como WebP para no llenar el almacenamiento.
export function fileToDataUrl(file, max = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/webp', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}
