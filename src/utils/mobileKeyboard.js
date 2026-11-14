/**
 * Open the on-screen keyboard for a field inside a dialog that is about to open.
 *
 * iOS (Safari and in-app web views) only shows the keyboard for a focus() made
 * while the user's tap is being handled, and a dialog's field is not on the
 * page yet at that moment. So:
 *   1. holdKeyboard() in the tap handler that opens the dialog: a hidden input
 *      takes the focus straight away, which opens the keyboard;
 *   2. releaseKeyboard(field) once the dialog shows its field: the focus moves
 *      over and the keyboard stays up.
 * On desktop this only puts the cursor in the field.
 */
let holder = null
let releaseTimer = null

export function holdKeyboard() {
  releaseKeyboard()

  holder = document.createElement('input')
  holder.type = 'text'
  holder.tabIndex = -1
  holder.setAttribute('aria-hidden', 'true')
  // Invisible and out of the layout; 16px stops iOS from zooming in on focus
  Object.assign(holder.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    fontSize: '16px',
    pointerEvents: 'none'
  })
  document.body.appendChild(holder)
  holder.focus({ preventScroll: true })

  // Never leave the keyboard up on the hidden input if no dialog takes over
  releaseTimer = setTimeout(() => releaseKeyboard(), 1500)
}

/**
 * Move the focus to `field` (an input or a Vuetify field ref) and drop the
 * hidden input. Focus moves first so the keyboard does not close in between.
 */
export function releaseKeyboard(field) {
  clearTimeout(releaseTimer)
  field?.focus?.()
  holder?.remove()
  holder = null
}
