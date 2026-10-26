/**
 * Rx template settings
 *
 * The clinic's prescription paper: the letterhead panel they upload, the paper
 * size, and how big the writing should be. Kept in localStorage — it belongs to
 * the machine that prints, not to the account — and shared as one module-level
 * object so every dialog on screen sees the same paper.
 */

import { reactive, computed } from 'vue'
import { useClinicSettings } from '@/composables/useClinicSettings'
import { DEFAULT_RX_TEMPLATE } from '@/utils/rxPaper'

const STORAGE_KEY = 'rx_paper_template'
const LEGACY_KEY = 'rx_print_settings'

// A letterhead scan is usually far bigger than it needs to be, and localStorage
// gives us ~5MB for everything. Downscale before it ever gets stored.
const MAX_IMAGE_WIDTH = 1400
const IMAGE_QUALITY = 0.85

const template = reactive({ ...DEFAULT_RX_TEMPLATE })
let loaded = false

const pickKnown = (source) => Object.fromEntries(
  Object.keys(DEFAULT_RX_TEMPLATE)
    .filter((key) => source && key in source)
    .map((key) => [key, source[key]])
)

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useRxTemplate() {
  const { clinicInfo } = useClinicSettings()

  const load = (force = false) => {
    if (loaded && !force) return template

    const stored = readJson(STORAGE_KEY)
    if (stored) {
      Object.assign(template, DEFAULT_RX_TEMPLATE, pickKnown(stored))
    } else {
      // First run on this browser: carry over whatever the old print settings
      // dialog had so the clinic's name and phone don't disappear.
      const legacy = readJson(LEGACY_KEY)
      if (legacy) {
        Object.assign(template, DEFAULT_RX_TEMPLATE, {
          clinicName: legacy.clinicName || '',
          doctorName: legacy.doctorName || '',
          specialty: legacy.specialty || '',
          phone: legacy.phone || '',
          address: legacy.address || '',
          accent: legacy.primaryColor || DEFAULT_RX_TEMPLATE.accent,
          footerNote: legacy.disclaimer || ''
        })
      }
    }

    loaded = true
    return template
  }

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...template }))
    } catch {
      // Quota — almost always an oversized letterhead. Keep the settings,
      // drop the picture, and let the caller's UI say so.
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...template, headerImage: '' }))
      } catch { /* ignore */ }
      return false
    }
    return true
  }

  const reset = () => {
    Object.assign(template, DEFAULT_RX_TEMPLATE)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  /** Read an uploaded letterhead and shrink it. Returns the data URL; the
      caller decides where to put it, so cancelling an edit changes nothing. */
  const prepareHeaderImage = (file) => new Promise((resolve, reject) => {
    if (!file) { reject(new Error('NO_FILE')); return }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('READ_FAILED'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('DECODE_FAILED'))
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        // Letterheads are printed on white; flatten transparency so a PNG with
        // an alpha channel doesn't come out black once it's JPEG.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })

  /**
   * A detached copy to edit. Blank identity fields come pre-filled from the
   * clinic settings, so the form shows what the paper actually prints today
   * instead of empty boxes the user has to guess at.
   */
  const makeDraft = () => ({ ...DEFAULT_RX_TEMPLATE, ...template, ...resolvedIdentity() })

  const resolvedIdentity = () => {
    const clinic = clinicInfo.value || {}
    return {
      clinicName: template.clinicName || clinic.name || '',
      phone: template.phone || clinic.phone || '',
      address: template.address || clinic.address || ''
    }
  }

  /** The template with clinic settings filling in anything left blank. */
  const resolved = computed(() => ({ ...template, ...resolvedIdentity() }))

  load()

  return { template, resolved, makeDraft, load, save, reset, prepareHeaderImage }
}
