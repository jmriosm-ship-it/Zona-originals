import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Color promedio del borde de la foto: se usa para los lados de la caja.
function edgeColor(img) {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, 32, 32)
  const d = ctx.getImageData(0, 0, 32, 32).data
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i < 32; i++) {
    for (const [x, y] of [[i, 0], [i, 31], [0, i], [31, i]]) {
      const k = (y * 32 + x) * 4
      r += d[k]
      g += d[k + 1]
      b += d[k + 2]
      n++
    }
  }
  return new THREE.Color(r / n / 255, g / n / 255, b / n / 255)
}

// Rectángulo con esquinas redondeadas (para el contorno del celular y su cámara).
function roundedRect(w, h, r) {
  const sh = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  sh.moveTo(x + r, y)
  sh.lineTo(x + w - r, y)
  sh.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  sh.lineTo(x + w, y + h - r)
  sh.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  sh.lineTo(x + r, y + h)
  sh.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  sh.lineTo(x, y + r)
  sh.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return sh
}

// Cuerpo extruido con bisel (marco del celular).
function bodyGeometry(w, h, r, depth, bevel) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, Math.max(r - bevel, 0.01)), {
    depth: Math.max(depth - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 32,
  })
  g.translate(0, 0, -(depth - bevel * 2) / 2)
  return g
}

// Plano con esquinas redondeadas y UV normalizados a 0..1 para que la foto lo cubra entero.
function photoPlane(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 32)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  return g
}

// Teclado sobre fondo transparente: se dibuja encima de la base, que toma el color elegido.
function keyboardCanvas() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 700
  const g = c.getContext('2d')
  g.fillStyle = '#0b0b0d'
  const rows = [14, 14, 13, 12, 10]
  const left = 70
  const width = 884
  const gap = 8
  let y = 64
  for (const n of rows) {
    const kw = (width - gap * (n - 1)) / n
    for (let i = 0; i < n; i++) {
      g.beginPath()
      g.roundRect(left + i * (kw + gap), y, kw, 56, 8)
      g.fill()
    }
    y += 70
  }
  g.strokeStyle = 'rgba(0,0,0,0.28)'
  g.lineWidth = 3
  g.beginPath()
  g.roundRect(334, 470, 356, 190, 16)
  g.stroke()
  return c
}

// Carátula de reloj por defecto: negro con la hora.
function watchFaceCanvas() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 600
  const g = c.getContext('2d')
  g.fillStyle = '#000'
  g.fillRect(0, 0, 512, 600)
  g.fillStyle = '#f5f5f7'
  g.font = '600 150px Inter, system-ui, sans-serif'
  g.textAlign = 'center'
  g.fillText('10:09', 256, 330)
  g.fillStyle = '#86868b'
  g.font = '500 34px Inter, system-ui, sans-serif'
  g.fillText('ZONA ORIGINALS', 256, 400)
  return c
}

// Busca el módulo de cámaras en la foto de la tapa: el bloque oscuro más grande de la parte de arriba.
// Devuelve su rectángulo en 0..1 (origen arriba a la izquierda) o null si no parece una cámara.
function findCamera(img) {
  const W = 160
  const H = Math.max(8, Math.round((W * img.height) / img.width))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, W, H)
  const d = ctx.getImageData(0, 0, W, H).data
  const lum = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) lum[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114

  // Umbral relativo al color de la tapa (mediana de la mitad de arriba).
  const sample = Array.from(lum.slice(0, Math.floor(W * H * 0.5))).sort((p, q) => p - q)
  const body = sample[Math.floor(sample.length / 2)]
  const limit = Math.min(95, body * 0.55)
  const rows = Math.floor(H * 0.45)
  const seen = new Uint8Array(W * H)
  let best = null
  for (let y0 = 0; y0 < rows; y0++) {
    for (let x0 = 0; x0 < W; x0++) {
      const start = y0 * W + x0
      if (seen[start] || lum[start] >= limit) continue
      // Componente conexa de píxeles oscuros
      const stack = [start]
      seen[start] = 1
      let minX = x0
      let maxX = x0
      let minY = y0
      let maxY = y0
      let n = 0
      let edge = false
      while (stack.length) {
        const k = stack.pop()
        const x = k % W
        const y = (k - x) / W
        n++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        if (x === 0 || y === 0 || x === W - 1) edge = true
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= W || ny >= rows) continue
          const nk = ny * W + nx
          if (!seen[nk] && lum[nk] < limit) {
            seen[nk] = 1
            stack.push(nk)
          }
        }
      }
      if (edge || n < W * H * 0.004) continue
      if (!best || n > best.n) best = { n, minX, maxX, minY, maxY }
    }
  }
  if (!best) return null
  const pad = 0.012
  const box = {
    x0: Math.max(0, best.minX / W - pad),
    x1: Math.min(1, (best.maxX + 1) / W + pad),
    y0: Math.max(0, best.minY / H - pad),
    y1: Math.min(1, (best.maxY + 1) / H + pad),
  }
  const bw = box.x1 - box.x0
  const bh = box.y1 - box.y0
  return bw > 0.85 || bh > 0.5 || bw < 0.12 || bh < 0.06 ? null : box
}

// Caja 3D a partir de la foto del frente: la foto va en las caras grandes y los lados toman su color.
export function createBoxScene(container, { image, faces = {}, depth = 0.34, name = '', mode = 'box', color = '#2b2b2d', camera: cameraBox = null }) {
  const phone = mode === 'phone'
  const laptop = mode === 'laptop'
  const watch = mode === 'watch'
  const solid = mode !== 'box'
  let strapMat = null
  const target = new THREE.Color(color)
  let sideMat = null
  let backMat = null
  const tint = new THREE.Color(1, 1, 1)
  const syncTint = () => tint.set(1, 1, 1).lerp(target, 0.9)
  syncTint()
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-2px'
  canvas.tabIndex = 0
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', `${laptop ? 'MacBook' : watch ? 'Reloj' : phone ? 'Celular' : 'Caja'} 3D de ${name}. Arrastra o usa las flechas para girarlo.`)
  container.appendChild(canvas)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  const key = new THREE.DirectionalLight(0xffffff, 1.1)
  key.position.set(4, 8, 10)
  scene.add(key)
  // Relleno frío desde la izquierda y luz de contorno desde atrás: marcan los bordes del marco.
  const fill = new THREE.DirectionalLight(0xa9bfff, 0.35)
  fill.position.set(-6, 2, 6)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.7)
  rim.position.set(-3, 5, -9)
  scene.add(rim)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  const holder = new THREE.Group()
  scene.add(holder)
  const box = new THREE.Group()
  holder.add(box)
  const floor = new THREE.Group()
  scene.add(floor)

  // Medidas: alto 1, ancho según la proporción de la foto.
  let dims = { w: 0.6, h: 1, d: 0.6 * depth }
  let zoom = 1
  let floorLevel = null // altura del piso cuando el modelo no está centrado (laptop, reloj)
  const resize = () => {
    const cw = container.clientWidth || 1
    const ch = container.clientHeight || 1
    renderer.setSize(cw, ch, false)
    camera.aspect = cw / ch
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const distH = (dims.h * 1.35) / 2 / t
    const distW = (Math.max(dims.w, dims.d) * 2.1) / 2 / (t * camera.aspect)
    camera.position.set(0, dims.h * 0.14, Math.max(distH, distW) * zoom)
    camera.lookAt(0, -dims.h * 0.02, 0)
    camera.updateProjectionMatrix()
  }

  const mats = []
  const texs = []
  const loadImg = (url) =>
    new Promise((resolve) => {
      const im = new Image()
      // Las fotos de la nube vienen de otra dirección: sin esto el navegador bloquearía usarlas como textura 3D.
      im.crossOrigin = 'anonymous'
      im.onload = () => resolve(im)
      im.onerror = () => resolve(null)
      im.src = url
    })
  const faceMaterial = (im) => {
    const tex = new THREE.Texture(im)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
    texs.push(tex)
    const m = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.35 })
    mats.push(m)
    return m
  }

  let alive = true
  ;(async () => {
    const [front, ...others] = await Promise.all([image, faces.right, faces.left, faces.top, faces.bottom, faces.back, faces.deck].map((u) => (u ? loadImg(u) : null)))
    if (!alive) return
    if (!front && !laptop && !watch) return
    const ratio = front ? front.width / front.height : 1
    dims = { w: ratio, h: 1, d: ratio * depth }
    const side = solid
      ? new THREE.MeshPhysicalMaterial({ color: target.clone(), metalness: 0.85, roughness: 0.32 })
      : new THREE.MeshPhysicalMaterial({ color: edgeColor(front), roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 })
    if (solid) sideMat = side
    mats.push(side)
    const [right, left, top, bottom, back, deck] = others
    if (laptop) {
      // MacBook abierta: base con teclado, bisagra y pantalla inclinada. Todo sale de las fotos del administrador.
      const W = 1.5
      const D = 1.02
      const t = 0.055
      const Hs = 0.98
      const lidT = 0.042
      const baseY = -0.55 + t / 2
      dims = { w: W, h: 1.5, d: D }
      floorLevel = -0.55

      const baseMesh = new THREE.Mesh(new RoundedBoxGeometry(W, t, D, 4, 0.02), side)
      baseMesh.position.y = baseY
      box.add(baseMesh)

      // Teclado: foto del administrador o teclado dibujado sobre el color de la base.
      let deckMat
      if (deck) {
        deckMat = faceMaterial(deck)
      } else {
        const ktex = new THREE.CanvasTexture(keyboardCanvas())
        ktex.colorSpace = THREE.SRGBColorSpace
        ktex.anisotropy = 8
        texs.push(ktex)
        deckMat = new THREE.MeshBasicMaterial({ map: ktex, transparent: true, depthWrite: false })
        mats.push(deckMat)
      }
      const deckMesh = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.05, D - 0.05).rotateX(-Math.PI / 2), deckMat)
      deckMesh.position.y = baseY + t / 2 + 0.001
      box.add(deckMesh)

      // Tapa de la pantalla (gira sobre la bisagra del borde de atrás)
      const hingeY = baseY + t / 2
      const lid = new THREE.Group()
      lid.position.set(0, hingeY, -D / 2 + 0.012)
      lid.rotation.x = -(105 * Math.PI) / 180
      const slab = new THREE.Mesh(new RoundedBoxGeometry(W, lidT, Hs, 3, 0.012), side)
      slab.position.z = Hs / 2
      lid.add(slab)

      const bezel = new THREE.Mesh(
        new THREE.PlaneGeometry(W - 0.02, Hs - 0.02).rotateX(Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0x050507, roughness: 0.12, clearcoat: 1 }),
      )
      mats.push(bezel.material)
      bezel.position.set(0, -lidT / 2 - 0.0006, Hs / 2)
      lid.add(bezel)

      let screenMat
      if (front) {
        screenMat = new THREE.MeshBasicMaterial({ map: (() => { const tx = new THREE.Texture(front); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; tx.needsUpdate = true; texs.push(tx); return tx })(), toneMapped: false })
      } else {
        screenMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0d })
      }
      mats.push(screenMat)
      const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.09, Hs - 0.1).rotateX(Math.PI / 2), screenMat)
      screenMesh.position.set(0, -lidT / 2 - 0.0012, Hs / 2)
      lid.add(screenMesh)

      // Parte de afuera de la tapa (con el logo): la foto se tiñe con el color elegido.
      if (back) {
        backMat = faceMaterial(back)
        backMat.color.copy(tint)
        backMat.metalness = 0.15
        const outer = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, Hs - 0.04).rotateX(-Math.PI / 2).rotateY(Math.PI), backMat)
        outer.position.set(0, lidT / 2 + 0.0008, Hs / 2)
        lid.add(outer)
      }
      box.add(lid)

      const hinge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, W * 0.92, 24).rotateZ(Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0x2a2a2e, metalness: 0.9, roughness: 0.3 }),
      )
      mats.push(hinge.material)
      hinge.position.set(0, hingeY, -D / 2 + 0.012)
      box.add(hinge)
    } else if (watch) {
      // Reloj: caja redondeada con la foto de la pantalla y de la parte de atrás, corona, botón y correa.
      const cw = 0.86
      const ch = 1.0
      const cd = 0.3
      const cr = cw * 0.26
      dims = { w: cw + 0.1, h: 2.0, d: cd }
      floorLevel = -1.0

      box.add(new THREE.Mesh(bodyGeometry(cw, ch, cr, cd, 0.04), side))

      const faceMat = front
        ? faceMaterial(front)
        : (() => {
            const ftex = new THREE.CanvasTexture(watchFaceCanvas())
            ftex.colorSpace = THREE.SRGBColorSpace
            ftex.anisotropy = 8
            texs.push(ftex)
            const m = new THREE.MeshBasicMaterial({ map: ftex, toneMapped: false })
            mats.push(m)
            return m
          })()
      const faceMesh = new THREE.Mesh(photoPlane(cw - 0.07, ch - 0.07, cr - 0.035), faceMat)
      faceMesh.position.z = cd / 2 + 0.0008
      box.add(faceMesh)

      if (back) {
        const bm = faceMaterial(back)
        const backMesh = new THREE.Mesh(photoPlane(cw - 0.12, ch - 0.12, cr - 0.06), bm)
        backMesh.rotation.y = Math.PI
        backMesh.position.z = -cd / 2 - 0.0008
        box.add(backMesh)
      }

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 28).rotateZ(Math.PI / 2), side)
      crown.position.set(cw / 2 + 0.03, 0.2, 0)
      box.add(crown)
      const sideBtn = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.24, 0.08, 3, 0.01), side)
      sideBtn.position.set(cw / 2 + 0.012, -0.12, 0)
      box.add(sideBtn)

      // Correa: dos tramos que se curvan hacia atrás; toman el color elegido.
      strapMat = new THREE.MeshPhysicalMaterial({ color: target.clone(), roughness: 0.78, metalness: 0.02 })
      mats.push(strapMat)
      for (const dir of [1, -1]) {
        const g = new THREE.Group()
        g.position.set(0, (dir * ch) / 2 - dir * 0.02, -0.03)
        g.rotation.x = dir * -0.4
        const piece = new THREE.Mesh(new RoundedBoxGeometry(cw * 0.8, 0.56, 0.07, 4, 0.03), strapMat)
        piece.position.y = dir * 0.28
        g.add(piece)
        box.add(g)
      }
    } else if (!phone) {
      // Orden de BoxGeometry: +x (derecha), -x (izquierda), +y (arriba), -y (abajo), +z (frente), -z (atrás)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(dims.w, dims.h, dims.d), [
        right ? faceMaterial(right) : side,
        left ? faceMaterial(left) : side,
        top ? faceMaterial(top) : side,
        bottom ? faceMaterial(bottom) : side,
        faceMaterial(front),
        back ? faceMaterial(back) : side,
      ])
      box.add(mesh)
    } else {
      // Celular: marco metálico biselado con esquinas redondeadas, fotos de frente y tapa dentro del marco,
      // botones laterales y módulo de cámaras en relieve.
      const { w, h, d } = dims
      const radius = w * 0.15
      const rim = 0.012
      box.add(new THREE.Mesh(bodyGeometry(w, h, radius, d, Math.min(d * 0.3, 0.012)), side))

      const fw = w - rim * 2
      const fh = h - rim * 2
      const fr = Math.max(radius - rim, 0.01)

      const frontMesh = new THREE.Mesh(photoPlane(fw, fh, fr), faceMaterial(front))
      frontMesh.position.z = d / 2 + 0.0008
      box.add(frontMesh)

      if (back) {
        backMat = faceMaterial(back)
        backMat.color.copy(tint)
        backMat.metalness = 0.15
        const backMesh = new THREE.Mesh(photoPlane(fw, fh, fr), backMat)
        backMesh.rotation.y = Math.PI
        backMesh.position.z = -d / 2 - 0.0008
        box.add(backMesh)
      }

      // Fotos de los costados: láminas pegadas a cada lado del marco.
      const sidePlane = (img, pw, ph, x, y, z, rx, ry) => {
        if (!img) return
        const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), faceMaterial(img))
        m.position.set(x, y, z)
        m.rotation.set(rx, ry, 0)
        box.add(m)
      }
      const lenY = h - radius * 2
      const lenX = w - radius * 2
      const thick = d * 0.8
      sidePlane(right, thick, lenY, w / 2 + 0.0008, 0, 0, 0, Math.PI / 2)
      sidePlane(left, thick, lenY, -w / 2 - 0.0008, 0, 0, 0, -Math.PI / 2)
      sidePlane(top, lenX, thick, 0, h / 2 + 0.0008, 0, -Math.PI / 2, 0)
      sidePlane(bottom, lenX, thick, 0, -h / 2 - 0.0008, 0, Math.PI / 2, 0)

      // Botones laterales: acción y volumen a la izquierda, encendido a la derecha.
      for (const [x, y, len] of [[-1, 0.3, 0.035], [-1, 0.19, 0.07], [-1, 0.08, 0.07], [1, 0.2, 0.1]]) {
        const btn = new THREE.Mesh(new RoundedBoxGeometry(0.014, len, d * 0.55, 3, 0.005), side)
        btn.position.set(x * (w / 2 + 0.003), y * h * 0.9, 0)
        box.add(btn)
      }

      // Módulo de cámaras en relieve: la zona se levanta como un bloque biselado con esa parte de la foto encima.
      if (back) {
        const cam = cameraBox || findCamera(back)
        if (cam) {
          const pw = (cam.x1 - cam.x0) * fw
          const phh = (cam.y1 - cam.y0) * fh
          // Dos niveles, como un módulo real: la base del bloque y, encima, el vidrio de las lentes.
          const rise = Math.max(0.04, d * 0.95)
          const rise2 = Math.max(0.015, d * 0.32)
          const bev = 0.006
          const tex = new THREE.Texture(back)
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = 8
          tex.repeat.set(cam.x1 - cam.x0, cam.y1 - cam.y0)
          tex.offset.set(cam.x0, 1 - cam.y1)
          tex.needsUpdate = true
          texs.push(tex)
          const capMat = new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: tex, bumpScale: 1.5, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 })
          // Las paredes del bloque usan el mismo material del marco, así siguen el color del celular
          // (en uno blanco no quedan bordes negros) y el escalón se distingue por la luz.
          const wallMat = side
          const glassWall = side
          mats.push(capMat)
          const cx = (0.5 - (cam.x0 + cam.x1) / 2) * fw
          const cy = (0.5 - (cam.y0 + cam.y1) / 2) * fh
          const block = (bw, bh, depthZ, z0, walls) => {
            const g = new THREE.ExtrudeGeometry(roundedRect(bw - bev * 2, bh - bev * 2, Math.min(bw, bh) * 0.24), {
              depth: Math.max(depthZ - bev * 2, 0.002),
              bevelEnabled: true,
              bevelThickness: bev,
              bevelSize: bev,
              bevelSegments: 4,
              curveSegments: 24,
            })
            const uv = g.attributes.uv
            const pos = g.attributes.position
            for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / pw + 0.5, pos.getY(i) / phh + 0.5)
            const m = new THREE.Mesh(g, [capMat, walls])
            m.rotation.y = Math.PI
            m.position.set(cx, cy, z0)
            box.add(m)
          }
          block(pw, phh, rise, -d / 2 + 0.002, wallMat)
          block(pw * 0.88, phh * 0.88, rise2, -d / 2 - rise + 0.004, glassWall)
        }
      }
    }
    // Piso: sombra suave y un halo de luz tenue debajo, para que el producto no flote en el vacío.
    const radial = (stops) => {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      const g = c.getContext('2d')
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
      for (const [o, col] of stops) grad.addColorStop(o, col)
      g.fillStyle = grad
      g.fillRect(0, 0, 128, 128)
      const t = new THREE.CanvasTexture(c)
      texs.push(t)
      return t
    }
    const floorY = (floorLevel ?? -dims.h / 2) - 0.035
    const span = Math.max(dims.w, dims.d * 2.2)
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(span * 2.4, span * 1.3),
      new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,255,255,0.11)'], [0.55, 'rgba(255,255,255,0.03)'], [1, 'rgba(255,255,255,0)']]), transparent: true, depthWrite: false }),
    )
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(span * 1.8, span * 1.1),
      new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }),
    )
    for (const m of [halo, shadow]) {
      m.rotation.x = -Math.PI / 2
      floor.add(m)
    }
    halo.position.y = floorY - 0.002
    shadow.position.y = floorY
    mats.push(halo.material, shadow.material)
    resize()
  })()

  let yaw = -0.5
  let pitch = 0.1
  let yawVel = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let idleSince = performance.now()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const AUTO = reduced ? 0 : 0.5

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
  const clampZoom = (z) => THREE.MathUtils.clamp(z, 0.55, 1.5)
  const onWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    zoom = clampZoom(zoom * (1 + Math.sign(e.deltaY) * 0.08))
    resize()
  }
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

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
      pitch += (0.1 - pitch) * Math.min(dt * 1.5, 1)
    }
    box.rotation.set(pitch, yaw, 0)
    holder.position.y = Math.sin(now / 1400) * 0.015
    sideMat?.color.lerp(target, Math.min(dt * 7, 1))
    backMat?.color.lerp(tint, Math.min(dt * 7, 1))
    strapMat?.color.lerp(target, Math.min(dt * 7, 1))
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)

  return {
    setColor(hex) {
      target.set(hex)
      syncTint()
    },
    // Acercar (delta negativo) o alejar (positivo) la cámara.
    zoom(delta) {
      zoom = clampZoom(zoom * (1 + delta))
      resize()
    },
    dispose() {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('keydown', onKey)
      canvas.removeEventListener('wheel', onWheel)
      floor.traverse((o) => o.geometry?.dispose())
      box.traverse((o) => o.geometry?.dispose())
      for (const m of mats) m.dispose()
      for (const t of texs) t.dispose()
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
