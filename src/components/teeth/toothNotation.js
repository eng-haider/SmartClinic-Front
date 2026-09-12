/**
 * Tooth numbering (notation) helpers
 *
 * Cases are always STORED with the FDI number - 11-48 for the permanent chart
 * and 51-85 for the baby one. Only the label shown on screen changes with the
 * clinic's `baby_teeth_notation` setting, so switching notation never touches
 * existing data and both charts keep matching what is in the database.
 */

// A child has 5 teeth per quadrant instead of 8, and the primary FDI numbers are
// the permanent ones shifted by a quadrant: 1x -> 5x, 2x -> 6x, 3x -> 7x, 4x -> 8x
export const PRIMARY_TOOTH_OFFSET = 40
export const PRIMARY_LAST_POSITION = 5

export function toPrimaryToothNum(toothNum) {
  return toothNum + PRIMARY_TOOTH_OFFSET
}

// True for a baby (primary) FDI number - 51-55, 61-65, 71-75, 81-85
export function isBabyToothNumber(toothNum) {
  const num = Number(toothNum)
  if (!Number.isFinite(num)) return false
  const quadrant = Math.floor(num / 10)
  const position = num % 10
  return quadrant >= 5 && quadrant <= 8 && position >= 1 && position <= PRIMARY_LAST_POSITION
}

// Clinic setting key that picks how baby teeth are labelled
export const BABY_TEETH_NOTATION_KEY = 'baby_teeth_notation'

// 'fdi'       -> 51-85 (default, what the chart has always shown)
// 'universal' -> A-T, one letter per baby tooth (Universal / ADA lettering)
// 'palmer'    -> A-E per quadrant (Palmer / Zsigmondy lettering)
export const TOOTH_NOTATIONS = ['fdi', 'universal', 'palmer']
export const DEFAULT_TOOTH_NOTATION = 'fdi'

// Universal lettering runs A-J across the upper arch (patient's right to left)
// then K-T back across the lower arch (patient's left to right).
const UNIVERSAL_PRIMARY_LETTERS = {
  55: 'A', 54: 'B', 53: 'C', 52: 'D', 51: 'E',
  61: 'F', 62: 'G', 63: 'H', 64: 'I', 65: 'J',
  75: 'K', 74: 'L', 73: 'M', 72: 'N', 71: 'O',
  81: 'P', 82: 'Q', 83: 'R', 84: 'S', 85: 'T'
}

// Palmer letters are per quadrant: A = central incisor ... E = second molar,
// the quadrant being obvious from where the tooth sits on the chart.
const PALMER_PRIMARY_LETTERS = ['A', 'B', 'C', 'D', 'E']

export function normalizeToothNotation(notation) {
  return TOOTH_NOTATIONS.includes(notation) ? notation : DEFAULT_TOOTH_NOTATION
}

/**
 * Label for a tooth number. Permanent teeth are always shown as their FDI
 * number - the setting only re-labels the baby (primary) chart.
 *
 * @param {number|string} toothNum - FDI tooth number as stored
 * @param {string} notation - 'fdi' | 'universal' | 'palmer'
 * @returns {string} label to display
 */
export function formatToothNumber(toothNum, notation = DEFAULT_TOOTH_NOTATION) {
  if (toothNum === null || toothNum === undefined || toothNum === '') return ''

  const num = Number(toothNum)
  if (!isBabyToothNumber(num)) return String(toothNum)

  switch (normalizeToothNotation(notation)) {
    case 'universal':
      return UNIVERSAL_PRIMARY_LETTERS[num] || String(num)
    case 'palmer':
      return PALMER_PRIMARY_LETTERS[(num % 10) - 1] || String(num)
    default:
      return String(num)
  }
}
