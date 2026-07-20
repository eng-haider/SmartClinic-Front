import axios from 'axios'
import { useAuthStore } from '@/stores/authNew'

const messagingApiClient = axios.create({
  baseURL:
    import.meta?.env?.VITE_MESSAGING_API_BASE_URL ||
    'https://api.smartclinic.software/api/tenant/messaging',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

messagingApiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token || localStorage.getItem('auth_token') || localStorage.getItem('tokinn')
    const clinicId =
      authStore.clinic?.id ||
      authStore.clinic?.clinic_id ||
      localStorage.getItem('clinic_id') ||
      localStorage.getItem('tenant_id')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (clinicId) {
      config.headers['X-Tenant-ID'] = clinicId
    }

    return config
  },
  (error) => Promise.reject(error)
)

function normalizeError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'حدث خطأ غير متوقع أثناء تنفيذ الطلب'
  )
}

export function useMessagingApi() {
  async function request(promiseFactory) {
    try {
      const response = await promiseFactory()
      return response.data
    } catch (error) {
      throw new Error(normalizeError(error))
    }
  }

  return {
    // Settings
    getSettings: () => request(() => messagingApiClient.get('/settings')),
    saveSettings: (data) => request(() => messagingApiClient.post('/settings', { ...data, provider: 'whatsapp' })),
    testConnection: (phone_id, token) =>
      request(() => messagingApiClient.post('/settings/test-connection', { 
        whatsapp_phone_number_id: phone_id, 
        whatsapp_access_token: token 
      })),
    getWebhookInfo: () => request(() => messagingApiClient.get('/settings/webhook-info')),

    // Templates
    getTemplates: () => request(() => messagingApiClient.get('/templates')),
    createTemplate: (data) => request(() => messagingApiClient.post('/templates', data)),
    updateTemplate: (id, data) => request(() => messagingApiClient.put(`/templates/${id}`, data)),
    deleteTemplate: (id) => request(() => messagingApiClient.delete(`/templates/${id}`)),
    previewTemplate: (id) => request(() => messagingApiClient.get(`/templates/${id}/preview`)),

    // Automation Rules
    getRules: () => request(() => messagingApiClient.get('/automation-rules')),
    createRule: (data) => request(() => messagingApiClient.post('/automation-rules', data)),
    updateRule: (id, data) => request(() => messagingApiClient.put(`/automation-rules/${id}`, data)),
    deleteRule: (id) => request(() => messagingApiClient.delete(`/automation-rules/${id}`)),
    triggerRule: (id, patient_id, case_id, scheduled_for = null) =>
      request(() =>
        messagingApiClient.post(`/automation-rules/${id}/trigger`, {
          patient_id,
          case_id,
          scheduled_for
        })
      ),

    // Targets
    getTargets: (filters = {}) =>
      request(() =>
        messagingApiClient.get('/automation-targets', {
          params: filters
        })
      ),
    cancelTarget: (id) => request(() => messagingApiClient.post(`/automation-targets/${id}/cancel`)),

    // Conversations
    getConversations: () => request(() => messagingApiClient.get('/conversations')),
    getConversation: (id) => request(() => messagingApiClient.get(`/conversations/${id}`)),
    sendMessage: (id, body) => request(() => messagingApiClient.post(`/conversations/${id}/send`, { body }))
  }
}
