export const fmt = (v, digits = 1) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(digits))
export const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-GB') : '—')
export const statusColor = s => ({ within: 'success', above: 'warning', below: 'info' }[s] || 'grey')
export const statusLabel = s => ({ within: 'ضمن المرجع', above: 'أعلى من المرجع', below: 'أقل من المرجع' }[s] || '')
export const bytes = n => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`
}
