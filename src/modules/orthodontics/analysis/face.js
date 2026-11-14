// Facial / smile measurements - browser twin of FaceAnalysisCalculator.php.
import { sub, dot, norm, distance, midpoint, angleAt, cross2, signedDistanceToLine2, deg, round, point2 } from './geometry.js'
import { calibrationFrom } from './ceph.js'

export const FACE_LANDMARKS = [
  { code: 'Tr', ar: 'خط الشعر (Tr)', views: ['frontal', 'smile'], manualOnly: true },
  { code: 'G', ar: 'الجبهة بين الحاجبين (G)', views: ['frontal', 'smile', 'profile'] },
  { code: 'Ns', ar: 'جذر الأنف (N′)', views: ['frontal', 'smile', 'profile'] },
  { code: 'Prn', ar: 'قمة الأنف (Prn)', views: ['profile', 'frontal'] },
  { code: 'Cm', ar: 'العمود الأنفي (Cm)', views: ['profile'], manualOnly: true },
  { code: 'Sn', ar: 'تحت الأنف (Sn)', views: ['frontal', 'smile', 'profile'] },
  { code: 'Ls', ar: 'الشفة العليا (Ls)', views: ['frontal', 'smile', 'profile'] },
  { code: 'Sto', ar: 'ملتقى الشفتين (Sto)', views: ['frontal'] },
  { code: 'Li', ar: 'الشفة السفلى (Li)', views: ['frontal', 'smile', 'profile'] },
  { code: 'PogS', ar: 'الذقن الرخو (Pog′)', views: ['frontal', 'smile', 'profile'] },
  { code: 'MeS', ar: 'أسفل الذقن (Me′)', views: ['frontal', 'smile'] },
  { code: 'PupR', ar: 'بؤبؤ العين اليمنى', views: ['frontal', 'smile'] },
  { code: 'PupL', ar: 'بؤبؤ العين اليسرى', views: ['frontal', 'smile'] },
  { code: 'ExR', ar: 'الزاوية الخارجية للعين اليمنى', views: ['frontal', 'smile'] },
  { code: 'ExL', ar: 'الزاوية الخارجية للعين اليسرى', views: ['frontal', 'smile'] },
  { code: 'EnR', ar: 'الزاوية الداخلية للعين اليمنى', views: ['frontal', 'smile'] },
  { code: 'EnL', ar: 'الزاوية الداخلية للعين اليسرى', views: ['frontal', 'smile'] },
  { code: 'AlR', ar: 'جناح الأنف الأيمن', views: ['frontal', 'smile'] },
  { code: 'AlL', ar: 'جناح الأنف الأيسر', views: ['frontal', 'smile'] },
  { code: 'ChR', ar: 'زاوية الفم اليمنى', views: ['frontal', 'smile'] },
  { code: 'ChL', ar: 'زاوية الفم اليسرى', views: ['frontal', 'smile'] },
  { code: 'ZyR', ar: 'عرض الوجه - يمين (Zy)', views: ['frontal'] },
  { code: 'ZyL', ar: 'عرض الوجه - يسار (Zy)', views: ['frontal'] },
  { code: 'GoR', ar: 'زاوية الفك - يمين', views: ['frontal'] },
  { code: 'GoL', ar: 'زاوية الفك - يسار', views: ['frontal'] },
  { code: 'DM', ar: 'منتصف الأسنان العلوية', views: ['smile'], manualOnly: true },
  { code: 'UIE', ar: 'حافة القاطع العلوي', views: ['smile'], manualOnly: true },
  { code: 'UIG', ar: 'حافة اللثة فوق القاطع', views: ['smile'], manualOnly: true },
  { code: 'Stms', ar: 'الحافة السفلية للشفة العليا', views: ['smile'] },
  { code: 'DR', ar: 'آخر سن ظاهر - يمين', views: ['smile'], manualOnly: true },
  { code: 'DL', ar: 'آخر سن ظاهر - يسار', views: ['smile'], manualOnly: true }
]

const PAIRS = { pupils: ['PupR', 'PupL'], exocanthion: ['ExR', 'ExL'], endocanthion: ['EnR', 'EnL'], alare: ['AlR', 'AlL'], cheilion: ['ChR', 'ChL'], zygion: ['ZyR', 'ZyL'], gonion: ['GoR', 'GoL'] }
const CODES = new Set(FACE_LANDMARKS.map(l => l.code))

function midline (p) {
  for (const [r, l, name] of [['PupR', 'PupL', 'pupils'], ['EnR', 'EnL', 'endocanthion'], ['ExR', 'ExL', 'exocanthion']]) {
    if (p[r] && p[l] && distance(p[r], p[l]) > 1e-9) {
      const across = sub(p[l], p[r])
      const n = norm(across)
      const acrossU = [across[0] / n, across[1] / n]
      let down = [-acrossU[1], acrossU[0]]
      if (down[1] < 0) down = [-down[0], -down[1]]
      return { origin: midpoint(p[r], p[l]), across: acrossU, down, defined_by: name }
    }
  }
  return null
}

export function analyzeFace (data = {}) {
  const p = {}
  for (const [code, pt] of Object.entries(data.landmarks || {})) {
    if (!CODES.has(code)) continue
    const v = point2(pt)
    if (v) p[code] = v
  }
  const cal = calibrationFrom({ p1: data.calibration?.p1, p2: data.calibration?.p2, known_mm: data.calibration?.known_mm })
  const mm = cal.mm_per_px
  const len = px => (px === null || px === undefined ? null : round(mm ? px * mm : px, 2))
  const view = ['frontal', 'smile', 'profile'].includes(data.view) ? data.view : 'frontal'
  const out = { view, calibrated: !!mm, length_unit: mm ? 'mm' : 'px', approximate: true }

  if (view === 'profile') {
    const facing = p.Prn && p.Sn ? (p.Prn[0] >= p.Sn[0] ? 1 : -1) : 1
    const ant = [facing, 0]
    let convexity = null
    if (p.G && p.Sn && p.PogS) {
      const angle = angleAt(p.G, p.Sn, p.PogS)
      const side = signedDistanceToLine2(p.Sn, p.G, p.PogS, ant)
      convexity = (side >= 0 ? 1 : -1) * (180 - angle)
    }
    const eLine = code => (p[code] && p.Prn && p.PogS ? len(signedDistanceToLine2(p[code], p.Prn, p.PogS, ant)) : null)
    out.profile = {
      facing: facing > 0 ? 'right' : 'left',
      nasolabial_angle: p.Cm && p.Sn && p.Ls ? round(angleAt(p.Cm, p.Sn, p.Ls)) : null,
      nasolabial_norm: { mean: 102, sd: 8, source: 'Legan & Burstone 1980' },
      facial_convexity: round(convexity),
      facial_convexity_norm: { mean: 12, sd: 4, source: 'Legan & Burstone 1980 (G–Sn–Pog′)' },
      upper_lip_E: eLine('Ls'),
      lower_lip_E: eLine('Li'),
      lower_lip_E_norm: { mean: -2, sd: 2, source: 'Ricketts 1968 (adult)' }
    }
    return out
  }

  const m = midline(p)
  out.midline = m ? { defined_by: m.defined_by } : null
  const down = m?.down || [0, 1]
  const h = (a, b) => (p[a] && p[b] ? Math.abs(dot(sub(p[b], p[a]), down)) : null)
  const upper = h('Tr', 'G'); const middle = h('G', 'Sn'); const lower = h('Sn', 'MeS')
  const total = upper !== null && middle !== null && lower !== null ? upper + middle + lower : null
  const upperLip = h('Sn', 'Sto'); const lowerChin = h('Sto', 'MeS')
  out.thirds = {
    upper: len(upper), middle: len(middle), lower: len(lower),
    upper_pct: total ? round(upper / total * 100, 1) : null,
    middle_pct: total ? round(middle / total * 100, 1) : null,
    lower_pct: total ? round(lower / total * 100, 1) : null,
    middle_to_lower: middle && lower ? round(middle / lower, 3) : null,
    upper_lip_to_lower_face: upperLip && lowerChin ? round(upperLip / lowerChin, 3) : null
  }

  out.symmetry = {}
  if (m) {
    for (const [name, [r, l]] of Object.entries(PAIRS)) {
      if (!p[r] || !p[l]) continue
      const dR = Math.abs(dot(sub(p[r], m.origin), m.across))
      const dL = Math.abs(dot(sub(p[l], m.origin), m.across))
      const pair = sub(p[l], p[r])
      out.symmetry[name] = {
        right: len(dR), left: len(dL),
        asymmetry_pct: dR + dL > 1e-9 ? round(Math.abs(dR - dL) / (dR + dL) * 100, 1) : null,
        cant_deg: name === 'pupils' ? 0 : round(deg(Math.atan2(cross2(m.across, pair), dot(m.across, pair))), 2)
      }
    }
  }
  out.midline_deviation = {}
  if (m) for (const code of ['Sn', 'Ls', 'Li', 'PogS', 'MeS', 'DM']) if (p[code]) out.midline_deviation[code] = len(dot(sub(p[code], m.origin), m.across))

  const d = (a, b) => (p[a] && p[b] ? distance(p[a], p[b]) : null)
  const ratio = (a, b) => (a !== null && b ? round(a / b, 3) : null)
  out.proportions = {
    facial_index: d('Ns', 'MeS') !== null && d('ZyR', 'ZyL') ? round(d('Ns', 'MeS') / d('ZyR', 'ZyL') * 100, 1) : null,
    intercanthal_to_alar: ratio(d('EnR', 'EnL'), d('AlR', 'AlL')),
    mouth_to_interpupillary: ratio(d('ChR', 'ChL'), d('PupR', 'PupL')),
    intercanthal_to_eye_width_right: ratio(d('EnR', 'EnL'), d('ExR', 'EnR'))
  }

  if (view === 'smile') {
    const width = d('ChR', 'ChL')
    const dentition = d('DR', 'DL')
    const vertical = (a, b) => (p[a] && p[b] ? dot(sub(p[b], p[a]), down) : null)
    out.smile = {
      smile_width: len(width),
      smile_to_interpupillary: width && p.PupR && p.PupL ? round(width / distance(p.PupR, p.PupL), 3) : null,
      buccal_corridor_pct: width && dentition !== null ? round((width - dentition) / width * 100, 1) : null,
      incisor_display: len(vertical('Stms', 'UIE')),
      gingival_display: p.Stms && p.UIG ? len(-vertical('Stms', 'UIG')) : null,
      dental_midline_deviation: p.DM && m ? len(dot(sub(p.DM, m.origin), m.across)) : null
    }
  }
  return out
}

/**
 * MediaPipe Face Landmarker (478-point mesh) indices mapped to the named
 * points above. These are mesh vertices, not anatomical landmarks: every
 * point is shown to the doctor to confirm or move before it is used.
 * Points marked manualOnly (hairline, columella, teeth) are never guessed.
 */
export const MEDIAPIPE_INDEX = {
  G: 9, Ns: 168, Prn: 1, Sn: 2, Ls: 0, Sto: 13, Li: 17, PogS: 175, MeS: 152,
  PupR: 468, PupL: 473, ExR: 33, ExL: 263, EnR: 133, EnL: 362,
  AlR: 129, AlL: 358, ChR: 61, ChL: 291, ZyR: 234, ZyL: 454, GoR: 172, GoL: 397, Stms: 13
}
