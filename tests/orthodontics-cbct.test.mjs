import assert from 'node:assert/strict'
import test from 'node:test'
import { archCurve, crossSection, indexToWorld, panoramicImage, rowToSlice, sample } from '../src/modules/orthodontics/components/cbct/panoramic.js'

// Synthetic volume (no patient data): value = 1000*k + 10*j + i, so every
// sample can be checked by hand. Axial LPS orientation, k = +z (superior).
function volume () {
  const dims = [20, 20, 10]
  const scalars = new Float32Array(dims[0] * dims[1] * dims[2])
  for (let k = 0; k < dims[2]; k++) for (let j = 0; j < dims[1]; j++) for (let i = 0; i < dims[0]; i++) scalars[i + 20 * (j + 20 * k)] = 1000 * k + 10 * j + i
  return { dims, spacing: [0.5, 0.5, 1], origin: [-5, -5, 0], direction: [1, 0, 0, 0, 1, 0, 0, 0, 1], scalars }
}

test('index -> world uses origin, spacing and direction', () => {
  assert.deepEqual(indexToWorld(volume(), [2, 4, 3]), [-4, -3, 3])
})

test('bilinear sampling is exact for a linear field', () => {
  const g = volume()
  assert.equal(sample(g, 2.5, 3.25, 4), 4000 + 32.5 + 2.5)
  assert.equal(sample(g, -1, 0, 0), null)
})

test('straight arch curve: length, spacing and normal', () => {
  const c = archCurve(volume(), [[2, 10], [12, 10]], 0.5)
  assert.ok(Math.abs(c.lengthMm - 5) < 1e-6) // 10 voxels * 0.5 mm
  assert.equal(c.samples.length, 11)
  assert.deepEqual(c.samples[0].pos.map(v => +v.toFixed(6)), [2, 10])
  assert.deepEqual(c.samples[0].normal.map(v => +v.toFixed(6) + 0), [0, 1])
})

test('panoramic image with zero slab equals the voxels under the curve, superior on top', () => {
  const g = volume()
  const c = archCurve(g, [[2, 10], [12, 10]], 0.5)
  const pano = panoramicImage(g, c, { thicknessMm: 0, mode: 'mip' })
  assert.equal(pano.width, 11)
  assert.equal(pano.height, 10)
  assert.equal(rowToSlice(g, 0), 9)
  // Column 0, row 0 -> i=2, j=10, k=9
  assert.equal(pano.values[0], 9000 + 100 + 2)
  // Column 4 (2 mm along = i 6), bottom row (k = 0)
  assert.equal(pano.values[4 + 11 * 9], 0 + 100 + 6)
  assert.deepEqual(pano.pixelMm, [0.5, 1])
})

test('MIP slab takes the maximum across the normal', () => {
  const g = volume()
  const c = archCurve(g, [[2, 10], [12, 10]], 0.5)
  const pano = panoramicImage(g, c, { thicknessMm: 2, mode: 'mip' }) // j 8..12
  assert.equal(pano.values[0], 9000 + 120 + 2)
})

test('cross-section maps back to world coordinates in mm', () => {
  const g = volume()
  const c = archCurve(g, [[2, 10], [12, 10]], 0.5)
  const xs = crossSection(g, c, 0, { halfWidthMm: 2, stepMm: 0.5 })
  assert.equal(xs.width, 9)
  // Centre column = the curve point; top row = most superior slice.
  assert.deepEqual(xs.toWorld(4, 0), indexToWorld(g, [2, 10, 9]))
  assert.equal(xs.values[4], 9000 + 100 + 2)
  assert.deepEqual(xs.pixelMm, [0.5, 1])
})
