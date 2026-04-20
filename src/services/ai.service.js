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
   * Analyze an X-ray image using the AI vision API.
   * POST /tenant/ai/analyze-xray (JSON)
   * @param {string} imageBase64 - The base64 string of the image
   * @param {number|null} patientId - Optional patient ID
   * @returns {Promise<{success: boolean, data: {analysis: Object, raw_response: string}}>}
   */
  async analyzeXray(imageBase64, patientId = null) {
    const payload = {
      image_base64: imageBase64
    }
    if (patientId) {
      payload.patient_id = patientId
    }

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
