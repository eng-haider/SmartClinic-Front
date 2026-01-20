import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRtl } from 'vuetify'

export function useLanguage() {
  const { locale, t } = useI18n()
  const { isRtl: vuetifyRtl } = useRtl()

  const languages = [
    { code: 'ar', name: 'العربية', icon: 'mdi-abjad-arabic', dir: 'rtl' },
    { code: 'en', name: 'English', icon: 'mdi-alpha-e-circle', dir: 'ltr' },
    { code: 'ku', name: 'کوردی', icon: 'mdi-alpha-k-circle', dir: 'rtl' }
  ]

  const currentLanguage = computed(() => {
    return languages.find(l => l.code === locale.value) || languages[0]
  })

  const isRTL = computed(() => currentLanguage.value.dir === 'rtl')

  const changeLanguage = (code) => {
    const lang = languages.find(l => l.code === code)
    if (!lang) return

    // Update locale
    locale.value = code
    
    // Update HTML attributes
    document.documentElement.setAttribute('dir', lang.dir)
    document.documentElement.setAttribute('lang', code)
    
    // Update Vuetify RTL
    vuetifyRtl.value = lang.dir === 'rtl'
    
    // Save to localStorage
    localStorage.setItem('locale', code)
  }

  return {
    locale,
    t,
    languages,
    currentLanguage,
    isRTL,
    changeLanguage
  }
}