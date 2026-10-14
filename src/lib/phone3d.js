import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { LOGO } from './assets'

// Medidas aproximadas en cm: ancho, alto, grosor.
const DIMS = {
  base: { w: 7.16, h: 14.76, d: 0.78 },
  pro: { w: 7.15, h: 14.96, d: 0.82 },
  max: { w: 7.76, h: 16.3, d: 0.82 },
}

// Posiciones de lentes vistas desde atrás (x hacia la derecha del espectador).
const LENSES = {
  pro: [[-0.85, 0.85], [-0.85, -0.85], [0.8, 0]],
  base: [[-0.8, 0.8], [0.8, -0.8]],
}

const roundedRect = (w, h, r) => {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

const extrude = (w, h, r, depth, bevel) => {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, Math.max(r - bevel, 0.05)), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 8,
    curveSegments: 40,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

function screenTexture(logoUrl) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 1056
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  const draw = (img) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (img) {
      const size = 300
      const ratio = img.width / img.height
      const w = ratio > 1 ? size : size * ratio
      const h = ratio > 1 ? size / ratio : size
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2 - 40, w, h)
    }
    ctx.fillStyle = '#86868b'
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ZONA ORIGINALS', canvas.width / 2, canvas.height / 2 + 190)
    tex.needsUpdate = true
  }

  draw(null)
  const img = new Image()
  img.onload = () => draw(img)
  img.src = logoUrl
  return tex
}

export function createPhoneScene(container, { color = '#2b2b2d', variant = 'pro', logoUrl = LOGO, name = '' }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-2px'
  canvas.tabIndex = 0
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', `Modelo 3D de ${name || 'iPhone'}. Arrastra o usa las flechas para girarlo.`)
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  const key = new THREE.DirectionalLight(0xffffff, 1.2)
  key.position.set(4, 8, 10)
  scene.add(key)

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 200)

  const size = variant.startsWith('max') ? DIMS.max : variant === 'pro' ? DIMS.pro : DIMS.base
  const triple = variant.endsWith('pro')
  const { w, h, d } = size
  const target = new THREE.Color(color)

  const metal = new THREE.MeshPhysicalMaterial({ color: target.clone(), metalness: 0.92, roughness: 0.3 })
  const glass = new THREE.MeshPhysicalMaterial({
    color: target.clone(),
    metalness: 0.1,
    roughness: 0.38,
    clearcoat: 0.6,
    clearcoatRoughness: 0.35,
  })
  const plateau = new THREE.MeshPhysicalMaterial({
    color: target.clone(),
    metalness: 0.05,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })
  const tinted = [metal, glass, plateau]

  const phone = new THREE.Group()
  const holder = new THREE.Group()
  holder.add(phone)
  scene.add(holder)

  // Marco
  phone.add(new THREE.Mesh(extrude(w, h, 1.05, d - 0.24, 0.12), metal))

  // Vidrio trasero (mira hacia -z)
  const back = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(w - 0.34, h - 0.34, 0.9), 40), glass)
  back.rotation.y = Math.PI
  back.position.z = -d / 2 - 0.004
  phone.add(back)

  // Emblema de la tienda grabado en la tapa: solo las líneas claras del logo, sin el fondo oscuro.
  const emblemCanvas = document.createElement('canvas')
  emblemCanvas.width = 512
  emblemCanvas.height = 512
  const emblemTex = new THREE.CanvasTexture(emblemCanvas)
  emblemTex.colorSpace = THREE.SRGBColorSpace
  emblemTex.anisotropy = 8
  const emblemImg = new Image()
  emblemImg.onload = () => {
    const ctx = emblemCanvas.getContext('2d', { willReadFrequently: true })
    const ratio = emblemImg.width / emblemImg.height
    const ew = ratio > 1 ? 512 : 512 * ratio
    const eh = ratio > 1 ? 512 / ratio : 512
    ctx.drawImage(emblemImg, (512 - ew) / 2, (512 - eh) / 2, ew, eh)
    const img = ctx.getImageData(0, 0, 512, 512)
    for (let i = 0; i < img.data.length; i += 4) {
      const lum = (img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114) / 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
      img.data[i + 3] = Math.round(Math.min(1, Math.max(0, (lum - 0.3) / 0.35)) * 255)
    }
    ctx.putImageData(img, 0, 0)
    emblemTex.needsUpdate = true
  }
  emblemImg.src = logoUrl

  // Claro sobre teléfonos oscuros y oscuro sobre teléfonos claros.
  const emblemFor = (c) => new THREE.Color(c.r * 0.299 + c.g * 0.587 + c.b * 0.114 > 0.2 ? 0x232326 : 0xdcdce0)
  const emblemTarget = emblemFor(target)
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8),
    new THREE.MeshBasicMaterial({ map: emblemTex, transparent: true, opacity: 0.92, depthWrite: false, color: emblemTarget.clone() }),
  )
  logo.rotation.y = Math.PI
  logo.position.set(0, -h * 0.1, -d / 2 - 0.008)
  phone.add(logo)

  // Marco negro y pantalla (mira hacia +z)
  const bezel = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(w - 0.26, h - 0.26, 0.95), 40),
    new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.15, clearcoat: 1 }),
  )
  bezel.position.z = d / 2 + 0.004
  phone.add(bezel)

  const screenTex = screenTexture(logoUrl)
  const screen = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(w - 0.5, h - 0.5, 0.8), 40),
    new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
  )
  // El mapa UV de ShapeGeometry usa coordenadas absolutas; se normaliza para cubrir 0..1.
  const sw = w - 0.5
  const sh = h - 0.5
  const uv = screen.geometry.attributes.uv
  const pos = screen.geometry.attributes.position
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / sw + 0.5, pos.getY(i) / sh + 0.5)
  screen.position.z = d / 2 + 0.008
  phone.add(screen)

  const island = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRect(1.9, 0.55, 0.27), 24),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  )
  island.position.set(0, h / 2 - 0.85, d / 2 + 0.012)
  phone.add(island)

  // Isla de cámaras
  const pw = triple ? 3.5 : 3.1
  const px = w / 2 - pw / 2 - 0.42 // +x local = izquierda vista desde atrás
  const py = h / 2 - pw / 2 - 0.42
  const ph = 0.14
  const plate = new THREE.Mesh(extrude(pw, pw, 0.8, ph, 0.04), plateau)
  plate.position.set(px, py, -d / 2 - ph / 2)
  phone.add(plate)

  const ring = new THREE.MeshPhysicalMaterial({ color: 0x9a9aa0, metalness: 1, roughness: 0.25 })
  const lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x050508, roughness: 0.04, metalness: 0.2, clearcoat: 1 })
  const lensCore = new THREE.MeshBasicMaterial({ color: 0x1a1b3a })
  const zBack = -d / 2 - ph

  for (const [vx, vy] of triple ? LENSES.pro : LENSES.base) {
    const lx = px - vx * (pw / 3.5)
    const ly = py + vy * (pw / 3.5)
    const r = pw * 0.19
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 48), ring)
    rim.rotation.x = Math.PI / 2
    rim.position.set(lx, ly, zBack - 0.05)
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, 0.14, 48), lensGlass)
    lens.rotation.x = Math.PI / 2
    lens.position.set(lx, ly, zBack - 0.06)
    const core = new THREE.Mesh(new THREE.CircleGeometry(r * 0.4, 32), lensCore)
    core.rotation.y = Math.PI
    core.position.set(lx, ly, zBack - 0.135)
    phone.add(rim, lens, core)
  }

  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: 0xf2ecd9 }))
  flash.rotation.y = Math.PI
  flash.position.set(px - (pw / 3.5) * 0.85, py + (pw / 3.5) * (triple ? 1.05 : 0.85), zBack - 0.06)
  phone.add(flash)

  // Botones laterales
  const addButton = (x, y, bh) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, bh, 0.34), metal)
    b.position.set(x, y, 0)
    phone.add(b)
  }
  addButton(-w / 2 - 0.02, h * 0.28, 0.5)
  addButton(-w / 2 - 0.02, h * 0.17, 0.95)
  addButton(-w / 2 - 0.02, h * 0.04, 0.95)
  addButton(w / 2 + 0.02, h * 0.16, 1.6)
  if (triple) {
    // Botón de captura de cámara
    addButton(w / 2 + 0.02, -h * 0.14, 1.2)
  }

  // Interacción
  let yaw = Math.PI - 0.6
  let pitch = 0.08
  let yawVel = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let idleSince = performance.now()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const AUTO = reduced ? 0 : 0.55

  const onDown = (e) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    lastT = performance.now()
    canvas.setPointerCapture(e.pointerId)
    canvas.style.cursor = 'grabbing'
  }
  const onMove = (e) => {
    if (!dragging) return
    const now = performance.now()
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    yaw += dx * 0.011
    yawVel = THREE.MathUtils.clamp((dx * 0.011) / Math.max((now - lastT) / 1000, 0.016), -8, 8)
    if (e.pointerType !== 'touch') pitch = THREE.MathUtils.clamp(pitch + dy * 0.006, -0.6, 0.6)
    lastX = e.clientX
    lastY = e.clientY
    lastT = now
  }
  const onUp = () => {
    dragging = false
    idleSince = performance.now()
    canvas.style.cursor = 'grab'
  }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') yawVel = -2.5
    else if (e.key === 'ArrowRight') yawVel = 2.5
    else return
    idleSince = performance.now()
    e.preventDefault()
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('keydown', onKey)

  // Tamaño
  const resize = () => {
    const cw = container.clientWidth || 1
    const ch = container.clientHeight || 1
    renderer.setSize(cw, ch, false)
    camera.aspect = cw / ch
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const distH = (h * 1.18) / 2 / t
    const distW = (Math.max(w, 4.2) * 1.7) / 2 / (t * camera.aspect)
    camera.position.set(0, 0, Math.max(distH, distW))
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  // Solo se dibuja cuando está visible
  let visible = true
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  })
  io.observe(container)

  let raf = 0
  let prev = performance.now()
  const frame = (now) => {
    raf = requestAnimationFrame(frame)
    if (!visible) {
      prev = now
      return
    }
    const dt = Math.min((now - prev) / 1000, 0.05)
    prev = now

    if (!dragging) {
      if (now - idleSince > 1600) yawVel += (AUTO - yawVel) * Math.min(dt * 2, 1)
      else yawVel *= 0.94
      yaw += yawVel * dt
      pitch += (0.08 - pitch) * Math.min(dt * 1.5, 1)
    }

    phone.rotation.set(pitch, yaw, 0)
    holder.position.y = Math.sin(now / 1400) * 0.12

    for (const m of tinted) m.color.lerp(target, Math.min(dt * 7, 1))
    logo.material.color.lerp(emblemTarget, Math.min(dt * 7, 1))
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)

  return {
    setColor(hex) {
      target.set(hex)
      emblemTarget.copy(emblemFor(target))
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('keydown', onKey)
      scene.traverse((o) => {
        o.geometry?.dispose()
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        for (const m of mats) {
          m.map?.dispose()
          m.dispose()
        }
      })
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
