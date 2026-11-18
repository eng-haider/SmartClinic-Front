// Root canal record of a dental case (cases.root_stuffing).
// Stored as JSON in the old system's shape so imported cases open unchanged:
//   { access_opening: [[canal, working length, reference point, file used], ...],
//     oburation:      [[canal, last file size, sealer type & duration, gutta percha size], ...],
//     note?: free text an old case held instead of JSON }
// ("oburation" is the old spelling and is kept on purpose.)

export const ROOT_CANAL_COLUMNS = 4

const emptyRow = () => Array(ROOT_CANAL_COLUMNS).fill('')

const toRows = (rows) => (Array.isArray(rows) ? rows : [])
  .map((row) => {
    const values = Array.isArray(row) ? row : Object.values(row || {})
    return Array.from({ length: ROOT_CANAL_COLUMNS }, (_, i) => (values[i] == null ? '' : String(values[i])))
  })

const isFilledRow = (row) => row.some((cell) => String(cell ?? '').trim() !== '')

/** Parse root_stuffing (JSON string, object or old free text) into editable rows. */
export function parseRootStuffing(raw) {
  let data = raw
  if (typeof raw === 'string') {
    const text = raw.trim()
    if (!text) data = null
    else {
      try {
        data = JSON.parse(text)
      } catch {
        return { accessOpening: [], obturation: [], note: text }
      }
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { accessOpening: [], obturation: [], note: '' }
  }
  return {
    accessOpening: toRows(data.access_opening).filter(isFilledRow),
    obturation: toRows(data.oburation ?? data.obturation).filter(isFilledRow),
    note: typeof data.note === 'string' ? data.note : '',
  }
}

/** Number of canals recorded (whichever table has more filled rows). */
export function countRootCanals(raw) {
  const { accessOpening, obturation } = parseRootStuffing(raw)
  return Math.max(accessOpening.length, obturation.length)
}

export function hasRootCanalData(raw) {
  const { accessOpening, obturation, note } = parseRootStuffing(raw)
  return accessOpening.length > 0 || obturation.length > 0 || !!note.trim()
}

// Category names that mean root canal treatment (English and Arabic).
const ROOT_CANAL_NAME = /root|canal|endo|\brct\b|pulp|عصب|اعصاب|أعصاب|جذر|جذور/i

export function isRootCanalCategory(category) {
  if (!category) return false
  return [category.name, category.name_ar, category.name_en]
    .some((name) => typeof name === 'string' && ROOT_CANAL_NAME.test(name))
}

export { emptyRow as emptyRootCanalRow, isFilledRow as isFilledRootCanalRow }
