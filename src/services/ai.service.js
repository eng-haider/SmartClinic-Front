import api from './api'

class AIService {
  /**
   * Send a question to the RAG-powered AI chatbot.
   * POST /tenant/ai/chat
   * @param {string} question - The user's question
   * @returns {Promise<{success: boolean, question: string, answer: string, sources: Array, answered_at: string}>}
   */
  async chat(question) {
    const response = await api.post('/ai/chat', { question })
    return response
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
