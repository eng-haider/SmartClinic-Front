// Builds the orthodontic report as a standalone HTML document. The browser
// lays it out (RTL for Arabic, proper Arabic shaping) and prints / saves it
// as PDF. Only measured values and published reference ranges are included -
// no automatic clinical interpretation.
import { CEPH_ANALYSES, CEPH_DEFINITIONS, CEPH_TRACING, formatNorm } from '../analysis/ceph.js'
import { escapeHtml as e } from './print.js'

const T = {
  ar: {
    title: 'تقرير تحليل التقويم', patient: 'المريض', doctor: 'الطبيب', caseNo: 'رقم الحالة', category: 'الفئة', date: 'تاريخ التقرير',
    age: 'العمر', sex: 'الجنس', ceph: 'التحليل السيفالومتري', cast: 'تحليل الموديلات', cbct: 'قياسات CBCT', face: 'تحليل الوجه والابتسامة',
    plan: 'الخطة العلاجية', assessment: 'التقييم الأولي', measurement: 'القياس', value: 'القيمة', norm: 'المرجع', analysisDate: 'تاريخ التحليل',
    reviewed: 'معتمد من الطبيب', draft: 'مسودة - غير معتمدة', draftBanner: 'مسودة غير معتمدة: تحتوي على تحليلات لم يراجعها الطبيب. لا تُستخدم كتقرير نهائي.',
    disclaimer: 'القيم محسوبة هندسياً من نقاط وضعها الطبيب أو أكّدها. القيم المرجعية منشورة لعينات سكانية محددة وتُعرض للمقارنة فقط، وليست تشخيصاً. يتطلب التفسير السريري حكم الطبيب المختص.',
    signature: 'توقيع الطبيب', uncalibrated: 'غير معاير - المسافات بالبكسل', notes: 'ملاحظات الطبيب', bolton: 'Bolton', space: 'تحليل المسافة', arch: 'أبعاد القوس',
    overall: 'الكلية', anterior: 'الأمامية', upper: 'علوي', lower: 'سفلي', required: 'المطلوب', available: 'المتاح', discrepancy: 'الفرق',
    pont: 'Pont', tj: 'Tanaka-Johnston', spee: 'منحنى سبي', distances: 'مسافات', implants: 'الزرعات المخططة', bone: 'قياسات العظم',
    thirds: 'أثلاث الوجه', symmetry: 'التناظر', smile: 'الابتسامة', profile: 'الملف الجانبي', stages: 'المراحل', status: 'الحالة', startDate: 'تاريخ البدء', duration: 'المدة المتوقعة (شهر)', appliance: 'الجهاز',
    objectives: 'الأهداف', planned: 'العلاج المخطط', complaint: 'الشكوى الرئيسية', examination: 'الفحص السريري', diagnosis: 'التشخيص', skeletal: 'التصنيف الهيكلي', molar: 'تصنيف الرحى (يمين/يسار)', canine: 'تصنيف الناب (يمين/يسار)', overjet: 'Overjet', overbite: 'Overbite', crowding: 'الازدحام (علوي/سفلي)', crossbite: 'العضة المعكوسة', midline: 'انحراف المنتصف (علوي/سفلي)'
  },
  en: {
    title: 'Orthodontic Analysis Report', patient: 'Patient', doctor: 'Doctor', caseNo: 'Case #', category: 'Category', date: 'Report date',
    age: 'Age', sex: 'Sex', ceph: 'Cephalometric analysis', cast: 'Dental cast analysis', cbct: 'CBCT measurements', face: 'Facial & smile analysis',
    plan: 'Treatment plan', assessment: 'Initial assessment', measurement: 'Measurement', value: 'Value', norm: 'Reference', analysisDate: 'Analysis date',
    reviewed: 'Reviewed by doctor', draft: 'Draft - not reviewed', draftBanner: 'DRAFT: contains analyses not reviewed by the doctor. Not a final report.',
    disclaimer: 'Values are geometric calculations from landmarks placed or confirmed by the doctor. Reference values come from specific published samples and are shown for comparison only; they are not a diagnosis. Clinical interpretation requires the treating specialist.',
    signature: 'Doctor signature', uncalibrated: 'Not calibrated - distances in pixels', notes: 'Doctor notes', bolton: 'Bolton', space: 'Space analysis', arch: 'Arch dimensions',
    overall: 'Overall', anterior: 'Anterior', upper: 'Upper', lower: 'Lower', required: 'Required', available: 'Available', discrepancy: 'Discrepancy',
    pont: 'Pont', tj: 'Tanaka-Johnston', spee: 'Curve of Spee', distances: 'Distances', implants: 'Planned implants', bone: 'Bone measurements',
    thirds: 'Facial thirds', symmetry: 'Symmetry', smile: 'Smile', profile: 'Profile', stages: 'Stages', status: 'Status', startDate: 'Start date', duration: 'Estimated duration (months)', appliance: 'Appliance',
    objectives: 'Objectives', planned: 'Planned treatment', complaint: 'Chief complaint', examination: 'Clinical examination', diagnosis: 'Diagnosis', skeletal: 'Skeletal class', molar: 'Molar class (R/L)', canine: 'Canine class (R/L)', overjet: 'Overjet', overbite: 'Overbite', crowding: 'Crowding (U/L)', crossbite: 'Crossbite', midline: 'Midline deviation (U/L)'
  }
}

const n = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(d))
const mmOr = (v, unit) => (v === null || v === undefined ? '—' : `${n(v, 2)} ${unit === 'mm' ? 'mm' : 'u'}`)

function table (head, rows) {
  return `<table><thead><tr>${head.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
}

function tracingSvg (data, imageDataUrl) {
  const lm = data?.landmarks || {}
  const w = data?.image?.width
  const h = data?.image?.height
  if (!w || !h) return ''
  const sw = Math.max(w, h) / 450
  const lines = CEPH_TRACING.filter(t => lm[t.from] && lm[t.to])
    .map(t => `<line x1="${lm[t.from].x}" y1="${lm[t.from].y}" x2="${lm[t.to].x}" y2="${lm[t.to].y}" stroke="${t.color}" stroke-width="${sw}" ${t.dashed ? `stroke-dasharray="${sw * 4} ${sw * 3}"` : ''}/>`).join('')
  const pts = Object.entries(lm).map(([c, p]) => `<circle cx="${p.x}" cy="${p.y}" r="${sw * 2.2}" fill="#ef4444"/><text x="${p.x + sw * 4}" y="${p.y - sw * 3}" font-size="${sw * 9}" fill="#fff" stroke="#000" stroke-width="${sw * 0.6}" paint-order="stroke">${e(c)}</text>`).join('')
  const bg = imageDataUrl ? `<image href="${imageDataUrl}" x="0" y="0" width="${w}" height="${h}" />` : `<rect width="${w}" height="${h}" fill="#0b1220"/>`
  return `<svg class="tracing" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${bg}${lines}${pts}</svg>`
}

function cephSection (a, t, images) {
  const r = a.results || {}
  const m = r.measurements || {}
  const groups = Object.entries(CEPH_ANALYSES).map(([key, g]) => {
    const rows = (r.analyses?.[key] || []).filter(row => m[row.key]?.value !== null && m[row.key]?.value !== undefined)
      .map(row => {
        const mm = m[row.key]
        return [`<span dir="ltr">${e(CEPH_DEFINITIONS[row.key]?.name || row.key)}</span>`, `<span dir="ltr">${n(mm.value)} ${e(mm.unit)}</span>`, `<span dir="ltr">${e(formatNorm(row.norm, mm.unit === '°' ? '°' : mm.unit))}</span>`]
      })
    return rows.length ? `<h4>${e(g.ar)}</h4>${table([t.measurement, t.value, t.norm], rows)}` : ''
  }).join('')
  const cal = r.calibration?.mm_per_px ? '' : `<p class="muted">${t.uncalibrated}</p>`
  return `${tracingSvg(a.data, images[a.file_id])}${cal}${groups}`
}

function castSection (a, t) {
  const r = a.results || {}
  const L = r.length_unit
  const rows = []
  const b = r.bolton || {}
  for (const k of ['overall', 'anterior']) {
    if (b[k]?.ratio !== null && b[k]?.ratio !== undefined) {
      rows.push([`${t.bolton} ${t[k]}`, `${n(b[k].ratio, 2)}%`, `${b[k].norm.mean} ± ${b[k].norm.sd}%`])
      if (b[k].excess !== null) rows.push([`${t.bolton} ${t[k]} (${b[k].excess_arch})`, mmOr(b[k].excess, r.width_unit), ''])
    }
  }
  for (const arch of ['upper', 'lower']) {
    const s = r.space_analysis?.[arch]
    if (s?.required !== null || s?.available !== null) rows.push([`${t.space} - ${t[arch]}`, `${t.required} ${mmOr(s.required, r.width_unit)} / ${t.available} ${mmOr(s.available, L)}`, `${t.discrepancy}: ${mmOr(s.discrepancy, L)}`])
    const ar = r.arch?.[arch] || {}
    if (ar.intercanine_width !== null || ar.intermolar_width !== null || ar.arch_depth !== null) rows.push([`${t.arch} - ${t[arch]}`, `3-3: ${mmOr(ar.intercanine_width, L)} · 6-6: ${mmOr(ar.intermolar_width, L)}`, `depth: ${mmOr(ar.arch_depth, L)}`])
  }
  const p = r.pont || {}
  if (p.predicted_premolar_width !== null && p.predicted_premolar_width !== undefined) rows.push([t.pont, `P: ${n(p.measured_premolar_width)} / ${n(p.predicted_premolar_width)} mm · M: ${n(p.measured_molar_width)} / ${n(p.predicted_molar_width)} mm`, p.source])
  const tj = r.tanaka_johnston || {}
  if (tj.predicted_upper !== null && tj.predicted_upper !== undefined) rows.push([t.tj, `U ${n(tj.predicted_upper)} / L ${n(tj.predicted_lower)} mm`, tj.source])
  const cs = r.curve_of_spee || {}
  if (cs.mean !== null && cs.mean !== undefined) rows.push([t.spee, `R ${mmOr(cs.right, L)} · L ${mmOr(cs.left, L)}`, `mean ${mmOr(cs.mean, L)}`])
  for (const d of r.distances || []) rows.push([`${t.distances}: ${e(d.label)}`, mmOr(d.value, d.unit), ''])
  const unit = r.calibrated ? '' : `<p class="muted">${t.uncalibrated.replace('بالبكسل', 'بوحدات النموذج').replace('pixels', 'model units')}</p>`
  return rows.length ? unit + table([t.measurement, t.value, t.norm], rows) : ''
}

function cbctSection (a, t) {
  const r = a.results || {}
  const rows = [
    ...(r.measurements || []).map(m => [e(m.label || m.type), `${n(m.value, 2)} ${m.unit}`]),
    ...(r.cross_sections || []).map(s => [`${t.bone}: ${e(s.label)} @ ${n(s.position_mm)} mm`, `${n(s.value, 2)} mm`])
  ]
  const imp = (r.implants || []).map(i => [e(i.label) + (i.tooth ? ` (${e(i.tooth)})` : ''), `Ø ${n(i.diameter_mm)} × ${n(i.length_mm)} mm · ${n(i.tilt_from_vertical_deg)}°`])
  return (rows.length ? table([t.measurement, t.value], rows) : '') + (imp.length ? `<h4>${t.implants}</h4>${table([t.measurement, t.value], imp)}` : '')
}

function faceSection (a, t) {
  const r = a.results || {}
  const u = r.length_unit === 'mm' ? 'mm' : 'px'
  const rows = []
  if (r.profile) {
    rows.push(['Nasolabial angle', `${n(r.profile.nasolabial_angle)}°`, '102 ± 8° (Legan & Burstone)'])
    rows.push(['Facial convexity (G–Sn–Pog′)', `${n(r.profile.facial_convexity)}°`, '12 ± 4° (Legan & Burstone)'])
    rows.push(['Upper lip – E-line', `${n(r.profile.upper_lip_E, 2)} ${u}`, ''])
    rows.push(['Lower lip – E-line', `${n(r.profile.lower_lip_E, 2)} ${u}`, '−2 ± 2 mm (Ricketts)'])
  } else {
    const th = r.thirds || {}
    if (th.middle_to_lower !== null) rows.push([t.thirds, `${n(th.upper_pct)}% / ${n(th.middle_pct)}% / ${n(th.lower_pct)}%`, `mid/low ${n(th.middle_to_lower, 2)}`])
    for (const [k, s] of Object.entries(r.symmetry || {})) rows.push([`${t.symmetry}: ${k}`, `${n(s.asymmetry_pct)}%`, k === 'pupils' ? '' : `${n(s.cant_deg)}°`])
    if (r.smile) {
      rows.push([t.smile, `${n(r.smile.smile_width, 1)} ${u}`, `buccal corridor ${n(r.smile.buccal_corridor_pct)}%`])
      if (r.smile.dental_midline_deviation !== null) rows.push(['Dental midline', `${n(r.smile.dental_midline_deviation, 2)} ${u}`, ''])
    }
  }
  return rows.length ? table([t.measurement, t.value, t.norm], rows) : ''
}

function planSection (p, t) {
  if (!p) return ''
  const kv = (k, v) => (v === null || v === undefined || v === '' ? '' : `<div class="kv"><b>${e(k)}</b><span>${e(v)}</span></div>`)
  const pair = (a, b) => (a === null && b === null ? null : `${a ?? '—'} / ${b ?? '—'}`)
  const stages = (p.stages || []).map((s, i) => `<li><b>${i + 1}. ${e(s.title)}</b> ${s.target_date ? `(${e(s.target_date)})` : ''}<br>${e(s.description || '')}</li>`).join('')
  return `<h3>${t.assessment}</h3>
    ${kv(t.complaint, p.chief_complaint)}${kv(t.examination, p.clinical_examination)}${kv(t.diagnosis, p.diagnosis)}
    ${kv(t.skeletal, p.skeletal_class)}${kv(t.molar, pair(p.molar_class_right, p.molar_class_left))}${kv(t.canine, pair(p.canine_class_right, p.canine_class_left))}
    ${kv(t.overjet, p.overjet_mm !== null ? `${p.overjet_mm} mm` : null)}${kv(t.overbite, p.overbite_mm !== null ? `${p.overbite_mm} mm` : null)}
    ${kv(t.crowding, pair(p.crowding_upper_mm, p.crowding_lower_mm))}${kv(t.crossbite, p.crossbite)}${kv(t.midline, pair(p.midline_upper_mm, p.midline_lower_mm))}
    ${(p.observations || []).map(o => kv(o.label, o.value)).join('')}
    <h3>${t.plan}</h3>
    ${kv(t.objectives, p.objectives)}${kv(t.planned, p.planned_treatment)}${kv(t.appliance, p.appliance_type)}
    ${kv(t.duration, p.estimated_duration_months)}${kv(t.startDate, p.start_date)}${kv(t.status, p.status)}
    ${stages ? `<h4>${t.stages}</h4><ul>${stages}</ul>` : ''}${kv(t.notes, p.doctor_notes)}`
}

/**
 * @param report  GET .../orthodontics/report payload
 * @param options { locale, sections: {ceph, cast, cbct, face, plan}, images: { fileId: dataUrl } }
 */
export function buildReportHtml (report, { locale = 'ar', sections = {}, images = {} } = {}) {
  const t = T[locale === 'ar' ? 'ar' : 'en']
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const on = k => sections[k] !== false
  const clinic = report.clinic || {}
  const patient = report.patient || {}
  const byType = type => (report.analyses || []).filter(a => a.type === type)
  const isDraft = !report.final && (report.analyses || []).some(a => a.status !== 'reviewed')
  const analysisBlock = (a, body) => body ? `<div class="analysis"><div class="ahead"><span>${e(a.title || '')}</span><span>${t.analysisDate}: ${e(a.analysis_date || '')}</span><span class="badge ${a.status === 'reviewed' ? 'ok' : 'draft'}">${a.status === 'reviewed' ? t.reviewed : t.draft}${a.reviewed_by?.name ? ' - ' + e(a.reviewed_by.name) : ''}</span></div>${body}${a.notes ? `<p><b>${t.notes}:</b> ${e(a.notes)}</p>` : ''}</div>` : ''
  const section = (key, title, fn) => {
    if (!on(key)) return ''
    const blocks = byType(key).map(a => analysisBlock(a, fn(a))).join('')
    return blocks ? `<section><h2>${t[title]}</h2>${blocks}</section>` : ''
  }
  const today = new Date(report.generated_at || Date.now()).toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB')

  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><title>${t.title}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Tajawal', 'Segoe UI', 'Noto Naskh Arabic', Tahoma, Arial, sans-serif; color: #0f172a; font-size: 12px; margin: 0; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #17638d; padding-bottom: 10px; margin-bottom: 12px; }
  header img { height: 56px; }
  header .clinic { flex: 1; } header .clinic b { font-size: 16px; color: #17638d; display: block; }
  h1 { font-size: 18px; margin: 0 0 8px; color: #17638d; }
  h2 { font-size: 15px; margin: 18px 0 6px; color: #17638d; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 4px; } h4 { font-size: 12px; margin: 10px 0 4px; color: #334155; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 16px; background: #f1f5f9; padding: 8px 10px; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; page-break-inside: auto; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: start; vertical-align: top; }
  th { background: #f8fafc; } td.num { white-space: nowrap; }
  tr { page-break-inside: avoid; }
  .analysis { margin-bottom: 10px; page-break-inside: avoid; }
  .ahead { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-weight: 600; margin-bottom: 4px; }
  .badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; } .badge.ok { background: #dcfce7; color: #166534; } .badge.draft { background: #fef3c7; color: #92400e; }
  .tracing { width: 100%; max-height: 420px; display: block; margin: 4px auto 8px; background: #000; border-radius: 6px; }
  .kv { display: flex; gap: 8px; padding: 2px 0; } .kv b { min-width: 160px; color: #334155; } .kv span { white-space: pre-wrap; }
  .muted { color: #64748b; font-size: 11px; }
  .banner { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 6px 10px; border-radius: 6px; margin: 8px 0; font-weight: 700; }
  footer { margin-top: 22px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10.5px; color: #475569; }
  .sign { margin-top: 26px; display: flex; justify-content: flex-end; } .sign div { border-top: 1px solid #0f172a; width: 220px; text-align: center; padding-top: 4px; }
  ${isDraft ? `body::before { content: '${t.draft}'; position: fixed; top: 40%; left: 10%; right: 10%; text-align: center; font-size: 64px; color: rgba(245, 158, 11, 0.12); transform: rotate(-24deg); z-index: 0; }` : ''}
</style></head><body>
<header>
  ${clinic.logo ? `<img src="${e(clinic.logo)}" alt="">` : ''}
  <div class="clinic"><b>${e(clinic.name || '')}</b>${e(clinic.address || '')}${clinic.phone ? ` · ${e(clinic.phone)}` : ''}</div>
  <div>${t.date}: ${e(today)}</div>
</header>
<h1>${t.title}</h1>
${isDraft ? `<div class="banner">${t.draftBanner}</div>` : ''}
<div class="meta">
  <div><b>${t.patient}:</b> ${e(patient.name || '')}</div>
  <div><b>${t.age}:</b> ${e(patient.age ?? '—')}</div>
  <div><b>${t.sex}:</b> ${e(patient.sex ?? '—')}</div>
  <div><b>${t.doctor}:</b> ${e(report.doctor?.name || '')}</div>
  <div><b>${t.caseNo}:</b> ${e(report.case?.id)}</div>
  <div><b>${t.category}:</b> ${e(report.case?.category || '')}</div>
</div>
${section('ceph', 'ceph', a => cephSection(a, t, images))}
${section('cast', 'cast', a => castSection(a, t))}
${section('cbct', 'cbct', a => cbctSection(a, t))}
${section('face', 'face', a => faceSection(a, t))}
${on('plan') && report.treatment_plan ? `<section><h2>${t.plan}</h2>${planSection(report.treatment_plan, t)}</section>` : ''}
<footer>${t.disclaimer}</footer>
<div class="sign"><div>${t.signature}</div></div>
</body></html>`
}
