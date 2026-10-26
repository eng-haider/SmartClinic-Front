import { formatWhatsAppPhone } from '@/utils/whatsapp'

const LOCALE_MAP = { ar: 'ar-IQ', ku: 'ku-IQ', pl: 'pl-PL', en: 'en-US' }

export const publicLocale = (locale) => LOCALE_MAP[locale] || LOCALE_MAP.en

export const formatPublicDate = (value, locale, options = {}) => {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(publicLocale(locale), {
    weekday: options.weekday ?? undefined,
    year: 'numeric',
    month: options.month || 'long',
    day: 'numeric',
  }).format(date)
}

export const formatPublicTime = (value, locale) => {
  if (!value || !/^\d{2}:\d{2}/.test(value)) return ''
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  const date = new Date(2000, 0, 1, hours, minutes)
  return new Intl.DateTimeFormat(publicLocale(locale), { hour: 'numeric', minute: '2-digit' }).format(date)
}

export const formatMoney = (amount, currency = 'IQD', locale = 'en') => {
  const value = Number(amount || 0)
  try {
    return new Intl.NumberFormat(publicLocale(locale), {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${new Intl.NumberFormat(publicLocale(locale)).format(value)} ${currency}`
  }
}

export const phoneHref = (value) => {
  const phone = String(value || '').replace(/[^+\d]/g, '')
  return phone.length >= 6 && /^\+?\d+$/.test(phone) ? `tel:${phone}` : ''
}

// wa.me needs the international form; clinics usually save local numbers (07…).
export const whatsappHref = (value, message = '') => {
  const phone = formatWhatsAppPhone(value)
  if (!phone) return ''
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${query}`
}

export const mapsHref = (value) => value
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
  : ''

export const externalHref = (value) => {
  try {
    const url = new URL(String(value || ''))
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

const hexToRgb = (value) => {
  const hex = String(value || '').trim().replace('#', '')
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return null
  const normalized = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex
  return [0, 2, 4].map(index => Number.parseInt(normalized.slice(index, index + 2), 16))
}

const mix = (rgb, target, amount) => rgb.map((value, index) => Math.round(value + (target[index] - value) * amount))
const rgbString = (rgb) => rgb.join(', ')
const luminance = (rgb) => rgb.map(value => {
  const channel = value / 255
  return channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
}).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)

/** Safe, accessible CSS variables from a clinic-configured hex brand colour. */
export const clinicBrandTokens = (value) => {
  const rgb = hexToRgb(value) || [23, 99, 141]
  const foreground = luminance(rgb) > .42 ? [15, 35, 52] : [255, 255, 255]
  return {
    '--clinic-primary': `rgb(${rgbString(rgb)})`,
    '--clinic-primary-hover': `rgb(${rgbString(mix(rgb, [0, 0, 0], .14))})`,
    '--clinic-primary-subtle': `rgb(${rgbString(mix(rgb, [255, 255, 255], .91))})`,
    '--clinic-primary-foreground': `rgb(${rgbString(foreground)})`,
  }
}

export const downloadCalendar = ({ title, date, time, description = '', location = '' }) => {
  if (!date) return false
  const start = `${date.replaceAll('-', '')}T${(time || '09:00').replace(':', '').padEnd(4, '0')}00`
  const escape = (text) => String(text).replace(/[\\,;\n]/g, match => ({ '\\': '\\\\', ',': '\\,', ';': '\\;', '\n': '\\n' })[match])
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${start}`, `SUMMARY:${escape(title)}`,
    description && `DESCRIPTION:${escape(description)}`, location && `LOCATION:${escape(location)}`, 'END:VEVENT', 'END:VCALENDAR']
    .filter(Boolean).join('\r\n')
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'clinic-appointment.ics'
  anchor.click()
  URL.revokeObjectURL(url)
  return true
}
