export function formatWhatsAppPhone(value) {
  const rawPhone = String(value || '').trim()
  let phone = rawPhone.replace(/\D/g, '')
  if (phone.startsWith('00')) {
    phone = phone.slice(2)
  } else if (!rawPhone.startsWith('+')) {
    phone = phone.replace(/^0+/, '')
    if (phone && !phone.startsWith('964')) phone = `964${phone}`
  }
  return /^[1-9]\d{7,14}$/.test(phone) ? phone : ''
}

// Call during the button click, then open only after the server confirms success.
export function prepareWhatsAppMessage(phone, message) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  let tab = null
  let opened = false
  try {
    tab = window.open('about:blank', '_blank')
    if (tab) tab.opener = null
  } catch {
    // Browsers without popup support use the current tab after success.
  }

  return {
    open() {
      if (tab && !tab.closed) {
        try {
          tab.location.replace(url)
          opened = true
          return
        } catch {
          tab.close()
        }
      }
      window.location.assign(url)
      opened = true
    },
    cancel() {
      if (!opened && tab && !tab.closed) tab.close()
    },
  }
}
