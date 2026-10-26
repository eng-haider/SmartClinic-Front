/**
 * Shared doctor filter for the Reports pages.
 *
 * - Super admin / clinic super doctor / secretary: may narrow every report to
 *   one doctor. The choice is shared by all report pages for the session.
 * - Doctor: no filter. The API always scopes a doctor's reports to their own
 *   data, whatever doctor_id is sent, so the selector is hidden.
 *
 * State lives at module level (not localStorage) so every report page sees the
 * same selection, and a doctor id from another clinic can't outlive a reload.
 */
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authNew'
import DoctorService from '@/services/doctor.service'

const ADMIN_ROLES = ['super_admin', 'clinic_super_doctor', 'secretary']

const doctorId = ref(null)
const doctors = ref([])
const loadingDoctors = ref(false)
let doctorsRequest = null

export function useReportDoctorFilter() {
  const authStore = useAuthStore()

  // Mirrors DoctorFilterTrait::getReportRestrictedDoctorId on the API.
  const canFilterByDoctor = computed(
    () => ADMIN_ROLES.some((role) => authStore.hasRole(role)) || !authStore.hasRole('doctor')
  )

  // The value to send as ?doctor_id= (null = whole clinic / own data for doctors).
  const doctorParam = computed(() => (canFilterByDoctor.value ? doctorId.value : null))

  function setDoctorId(id) {
    doctorId.value = id || null
  }

  function loadDoctors() {
    if (!canFilterByDoctor.value) return Promise.resolve()
    if (doctorsRequest) return doctorsRequest

    loadingDoctors.value = true
    doctorsRequest = DoctorService.getActive()
      .then((response) => {
        doctors.value = response.data?.data || response.data || []
        // Drop a selection that no longer exists (e.g. doctor deactivated).
        if (doctorId.value && !doctors.value.some((d) => d.id === doctorId.value)) {
          doctorId.value = null
        }
      })
      .catch((e) => {
        console.error('Failed to load doctors for report filter:', e)
        doctorsRequest = null
      })
      .finally(() => {
        loadingDoctors.value = false
      })

    return doctorsRequest
  }

  return { doctorId, doctorParam, doctors, loadingDoctors, canFilterByDoctor, setDoctorId, loadDoctors }
}
