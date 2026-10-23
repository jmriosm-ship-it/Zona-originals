// Endereza un cuadrilátero de una foto (la tapa de una caja vista en perspectiva) a un rectángulo plano.
// corners: [[x, y] × 4] en 0..1 sobre la imagen, en orden: arriba-izq, arriba-der, abajo-der, abajo-izq.

// Resuelve el sistema 8x8 de la homografía que lleva el rectángulo unitario a los 4 puntos de origen.
function homography(src, w, h) {
  const dst = [[0, 0], [w, 0], [w, h], [0, h]]
  const A = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = dst[i]
    const [u, v] = src[i]
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u])
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v, v])
  }
  for (let c = 0; c < 8; c++) {
    let p = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]
    }
  }
  return A.map((row, i) => row[8] / row[i])
}

export function rectify(img, corners, outW = 640) {
  const sw = img.naturalWidth || img.width
  const sh = img.naturalHeight || img.height
  const pts = corners.map(([x, y]) => [x * sw, y * sh])
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const top = dist(pts[0], pts[1])
  const bottom = dist(pts[3], pts[2])
  const left = dist(pts[0], pts[3])
  const right = dist(pts[1], pts[2])
  const ratio = (left + right) / Math.max(top + bottom, 1)
  const W = outW
  const H = Math.max(8, Math.min(1600, Math.round(W * ratio)))

  const src = document.createElement('canvas')
  src.width = sw
  src.height = sh
  const sctx = src.getContext('2d', { willReadFrequently: true })
  sctx.drawImage(img, 0, 0)
  const sdata = sctx.getImageData(0, 0, sw, sh).data

  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const octx = out.getContext('2d')
  const odata = octx.createImageData(W, H)
  const [a, b, c, d, e, f, g, hh] = homography(pts, W, H)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const z = g * x + hh * y + 1
      const u = (a * x + b * y + c) / z
      const v = (d * x + e * y + f) / z
      const x0 = Math.max(0, Math.min(sw - 2, Math.floor(u)))
      const y0 = Math.max(0, Math.min(sh - 2, Math.floor(v)))
      const fx = Math.max(0, Math.min(1, u - x0))
      const fy = Math.max(0, Math.min(1, v - y0))
      const i00 = (y0 * sw + x0) * 4
      const i10 = i00 + 4
      const i01 = i00 + sw * 4
      const i11 = i01 + 4
      const o = (y * W + x) * 4
      for (let k = 0; k < 3; k++) {
        const top = sdata[i00 + k] * (1 - fx) + sdata[i10 + k] * fx
        const bot = sdata[i01 + k] * (1 - fx) + sdata[i11 + k] * fx
        odata.data[o + k] = top * (1 - fy) + bot * fy
      }
      odata.data[o + 3] = 255
    }
  }
  octx.putImageData(odata, 0, 0)
  return out.toDataURL('image/webp', 0.85)
}
