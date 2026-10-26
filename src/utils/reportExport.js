/**
 * Shared "Export Excel" / "Export PDF" implementation for every Reports page.
 *
 * Excel: delegates straight to the existing, already-production-ready
 * src/utils/excelExport.js (ExcelJS-based) — no need for a second exporter.
 *
 * PDF: Arabic text cannot be drawn with jsPDF's built-in fonts (no Arabic
 * glyphs), so — exactly like src/components/PatientReportDialog.vue already
 * does for patient reports — this builds an off-screen HTML sheet, rasterizes
 * it with dom-to-image-more, and slices the tall image into A4-height JPEG
 * bands added to a jsPDF document. That keeps real, RTL-shaped Arabic text
 * (not per-page giant bleeding images) with each page correctly margined.
 *
 * A report page never touches jsPDF/dom-to-image-more directly — it just
 * hands this module its title/period/KPIs/columns/rows/totals.
 */

const EXPORT_WIDTH = 900
const EXPORT_SCALE = 2
const PDF_MARGIN = 8
const PDF_JPEG_QUALITY = 0.92

function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Builds the printable report sheet as an HTML string.
 * @param {object} opts
 * @param {{name:string, logo?:string, phone?:string, address?:string}} opts.clinicInfo
 * @param {string} opts.title
 * @param {string} [opts.subtitle]
 * @param {string} opts.periodLabel
 * @param {Array<{label:string, value:string}>} [opts.kpis]
 * @param {Array<{key:string, label:string, align?:'start'|'end'}>} opts.columns
 * @param {Array<object>} opts.rows
 * @param {Array<{label:string, value:string}>} [opts.totals]
 */
function buildReportHtml({ clinicInfo, title, subtitle, periodLabel, kpis = [], columns, rows, totals = [] }) {
  const generatedAtLabel = new Date().toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const kpiHtml = kpis.length
    ? `<div class="kpi-row">${kpis.map((k) => `
        <div class="kpi-box">
          <div class="kpi-label">${escapeHtml(k.label)}</div>
          <div class="kpi-value">${escapeHtml(k.value)}</div>
        </div>`).join('')}</div>`
    : ''

  const headHtml = `<tr>${columns.map((c) => `<th style="text-align:${c.align === 'end' ? 'left' : 'right'}">${escapeHtml(c.label)}</th>`).join('')}</tr>`
  const bodyHtml = rows.map((row, i) => `
    <tr class="${i % 2 === 1 ? 'zebra' : ''}">
      ${columns.map((c) => `<td style="text-align:${c.align === 'end' ? 'left' : 'right'}">${escapeHtml(row[c.key])}</td>`).join('')}
    </tr>`).join('')

  const totalsHtml = totals.length
    ? `<div class="totals-row">${totals.map((t) => `
        <div class="totals-item"><span class="totals-label">${escapeHtml(t.label)}</span><span class="totals-value">${escapeHtml(t.value)}</span></div>`).join('')}</div>`
    : ''

  return `
  <div class="sheet" dir="rtl">
    <div class="sheet-accent"></div>
    <div class="sheet-head">
      <div class="clinic-block">
        ${clinicInfo?.logo ? `<img src="${escapeHtml(clinicInfo.logo)}" class="clinic-logo" />` : ''}
        <div>
          <div class="clinic-name">${escapeHtml(clinicInfo?.name || 'Smart Clinic')}</div>
          ${clinicInfo?.address ? `<div class="clinic-line">${escapeHtml(clinicInfo.address)}</div>` : ''}
          ${clinicInfo?.phone ? `<div class="clinic-line" dir="ltr">${escapeHtml(clinicInfo.phone)}</div>` : ''}
        </div>
      </div>
      <div class="report-badge">
        <div class="report-title">${escapeHtml(title)}</div>
        <div class="report-period">${escapeHtml(periodLabel)}</div>
        <div class="report-generated" dir="ltr">${escapeHtml(generatedAtLabel)}</div>
      </div>
    </div>
    ${subtitle ? `<div class="sheet-subtitle">${escapeHtml(subtitle)}</div>` : ''}
    ${kpiHtml}
    <table class="report-table">
      <thead>${headHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table>
    ${totalsHtml}
  </div>`
}

const SHEET_STYLE = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .sheet { width: ${EXPORT_WIDTH}px; background: #ffffff; font-family: 'Cairo', Tahoma, Arial, sans-serif; color: #1e293b; padding: 28px 32px 36px; }
  .sheet-accent { height: 6px; border-radius: 4px; background: linear-gradient(90deg, #0F766E, #17638D); margin-bottom: 18px; }
  .sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #eef0f3; }
  .clinic-block { display: flex; align-items: center; gap: 12px; }
  .clinic-logo { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; }
  .clinic-name { font-size: 17px; font-weight: 700; }
  .clinic-line { font-size: 12px; color: #64748b; margin-top: 2px; }
  .report-badge { text-align: left; }
  .report-title { font-size: 16px; font-weight: 700; color: #0F766E; }
  .report-period { font-size: 12px; color: #334155; margin-top: 2px; }
  .report-generated { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .sheet-subtitle { font-size: 12px; color: #64748b; margin: 12px 0 4px; }
  .kpi-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0; }
  .kpi-box { flex: 1 1 150px; border: 1px solid #eef0f3; border-radius: 10px; padding: 10px 14px; background: #f8fafc; }
  .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
  .kpi-value { font-size: 15px; font-weight: 700; margin-top: 4px; }
  .report-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
  .report-table th { background: #0F766E; color: #ffffff; padding: 8px 10px; font-weight: 600; font-size: 11px; }
  .report-table td { padding: 7px 10px; border-bottom: 1px solid #f1f3f5; }
  .report-table tr.zebra td { background: #f8fafc; }
  .totals-row { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #eef0f3; }
  .totals-item { display: flex; gap: 6px; font-size: 13px; }
  .totals-label { color: #64748b; }
  .totals-value { font-weight: 700; }
`

async function rasterizeToDataUrl(html) {
  const domtoimage = await import('dom-to-image-more')
  await document.fonts.ready
  await new Promise((r) => setTimeout(r, 200))

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '-10000px'
  container.style.colorScheme = 'only light'
  container.style.background = '#ffffff'
  container.innerHTML = `<style>${SHEET_STYLE}</style>${html}`
  document.body.appendChild(container)

  try {
    await new Promise((r) => setTimeout(r, 60))
    const target = container.firstElementChild.nextElementSibling || container
    const height = target.getBoundingClientRect().height || target.scrollHeight
    return await domtoimage.toPng(target, {
      quality: 1,
      bgcolor: '#ffffff',
      width: EXPORT_WIDTH * EXPORT_SCALE,
      height: height * EXPORT_SCALE,
      style: {
        transform: `scale(${EXPORT_SCALE})`,
        transformOrigin: 'top left',
        width: `${EXPORT_WIDTH}px`,
        height: `${height}px`,
      },
    })
  } finally {
    document.body.removeChild(container)
  }
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error('Could not rasterize the report'))
  img.src = src
})

/** Downloads a paginated A4 PDF built from the report data. */
export async function exportReportPdf({ filename = 'report', ...reportData }) {
  const html = buildReportHtml(reportData)
  const [dataUrl, { jsPDF }] = await Promise.all([rasterizeToDataUrl(html), import('jspdf')])
  const img = await loadImage(dataUrl)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const drawWidth = pageWidth - PDF_MARGIN * 2
  const drawHeight = pageHeight - PDF_MARGIN * 2
  const pxPerMm = img.width / drawWidth
  const slicePx = Math.max(1, Math.floor(drawHeight * pxPerMm))

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  for (let y = 0, page = 0; y < img.height; y += slicePx, page++) {
    const sliceHeight = Math.min(slicePx, img.height - y)
    if (sliceHeight < 4 && page > 0) break

    canvas.width = img.width
    canvas.height = sliceHeight
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, y, img.width, sliceHeight, 0, 0, img.width, sliceHeight)

    if (page > 0) pdf.addPage()
    pdf.addImage(
      canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY), 'JPEG',
      PDF_MARGIN, PDF_MARGIN, drawWidth, sliceHeight / pxPerMm, undefined, 'FAST'
    )
  }

  const safeFilename = String(filename).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').trim() || 'report'
  pdf.save(`${safeFilename}.pdf`)
}

/**
 * Downloads a genuine .xlsx built from the report data (delegates to
 * excelExport.js). `totalsRow` is a plain object keyed by column `key`
 * (e.g. { patient_name: 'Total', total_price: 1250000 }) rendered as a bold
 * summary line under the data.
 */
export async function exportReportExcel({ filename = 'report', sheetName = 'Report', columns, rows, totalsRow = null }) {
  const { exportWorkbook } = await import('@/utils/excelExport')
  await exportWorkbook({
    filename,
    rtl: true,
    sheets: [{ name: sheetName, columns, rows, totalsRow }],
  })
}
