// Shared parsing/formatting for the orthodontics quick-fields tag line that
// gets prefixed onto a case note's content, e.g.:
//   [تقويم] التاريخ: 2026-07-22 | الجهاز: خزفي | المرحلة: تثبيت (Retainer) | المدة: 1 شهر
// Kept here (not inline in PatientDetail.vue) so both the note composer and
// the saved-note editor can build/read the same format.

export const ORTHO_TAG = '[تقويم]'

export const orthoApplianceOptions = ['معدني', 'خزفي', 'شفاف (Aligners)', 'داخلي (Lingual)']
export const orthoPhaseOptions = ['تحضيري', 'نشط', 'تثبيت (Retainer)']

const LABELS = {
  noteDate: 'التاريخ',
  appliance: 'الجهاز',
  phase: 'المرحلة',
  duration: 'المدة',
}

// noteDate is stored/parsed as the raw ISO value (YYYY-MM-DD) so it round-trips
// straight back into a native <input type="date">. Format it for display only.
export const formatOrthoDate = (isoDate) => {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}

// The date rides along only once there's other quick-field content — it's
// metadata, not by itself a sign the user picked something meaningful.
export const buildOrthoLine = (meta = {}) => {
  const { noteDate, appliance, phase, duration } = meta
  const parts = []
  if (appliance) parts.push(`${LABELS.appliance}: ${appliance}`)
  if (phase) parts.push(`${LABELS.phase}: ${phase}`)
  if (duration) parts.push(`${LABELS.duration}: ${duration} شهر`)
  if (!parts.length) return ''
  if (noteDate) parts.unshift(`${LABELS.noteDate}: ${noteDate}`)
  return `${ORTHO_TAG} ${parts.join(' | ')}`
}

export const composeNoteContent = (meta, text) =>
  [buildOrthoLine(meta), (text || '').trim()].filter(Boolean).join('\n')

// Reverse of buildOrthoLine + composeNoteContent — splits a saved note's
// content back into { meta, text }. meta is null when the note has no tag
// line (a plain note, or one from before this feature existed).
export const parseOrthoLine = (content) => {
  if (!content) return { meta: null, text: '' }

  const breakIdx = content.indexOf('\n')
  const firstLine = (breakIdx === -1 ? content : content.slice(0, breakIdx)).trim()
  if (!firstLine.startsWith(ORTHO_TAG)) {
    return { meta: null, text: content }
  }

  const rest = firstLine.slice(ORTHO_TAG.length).trim()
  const meta = { noteDate: null, appliance: null, phase: null, duration: null }
  for (const segment of rest.split('|')) {
    const idx = segment.indexOf(':')
    if (idx === -1) continue
    const key = segment.slice(0, idx).trim()
    const value = segment.slice(idx + 1).trim()
    if (key === LABELS.noteDate) meta.noteDate = value
    else if (key === LABELS.appliance) meta.appliance = value
    else if (key === LABELS.phase) meta.phase = value
    else if (key === LABELS.duration) meta.duration = value.replace(/\s*شهر\s*$/, '')
  }

  const text = breakIdx === -1 ? '' : content.slice(breakIdx + 1).trim()
  return { meta, text }
}
