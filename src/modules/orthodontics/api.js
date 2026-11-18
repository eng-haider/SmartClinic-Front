// Orthodontics module API client. Every call goes through the app's axios
// client (JWT + clinic headers); images, models and DICOM are downloaded as
// authenticated blobs - there are no public file URLs.
import api from '@/services/api'
import { orthoLang, ot } from './i18n.js'

const base = caseId => `/cases/${caseId}/orthodontics`
const multipart = onProgress => ({
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 0,
  onUploadProgress: evt => onProgress?.(evt.total ? evt.loaded / evt.total : 0)
})

export const orthoApi = {
  overview: caseId => api.get(base(caseId)),
  report: (caseId, params = {}) => api.get(`${base(caseId)}/report`, { params }),

  files: (caseId, kind) => api.get(`${base(caseId)}/files`, { params: kind ? { kind } : {} }),
  uploadFile (caseId, { file, kind, label, capturedAt }, onProgress) {
    const fd = new FormData()
    fd.append('kind', kind)
    fd.append('file', file)
    if (label) fd.append('label', label)
    if (capturedAt) fd.append('captured_at', capturedAt)
    return api.post(`${base(caseId)}/files`, fd, multipart(onProgress))
  },
  /** Original bytes as a Blob (images, STL/PLY/OBJ). */
  fileContent: (caseId, fileId, onProgress) => api.get(`${base(caseId)}/files/${fileId}/content`, {
    responseType: 'blob',
    timeout: 0,
    onDownloadProgress: evt => onProgress?.(evt.total ? evt.loaded / evt.total : 0)
  }),
  updateFile: (caseId, fileId, data) => api.patch(`${base(caseId)}/files/${fileId}`, data),
  deleteFile: (caseId, fileId) => api.delete(`${base(caseId)}/files/${fileId}`),
  detectLandmarks: (caseId, fileId) => api.post(`${base(caseId)}/files/${fileId}/detect-landmarks`, {}, { timeout: 120000 }),

  analyses: (caseId, type, withData = false) => api.get(`${base(caseId)}/analyses`, { params: { type, with_data: withData ? 1 : undefined } }),
  analysis: (caseId, id) => api.get(`${base(caseId)}/analyses/${id}`),
  createAnalysis: (caseId, payload) => api.post(`${base(caseId)}/analyses`, payload),
  updateAnalysis: (caseId, id, payload) => api.put(`${base(caseId)}/analyses/${id}`, payload),
  reviewAnalysis: (caseId, id, reviewed) => api.post(`${base(caseId)}/analyses/${id}/review`, { reviewed }),
  deleteAnalysis: (caseId, id) => api.delete(`${base(caseId)}/analyses/${id}`),
  revisions: (caseId, id) => api.get(`${base(caseId)}/analyses/${id}/revisions`),
  revision: (caseId, id, rev) => api.get(`${base(caseId)}/analyses/${id}/revisions/${rev}`),
  compute: (caseId, type, data) => api.post(`${base(caseId)}/analyses/compute`, { type, data }),

  cbctStudies: caseId => api.get(`${base(caseId)}/cbct`),
  cbctStudy: (caseId, id) => api.get(`${base(caseId)}/cbct/${id}`),
  createCbctStudy: (caseId, description) => api.post(`${base(caseId)}/cbct`, { description }),
  uploadCbctBatch (caseId, studyId, files, onProgress) {
    const fd = new FormData()
    files.forEach(f => fd.append('files[]', f, f.name))
    return api.post(`${base(caseId)}/cbct/${studyId}/instances`, fd, multipart(onProgress))
  },
  completeCbctStudy: (caseId, id) => api.post(`${base(caseId)}/cbct/${id}/complete`, {}, { timeout: 120000 }),
  cbctInstance: (caseId, studyId, instanceId) => api.get(`${base(caseId)}/cbct/${studyId}/instances/${instanceId}`, { responseType: 'arraybuffer', timeout: 0 }),
  saveCbctViewerState: (caseId, id, viewerState) => api.put(`${base(caseId)}/cbct/${id}/viewer-state`, { viewer_state: viewerState }),
  deleteCbctStudy: (caseId, id) => api.delete(`${base(caseId)}/cbct/${id}`),

  treatmentPlan: caseId => api.get(`${base(caseId)}/treatment-plan`),
  saveTreatmentPlan: (caseId, data) => api.put(`${base(caseId)}/treatment-plan`, data),
  treatmentPlanHistory: caseId => api.get(`${base(caseId)}/treatment-plan/history`)
}

/** The API's { message, message_ar, code } error -> one line for the user. */
export function orthoError (err, fallback = ot('common.unexpectedError')) {
  const data = jsonBody(err?.response?.data)
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  return (orthoLang() === 'ar' && data?.message_ar) || data?.message || err?.message || fallback
}

// A binary download (responseType arraybuffer) gets its JSON error as raw bytes.
function jsonBody (data) {
  if (!(data instanceof ArrayBuffer)) return data
  try {
    return JSON.parse(new TextDecoder().decode(data))
  } catch (_) {
    return null
  }
}

export default orthoApi
