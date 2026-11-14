// Curved planar reconstruction for dental CBCT, in plain JS on the volume's
// own voxels (no screenshots, no estimation):
//  - an arch curve drawn on an axial slice (index space) is turned into a
//    Catmull-Rom spline and resampled every `stepMm` along its length;
//  - the panoramic image samples, for every curve point and every axial
//    slice, the voxels along the curve normal within the slab (MIP or mean);
//  - a cross-section is the plane through one curve point spanned by the
//    curve normal and the slice axis.
// Pixel sizes are exact: `stepMm` horizontally and the slice spacing
// vertically, so distances measured on these images are in mm.
//
// Geometry follows Cornerstone3D volumes: direction = [rowCosine (i),
// columnCosine (j), sliceNormal (k)], world = origin + Σ index·spacing·dir.

export function indexToWorld (g, [i, j, k]) {
  const d = g.direction
  const s = g.spacing
  return [0, 1, 2].map(a => g.origin[a] + i * s[0] * d[a] + j * s[1] * d[3 + a] + k * s[2] * d[6 + a])
}

const at = (g, i, j, k) => g.scalars[i + g.dims[0] * (j + g.dims[1] * k)]

/** Bilinear sample in the (i, j) plane of slice k; null outside the volume. */
export function sample (g, i, j, k) {
  const [nx, ny, nz] = g.dims
  if (k < 0 || k >= nz || i < 0 || j < 0 || i > nx - 1 || j > ny - 1) return null
  const i0 = Math.floor(i); const j0 = Math.floor(j)
  const i1 = Math.min(i0 + 1, nx - 1); const j1 = Math.min(j0 + 1, ny - 1)
  const fi = i - i0; const fj = j - j0
  const v00 = at(g, i0, j0, k); const v10 = at(g, i1, j0, k)
  const v01 = at(g, i0, j1, k); const v11 = at(g, i1, j1, k)
  return (v00 * (1 - fi) + v10 * fi) * (1 - fj) + (v01 * (1 - fi) + v11 * fi) * fj
}

/** Row 0 is the most superior slice (patient +z in DICOM LPS). */
export const rowToSlice = (g, row) => (g.direction[8] >= 0 ? g.dims[2] - 1 - row : row)

/** Axial (i, j) image of slice k, as a MIP over k ± slab slices. */
export function axialImage (g, k, slab = 0) {
  const [nx, ny, nz] = g.dims
  const out = new Float32Array(nx * ny)
  const k0 = Math.max(0, k - slab); const k1 = Math.min(nz - 1, k + slab)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      let v = -Infinity
      for (let kk = k0; kk <= k1; kk++) v = Math.max(v, at(g, i, j, kk))
      out[i + nx * j] = v
    }
  }
  return { width: nx, height: ny, values: out }
}

/**
 * Arch curve through control points ([i, j] index coords on an axial slice),
 * resampled every stepMm. Each sample has its position (index space), unit
 * tangent and in-plane unit normal (both in mm space, then index space).
 */
export function archCurve (g, controlPoints, stepMm = 0.5) {
  const [sx, sy] = g.spacing
  const mm = controlPoints.map(([i, j]) => [i * sx, j * sy])
  if (mm.length < 2) return { samples: [], lengthMm: 0, stepMm }
  // Dense Catmull-Rom polyline in mm.
  const dense = []
  const P = idx => mm[Math.max(0, Math.min(mm.length - 1, idx))]
  for (let s = 0; s < mm.length - 1; s++) {
    const p0 = P(s - 1); const p1 = P(s); const p2 = P(s + 1); const p3 = P(s + 2)
    for (let t = 0; t < 1; t += 1 / 32) {
      const t2 = t * t; const t3 = t2 * t
      dense.push([0, 1].map(a => 0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)))
    }
  }
  dense.push(mm[mm.length - 1])
  // Resample by arc length.
  const cum = [0]
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]))
  const lengthMm = cum[cum.length - 1]
  const samples = []
  let seg = 0
  for (let d = 0; d <= lengthMm + 1e-9; d += stepMm) {
    while (seg < cum.length - 2 && cum[seg + 1] < d) seg++
    const span = cum[seg + 1] - cum[seg] || 1
    const f = Math.min(1, Math.max(0, (d - cum[seg]) / span))
    const p = [dense[seg][0] + (dense[seg + 1][0] - dense[seg][0]) * f, dense[seg][1] + (dense[seg + 1][1] - dense[seg][1]) * f]
    let tx = dense[seg + 1][0] - dense[seg][0]; let ty = dense[seg + 1][1] - dense[seg][1]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl; ty /= tl
    samples.push({ distMm: d, posMm: p, pos: [p[0] / sx, p[1] / sy], tangent: [tx, ty], normal: [-ty, tx] })
  }
  return { samples, lengthMm, stepMm }
}

/**
 * Panoramic reconstruction: width = curve samples, height = slices.
 * `thicknessMm` is the full slab across the curve (MIP or mean).
 */
export function panoramicImage (g, curve, { thicknessMm = 10, mode = 'mip' } = {}) {
  const [sx, sy] = g.spacing
  const nz = g.dims[2]
  const w = curve.samples.length
  const step = Math.min(sx, sy)
  const half = Math.max(0, thicknessMm / 2)
  const offsets = []
  for (let t = -half; t <= half + 1e-9; t += step) offsets.push(t)
  if (!offsets.length) offsets.push(0)
  const out = new Float32Array(w * nz)
  for (let c = 0; c < w; c++) {
    const { posMm, normal } = curve.samples[c]
    for (let row = 0; row < nz; row++) {
      const k = rowToSlice(g, row)
      let acc = mode === 'mip' ? -Infinity : 0
      let n = 0
      for (const t of offsets) {
        const v = sample(g, (posMm[0] + normal[0] * t) / sx, (posMm[1] + normal[1] * t) / sy, k)
        if (v === null) continue
        if (mode === 'mip') acc = Math.max(acc, v); else acc += v
        n++
      }
      out[c + w * row] = n ? (mode === 'mip' ? acc : acc / n) : NaN
    }
  }
  return { width: w, height: nz, values: out, pixelMm: [curve.stepMm, g.spacing[2]] }
}

/**
 * Cross-section through curve sample `index`: columns run along the normal
 * from -halfWidthMm (lingual side, by the curve's orientation) to +halfWidthMm.
 */
export function crossSection (g, curve, index, { halfWidthMm = 15, stepMm = null } = {}) {
  const s = curve.samples[Math.max(0, Math.min(curve.samples.length - 1, index))]
  const [sx, sy] = g.spacing
  const step = stepMm || Math.min(sx, sy)
  const nz = g.dims[2]
  const w = Math.max(1, Math.round((2 * halfWidthMm) / step) + 1)
  const out = new Float32Array(w * nz)
  for (let col = 0; col < w; col++) {
    const t = -halfWidthMm + col * step
    const i = (s.posMm[0] + s.normal[0] * t) / sx
    const j = (s.posMm[1] + s.normal[1] * t) / sy
    for (let row = 0; row < nz; row++) {
      const v = sample(g, i, j, rowToSlice(g, row))
      out[col + w * row] = v === null ? NaN : v
    }
  }
  // (col, row) on this image -> world (mm), for saving implants / points.
  const toWorld = (col, row) => {
    const t = -halfWidthMm + col * step
    return indexToWorld(g, [(s.posMm[0] + s.normal[0] * t) / sx, (s.posMm[1] + s.normal[1] * t) / sy, rowToSlice(g, row)])
  }
  return { width: w, height: nz, values: out, pixelMm: [step, g.spacing[2]], toWorld, sample: s }
}

/** Window/level -> RGBA for a canvas ImageData. NaN (outside) is black. */
export function toRgba ({ width, height, values }, lower, upper) {
  const data = new Uint8ClampedArray(width * height * 4)
  const span = upper - lower || 1
  for (let p = 0; p < width * height; p++) {
    const v = values[p]
    const g = Number.isNaN(v) ? 0 : Math.max(0, Math.min(255, ((v - lower) / span) * 255))
    data[p * 4] = data[p * 4 + 1] = data[p * 4 + 2] = g
    data[p * 4 + 3] = 255
  }
  return data
}

/** A reasonable starting window from the data (1st..99.5th percentile). */
export function autoWindow (values) {
  const sampleVals = []
  const stride = Math.max(1, Math.floor(values.length / 20000))
  for (let i = 0; i < values.length; i += stride) if (!Number.isNaN(values[i])) sampleVals.push(values[i])
  sampleVals.sort((a, b) => a - b)
  const q = f => sampleVals[Math.min(sampleVals.length - 1, Math.floor(f * sampleVals.length))] ?? 0
  return [q(0.01), q(0.995)]
}
