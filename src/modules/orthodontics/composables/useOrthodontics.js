// Whether the orthodontics module is available, and for which cases.
// The API enforces the same rules on every request - this only decides what
// to show.
import { computed } from 'vue'
import { useClinicSettings, ORTHODONTICS_ENABLED_KEY } from '@/composables/useClinicSettings'
import { useAuthStore } from '@/stores/authNew'

export const ORTHO_PERMISSIONS = { view: 'view-orthodontics', manage: 'manage-orthodontics' }

/** Category object (or case.category) -> is it flagged as orthodontic? */
export const isOrthodonticCategory = category => !!category?.is_orthodontic

export function useOrthodontics () {
  const { getSettingByKey } = useClinicSettings()
  const authStore = useAuthStore()

  const moduleEnabled = computed(() => getSettingByKey(ORTHODONTICS_ENABLED_KEY) === true)
  const canView = computed(() => authStore.hasPermission(ORTHO_PERMISSIONS.view))
  const canManage = computed(() => authStore.hasPermission(ORTHO_PERMISSIONS.manage))

  /** showOrthodontics = module on && category flagged orthodontic && allowed to view */
  const showForCategory = category => moduleEnabled.value && isOrthodonticCategory(category) && canView.value

  return { moduleEnabled, canView, canManage, showForCategory }
}

export default useOrthodontics
