// Strings for the orthodontics module. The module follows the app language
// (vue-i18n's global locale): Arabic and Kurdish clinics get the Arabic
// strings, every other language gets English.
//
// Kept inside the module (not src/locales/*.json) so the module stays
// self-contained; the analysis/*.js files stay free of Vue so the node tests
// can import them.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import en from './locales/en.js'
import ar from './locales/ar.js'

const MESSAGES = { en, ar }
const RTL = ['ar', 'ku']

// The app's global locale ref, captured by the first component that calls
// useOrthoI18n(). Reading it inside ot() makes every render that translates
// re-run when the language changes.
let appLocale = null

const storedLocale = () => {
  try { return localStorage.getItem('locale') } catch (_) { return null }
}
const currentLocale = () => appLocale?.value || storedLocale() || 'ar'

/** 'ar' or 'en': the language the module's strings are shown in. */
export const orthoLang = () => (RTL.includes(currentLocale()) ? 'ar' : 'en')

const lookup = (lang, key) => key.split('.').reduce((o, k) => o?.[k], MESSAGES[lang])

/** Translate `key` (dot path), filling {name} placeholders from `params`. */
export function ot (key, params) {
  const value = lookup(orthoLang(), key) ?? lookup('en', key)
  if (typeof value !== 'string') return value ?? key
  return params ? value.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m)) : value
}

/** The label in the current language from an { en, ar } pair. */
export const pickLang = obj => obj?.[orthoLang()] ?? obj?.en ?? obj?.ar ?? ''

export function useOrthoI18n () {
  const { locale } = useI18n({ useScope: 'global' })
  appLocale = locale
  const isRtl = computed(() => RTL.includes(locale.value))
  return {
    t: ot,
    pick: pickLang,
    lang: computed(orthoLang),
    isRtl,
    // "Back" points toward the start of the line.
    backIcon: computed(() => (isRtl.value ? 'mdi-arrow-right' : 'mdi-arrow-left')),
    forwardIcon: computed(() => (isRtl.value ? 'mdi-chevron-left' : 'mdi-chevron-right'))
  }
}
