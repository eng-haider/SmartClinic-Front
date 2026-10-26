/**
 * Shared date-range state for Reports pages: quick tabs (today/week/month/year) +
 * custom range, persisted per report so switching pages remembers the
 * filter. Mirrors the date math already used by useDashboard.js but adds
 * week/year quick tabs and a `period` (preset key) so pages/exports can tell
 * "this month" from a custom range with the same day span.
 */
import { computed, reactive, ref } from 'vue'
import { toDateInput } from '@/utils/reportFormatters'

export const PRESETS = ['today', 'week', 'month', 'year', 'custom']

function startOfWeek(date) {
  // Saturday-start week (common regional convention); adjust here only if
  // the clinic's locale needs a different week start.
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday .. 6 = Saturday
  const diff = (day + 1) % 7 // days since last Saturday
  d.setDate(d.getDate() - diff)
  return d
}

function computeRange(preset) {
  const today = new Date()
  if (preset === 'today') {
    return { from: toDateInput(today), to: toDateInput(today) }
  }
  if (preset === 'week') {
    return { from: toDateInput(startOfWeek(today)), to: toDateInput(today) }
  }
  if (preset === 'year') {
    return { from: toDateInput(new Date(today.getFullYear(), 0, 1)), to: toDateInput(today) }
  }
  // month (default)
  return { from: toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)), to: toDateInput(today) }
}

export function useReportDateRange(storageKey, defaultPreset = 'month') {
  const initialRange = computeRange(defaultPreset)
  const period = ref(defaultPreset)
  const range = reactive({ from: initialRange.from, to: initialRange.to })

  function persist() {
    try {
      localStorage.setItem(`report_range_${storageKey}`, JSON.stringify({ period: period.value, from: range.from, to: range.to }))
    } catch {
      // localStorage unavailable (private mode) — filters just won't persist.
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(`report_range_${storageKey}`)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved?.from && saved?.to) {
        period.value = PRESETS.includes(saved.period) ? saved.period : 'custom'
        // Quick presets are relative to the current date, so recompute them
        // instead of restoring stale dates (e.g. "today" saved yesterday).
        const restored = period.value === 'custom' ? saved : computeRange(period.value)
        range.from = restored.from
        range.to = restored.to
      }
    } catch {
      // Corrupt/absent cache — fall back to the computed default silently.
    }
  }

  function setPreset(preset) {
    period.value = preset
    if (preset !== 'custom') {
      const computed = computeRange(preset)
      range.from = computed.from
      range.to = computed.to
    }
    persist()
  }

  function setCustomRange(from, to) {
    period.value = 'custom'
    range.from = from
    range.to = to
    persist()
  }

  // Human-readable label for the header ("1 Sep – 24 Sep 2026", or
  // "24 Sep 2026" for a single day).
  const rangeLabel = computed(() => {
    const from = new Date(range.from)
    const to = new Date(range.to)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return ''
    if (range.from === range.to) {
      return to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    const fromLabel = from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const toLabel = to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${fromLabel} – ${toLabel}`
  })

  // day/week/month grouping the trend endpoints expect for the active preset.
  const trendPeriod = computed(() => {
    if (period.value === 'year') return 'month'
    if (period.value === 'today') return 'day'
    if (period.value === 'week') return 'day'
    if (period.value === 'month') return 'day'
    // custom: pick a sensible granularity from the span length
    const days = (new Date(range.to) - new Date(range.from)) / 86400000
    if (days > 400) return 'month'
    if (days > 60) return 'week'
    return 'day'
  })

  restore()

  return { period, range, rangeLabel, trendPeriod, setPreset, setCustomRange, restore }
}
