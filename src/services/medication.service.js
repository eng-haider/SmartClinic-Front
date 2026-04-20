import api from './api'

const MedicationService = {
  async getAll(params = {}) {
    const res = await api.get('/medications', { params })
    return res?.data?.data ?? res?.data ?? res
  },

  async create(name) {
    const res = await api.post('/medications', { name })
    return { status: res.status ?? 201, data: res?.data ?? res }
  },

  async remove(id) {
    await api.delete(`/medications/${id}`)
  },
}

export default MedicationService
