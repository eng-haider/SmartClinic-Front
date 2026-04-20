import api from './api'

export const caseService = {
  async getByPatient(patientId, params = {}) {
    return api.get('/cases', {
      params: {
        'filter[patient_id]': patientId,
        include: 'category,status,doctor,bills,ophthalmologyEncounterDetails',
        sort: '-created_at',
        ...params,
      },
    })
  },

  async create(data) {
    return api.post('/cases', data)
  },

  async update(id, data) {
    return api.put(`/cases/${id}`, data)
  },

  async delete(id) {
    return api.delete(`/cases/${id}`)
  },
}
