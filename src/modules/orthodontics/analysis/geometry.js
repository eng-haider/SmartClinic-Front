// Plain vector geometry shared by the orthodontic calculators.
// 2D points are [x, y] in image pixels with y DOWN; 3D points are [x, y, z].
// Mirrors app/Modules/Orthodontics/Analysis/Geometry.php in the API.

export const sub = (a, b) => a.map((v, i) => v - b[i])
export const add = (a, b) => a.map((v, i) => v + b[i])
export const scale = (a, k) => a.map(v => v * k)
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)
export const norm = a => Math.sqrt(dot(a, a))
export const distance = (a, b) => norm(sub(a, b))
export const midpoint = (a, b) => scale(add(a, b), 0.5)
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0]
export const deg = r => (r * 180) / Math.PI

/** Unsigned angle between two vectors, degrees 0..180. */
export function angleBetween (u, v) {
  const nu = norm(u)
  const nv = norm(v)
  if (nu < 1e-12 || nv < 1e-12) return null
  return deg(Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (nu * nv)))))
}

/** Angle at vertex b of the path a-b-c. */
export const angleAt = (a, b, c) => angleBetween(sub(a, b), sub(c, b))

/** Signed distance from p to the 2D line a-b; positive on the side `towards` points to. */
export function signedDistanceToLine2 (p, a, b, towards) {
  const d = sub(b, a)
  const len = norm(d)
  if (len < 1e-12) return null
  let n = [-d[1] / len, d[0] / len]
  if (dot(n, towards) < 0) n = [-n[0], -n[1]]
  return dot(sub(p, a), n)
}

export function projectOnLine (p, a, b) {
  const d = sub(b, a)
  const len2 = dot(d, d)
  if (len2 < 1e-12) return null
  return add(a, scale(d, dot(sub(p, a), d) / len2))
}

export function polylineLength (points) {
  let length = 0
  for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i])
  return length
}

export function distanceToPlane (p, a, b, c) {
  const n = cross3(sub(b, a), sub(c, a))
  const len = norm(n)
  if (len < 1e-12) return null
  return Math.abs(dot(sub(p, a), n)) / len
}

export function distanceToLine3 (p, a, b) {
  const d = sub(b, a)
  const len = norm(d)
  if (len < 1e-12) return null
  return norm(cross3(sub(p, a), d)) / len
}

export const round = (v, decimals = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return null
  const k = 10 ** decimals
  // Same rounding as PHP round() (half away from zero).
  return Math.sign(v) * Math.round(Math.abs(v) * k + Number.EPSILON) / k
}

/** {x, y} | [x, y] -> [x, y] or null */
export function point2 (p) {
  if (!p) return null
  const x = Array.isArray(p) ? p[0] : p.x
  const y = Array.isArray(p) ? p[1] : p.y
  return Number.isFinite(Number(x)) && Number.isFinite(Number(y)) && x !== '' && y !== '' ? [Number(x), Number(y)] : null
}

/** {x, y, z} | [x, y, z] -> [x, y, z] or null */
export function point3 (p) {
  if (!p) return null
  const v = Array.isArray(p) ? p : [p.x, p.y, p.z]
  return v.length >= 3 && v.slice(0, 3).every(n => Number.isFinite(Number(n))) ? v.slice(0, 3).map(Number) : null
}
