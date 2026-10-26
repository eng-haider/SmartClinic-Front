import api from './api'

export const publicClinicService = {
  getBySlug(slug) {
    return api.get(`/public/clinics/${encodeURIComponent(slug)}`)
  },
}
