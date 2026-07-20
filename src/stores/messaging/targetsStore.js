import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessagingApi } from '@/composables/useMessagingApi'

export const useMessagingTargetsStore = defineStore('messagingTargets', () => {
  const api = useMessagingApi()

  const targets = ref([])
  const filters = ref({
    status: '',
    patient_id: '',
    rule_id: ''
  })
  const loading = ref(false)
  const cancelling = ref(false)
  const error = ref('')

  async function fetchTargets(customFilters = null) {
    loading.value = true
    error.value = ''

    try {
      const finalFilters = customFilters || filters.value
      const normalizedFilters = Object.fromEntries(
        Object.entries(finalFilters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      )
      const result = await api.getTargets(normalizedFilters)
      targets.value = result?.data || result || []
      return targets.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelTarget(id) {
    cancelling.value = true
    error.value = ''

    try {
      const result = await api.cancelTarget(id)
      await fetchTargets()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      cancelling.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = {
      ...filters.value,
      ...newFilters
    }
  }

  return {
    targets,
    filters,
    loading,
    cancelling,
    error,
    fetchTargets,
    cancelTarget,
    setFilters
  }
})
