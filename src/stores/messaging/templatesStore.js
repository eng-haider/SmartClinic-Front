import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessagingApi } from '@/composables/useMessagingApi'

export const useMessagingTemplatesStore = defineStore('messagingTemplates', () => {
  const api = useMessagingApi()

  const templates = ref([])
  const preview = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const previewLoading = ref(false)
  const error = ref('')

  async function fetchTemplates() {
    loading.value = true
    error.value = ''

    try {
      const result = await api.getTemplates()
      templates.value = result?.data || result || []
      return templates.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(payload) {
    saving.value = true
    error.value = ''

    try {
      const result = await api.createTemplate(payload)
      await fetchTemplates()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateTemplate(id, payload) {
    saving.value = true
    error.value = ''

    try {
      const result = await api.updateTemplate(id, payload)
      await fetchTemplates()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  async function deleteTemplate(id) {
    deleting.value = true
    error.value = ''

    try {
      const result = await api.deleteTemplate(id)
      templates.value = templates.value.filter((item) => item.id !== id)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      deleting.value = false
    }
  }

  async function previewTemplate(id) {
    previewLoading.value = true
    error.value = ''

    try {
      const result = await api.previewTemplate(id)
      preview.value = result?.data?.preview || result?.preview || ''
      return preview.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      previewLoading.value = false
    }
  }

  return {
    templates,
    preview,
    loading,
    saving,
    deleting,
    previewLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate
  }
})
