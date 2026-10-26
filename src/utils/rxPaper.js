/**
 * Rx paper
 *
 * One prescription sheet, built as plain HTML + CSS so the screen preview, the
 * print window and the saved image are literally the same markup. Nothing here
 * knows about Vue or i18n — callers pass their own translated `labels`.
 *
 * The header is one of two things: a picture of the clinic's letterhead, or the
 * clinic details typed out and printed centred. `useImageHeader` picks which,
 * and a picture that was uploaded stays stored either way.
 */

export const RX_PAPER_SIZES = {
  A5: { width: 148, height: 210 },
  A4: { width: 210, height: 297 }
}

export const RX_FONT_SIZES = {
  small: 3.6,
  normal: 4.3,
  large: 5.1
}

export const DEFAULT_RX_TEMPLATE = {
  useImageHeader: false,
  headerImage: '',
  headerHeight: 42,
  paperSize: 'A5',
  fontSize: 'normal',
  accent: '#17638D',
  showPatientRow: true,
  showSignature: true,
  clinicName: '',
  doctorName: '',
  specialty: '',
  phone: '',
  address: '',
  footerNote: ''
}

export const DEFAULT_RX_LABELS = {
  patient: 'Name',
  age: 'Age',
  date: 'Date',
  notes: 'Notes',
  signature: 'Signature',
  prescription: 'Prescription'
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]))

const withTemplate = (template) => ({ ...DEFAULT_RX_TEMPLATE, ...(template || {}) })

/**
 * Stylesheet for one sheet. Scoped under `.rx-paper` so it can be dropped into
 * the app next to Vuetify without either side leaking into the other.
 */
export const buildRxPaperCss = (template, isRtl = false) => {
  const tpl = withTemplate(template)
  const paper = RX_PAPER_SIZES[tpl.paperSize] || RX_PAPER_SIZES.A5
  const base = RX_FONT_SIZES[tpl.fontSize] || RX_FONT_SIZES.normal
  const accent = tpl.accent || DEFAULT_RX_TEMPLATE.accent
  const start = isRtl ? 'right' : 'left'
  const end = isRtl ? 'left' : 'right'

  return `
.rx-paper {
  box-sizing: border-box;
  width: ${paper.width}mm;
  min-height: ${paper.height}mm;
  margin: 0 auto;
  padding: 10mm 12mm 12mm;
  background: #fff;
  color: #1a1a1a;
  font-family: ${isRtl ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', 'Segoe UI', sans-serif"};
  font-size: ${base}mm;
  line-height: 1.55;
  display: flex;
  flex-direction: column;
}
.rx-paper *, .rx-paper *::before, .rx-paper *::after { box-sizing: border-box; }

/* ── Header ── */
.rx-paper__head { margin-bottom: 4mm; }
.rx-paper__head-img { display: block; width: 100%; max-height: ${tpl.headerHeight}mm; object-fit: contain; object-position: center top; }
.rx-paper__head-text { text-align: center; }
.rx-paper__clinic { font-size: ${(base * 1.55).toFixed(2)}mm; font-weight: 700; color: ${accent}; line-height: 1.25; }
.rx-paper__doctor { font-size: ${(base * 1.05).toFixed(2)}mm; font-weight: 600; margin-top: 1mm; }
.rx-paper__contact { font-size: ${(base * 0.82).toFixed(2)}mm; color: #555; margin-top: 0.8mm; }

/* ── Patient row ── */
.rx-paper__meta {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 2mm 6mm;
  border-top: 0.3mm solid ${accent};
  border-bottom: 0.3mm solid ${accent};
  padding: 2.4mm 0;
  margin-bottom: 5mm;
  font-size: ${(base * 0.92).toFixed(2)}mm;
}
/* Age and date are short and fixed; the name takes whatever is left rather
   than a fixed share, so it only wraps once the row is genuinely full — and
   when it does, it wraps inside the rule instead of spilling past it. */
.rx-paper__meta-item { display: flex; align-items: baseline; gap: 1.5mm; flex: 0 0 auto; min-width: 0; }
.rx-paper__meta-item--grow { flex: 1 1 auto; }
.rx-paper__meta-label { color: #666; font-size: ${(base * 0.82).toFixed(2)}mm; white-space: nowrap; flex: 0 0 auto; }
.rx-paper__meta-value { font-weight: 600; min-width: 0; overflow-wrap: break-word; }

/* ── Body ── */
.rx-paper__body { display: flex; gap: 4mm; flex: 1 1 auto; }
.rx-paper__sym { font-size: ${(base * 2.6).toFixed(2)}mm; font-weight: 700; font-style: italic; color: ${accent}; line-height: 1; flex: 0 0 auto; }
.rx-paper__lines { flex: 1 1 auto; list-style: none; margin: 0; padding: 0; counter-reset: rx; }
.rx-paper__line {
  counter-increment: rx;
  display: flex; align-items: baseline; gap: 2.5mm;
  padding: 1.6mm 0;
  border-bottom: 0.2mm dotted #c9c9c9;
}
.rx-paper__line::before { content: counter(rx) "."; direction: ltr; unicode-bidi: isolate; color: ${accent}; font-weight: 700; min-width: 5mm; font-size: ${(base * 0.9).toFixed(2)}mm; }
.rx-paper__line-text { flex: 1 1 auto; word-break: break-word; }

/* ── Footer ── */
.rx-paper__notes { margin-top: 4mm; font-size: ${(base * 0.9).toFixed(2)}mm; white-space: pre-wrap; }
.rx-paper__notes-label { color: ${accent}; font-weight: 700; font-size: ${(base * 0.82).toFixed(2)}mm; }
.rx-paper__foot { margin-top: 6mm; display: flex; align-items: flex-end; justify-content: space-between; gap: 6mm; }
.rx-paper__note-text { font-size: ${(base * 0.75).toFixed(2)}mm; color: #777; flex: 1 1 auto; text-align: ${start}; }
.rx-paper__sig { text-align: center; flex: 0 0 auto; }
.rx-paper__sig-line { width: 38mm; border-bottom: 0.3mm solid #1a1a1a; margin-bottom: 1.2mm; }
.rx-paper__sig-label { font-size: ${(base * 0.78).toFixed(2)}mm; color: #555; }
.rx-paper__sig-name { font-size: ${(base * 0.88).toFixed(2)}mm; font-weight: 600; }
.rx-paper__meta-item--end { margin-${start}: auto; text-align: ${end}; }
`
}

/** The sheet itself. Returns an `.rx-paper` element as an HTML string. */
export const buildRxSheetHtml = ({
  template,
  patient = {},
  doctorName = '',
  lines = [],
  notes = '',
  date = '',
  isRtl = false,
  labels = {}
} = {}) => {
  const tpl = withTemplate(template)
  const l = { ...DEFAULT_RX_LABELS, ...labels }
  const written = (Array.isArray(lines) ? lines : []).map((s) => String(s || '').trim()).filter(Boolean)

  let head = ''
  if (tpl.useImageHeader && tpl.headerImage) {
    head = `<img class="rx-paper__head-img" src="${esc(tpl.headerImage)}" alt="" />`
  } else {
    const contact = [tpl.phone, tpl.address].filter(Boolean).map(esc).join(' · ')
    head = `<div class="rx-paper__head-text">
      ${tpl.clinicName ? `<div class="rx-paper__clinic">${esc(tpl.clinicName)}</div>` : ''}
      ${doctorName || tpl.doctorName ? `<div class="rx-paper__doctor">${esc(doctorName || tpl.doctorName)}${tpl.specialty ? ` — ${esc(tpl.specialty)}` : ''}</div>` : ''}
      ${contact ? `<div class="rx-paper__contact">${contact}</div>` : ''}
    </div>`
  }

  const metaItems = []
  if (tpl.showPatientRow) {
    metaItems.push(`<div class="rx-paper__meta-item rx-paper__meta-item--grow">
      <span class="rx-paper__meta-label">${esc(l.patient)}:</span>
      <span class="rx-paper__meta-value">${esc(patient.name || '')}</span>
    </div>`)
    if (patient.age) {
      metaItems.push(`<div class="rx-paper__meta-item">
        <span class="rx-paper__meta-label">${esc(l.age)}:</span>
        <span class="rx-paper__meta-value">${esc(patient.age)}</span>
      </div>`)
    }
    metaItems.push(`<div class="rx-paper__meta-item rx-paper__meta-item--end">
      <span class="rx-paper__meta-label">${esc(l.date)}:</span>
      <span class="rx-paper__meta-value">${esc(date)}</span>
    </div>`)
  }

  const lineHtml = written
    .map((text) => `<li class="rx-paper__line"><span class="rx-paper__line-text" dir="auto">${esc(text)}</span></li>`)
    .join('')

  const sigName = doctorName || tpl.doctorName || ''

  return `<div class="rx-paper" dir="${isRtl ? 'rtl' : 'ltr'}">
  <div class="rx-paper__head">${head}</div>
  ${metaItems.length ? `<div class="rx-paper__meta">${metaItems.join('')}</div>` : ''}
  <div class="rx-paper__body">
    <div class="rx-paper__sym">&#8478;</div>
    <ol class="rx-paper__lines">${lineHtml}</ol>
  </div>
  ${notes ? `<div class="rx-paper__notes"><span class="rx-paper__notes-label">${esc(l.notes)}:</span> ${esc(notes)}</div>` : ''}
  <div class="rx-paper__foot">
    <div class="rx-paper__note-text">${esc(tpl.footerNote || '')}</div>
    ${tpl.showSignature ? `<div class="rx-paper__sig">
      <div class="rx-paper__sig-line"></div>
      ${sigName ? `<div class="rx-paper__sig-name">${esc(sigName)}</div>` : `<div class="rx-paper__sig-label">${esc(l.signature)}</div>`}
    </div>` : ''}
  </div>
</div>`
}

/** A standalone printable document wrapping one sheet. */
export const buildRxDocument = (options = {}) => {
  const tpl = withTemplate(options.template)
  const paper = RX_PAPER_SIZES[tpl.paperSize] || RX_PAPER_SIZES.A5
  const isRtl = !!options.isRtl
  const title = options.title || tpl.clinicName || 'Rx'

  return `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${esc(options.lang || 'en')}">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; }
  body { background: #eceff1; padding: 6mm 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${buildRxPaperCss(tpl, isRtl)}
  .rx-paper { box-shadow: 0 2px 16px rgba(0,0,0,0.12); }
  @page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }
  @media print {
    body { background: #fff; padding: 0; }
    .rx-paper { box-shadow: none; margin: 0; }
  }
</style>
</head>
<body>${buildRxSheetHtml({ ...options, template: tpl })}</body>
</html>`
}

/**
 * Open the print dialog on a fresh window. Returns false when the browser
 * blocked the popup so the caller can tell the user instead of failing quietly.
 */
export const printRxPaper = (options = {}) => {
  const win = window.open('', '_blank', 'width=820,height=1000')
  if (!win) return false

  win.document.write(buildRxDocument(options))
  win.document.close()
  win.onload = () => {
    setTimeout(() => {
      win.print()
      win.close()
    }, 400)
  }
  return true
}
