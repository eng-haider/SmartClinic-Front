// Dental cast analysis - browser twin of the API's CastAnalysisCalculator.php.
import { distance, polylineLength, distanceToPlane, distanceToLine3, round, point3 } from './geometry.js'
import { compareToNorm } from './ceph.js'

export const MAXILLARY_12 = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26]
export const MANDIBULAR_12 = [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36]
export const MAXILLARY_6 = [13, 12, 11, 21, 22, 23]
export const MANDIBULAR_6 = [43, 42, 41, 31, 32, 33]
export const UPPER_10 = [15, 14, 13, 12, 11, 21, 22, 23, 24, 25]
export const LOWER_10 = [45, 44, 43, 42, 41, 31, 32, 33, 34, 35]
export const BOLTON_OVERALL = { mean: 91.3, sd: 1.91, source: 'Bolton 1958' }
export const BOLTON_ANTERIOR = { mean: 77.2, sd: 1.65, source: 'Bolton 1958' }

/** Named points the doctor can pick on each arch. */
export const CAST_POINTS = [
  { key: 'incisal', en: 'Incisal point (between the central incisors)', ar: 'نقطة القواطع (بين الثنيتين)' },
  { key: 'canine_right', en: 'Right canine cusp tip', ar: 'رأس الناب الأيمن' },
  { key: 'canine_left', en: 'Left canine cusp tip', ar: 'رأس الناب الأيسر' },
  { key: 'molar_right', en: 'Mesiobuccal cusp of the right molar', ar: 'الحدبة الأنسية الشدقية للرحى اليمنى' },
  { key: 'molar_left', en: 'Mesiobuccal cusp of the left molar', ar: 'الحدبة الأنسية الشدقية للرحى اليسرى' },
  { key: 'molar_mesial_right', en: 'Mesial contact point of the right molar', ar: 'نقطة التماس الأنسية للرحى اليمنى' },
  { key: 'molar_mesial_left', en: 'Mesial contact point of the left molar', ar: 'نقطة التماس الأنسية للرحى اليسرى' },
  { key: 'pont_premolar_right', en: 'Pont: distal pit of the right first premolar', ar: 'Pont: الحفرة الوحشية للضاحك الأول الأيمن', arch: 'upper' },
  { key: 'pont_premolar_left', en: 'Pont: distal pit of the left first premolar', ar: 'Pont: الحفرة الوحشية للضاحك الأول الأيسر', arch: 'upper' },
  { key: 'pont_molar_right', en: 'Pont: mesial pit of the right first molar', ar: 'Pont: الحفرة الأنسية للرحى الأولى اليمنى', arch: 'upper' },
  { key: 'pont_molar_left', en: 'Pont: mesial pit of the left first molar', ar: 'Pont: الحفرة الأنسية للرحى الأولى اليسرى', arch: 'upper' }
]

const r = v => (v === null || v === undefined ? null : round(v, 2))

function toothWidths (teeth = {}, scaleToMm) {
  const widths = {}
  let hasManual = false
  let hasUnscaled = false
  for (const [key, t] of Object.entries(teeth)) {
    const fdi = parseInt(key, 10)
    if (!(fdi >= 11 && fdi <= 48) || !t || typeof t !== 'object') continue
    if (Number(t.manual_mm) > 0) { widths[fdi] = Number(t.manual_mm); hasManual = true; continue }
    const m = point3(t.mesial)
    const d = point3(t.distal)
    if (m && d) {
      const dist = distance(m, d)
      if (scaleToMm) widths[fdi] = dist * scaleToMm
      else { widths[fdi] = dist; hasUnscaled = true }
    }
  }
  return { widths, unit: hasUnscaled ? 'model units' : 'mm', mixed: hasManual && hasUnscaled }
}

const sum = (w, teeth) => teeth.every(t => w[t] !== undefined) ? teeth.reduce((s, t) => s + w[t], 0) : null
const missing = (w, teeth) => teeth.filter(t => w[t] === undefined)
const pointList = list => (list || []).map(point3).filter(Boolean)

function bolton (w, max, mand, normDef, mixed) {
  const sumMax = sum(w, max)
  const sumMand = sum(w, mand)
  const out = { maxillary_sum: r(sumMax), mandibular_sum: r(sumMand), ratio: null, norm: normDef, comparison: null, excess_arch: null, excess: null, missing_teeth: missing(w, [...max, ...mand]) }
  if (mixed || sumMax === null || sumMand === null || sumMax <= 0) return out
  const ratio = sumMand / sumMax * 100
  const k = normDef.mean / 100
  out.ratio = r(ratio)
  out.comparison = compareToNorm(ratio, normDef)
  if (ratio > normDef.mean) { out.excess_arch = 'mandibular'; out.excess = r(sumMand - sumMax * k) } else { out.excess_arch = 'maxillary'; out.excess = r(sumMax - sumMand / k) }
  return out
}

export function analyzeCast (data = {}, moyersTable = null) {
  const scaleToMm = Number(data.scale_to_mm) > 0 ? Number(data.scale_to_mm) : null
  const { widths: w, unit, mixed } = toothWidths(data.teeth, scaleToMm)
  const toLen = v => (scaleToMm ? v * scaleToMm : v)
  const lenUnit = scaleToMm ? 'mm' : 'model units'
  const points = {}
  for (const arch of ['upper', 'lower']) {
    points[arch] = {}
    for (const [name, pt] of Object.entries(data.points?.[arch] || {})) {
      const v = point3(pt)
      if (v) points[arch][name] = v
    }
  }

  const res = {
    calibrated: !!scaleToMm,
    scale_to_mm: scaleToMm,
    width_unit: unit,
    length_unit: lenUnit,
    tooth_widths: Object.fromEntries(Object.entries(w).map(([k, v]) => [k, r(v)])),
    mixed_units: mixed,
    bolton: {
      overall: bolton(w, MAXILLARY_12, MANDIBULAR_12, BOLTON_OVERALL, mixed),
      anterior: bolton(w, MAXILLARY_6, MANDIBULAR_6, BOLTON_ANTERIOR, mixed)
    }
  }

  const space = {}
  for (const [arch, teeth] of [['upper', UPPER_10], ['lower', LOWER_10]]) {
    const required = sum(w, teeth)
    const pts = pointList(data.arch_perimeter?.[arch])
    const available = pts.length >= 2 ? toLen(polylineLength(pts)) : null
    const comparable = !mixed && required !== null && available !== null && unit === lenUnit
    space[arch] = { required: r(required), available: r(available), discrepancy: comparable ? r(available - required) : null, missing_teeth: missing(w, teeth), unit: lenUnit, needs_perimeter: pts.length < 2 }
  }
  res.space_analysis = space
  res.carey = space.lower

  res.arch = {}
  for (const a of ['upper', 'lower']) {
    const p = points[a]
    res.arch[a] = {
      intercanine_width: p.canine_right && p.canine_left ? r(toLen(distance(p.canine_right, p.canine_left))) : null,
      intermolar_width: p.molar_right && p.molar_left ? r(toLen(distance(p.molar_right, p.molar_left))) : null,
      arch_depth: p.incisal && p.molar_mesial_right && p.molar_mesial_left ? r(toLen(distanceToLine3(p.incisal, p.molar_mesial_right, p.molar_mesial_left))) : null,
      arch_perimeter: space[a].available,
      unit: lenUnit
    }
  }

  // Pont (1909) - maxilla
  const si = sum(w, [12, 11, 21, 22])
  const up = points.upper
  const pont = { sum_incisors: r(si), predicted_premolar_width: null, measured_premolar_width: null, premolar_difference: null, predicted_molar_width: null, measured_molar_width: null, molar_difference: null, unit: 'mm', source: 'Pont 1909', requires: [] }
  if (mixed || si === null || unit !== 'mm') pont.requires.push('incisor_widths_mm')
  else {
    pont.predicted_premolar_width = r(si * 100 / 80)
    pont.predicted_molar_width = r(si * 100 / 64)
    if (!scaleToMm) pont.requires.push('confirmed_model_units')
    else {
      if (up.pont_premolar_right && up.pont_premolar_left) {
        const m = distance(up.pont_premolar_right, up.pont_premolar_left) * scaleToMm
        pont.measured_premolar_width = r(m); pont.premolar_difference = r(m - si * 100 / 80)
      }
      if (up.pont_molar_right && up.pont_molar_left) {
        const m = distance(up.pont_molar_right, up.pont_molar_left) * scaleToMm
        pont.measured_molar_width = r(m); pont.molar_difference = r(m - si * 100 / 64)
      }
    }
  }
  res.pont = pont

  // Tanaka & Johnston (1974)
  const lsi = sum(w, [42, 41, 31, 32])
  const tj = { sum_mandibular_incisors: r(lsi), predicted_upper: null, predicted_lower: null, segments: {}, unit: 'mm', source: 'Tanaka & Johnston 1974' }
  if (!mixed && lsi !== null && unit === 'mm') {
    tj.predicted_upper = r(lsi / 2 + 11.0)
    tj.predicted_lower = r(lsi / 2 + 10.5)
    for (const seg of ['upper_right', 'upper_left', 'lower_right', 'lower_left']) {
      const pts = pointList(data.segments?.[seg])
      if (pts.length < 2 || lenUnit !== 'mm') continue
      const available = toLen(polylineLength(pts))
      const predicted = seg.startsWith('upper') ? lsi / 2 + 11.0 : lsi / 2 + 10.5
      tj.segments[seg] = { available: r(available), predicted: r(predicted), discrepancy: r(available - predicted) }
    }
  }
  res.tanaka_johnston = tj

  res.moyers = { sum_mandibular_incisors: r(lsi), predicted_upper: null, predicted_lower: null, level: null, table_configured: !!moyersTable, source: moyersTable?.source || null }

  // Curve of Spee
  const spee = data.spee || {}
  const inc = point3(spee.incisal)
  const mr = point3(spee.molar_right)
  const ml = point3(spee.molar_left)
  const cos = { right: null, left: null, mean: null, unit: lenUnit }
  if (inc && mr && ml) {
    for (const side of ['right', 'left']) {
      const cusps = pointList(spee[`cusps_${side}`])
      if (!cusps.length) continue
      cos[side] = r(toLen(Math.max(0, ...cusps.map(c => distanceToPlane(c, inc, mr, ml) ?? 0))))
    }
    if (cos.right !== null && cos.left !== null) cos.mean = r((cos.right + cos.left) / 2)
  }
  res.curve_of_spee = cos

  res.distances = (data.distances || []).map((d, i) => {
    const a = point3(d.a)
    const b = point3(d.b)
    return a && b ? { label: String(d.label || `#${i + 1}`), value: r(toLen(distance(a, b))), unit: lenUnit } : null
  }).filter(Boolean)

  return res
}
