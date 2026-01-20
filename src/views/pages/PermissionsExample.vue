<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>{{ $t('patients.title') }}</h1>
        
        <!-- Example 1: Using v-permission directive -->
        <v-btn 
          v-permission="PERMISSIONS.CREATE_PATIENT"
          color="primary"
          @click="createPatient"
        >
          <v-icon start>mdi-plus</v-icon>
          {{ $t('patients.create') }}
        </v-btn>
        
        <!-- Example 2: Using v-permission with multiple permissions (ANY) -->
        <v-btn 
          v-permission:any="[PERMISSIONS.EDIT_PATIENT, PERMISSIONS.DELETE_PATIENT]"
          color="warning"
        >
          Manage Patient
        </v-btn>
        
        <!-- Example 3: Using v-permission with ALL modifier -->
        <v-btn 
          v-permission:all="[PERMISSIONS.EDIT_PATIENT, PERMISSIONS.DELETE_PATIENT]"
          color="error"
        >
          Full Control
        </v-btn>
        
        <!-- Example 4: Using v-role directive -->
        <v-card v-role="ROLES.SUPER_ADMIN" class="mt-4">
          <v-card-title>Admin Only Card</v-card-title>
          <v-card-text>
            This card is only visible to super admins
          </v-card-text>
        </v-card>
        
        <!-- Example 5: Using v-role with multiple roles -->
        <v-card v-role="[ROLES.SUPER_ADMIN, ROLES.CLINIC_SUPER_DOCTOR]" class="mt-4">
          <v-card-title>Admin Panel</v-card-title>
          <v-card-text>
            This is visible to super admin or clinic super doctor
          </v-card-text>
        </v-card>
        
        <!-- Example 6: Using computed permissions -->
        <v-btn 
          v-if="canCreatePatient"
          color="success"
        >
          Create (Computed)
        </v-btn>
        
        <!-- Example 7: Using composable -->
        <v-btn 
          v-if="hasPermission(PERMISSIONS.VIEW_CLINIC_PATIENTS)"
          color="info"
        >
          View Patients
        </v-btn>
        
        <!-- Example 8: Role checks -->
        <v-alert v-if="isSuperAdmin" type="warning" class="mt-4">
          You are logged in as Super Admin
        </v-alert>
        
        <v-alert v-if="isClinicSuperDoctor" type="info" class="mt-4">
          You are logged in as Clinic Super Doctor
        </v-alert>
        
        <!-- Example 9: Display user info -->
        <v-card class="mt-4">
          <v-card-title>User Information</v-card-title>
          <v-card-text>
            <p><strong>Name:</strong> {{ authStore.user?.name }}</p>
            <p><strong>Role:</strong> {{ roleName }}</p>
            <p><strong>Permissions:</strong> {{ authStore.userPermissions?.length }}</p>
            
            <v-divider class="my-4"></v-divider>
            
            <h4>All Permissions:</h4>
            <v-chip 
              v-for="perm in authStore.userPermissions" 
              :key="perm"
              class="ma-1"
              size="small"
            >
              {{ perm }}
            </v-chip>
          </v-card-text>
        </v-card>
        
        <!-- Example 10: Data table with actions based on permissions -->
        <v-data-table
          :headers="headers"
          :items="patients"
          class="mt-4"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn 
              v-permission="PERMISSIONS.EDIT_PATIENT"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editPatient(item)"
            ></v-btn>
            
            <v-btn 
              v-permission="PERMISSIONS.DELETE_PATIENT"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deletePatient(item)"
            ></v-btn>
          </template>
        </v-data-table>
        
        <!-- Example 11: Menu with permission checks -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" class="mt-4">
              Actions Menu
            </v-btn>
          </template>
          
          <v-list>
            <v-list-item 
              v-permission="PERMISSIONS.CREATE_PATIENT"
              @click="createPatient"
            >
              <v-list-item-title>Create Patient</v-list-item-title>
            </v-list-item>
            
            <v-list-item 
              v-permission="PERMISSIONS.VIEW_CLINIC_BILLS"
              @click="viewBills"
            >
              <v-list-item-title>View Bills</v-list-item-title>
            </v-list-item>
            
            <v-list-item 
              v-role="ROLES.SUPER_ADMIN"
              @click="manageSystem"
            >
              <v-list-item-title>Manage System</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authNew'
import { usePermissions } from '@/composables/usePermissions'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES, ROLE_NAMES } from '@/constants/permissions'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const authStore = useAuthStore()

// Using composable
const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSuperAdmin,
  isClinicSuperDoctor,
  isDoctor,
  isSecretary
} = usePermissions()

// Computed permission (Example 6)
const canCreatePatient = computed(() => 
  authStore.hasPermission(PERMISSIONS.CREATE_PATIENT)
)

// Role name
const roleName = computed(() => {
  if (!authStore.userRole) return 'N/A'
  return ROLE_NAMES[authStore.userRole]?.[locale.value] || authStore.userRole
})

// Sample data
const patients = ref([
  { id: 1, name: 'Ahmed Ali', phone: '0123456789' },
  { id: 2, name: 'Sara Hassan', phone: '0987654321' },
  { id: 3, name: 'Mohammed Khalil', phone: '0555555555' }
])

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Phone', key: 'phone' },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Methods
function createPatient() {
  console.log('Creating patient...')
}

function editPatient(patient) {
  console.log('Editing patient:', patient)
}

function deletePatient(patient) {
  console.log('Deleting patient:', patient)
}

function viewBills() {
  console.log('Viewing bills...')
}

function manageSystem() {
  console.log('Managing system...')
}
</script>

<style scoped>
/* Add your styles here */
</style>
