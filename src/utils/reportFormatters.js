/**
 * Shared number/currency/percent/date formatters for the Reports module.
 *
 * The rest of the app re-implements formatCurrency locally in ~8 places with
 * inconsistent locales/suffixes (ar-IQ+'د.ع' in useDashboard.js, en-US+'IQD'
 * in PatientReportDialog/BillPreviewDialog/SmartTable). Reports pages should
 * all read from here instead of adding a 9th copy, so every report is
 * self-consistent. Handles null/undefined/NaN safely — never renders
 * "NaN"/"undefined"/"null" to the user.
 */

const EM_DASH = '—'

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return EM_DASH
  const num = typeof value === 'string' ? Number(value) : value
  if (typeof num !== 'number' || Number.isNaN(num)) return EM_DASH
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(value, currency = 'IQD') {
  if (value === null || value === undefined || value === '') return EM_DASH
  const num = typeof value === 'string' ? Number(value) : value
  if (typeof num !== 'number' || Number.isNaN(num)) return EM_DASH
  return `${new Intl.NumberFormat('en-US').format(Math.round(num))} ${currency}`
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || value === '') return EM_DASH
  const num = typeof value === 'string' ? Number(value) : value
  if (typeof num !== 'number' || Number.isNaN(num)) return EM_DASH
  return `${num.toFixed(digits)}%`
}

/** Safe divide -> percentage, e.g. paymentPercentage(paid, total). */
export function ratioPercent(numerator, denominator, digits = 1) {
  const n = Number(numerator) || 0
  const d = Number(denominator) || 0
  if (d <= 0) return n > 0 ? 100 : 0
  return Number(((n / d) * 100).toFixed(digits))
}

export function formatDate(value, locale = 'en-US') {
  if (!value) return EM_DASH
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return EM_DASH
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value, locale = 'en-US') {
  if (!value) return EM_DASH
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return EM_DASH
  return d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** YYYY-MM-DD using local date parts (never UTC — avoids a day-shift in UTC+ zones). */
export function toDateInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
