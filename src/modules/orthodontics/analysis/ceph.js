// Cephalometric measurements - the browser twin of the API's
// CephalometricCalculator.php (same formulas, same reference values). The
// browser uses it for the live preview while landmarks are dragged; the API
// recomputes and stores the authoritative values on save. Both are tested on
// the same constructed fixture (tests/orthodontics-analysis.test.mjs).
import {
  sub, add, scale, dot, norm, distance, midpoint, angleBetween, angleAt,
  signedDistanceToLine2, projectOnLine, deg, round, point2
} from './geometry.js'

export const CEPH_VERSION = '1.0.0'

/** Landmarks in placement order, with Arabic names and a short hint. */
export const CEPH_LANDMARKS = [
  { code: 'S', en: 'Sella', ar: 'السرج (S)', hint: 'مركز السرج التركي', group: 'cranial' },
  { code: 'N', en: 'Nasion', ar: 'الناسيون (N)', hint: 'أمامي نقطة الدرز الجبهي الأنفي', group: 'cranial' },
  { code: 'Po', en: 'Porion', ar: 'البوريون (Po)', hint: 'أعلى نقطة في مجرى السمع الخارجي', group: 'cranial' },
  { code: 'Or', en: 'Orbitale', ar: 'الحجاج (Or)', hint: 'أخفض نقطة في حافة الحجاج', group: 'cranial' },
  { code: 'Ba', en: 'Basion', ar: 'البازيون (Ba)', hint: 'أمامي حافة الثقبة العظمى', group: 'cranial' },
  { code: 'Pt', en: 'Pterygoid point', ar: 'النقطة الجناحية (Pt)', hint: 'الجزء الخلفي العلوي من الحفرة الجناحية الفكية', group: 'cranial' },
  { code: 'Ar', en: 'Articulare', ar: 'المفصلية (Ar)', hint: 'تقاطع قاعدة القحف مع الحافة الخلفية للقمة', group: 'mandible' },
  { code: 'Co', en: 'Condylion', ar: 'اللقمة (Co)', hint: 'أعلى نقطة خلفية على رأس اللقمة', group: 'mandible' },
  { code: 'ANS', en: 'Anterior nasal spine', ar: 'الشوكة الأنفية الأمامية (ANS)', hint: 'رأس الشوكة الأنفية الأمامية', group: 'maxilla' },
  { code: 'PNS', en: 'Posterior nasal spine', ar: 'الشوكة الأنفية الخلفية (PNS)', hint: 'نهاية الحنك الصلب الخلفية', group: 'maxilla' },
  { code: 'A', en: 'Point A', ar: 'النقطة A', hint: 'أعمق نقطة على تقعر الفك العلوي الأمامي', group: 'maxilla' },
  { code: 'B', en: 'Point B', ar: 'النقطة B', hint: 'أعمق نقطة على تقعر الفك السفلي الأمامي', group: 'mandible' },
  { code: 'Pog', en: 'Pogonion', ar: 'البوغونيون (Pog)', hint: 'أكثر نقطة أمامية على الذقن العظمي', group: 'mandible' },
  { code: 'Gn', en: 'Gnathion', ar: 'الناثيون (Gn)', hint: 'بين Pog و Me على محيط الذقن', group: 'mandible' },
  { code: 'Me', en: 'Menton', ar: 'المنتون (Me)', hint: 'أخفض نقطة على الارتفاق', group: 'mandible' },
  { code: 'Go', en: 'Gonion', ar: 'زاوية الفك (Go)', hint: 'أكثر نقطة خلفية سفلية على زاوية الفك', group: 'mandible' },
  { code: 'U1T', en: 'Upper incisor tip', ar: 'حافة القاطع العلوي', hint: 'الحافة القاطعة للثنية العلوية', group: 'dental' },
  { code: 'U1A', en: 'Upper incisor apex', ar: 'ذروة جذر القاطع العلوي', hint: 'قمة جذر الثنية العلوية', group: 'dental' },
  { code: 'L1T', en: 'Lower incisor tip', ar: 'حافة القاطع السفلي', hint: 'الحافة القاطعة للثنية السفلية', group: 'dental' },
  { code: 'L1A', en: 'Lower incisor apex', ar: 'ذروة جذر القاطع السفلي', hint: 'قمة جذر الثنية السفلية', group: 'dental' },
  { code: 'U6', en: 'Upper first molar', ar: 'الرحى الأولى العلوية', hint: 'الحدبة الأنسية للرحى الأولى العلوية', group: 'dental' },
  { code: 'L6', en: 'Lower first molar', ar: 'الرحى الأولى السفلية', hint: 'الحدبة الأنسية للرحى الأولى السفلية', group: 'dental' },
  { code: 'Prn', en: 'Pronasale', ar: 'قمة الأنف (Prn)', hint: 'أكثر نقطة أمامية على الأنف', group: 'soft' },
  { code: 'Sn', en: 'Subnasale', ar: 'تحت الأنف (Sn)', hint: 'التقاء الحاجز الأنفي بالشفة العليا', group: 'soft' },
  { code: 'Ls', en: 'Labrale superius', ar: 'الشفة العليا (Ls)', hint: 'أكثر نقطة أمامية على الشفة العليا', group: 'soft' },
  { code: 'Li', en: 'Labrale inferius', ar: 'الشفة السفلى (Li)', hint: 'أكثر نقطة أمامية على الشفة السفلى', group: 'soft' },
  { code: 'PogS', en: 'Soft tissue pogonion', ar: 'الذقن الرخو (Pog′)', hint: 'أكثر نقطة أمامية على الذقن الرخو', group: 'soft' }
]

/** Tracing lines drawn over the radiograph (pairs of landmark codes). */
export const CEPH_TRACING = [
  { from: 'S', to: 'N', color: '#22d3ee', label: 'SN' },
  { from: 'Po', to: 'Or', color: '#a3e635', label: 'FH' },
  { from: 'N', to: 'A', color: '#f472b6' },
  { from: 'N', to: 'B', color: '#f472b6' },
  { from: 'N', to: 'Pog', color: '#fb923c', label: 'N-Pog' },
  { from: 'Go', to: 'Me', color: '#facc15', label: 'MP' },
  { from: 'ANS', to: 'PNS', color: '#c084fc', label: 'PP' },
  { from: 'U1A', to: 'U1T', color: '#f87171' },
  { from: 'L1A', to: 'L1T', color: '#f87171' },
  { from: 'S', to: 'Gn', color: '#94a3b8', dashed: true },
  { from: 'Ar', to: 'Go', color: '#94a3b8' },
  { from: 'S', to: 'Ar', color: '#94a3b8' },
  { from: 'Ba', to: 'N', color: '#38bdf8', dashed: true },
  { from: 'Pt', to: 'Gn', color: '#38bdf8', dashed: true },
  { from: 'Prn', to: 'PogS', color: '#34d399', dashed: true, label: 'E' }
]

const D = (name, unit, needs, norm = null) => ({ name, unit, needs, norm })
const N = (mean, sd, source) => ({ mean, sd, source })
const R = (min, max, source) => ({ min, max, source })

export const CEPH_DEFINITIONS = {
  SNA: D('SNA', 'deg', ['S', 'N', 'A'], N(82, 2, 'Steiner 1953')),
  SNB: D('SNB', 'deg', ['S', 'N', 'B'], N(80, 2, 'Steiner 1953')),
  ANB: D('ANB', 'deg', ['S', 'N', 'A', 'B'], N(2, 2, 'Steiner 1953')),
  SN_GoGn: D('SN – GoGn', 'deg', ['S', 'N', 'Go', 'Gn'], N(32, 5, 'Steiner 1953')),
  SN_OP: D('SN – Occlusal plane', 'deg', ['S', 'N', 'U1T', 'L1T', 'U6', 'L6'], N(14, null, 'Steiner 1953')),
  U1_NA_deg: D('U1 – NA (angle)', 'deg', ['N', 'A', 'U1T', 'U1A'], N(22, null, 'Steiner 1953')),
  U1_NA_mm: D('U1 – NA (distance)', 'len', ['N', 'A', 'U1T', 'S'], N(4, null, 'Steiner 1953')),
  L1_NB_deg: D('L1 – NB (angle)', 'deg', ['N', 'B', 'L1T', 'L1A'], N(25, null, 'Steiner 1953')),
  L1_NB_mm: D('L1 – NB (distance)', 'len', ['N', 'B', 'L1T', 'S'], N(4, null, 'Steiner 1953')),
  interincisal: D('Interincisal angle', 'deg', ['U1T', 'U1A', 'L1T', 'L1A'], N(131, null, 'Steiner 1953')),
  facial_angle: D('Facial angle (FH – NPog)', 'deg', ['Po', 'Or', 'N', 'Pog'], N(87.8, 3.6, 'Downs 1948')),
  convexity: D('Angle of convexity (N-A-Pog)', 'deg', ['N', 'A', 'Pog', 'S'], N(0, 5.1, 'Downs 1948')),
  AB_plane: D('A-B plane angle', 'deg', ['A', 'B', 'N', 'Pog', 'S'], N(-4.6, 3.7, 'Downs 1948')),
  FMA: D('FMA (FH – mandibular plane GoMe)', 'deg', ['Po', 'Or', 'Go', 'Me'], N(25, 5, 'Tweed 1954')),
  Y_axis: D('Y-axis (FH – SGn)', 'deg', ['Po', 'Or', 'S', 'Gn'], N(59.4, 3.8, 'Downs 1948')),
  OP_cant: D('Cant of occlusal plane (FH – OP)', 'deg', ['Po', 'Or', 'U1T', 'L1T', 'U6', 'L6', 'S', 'N'], N(9.3, 3.8, 'Downs 1948')),
  L1_OP: D('L1 – occlusal plane (from 90°)', 'deg', ['L1T', 'L1A', 'U1T', 'U6', 'L6'], N(14.5, 3.5, 'Downs 1948')),
  IMPA: D('IMPA (L1 – mandibular plane)', 'deg', ['L1T', 'L1A', 'Go', 'Me'], N(90, 5, 'Tweed 1954')),
  FMIA: D('FMIA (180 − FMA − IMPA)', 'deg', ['Po', 'Or', 'Go', 'Me', 'L1T', 'L1A'], N(65, null, 'Tweed 1954')),
  U1_APog_mm: D('U1 – APog (distance)', 'len', ['U1T', 'A', 'Pog', 'S', 'N'], N(2.7, 1.8, 'Downs 1948')),
  facial_axis: D('Facial axis (BaN – PtGn)', 'deg', ['Ba', 'N', 'Pt', 'Gn'], N(90, 3.5, 'Ricketts 1981')),
  convexity_mm: D('Convexity (A – NPog)', 'len', ['A', 'N', 'Pog', 'S'], N(2, 2, 'Ricketts (age 9; -0.2 mm/year)')),
  L1_APog_mm: D('L1 – APog (distance)', 'len', ['L1T', 'A', 'Pog', 'S', 'N'], N(1, 2, 'Ricketts 1981')),
  L1_APog_deg: D('L1 – APog (angle)', 'deg', ['L1T', 'L1A', 'A', 'Pog'], N(22, 4, 'Ricketts 1981')),
  lower_lip_E: D('Lower lip – E-line', 'len', ['Li', 'Prn', 'PogS', 'S', 'N'], N(-2, 2, 'Ricketts 1968 (adult)')),
  upper_lip_E: D('Upper lip – E-line', 'len', ['Ls', 'Prn', 'PogS', 'S', 'N']),
  A_Nperp: D('A – N perpendicular', 'len', ['A', 'N', 'Po', 'Or'], R(0, 1, 'McNamara 1984 (adult)')),
  Pog_Nperp: D('Pog – N perpendicular', 'len', ['Pog', 'N', 'Po', 'Or']),
  Co_A: D('Midface length (Co – A)', 'len', ['Co', 'A']),
  Co_Gn: D('Mandibular length (Co – Gn)', 'len', ['Co', 'Gn']),
  mm_differential: D('Maxillomandibular differential', 'len', ['Co', 'A', 'Gn']),
  LAFH: D('Lower anterior face height (ANS – Me)', 'len', ['ANS', 'Me']),
  U1_Avert_mm: D('U1 – A vertical', 'len', ['U1T', 'A', 'Po', 'Or', 'N'], R(4, 6, 'McNamara 1984')),
  wits: D('Wits appraisal (AO – BO)', 'len', ['A', 'B', 'U1T', 'L1T', 'U6', 'L6', 'S', 'N'], { mean: null, sd: null, source: 'Jacobson 1975: about 0 mm (female), about −1 mm (male)' }),
  saddle: D('Saddle angle (N-S-Ar)', 'deg', ['N', 'S', 'Ar'], N(123, 5, 'Björk / Jarabak')),
  articular: D('Articular angle (S-Ar-Go)', 'deg', ['S', 'Ar', 'Go'], N(143, 6, 'Björk / Jarabak')),
  gonial: D('Gonial angle (Ar-Go-Me)', 'deg', ['Ar', 'Go', 'Me'], N(130, 7, 'Björk / Jarabak')),
  bjork_sum: D('Björk sum', 'deg', ['N', 'S', 'Ar', 'Go', 'Me'], N(396, 6, 'Björk 1969')),
  jarabak_ratio: D('Jarabak ratio (S-Go / N-Me)', 'pct', ['S', 'Go', 'N', 'Me'], R(62, 65, 'Jarabak 1972')),
  N_Me: D('Anterior face height (N – Me)', 'len', ['N', 'Me']),
  S_Go: D('Posterior face height (S – Go)', 'len', ['S', 'Go']),
  U1_SN: D('U1 – SN', 'deg', ['U1T', 'U1A', 'S', 'N'], N(103, null, 'Riedel / Steiner')),
  FH_SN: D('FH – SN', 'deg', ['Po', 'Or', 'S', 'N'], N(7, null, 'Commonly cited mean'))
}

export const CEPH_ANALYSES = {
  steiner: { ar: 'ستاينر (Steiner)', keys: { SNA: null, SNB: null, ANB: null, SN_GoGn: null, SN_OP: null, U1_NA_deg: null, U1_NA_mm: null, L1_NB_deg: null, L1_NB_mm: null, interincisal: N(131, null, 'Steiner 1953') } },
  downs: { ar: 'داونز (Downs)', keys: { facial_angle: null, convexity: null, AB_plane: null, FMA: N(21.9, 3.2, 'Downs 1948'), Y_axis: null, OP_cant: null, interincisal: N(135.4, 5.8, 'Downs 1948'), L1_OP: null, IMPA: N(91.4, 3.8, 'Downs 1948 (reported as 1.4 ± 3.8 from 90°)'), U1_APog_mm: null } },
  tweed: { ar: 'تويد (Tweed)', keys: { FMA: null, IMPA: null, FMIA: null } },
  ricketts: { ar: 'ريكيتس (Ricketts)', keys: { facial_axis: null, facial_angle: N(87, 3, 'Ricketts (facial depth, age 9; +0.3°/year)'), FMA: N(26, 4.5, 'Ricketts (age 9; -0.3°/year)'), convexity_mm: null, L1_APog_mm: null, L1_APog_deg: null, lower_lip_E: null, upper_lip_E: null } },
  mcnamara: { ar: 'ماكنمارا (McNamara)', keys: { A_Nperp: null, Pog_Nperp: null, Co_A: null, Co_Gn: null, mm_differential: null, LAFH: null, U1_Avert_mm: null, FMA: N(22, 4, 'McNamara 1984 (adult)'), facial_axis: null } },
  wits: { ar: 'ويتس (Wits)', keys: { wits: null } },
  bjork_jarabak: { ar: 'بيورك / جاراباك', keys: { saddle: null, articular: null, gonial: null, bjork_sum: null, jarabak_ratio: null, N_Me: null, S_Go: null } },
  other: { ar: 'قياسات أخرى', keys: { U1_SN: null, FH_SN: null } }
}

const LANDMARK_CODES = new Set(CEPH_LANDMARKS.map(l => l.code))

export function calibrationFrom (c = {}) {
  let mmPerPx = null
  let method = null
  let magnification = Number(c.magnification) > 0 ? Number(c.magnification) : 1
  const p1 = point2(c.p1)
  const p2 = point2(c.p2)
  if (p1 && p2 && Number(c.known_mm) > 0) {
    const px = distance(p1, p2)
    if (px > 1e-9) {
      mmPerPx = Number(c.known_mm) / px
      method = 'ruler'
      magnification = 1
    }
  } else if (Number(c.mm_per_px) > 0) {
    mmPerPx = Number(c.mm_per_px) / magnification
    method = 'pixel_spacing'
  }
  return { method, mm_per_px: mmPerPx, magnification }
}

export function compareToNorm (value, normDef) {
  if (!normDef || value === null || value === undefined) return null
  if (normDef.mean !== null && normDef.mean !== undefined && normDef.sd > 0) {
    const z = (value - normDef.mean) / normDef.sd
    return { sd_from_mean: round(z, 2), status: Math.abs(z) <= 1 ? 'within' : (z > 0 ? 'above' : 'below') }
  }
  if (normDef.min !== undefined && normDef.max !== undefined) {
    return { status: value < normDef.min ? 'below' : (value > normDef.max ? 'above' : 'within') }
  }
  return null
}

export function analyzeCeph (data = {}) {
  const p = {}
  for (const [code, pt] of Object.entries(data.landmarks || {})) {
    if (!LANDMARK_CODES.has(code)) continue
    const v = point2(pt)
    if (v) p[code] = v
  }
  const calibration = calibrationFrom(data.calibration || {})
  const facing = ['left', 'right'].includes(data.facing)
    ? data.facing
    : (p.S && p.N ? (p.N[0] >= p.S[0] ? 'right' : 'left') : null)
  const f = facing === 'left' ? -1 : 1
  const ant = [f, 0]
  const mmPerPx = calibration.mm_per_px
  const len = px => (px === null || px === undefined ? null : (mmPerPx ? px * mmPerPx : px))
  const frame = v => [f * v[0], -v[1]]
  const fromDown = v => { const w = frame(v); return deg(Math.atan2(w[0], -w[1])) }
  const fromUp = v => { const w = frame(v); return deg(Math.atan2(w[0], w[1])) }
  const op = () => ({ ant: midpoint(p.U1T, p.L1T), post: midpoint(p.U6, p.L6) })
  const nPerp = (pt, origin) => {
    const fh = sub(p.Or, p.Po)
    return signedDistanceToLine2(pt, origin, add(origin, [-fh[1], fh[0]]), ant)
  }

  const compute = {
    SNA: () => angleAt(p.S, p.N, p.A),
    SNB: () => angleAt(p.S, p.N, p.B),
    ANB: () => angleAt(p.S, p.N, p.A) - angleAt(p.S, p.N, p.B),
    SN_GoGn: () => angleBetween(sub(p.N, p.S), sub(p.Gn, p.Go)),
    SN_OP: () => { const o = op(); return angleBetween(sub(p.N, p.S), sub(o.ant, o.post)) },
    U1_NA_deg: () => fromDown(sub(p.U1T, p.U1A)) - fromDown(sub(p.A, p.N)),
    U1_NA_mm: () => len(signedDistanceToLine2(p.U1T, p.N, p.A, ant)),
    L1_NB_deg: () => fromUp(sub(p.L1T, p.L1A)) - fromUp(sub(p.N, p.B)),
    L1_NB_mm: () => len(signedDistanceToLine2(p.L1T, p.N, p.B, ant)),
    interincisal: () => angleBetween(sub(p.U1A, p.U1T), sub(p.L1A, p.L1T)),
    facial_angle: () => angleBetween(sub(p.Po, p.Or), sub(p.Pog, p.N)),
    convexity: () => {
      const side = signedDistanceToLine2(p.A, p.N, p.Pog, ant)
      const angle = angleAt(p.N, p.A, p.Pog)
      return side === null || angle === null ? null : (side >= 0 ? 1 : -1) * (180 - angle)
    },
    AB_plane: () => fromDown(sub(p.B, p.A)) - fromDown(sub(p.Pog, p.N)),
    FMA: () => angleBetween(sub(p.Or, p.Po), sub(p.Me, p.Go)),
    Y_axis: () => angleBetween(sub(p.Or, p.Po), sub(p.Gn, p.S)),
    OP_cant: () => {
      const o = op()
      const fh = frame(sub(p.Or, p.Po))
      const occ = frame(sub(o.ant, o.post))
      return deg(Math.atan2(fh[1], fh[0])) - deg(Math.atan2(occ[1], occ[0]))
    },
    L1_OP: () => { const o = op(); return angleBetween(sub(p.L1T, p.L1A), sub(o.post, o.ant)) - 90 },
    IMPA: () => angleBetween(sub(p.L1T, p.L1A), sub(p.Go, p.Me)),
    FMIA: () => 180 - angleBetween(sub(p.Or, p.Po), sub(p.Me, p.Go)) - angleBetween(sub(p.L1T, p.L1A), sub(p.Go, p.Me)),
    U1_APog_mm: () => len(signedDistanceToLine2(p.U1T, p.A, p.Pog, ant)),
    facial_axis: () => angleBetween(sub(p.Ba, p.N), sub(p.Gn, p.Pt)),
    convexity_mm: () => len(signedDistanceToLine2(p.A, p.N, p.Pog, ant)),
    L1_APog_mm: () => len(signedDistanceToLine2(p.L1T, p.A, p.Pog, ant)),
    L1_APog_deg: () => angleBetween(sub(p.L1T, p.L1A), sub(p.A, p.Pog)),
    lower_lip_E: () => len(signedDistanceToLine2(p.Li, p.Prn, p.PogS, ant)),
    upper_lip_E: () => len(signedDistanceToLine2(p.Ls, p.Prn, p.PogS, ant)),
    A_Nperp: () => len(nPerp(p.A, p.N)),
    Pog_Nperp: () => len(nPerp(p.Pog, p.N)),
    Co_A: () => len(distance(p.Co, p.A)),
    Co_Gn: () => len(distance(p.Co, p.Gn)),
    mm_differential: () => len(distance(p.Co, p.Gn) - distance(p.Co, p.A)),
    LAFH: () => len(distance(p.ANS, p.Me)),
    U1_Avert_mm: () => len(nPerp(p.U1T, p.A)),
    wits: () => {
      const o = op()
      const dir = sub(o.ant, o.post)
      const n = norm(dir)
      if (n < 1e-12) return null
      const ao = projectOnLine(p.A, o.post, o.ant)
      const bo = projectOnLine(p.B, o.post, o.ant)
      return len(dot(sub(ao, bo), scale(dir, 1 / n)))
    },
    saddle: () => angleAt(p.N, p.S, p.Ar),
    articular: () => angleAt(p.S, p.Ar, p.Go),
    gonial: () => angleAt(p.Ar, p.Go, p.Me),
    bjork_sum: () => angleAt(p.N, p.S, p.Ar) + angleAt(p.S, p.Ar, p.Go) + angleAt(p.Ar, p.Go, p.Me),
    jarabak_ratio: () => { const nMe = distance(p.N, p.Me); return nMe < 1e-12 ? null : distance(p.S, p.Go) / nMe * 100 },
    N_Me: () => len(distance(p.N, p.Me)),
    S_Go: () => len(distance(p.S, p.Go)),
    U1_SN: () => angleBetween(sub(p.U1T, p.U1A), sub(p.S, p.N)),
    FH_SN: () => angleBetween(sub(p.Or, p.Po), sub(p.N, p.S))
  }

  const measurements = {}
  for (const [key, def] of Object.entries(CEPH_DEFINITIONS)) {
    const missing = def.needs.filter(code => !p[code])
    const value = missing.length ? null : compute[key]()
    measurements[key] = {
      key,
      name: def.name,
      value: value === null || value === undefined ? null : round(value, 2),
      unit: def.unit === 'deg' ? '°' : def.unit === 'pct' ? '%' : (mmPerPx ? 'mm' : 'px'),
      calibrated: def.unit !== 'len' || !!mmPerPx,
      missing,
      norm: def.norm
    }
  }

  const analyses = {}
  for (const [group, { keys }] of Object.entries(CEPH_ANALYSES)) {
    analyses[group] = Object.entries(keys).map(([key, override]) => {
      const m = measurements[key]
      const n = override || m.norm
      return { key, norm: n, comparison: m.value !== null && m.calibrated ? compareToNorm(m.value, n) : null }
    })
  }

  return { version: CEPH_VERSION, calibration, facing, measurements, analyses }
}

/** Human-readable reference range, e.g. "82 ± 2°" or "0 – 1 mm". */
export function formatNorm (n, unit = '') {
  if (!n) return '—'
  const u = unit === '°' ? '°' : (unit ? ` ${unit}` : '')
  if (n.mean !== null && n.mean !== undefined) return n.sd ? `${n.mean} ± ${n.sd}${u}` : `${n.mean}${u}`
  if (n.min !== undefined && n.max !== undefined) return `${n.min} – ${n.max}${u}`
  return n.source || '—'
}
