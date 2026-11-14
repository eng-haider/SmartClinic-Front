import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { analyzeCeph } from '../src/modules/orthodontics/analysis/ceph.js'
import { analyzeCast } from '../src/modules/orthodontics/analysis/cast.js'
import { analyzeFace } from '../src/modules/orthodontics/analysis/face.js'

// Same fixtures as the API's PHPUnit tests (tests/Fixtures/orthodontics in
// SmartClinic-API-Laravel). Landmarks are placed by geometric construction,
// so the expected values are known exactly - neither engine produced them.
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/orthodontics/${name}`, import.meta.url), 'utf8'))
const near = (actual, expected, tol, label) =>
  assert.ok(actual !== null && Math.abs(actual - expected) <= tol, `${label}: expected ${expected} ± ${tol}, got ${actual}`)

test('cephalometric twin matches the constructed reference geometry', () => {
  const f = fixture('ceph_reference.json')
  const { measurements: m, calibration, facing } = analyzeCeph(f.input)
  for (const [key, expected] of Object.entries(f.expected)) {
    near(m[key].value, expected, m[key].unit === '°' ? f.tolerance.deg : f.tolerance.mm, key)
  }
  assert.equal(calibration.method, 'ruler')
  assert.equal(facing, 'right')
  assert.equal(m.wits.unit, 'mm')
})

test('cephalometric measurements do not change when the radiograph is mirrored', () => {
  const f = fixture('ceph_reference.json')
  const mirrored = structuredClone(f.input)
  for (const p of Object.values(mirrored.landmarks)) p.x = 1000 - p.x
  const a = analyzeCeph(f.input).measurements
  const b = analyzeCeph(mirrored).measurements
  for (const [key, row] of Object.entries(a)) if (row.value !== null) near(b[key].value, row.value, 0.011, key)
})

test('uncalibrated distances stay in px and are not compared to mm norms', () => {
  const f = fixture('ceph_reference.json')
  const input = { landmarks: f.input.landmarks }
  const r = analyzeCeph(input)
  assert.equal(r.measurements.wits.unit, 'px')
  assert.equal(r.measurements.wits.calibrated, false)
  near(r.measurements.wits.value, 14.52, 0.01, 'wits px')
  const steiner = Object.fromEntries(r.analyses.steiner.map(row => [row.key, row]))
  assert.equal(steiner.U1_NA_mm.comparison, null)
  assert.equal(steiner.SNA.comparison.status, 'within')
})

test('missing landmarks give null with the missing codes', () => {
  const f = fixture('ceph_reference.json')
  const input = structuredClone(f.input)
  delete input.landmarks.B
  const m = analyzeCeph(input).measurements
  assert.equal(m.SNB.value, null)
  assert.deepEqual(m.SNB.missing, ['B'])
})

test('cast twin matches the hand-computed reference', () => {
  const f = fixture('cast_reference.json')
  const r = analyzeCast(f.input)
  const e = f.expected
  const t = f.tolerance
  near(r.bolton.overall.ratio, e.bolton_overall_ratio, t, 'bolton overall')
  assert.equal(r.bolton.overall.excess_arch, e.bolton_overall_excess_arch)
  near(r.bolton.overall.excess, e.bolton_overall_excess, t, 'overall excess')
  near(r.bolton.anterior.ratio, e.bolton_anterior_ratio, t, 'bolton anterior')
  assert.equal(r.bolton.anterior.excess_arch, e.bolton_anterior_excess_arch)
  near(r.bolton.anterior.excess, e.bolton_anterior_excess, t, 'anterior excess')
  near(r.space_analysis.lower.required, e.lower_required, t, 'required')
  near(r.space_analysis.lower.available, e.lower_available, t, 'available')
  near(r.space_analysis.lower.discrepancy, e.lower_discrepancy, t, 'discrepancy')
  near(r.arch.upper.intercanine_width, e.upper_intercanine, t, 'intercanine')
  near(r.arch.upper.arch_depth, e.upper_arch_depth, t, 'arch depth')
  near(r.pont.predicted_premolar_width, e.pont_predicted_premolar, t, 'pont premolar')
  near(r.pont.predicted_molar_width, e.pont_predicted_molar, t, 'pont molar')
  near(r.pont.premolar_difference, e.pont_premolar_difference, t, 'pont premolar diff')
  near(r.pont.molar_difference, e.pont_molar_difference, t, 'pont molar diff')
  near(r.tanaka_johnston.predicted_upper, e.tj_upper, t, 'TJ upper')
  near(r.tanaka_johnston.predicted_lower, e.tj_lower, t, 'TJ lower')
  near(r.curve_of_spee.right, e.spee_right, t, 'spee right')
  near(r.curve_of_spee.left, e.spee_left, t, 'spee left')
  near(r.curve_of_spee.mean, e.spee_mean, t, 'spee mean')
})

test('cast widths from unconfirmed models are model units and never mixed with mm', () => {
  const f = fixture('cast_reference.json')
  const teeth = structuredClone(f.input.teeth)
  teeth['11'] = { mesial: [0, 0, 0], distal: [9, 0, 0] }
  const r = analyzeCast({ teeth })
  assert.equal(r.mixed_units, true)
  assert.equal(r.width_unit, 'model units')
  assert.equal(r.bolton.overall.ratio, null)
})

test('face twin: thirds, symmetry and profile', () => {
  const p = (x, y) => ({ x, y })
  const frontal = analyzeFace({
    view: 'frontal',
    landmarks: { PupR: p(80, 100), PupL: p(140, 100), Tr: p(110, 0), G: p(110, 60), Sn: p(110, 120), Sto: p(110, 140), MeS: p(110, 180), ChR: p(85, 140), ChL: p(145, 142), Ls: p(113, 132) },
    calibration: { p1: p(0, 0), p2: p(100, 0), known_mm: 50 }
  })
  near(frontal.thirds.upper, 30, 1e-9, 'upper third mm')
  near(frontal.symmetry.cheilion.asymmetry_pct, 16.7, 0.05, 'commissure asymmetry')
  near(frontal.midline_deviation.Ls, 1.5, 1e-9, 'philtrum deviation')

  const profile = analyzeFace({ view: 'profile', landmarks: { Cm: p(110, 90), Sn: p(100, 100), Ls: p(100, 130), G: p(100, 0), PogS: p(100, 200), Prn: p(130, 80), Li: p(100, 160) } })
  near(profile.profile.nasolabial_angle, 135, 0.01, 'nasolabial')
  near(profile.profile.facial_convexity, 0, 0.01, 'convexity')
})
