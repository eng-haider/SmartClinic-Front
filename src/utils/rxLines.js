/**
 * Prescription lines
 *
 * A line is plain text — exactly what a doctor writes on a paper pad:
 * "Paramol 500  2x1  5 days". The API stores one recipe_item per line and
 * `medication_name` is the only required column, so the whole line lives there.
 *
 * Prescriptions written before this (name / dosage / frequency / duration in
 * separate columns) still read back correctly: the parts are joined into one
 * line so old records open in the same editor.
 */

export const RX_LINE_MAX = 255

/** Collapse one API item — old or new — into a single written line. */
export const lineFromItem = (item) => {
  if (!item) return ''
  if (typeof item === 'string') return item.trim()

  const head = [item.medication_name, item.dosage].filter(Boolean).join(' ')
  const tail = [item.form, item.frequency, item.duration, item.instructions].filter(Boolean)
  return [head, ...tail].filter(Boolean).join(' — ').trim()
}

/** One written line back into the API shape. Blanks clear any legacy columns. */
export const itemFromLine = (line) => ({
  medication_name: String(line || '').trim().slice(0, RX_LINE_MAX),
  dosage: '',
  frequency: '',
  duration: ''
})

export const linesFromItems = (items) => {
  const list = Array.isArray(items) ? items : []
  const lines = list.map(lineFromItem).filter(Boolean)
  return lines.length ? lines : ['']
}

export const itemsFromLines = (lines) =>
  (Array.isArray(lines) ? lines : [])
    .map((l) => String(l || '').trim())
    .filter(Boolean)
    .map(itemFromLine)

/** Lines that actually carry something — what save and print both go by. */
export const filledLines = (lines) =>
  (Array.isArray(lines) ? lines : []).map((l) => String(l || '').trim()).filter(Boolean)
