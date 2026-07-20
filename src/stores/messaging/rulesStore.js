import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessagingApi } from '@/composables/useMessagingApi'

export const useMessagingRulesStore = defineStore('messagingRules', () => {
  const api = useMessagingApi()

  const rules = ref([])
  const templates = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const triggering = ref(false)
  const error = ref('')

  async function fetchRules() {
    loading.value = true
    error.value = ''

    try {
      const result = await api.getRules()
      rules.value = result?.data || result || []
      return rules.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTemplates() {
    try {
      const result = await api.getTemplates()
      templates.value = result?.data || result || []
      return templates.value
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function createRule(payload) {
    saving.value = true
    error.value = ''

    try {
      const result = await api.createRule(payload)
      await fetchRules()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateRule(id, payload) {
    saving.value = true
    error.value = ''

    try {
      const result = await api.updateRule(id, payload)
      await fetchRules()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  async function deleteRule(id) {
    deleting.value = true
    error.value = ''

    try {
      const result = await api.deleteRule(id)
      rules.value = rules.value.filter((item) => item.id !== id)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      deleting.value = false
    }
  }

  async function triggerRule(id, patientId, caseId, scheduledFor = null) {
    triggering.value = true
    error.value = ''

    try {
      return await api.triggerRule(id, patientId, caseId, scheduledFor)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      triggering.value = false
    }
  }

  return {
    rules,
    templates,
    loading,
    saving,
    deleting,
    triggering,
    error,
    fetchRules,
    fetchTemplates,
    createRule,
    updateRule,
    deleteRule,
    triggerRule
  }
})
