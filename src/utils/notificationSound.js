/**
 * Short two-tone chime for new notifications, synthesised with Web Audio (no sound file).
 *
 * Browsers only allow audio after the user interacted with the page, so the AudioContext is
 * created/resumed on the first click, tap or key press; until then play is silently skipped.
 * The listeners stay on because some browsers suspend the context again (e.g. iOS).
 */
let ctx = null
let initialized = false

function unlock() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  } catch (e) {
    // No Web Audio support: notifications simply stay silent
  }
}

export function initNotificationSound() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  ;['pointerdown', 'keydown', 'touchstart'].forEach((event) =>
    window.addEventListener(event, unlock, { passive: true })
  )
}

export function playNotificationSound() {
  if (!ctx || ctx.state !== 'running') return

  const now = ctx.currentTime
  // Two rising notes (A5 then E6), each with a quick fade in/out to avoid clicks
  ;[[880, 0], [1318.5, 0.16]].forEach(([frequency, offset]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.5)
  })
}
