import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessagingApi } from '@/composables/useMessagingApi'

export const useMessagingConversationsStore = defineStore('messagingConversations', () => {
  const api = useMessagingApi()

  const conversations = ref([])
  const activeConversation = ref(null)
  const messages = ref([])

  const loadingConversations = ref(false)
  const loadingMessages = ref(false)
  const sending = ref(false)
  const error = ref('')

  async function fetchConversations() {
    loadingConversations.value = true
    error.value = ''

    try {
      const result = await api.getConversations()
      conversations.value = result?.data || result || []
      return conversations.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loadingConversations.value = false
    }
  }

  async function fetchConversation(id) {
    loadingMessages.value = true
    error.value = ''

    try {
      const result = await api.getConversation(id)
      activeConversation.value = result?.data || result
      messages.value = activeConversation.value?.messages || []
      return activeConversation.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loadingMessages.value = false
    }
  }

  async function sendMessage(body) {
    if (!activeConversation.value?.id) {
      throw new Error('لا توجد محادثة نشطة')
    }

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      body,
      direction: 'outbound',
      status: 'queued',
      created_at: new Date().toISOString(),
      pending: true
    }

    messages.value.push(optimisticMessage)
    sending.value = true
    error.value = ''

    try {
      const result = await api.sendMessage(activeConversation.value.id, body)
      const sentMessage = result?.data || result

      messages.value = messages.value.map((message) =>
        message.id === optimisticMessage.id
          ? {
              ...sentMessage,
              pending: false
            }
          : message
      )

      return sentMessage
    } catch (err) {
      messages.value = messages.value.map((message) =>
        message.id === optimisticMessage.id
          ? {
              ...message,
              status: 'failed',
              error: err.message,
              pending: false
            }
          : message
      )
      error.value = err.message
      throw err
    } finally {
      sending.value = false
    }
  }

  return {
    conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    fetchConversations,
    fetchConversation,
    sendMessage
  }
})
