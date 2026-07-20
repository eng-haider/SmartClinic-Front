import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessagingApi } from '@/composables/useMessagingApi'

export const useMessagingSettingsStore = defineStore('messagingSettings', () => {
  const api = useMessagingApi()

  const settings = ref(null)
  const testResult = ref(null)
  const webhookInfo = ref(null)

  const loadingSettings = ref(false)
  const savingSettings = ref(false)
  const testingConnection = ref(false)
  const loadingWebhookInfo = ref(false)

  const error = ref('')

  async function fetchSettings() {
    loadingSettings.value = true
    error.value = ''

    try {
      const data = await api.getSettings()
      settings.value = data?.data || data
      return settings.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loadingSettings.value = false
    }
  }

  async function save(data) {
    savingSettings.value = true
    error.value = ''

    try {
      const result = await api.saveSettings(data)
      settings.value = result?.data || data
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      savingSettings.value = false
    }
  }

  async function testConnection(phoneId, accessToken) {
    testingConnection.value = true
    error.value = ''

    try {
      const result = await api.testConnection(phoneId, accessToken)
      testResult.value = result?.data || result
      return testResult.value
    } catch (err) {
      testResult.value = {
        success: false,
        message: err.message
      }
      error.value = err.message
      throw err
    } finally {
      testingConnection.value = false
    }
  }

  async function fetchWebhookInfo() {
    loadingWebhookInfo.value = true
    error.value = ''

    try {
      const result = await api.getWebhookInfo()
      webhookInfo.value = result?.data || result
      return webhookInfo.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loadingWebhookInfo.value = false
    }
  }

  return {
    settings,
    testResult,
    webhookInfo,
    loadingSettings,
    savingSettings,
    testingConnection,
    loadingWebhookInfo,
    error,
    fetchSettings,
    save,
    testConnection,
    fetchWebhookInfo
  }
})
