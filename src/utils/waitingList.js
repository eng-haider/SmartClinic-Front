/**
 * Helpers shared by the waiting list's two looks: the cards and the table
 * (the clinic picks one with the `waiting_list_style` setting).
 */

// "HH:MM:SS" from a time or full datetime string, zero-padded so it also sorts as text
export function clockPart(timeString) {
  if (!timeString) return ''
  let time = String(timeString)
  if (time.includes('T') || time.includes(' ')) {
    time = (time.split('T')[1] || time.split(' ')[1] || '').split('.')[0]
  }
  const [hours = '', minutes = '00', seconds = '00'] = time.split(':')
  if (!hours) return ''
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
}

// 12-hour "2:05 PM" from a time or datetime string ('' when there is none)
export function formatClockTime(timeString) {
  const clock = clockPart(timeString)
  if (!clock) return ''

  const [hours, minutes] = clock.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12

  return `${hour12}:${minutes} ${ampm}`
}

export function getStatusColor(status) {
  if (!status) return 'grey'
  // Use the color from the API directly if available
  if (status.color) return status.color
  const id = status.id
  if (id === 1) return 'orange'
  if (id === 2) return 'success'
  if (id === 3) return 'error'
  if (id === 4) return 'info'
  return 'grey'
}

// Status name as the API localised it ('' when there is none)
export function getStatusName(status) {
  return status?.name_ar || status?.name_en || status?.name || ''
}

export function isDone(item) {
  const statusName = item?.status?.name?.toString().toLowerCase() || ''
  return item?.status?.id === 3 || statusName === 'completed' || statusName === 'complete'
}

export function isCancelled(item) {
  const statusName = item?.status?.name?.toString().toLowerCase() || ''
  return item?.status?.id === 4 || statusName === 'cancelled' || statusName === 'canceled'
}

// Still waiting to go in: not finished, cancelled, or already with the doctor (status 2 = in progress)
export function isWaiting(item) {
  return !isDone(item) && !isCancelled(item) && item?.status?.id !== 2
}

// Card accent stripe: API colours are CSS values (#hex / rgb), palette names map to Vuetify bg-* classes
export function getStatusAccent(status) {
  const color = getStatusColor(status)
  if (/^(#|rgb|hsl)/i.test(color)) return { style: { backgroundColor: color } }
  return { class: `bg-${color}` }
}
