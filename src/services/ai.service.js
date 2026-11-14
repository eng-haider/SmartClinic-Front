import api from './api'

class AIService {
  /**
   * The clinic chatbot. POST /tenant/ai/chat
   *
   * chat('question') — one-shot answer, no conversation and no actions
   *   (used by the patient analysis drawer). Resolves to { data: { answer, sources } }.
   *
   * chat({ message, optionId, conversationId, clientMessageId, newConversation }) — the chat
   *   widget: answers questions and prepares actions (bookings, payments...) that only
   *   run after confirmAction(). Resolves to { data: { conversation_id, reply, answer } }.
   *   Resending with the same clientMessageId is safe (same answer, nothing repeated).
   */
  async chat(input) {
    if (typeof input === 'string') {
      return api.post('/ai/chat', { question: input, answer_only: true })
    }

    const { message = null, optionId = null, conversationId = null, clientMessageId = null, newConversation = false } = input || {}
    const payload = {}
    if (message) payload.message = message
    if (optionId) payload.option_id = optionId
    if (conversationId) payload.conversation_id = conversationId
    else if (newConversation) payload.new_conversation = true
    if (clientMessageId) payload.client_message_id = clientMessageId
    return api.post('/ai/chat', payload, { timeout: 45000 })
  }

  /**
   * Confirm a prepared action. Safe to call twice: the server runs it once.
   * POST /tenant/ai/chat/actions/{id}/confirm
   */
  async confirmAction(actionId, conversationId = null) {
    return api.post(`/ai/chat/actions/${actionId}/confirm`, conversationId ? { conversation_id: conversationId } : {}, { timeout: 45000 })
  }

  /**
   * Cancel a prepared action (nothing is changed).
   * POST /tenant/ai/chat/actions/{id}/cancel
   */
  async cancelAction(actionId, conversationId = null) {
    return api.post(`/ai/chat/actions/${actionId}/cancel`, conversationId ? { conversation_id: conversationId } : {})
  }

  /**
   * An action's status, e.g. after a timeout.
   * GET /tenant/ai/chat/actions/{id}
   */
  async getAction(actionId) {
    return api.get(`/ai/chat/actions/${actionId}`)
  }

  /**
   * The last 50 turns of a conversation, to show it again after a reload.
   * GET /tenant/ai/chat/conversations/{id} → { conversation_id, language, messages: [{ role, content, reply, created_at }] }
   */
  async getConversation(conversationId) {
    return api.get(`/ai/chat/conversations/${conversationId}`)
  }

  /**
   * Analyze an image using the AI vision API.
   * POST /tenant/ai/analyze-xray (JSON) — sends the image as `image_base64`.
   * @param {Object} opts
   * @param {string} opts.imageBase64      - Base64 (data URL) of the image
   * @param {number|null} [opts.patientId] - Optional patient ID
   * @param {string|null} [opts.context]   - Optional case/patient text context to consider with the image
   * @returns {Promise<{success: boolean, data: {analysis: Object, raw_response: string}}>}
   */
  async analyzeXray(opts = {}) {
    // Back-compat: allow analyzeXray(base64, patientId, context) positional calls
    if (typeof opts === 'string') {
      opts = { imageBase64: opts, patientId: arguments[1] || null, context: arguments[2] || null }
    }

    const { imageBase64 = null, patientId = null, context = null } = opts
    const payload = {
      image_base64: imageBase64
    }
    if (patientId) payload.patient_id = patientId
    // Extra clinical context so the model considers the case/patient data with the image
    if (context) payload.context = context

    const response = await api.post('/ai/analyze-xray', payload, {
      timeout: 60000
    })
    return response
  }

  /**
   * Sync all clinic database records into vector embeddings.
   * POST /tenant/ai/sync-embeddings
   * @returns {Promise<{success: boolean, message: string, stats: {patients: number, reservations: number, cases: number, bills: number}}>}
   */
  async syncEmbeddings() {
    const response = await api.post('/ai/sync-embeddings')
    return response
  }
}

export default new AIService()
