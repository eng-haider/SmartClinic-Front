import { ref } from 'vue'

// This belongs to the device, not to the clinic. A doctor can use the compact
// V4 chart on a phone while the reception iPad uses the detailed chart.
export const DENTAL_CHART_PREFERENCE_KEY = 'dental_chart_type'

export const DENTAL_CHART_TYPES = Object.freeze({
  automatic: 'automatic',
  v4: 'v4',
  modern: 'modern'
})

const validTypes = new Set(Object.values(DENTAL_CHART_TYPES))

function normalizeChartType(value) {
  return validTypes.has(value) ? value : DENTAL_CHART_TYPES.automatic
}

function readChartType() {
  if (typeof window === 'undefined') return DENTAL_CHART_TYPES.automatic

  try {
    return normalizeChartType(window.localStorage.getItem(DENTAL_CHART_PREFERENCE_KEY))
  } catch {
    return DENTAL_CHART_TYPES.automatic
  }
}

const dentalChartType = ref(readChartType())

export function useDentalChartPreference() {
  const setDentalChartType = (type) => {
    const value = normalizeChartType(type)
    dentalChartType.value = value

    try {
      window.localStorage.setItem(DENTAL_CHART_PREFERENCE_KEY, value)
    } catch {
      // The chart still changes for the open page if browser storage is full
      // or disabled; it simply cannot survive a refresh in that browser.
    }
  }

  // Automatic keeps V4 on phones and uses the detailed chart on an iPad or
  // wider screen. The explicit choices override that responsive default.
  const usesModernDentalChart = (isPhone) => {
    if (dentalChartType.value === DENTAL_CHART_TYPES.v4) return false
    if (dentalChartType.value === DENTAL_CHART_TYPES.modern) return true
    return !isPhone
  }

  return {
    dentalChartType,
    setDentalChartType,
    usesModernDentalChart
  }
}
