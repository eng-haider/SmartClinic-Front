/**
 * Permission Change Notifier
 * Detects when user permissions change and notifies user
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/authNew'

let previousPermissions = []
let notificationCallback = null

/**
 * Setup permission change detection
 * @param {Function} onPermissionChange - Callback when permissions change
 */
export function setupPermissionWatcher(onPermissionChange) {
  const authStore = useAuthStore()
  notificationCallback = onPermissionChange
  
  // Watch for permission changes
  watch(() => authStore.userPermissions, (newPermissions, oldPermissions) => {
    if (!oldPermissions || oldPermissions.length === 0) {
      // First load, just store them
      previousPermissions = [...newPermissions]
      return
    }
    
    // Check if permissions actually changed
    const added = newPermissions.filter(p => !oldPermissions.includes(p))
    const removed = oldPermissions.filter(p => !newPermissions.includes(p))
    
    if (added.length > 0 || removed.length > 0) {
      console.log('🔔 Permissions changed!', {
        added,
        removed,
        current: newPermissions
      })
      
      // Store new permissions
      previousPermissions = [...newPermissions]
      
      // Notify callback
      if (notificationCallback) {
        notificationCallback({
          added,
          removed,
          current: newPermissions
        })
      }
    }
  }, { deep: true })
}

/**
 * Compare permissions and get differences
 */
export function comparePermissions(oldPerms, newPerms) {
  const added = newPerms.filter(p => !oldPerms.includes(p))
  const removed = oldPerms.filter(p => !newPerms.includes(p))
  const unchanged = newPerms.filter(p => oldPerms.includes(p))
  
  return {
    added,
    removed,
    unchanged,
    hasChanges: added.length > 0 || removed.length > 0
  }
}
