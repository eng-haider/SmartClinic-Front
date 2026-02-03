<template>
  <div class="secretaries-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('secretaries.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('secretaries.subtitle') }}</p>
        </div>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          elevation="2"
        >
          {{ $t('secretaries.add') }}
        </v-btn>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <v-card class="toolbar-card mb-6" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              :label="$t('secretaries.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <!-- Status Filter -->
          <v-col cols="6" md="3">
            <v-select
              v-model="filters.is_active"
              :label="$t('secretaries.status')"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadSecretaries"
            />
          </v-col>

          <!-- Per Page -->
          <v-col cols="6" md="3">
            <v-select
              v-model="perPage"
              :label="$t('secretaries.per_page')"
              :items="[15, 25, 50, 100]"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="loadSecretaries"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Secretaries Table -->
    <v-card elevation="2" rounded="xl">
      <!-- Loading State -->
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <!-- Error State -->
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <!-- Data Table -->
      <v-data-table-server
        v-model:items-per-page="perPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="secretaries"
        :items-length="totalSecretaries"
        :loading="loading"
        class="secretaries-table"
        density="compact"
        mobile-breakpoint="md"
        hover
        @update:page="loadSecretaries"
        @update:items-per-page="loadSecretaries"
      >
        <!-- Avatar & Name -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar :color="getAvatarColor(item.name)" size="42">
              <v-icon color="white">mdi-account-tie</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-grey">ID: {{ item.id }}</div>
            </div>
          </div>
        </template>

        <!-- Phone -->
        <template v-slot:item.phone="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="grey">mdi-phone</v-icon>
            <span dir="ltr">{{ item.phone || '-' }}</span>
          </div>
        </template>

        <!-- Permissions Count -->
        <template v-slot:item.permissions_count="{ item }">
          <v-chip
            color="info"
            size="small"
            variant="tonal"
            @click="openPermissionsDialog(item)"
          >
            <v-icon start size="14">mdi-shield-key</v-icon>
            {{ item.permissions_count || (item.all_permissions?.length || 0) }}
          </v-chip>
        </template>

        <!-- Status Badge -->
        <template v-slot:item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="flat"
            @click="toggleStatus(item)"
            style="cursor: pointer;"
          >
            <v-icon start size="14">{{ item.is_active ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
            {{ item.is_active ? $t('secretaries.active') : $t('secretaries.inactive') }}
          </v-chip>
        </template>

        <!-- Created Date -->
        <template v-slot:item.created_at="{ item }">
          <div class="text-caption">
            {{ formatDate(item.created_at) }}
          </div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-shield-key"
              size="small"
              variant="text"
              color="info"
              @click="openPermissionsDialog(item)"
            >
              <v-icon>mdi-shield-key</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('secretaries.manage_permissions') }}
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="primary"
              @click="viewSecretary(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="warning"
              @click="editSecretary(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            />
          </div>
        </template>

        <!-- Empty State -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon size="80" color="grey-lighten-2">mdi-account-tie</v-icon>
            <h3 class="text-h6 mt-4 text-grey">{{ $t('secretaries.no_secretaries') }}</h3>
            <p class="text-grey-darken-1">{{ $t('secretaries.no_secretaries_desc') }}</p>
            <v-btn
              color="primary"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openAddDialog"
            >
              {{ $t('secretaries.add_first') }}
            </v-btn>
          </div>
        </template>

        <!-- Loading Skeleton -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table-server>

      <!-- Pagination Info -->
      <v-divider />
      <div class="d-flex align-center justify-space-between pa-4">
        <div class="text-caption text-grey">
          {{ $t('secretaries.showing') }} {{ paginationInfo.from }}-{{ paginationInfo.to }} 
          {{ $t('secretaries.of') }} {{ paginationInfo.total }} {{ $t('secretaries.secretaries') }}
        </div>
      </div>
    </v-card>

    <!-- Add/Edit Secretary Dialog -->
    <v-dialog v-model="secretaryDialog" max-width="700" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">
            {{ editMode ? $t('secretaries.edit_secretary') : $t('secretaries.add_secretary') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeDialog" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="secretaryForm" @submit.prevent="saveSecretary">
            <v-row>
              <!-- Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="secretaryData.name"
                  :label="$t('secretaries.name') + ' *'"
                  :rules="[v => !!v || $t('validation.required')]"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :error-messages="formErrors.name"
                />
              </v-col>

              <!-- Phone -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="secretaryData.phone"
                  :label="$t('secretaries.phone') + ' *'"
                  :rules="[v => !!v || $t('validation.required')]"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  dir="ltr"
                  placeholder="07XXXXXXXXX"
                  :error-messages="formErrors.phone"
                />
              </v-col>

              <!-- Password (only for new secretaries or when changing) -->
              <v-col cols="12" md="6" v-if="!editMode || showPasswordField">
                <v-text-field
                  v-model="secretaryData.password"
                  :label="$t('secretaries.password') + (editMode ? '' : ' *')"
                  :rules="editMode ? [] : [v => !!v || $t('validation.required'), v => v.length >= 8 || $t('validation.minLength', { min: 8 })]"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :error-messages="formErrors.password"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>

              <!-- Change Password Toggle (edit mode only) -->
              <v-col cols="12" md="6" v-if="editMode && !showPasswordField">
                <v-btn
                  variant="outlined"
                  color="primary"
                  block
                  height="56"
                  @click="showPasswordField = true"
                >
                  <v-icon start>mdi-lock-reset</v-icon>
                  {{ $t('secretaries.change_password') }}
                </v-btn>
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="secretaryData.is_active"
                  :label="$t('secretaries.is_active')"
                  color="success"
                  hide-details
                  inset
                />
              </v-col>

              <!-- Permissions Section -->
              <v-col cols="12">
                <v-divider class="mb-4" />
                <div class="text-subtitle-1 font-weight-medium mb-3">
                  <v-icon color="primary" class="me-2">mdi-shield-key</v-icon>
                  {{ $t('secretaries.permissions') }}
                </div>
                
                <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                  {{ $t('secretaries.base_permissions_note') }}
                </v-alert>

                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                    v-for="(permissions, category) in groupedPermissions"
                    :key="category"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon :color="getCategoryColor(category)" class="me-3">
                          {{ getCategoryIcon(category) }}
                        </v-icon>
                        <span class="font-weight-medium">{{ $t(`secretaries.categories.${category}`) }}</span>
                        <v-chip size="x-small" class="ms-3" color="primary" variant="tonal">
                          {{ getSelectedCountInCategory(category, permissions) }} / {{ Object.keys(permissions).length }}
                        </v-chip>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col
                          v-for="(label, permission) in permissions"
                          :key="permission"
                          cols="12"
                          md="6"
                        >
                          <v-checkbox
                            v-model="secretaryData.permissions"
                            :label="label"
                            :value="permission"
                            color="primary"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            @click="saveSecretary"
          >
            {{ editMode ? $t('common.update') : $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Secretary Dialog -->
    <v-dialog v-model="viewDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">{{ $t('secretaries.secretary_details') }}</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="viewDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6" v-if="selectedSecretary">
          <v-row>
            <!-- Avatar -->
            <v-col cols="12" class="text-center">
              <v-avatar :color="getAvatarColor(selectedSecretary.name)" size="80">
                <v-icon color="white" size="50">mdi-account-tie</v-icon>
              </v-avatar>
              <h2 class="text-h5 mt-4">{{ selectedSecretary.name }}</h2>
              <v-chip
                :color="selectedSecretary.is_active ? 'success' : 'error'"
                size="small"
                class="mt-2"
              >
                {{ selectedSecretary.is_active ? $t('secretaries.active') : $t('secretaries.inactive') }}
              </v-chip>
            </v-col>

            <!-- Details -->
            <v-col cols="12">
              <v-list lines="two">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-identifier</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('secretaries.id') }}</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedSecretary.id }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="selectedSecretary.phone">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-phone</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('secretaries.phone') }}</v-list-item-title>
                  <v-list-item-subtitle dir="ltr">{{ selectedSecretary.phone }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-shield-account</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('secretaries.role') }}</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedSecretary.role || 'secretary' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('secretaries.created_at') }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedSecretary.created_at) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <!-- Permissions Display -->
            <v-col cols="12">
              <v-divider class="mb-4" />
              <div class="text-subtitle-1 font-weight-medium mb-3">
                <v-icon color="primary" class="me-2">mdi-shield-key</v-icon>
                {{ $t('secretaries.permissions') }}
              </div>
              
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="permission in selectedSecretary.all_permissions"
                  :key="permission"
                  size="small"
                  :color="isBasePermission(permission) ? 'grey' : 'primary'"
                  variant="tonal"
                >
                  <v-icon start size="14" v-if="isBasePermission(permission)">mdi-lock</v-icon>
                  {{ permission }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn
            variant="outlined"
            color="warning"
            prepend-icon="mdi-pencil"
            @click="editFromView"
          >
            {{ $t('common.edit') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Permissions Only Dialog -->
    <v-dialog v-model="permissionsDialog" max-width="700" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-info">
          <div class="d-flex align-center text-white">
            <v-icon class="me-2">mdi-shield-key</v-icon>
            <span>{{ $t('secretaries.manage_permissions') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="permissionsDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6" v-if="selectedSecretaryForPermissions">
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="font-weight-medium">{{ selectedSecretaryForPermissions.name }}</div>
            <div class="text-caption">{{ $t('secretaries.base_permissions_note') }}</div>
          </v-alert>

          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(permissions, category) in groupedPermissions"
              :key="category"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon :color="getCategoryColor(category)" class="me-3">
                    {{ getCategoryIcon(category) }}
                  </v-icon>
                  <span class="font-weight-medium">{{ $t(`secretaries.categories.${category}`) }}</span>
                  <v-chip size="x-small" class="ms-3" color="primary" variant="tonal">
                    {{ getSelectedCountInCategoryForPermissions(category, permissions) }} / {{ Object.keys(permissions).length }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col
                    v-for="(label, permission) in permissions"
                    :key="permission"
                    cols="12"
                    md="6"
                  >
                    <v-checkbox
                      v-model="permissionsData"
                      :label="label"
                      :value="permission"
                      color="primary"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="permissionsDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="info"
            variant="elevated"
            :loading="savingPermissions"
            @click="savePermissions"
          >
            {{ $t('secretaries.save_permissions') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">
          {{ $t('secretaries.delete_secretary') }}
        </v-card-title>
        <v-card-text>
          {{ $t('secretaries.delete_confirm') }}
          <strong>{{ secretaryToDelete?.name }}</strong>?
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleting"
            @click="deleteSecretary"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SecretaryService from '@/services/secretary.service'

// ==================== Composables ====================
const { t } = useI18n()

// ==================== State ====================
const secretaries = ref([])
const loading = ref(false)
const saving = ref(false)
const savingPermissions = ref(false)
const deleting = ref(false)
const error = ref('')
const search = ref('')
const perPage = ref(15)
const currentPage = ref(1)
const totalSecretaries = ref(0)

// Dialogs
const secretaryDialog = ref(false)
const viewDialog = ref(false)
const deleteDialog = ref(false)
const permissionsDialog = ref(false)
const editMode = ref(false)
const selectedSecretary = ref(null)
const secretaryToDelete = ref(null)
const selectedSecretaryForPermissions = ref(null)

// Password
const showPassword = ref(false)
const showPasswordField = ref(false)

// Permissions
const groupedPermissions = ref({})
const baseRolePermissions = ref(['view-own-clinic', 'view-notes'])
const permissionsData = ref([])

// Filters
const filters = reactive({
  is_active: null
})

// Form Data
const secretaryData = reactive({
  name: '',
  phone: '',
  password: '',
  is_active: true,
  permissions: []
})

const formErrors = reactive({})
const secretaryForm = ref(null)

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

// ==================== Options ====================
const statusOptions = computed(() => [
  { title: t('secretaries.active'), value: true },
  { title: t('secretaries.inactive'), value: false }
])

// Table Headers
const headers = computed(() => [
  { title: t('secretaries.name'), key: 'name', sortable: false },
  { title: t('secretaries.phone'), key: 'phone', sortable: false },
  { title: t('secretaries.permissions'), key: 'permissions_count', sortable: false },
  { title: t('secretaries.status'), key: 'is_active', sortable: false },
  { title: t('secretaries.created_at'), key: 'created_at', sortable: false },
  { title: t('secretaries.actions'), key: 'actions', sortable: false, align: 'center' }
])

// Pagination Info
const paginationInfo = computed(() => ({
  from: totalSecretaries.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1,
  to: Math.min(currentPage.value * perPage.value, totalSecretaries.value),
  total: totalSecretaries.value
}))

// ==================== Methods ====================

// Debounced Search
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadSecretaries()
  }, 500)
}

// Load Secretaries
async function loadSecretaries() {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value
    }

    if (search.value) {
      params.search = search.value
    }

    if (filters.is_active !== null && filters.is_active !== undefined) {
      params.is_active = filters.is_active
    }

    const response = await SecretaryService.getAll(params)
    
    secretaries.value = response.data || []
    totalSecretaries.value = response.pagination?.total || response.meta?.total || 0
    
  } catch (err) {
    console.error('Failed to load secretaries:', err)
    error.value = t('secretaries.load_error')
  } finally {
    loading.value = false
  }
}

// Load Available Permissions
async function loadAvailablePermissions() {
  try {
    const response = await SecretaryService.getAvailablePermissions()
    
    if (response.data) {
      // Get grouped permissions from API and translate them
      const apiGroupedPermissions = response.data.grouped_permissions || {}
      const translatedPermissions = {}
      
      // Translate each category and its permissions
      Object.keys(apiGroupedPermissions).forEach(category => {
        translatedPermissions[category] = {}
        Object.keys(apiGroupedPermissions[category]).forEach(permission => {
          // Translate the permission label using i18n
          const translationKey = `secretaries.permissions.${permission}`
          translatedPermissions[category][permission] = t(translationKey)
        })
      })
      
      groupedPermissions.value = translatedPermissions
      baseRolePermissions.value = response.data.base_role_permissions || ['view-own-clinic', 'view-notes']
    }
  } catch (err) {
    console.error('Failed to load permissions:', err)
  }
}

// Open Add Dialog
function openAddDialog() {
  editMode.value = false
  resetForm()
  secretaryDialog.value = true
}

// Edit Secretary
function editSecretary(secretary) {
  editMode.value = true
  selectedSecretary.value = secretary
  showPasswordField.value = false
  
  Object.assign(secretaryData, {
    name: secretary.name,
    phone: secretary.phone,
    password: '',
    is_active: secretary.is_active,
    permissions: secretary.direct_permissions || []
  })
  
  secretaryDialog.value = true
}

// Edit from View Dialog
function editFromView() {
  viewDialog.value = false
  editSecretary(selectedSecretary.value)
}

// View Secretary
function viewSecretary(secretary) {
  selectedSecretary.value = secretary
  viewDialog.value = true
}

// Open Permissions Dialog
function openPermissionsDialog(secretary) {
  selectedSecretaryForPermissions.value = secretary
  permissionsData.value = secretary.direct_permissions ? [...secretary.direct_permissions] : []
  permissionsDialog.value = true
}

// Close Dialog
function closeDialog() {
  secretaryDialog.value = false
  resetForm()
}

// Reset Form
function resetForm() {
  Object.assign(secretaryData, {
    name: '',
    phone: '',
    password: '',
    is_active: true,
    permissions: []
  })
  Object.keys(formErrors).forEach(key => delete formErrors[key])
  showPassword.value = false
  showPasswordField.value = false
}

// Save Secretary
async function saveSecretary() {
  const { valid } = await secretaryForm.value.validate()
  if (!valid) return

  saving.value = true
  Object.keys(formErrors).forEach(key => delete formErrors[key])

  try {
    const payload = {
      name: secretaryData.name,
      phone: secretaryData.phone,
      is_active: secretaryData.is_active,
      permissions: secretaryData.permissions
    }

    if (!editMode.value || (editMode.value && secretaryData.password)) {
      payload.password = secretaryData.password
    }

    if (editMode.value) {
      await SecretaryService.update(selectedSecretary.value.id, payload)
      showSnackbar(t('secretaries.updated'), 'success')
    } else {
      await SecretaryService.create(payload)
      showSnackbar(t('secretaries.created'), 'success')
    }
    
    closeDialog()
    loadSecretaries()
    
  } catch (err) {
    console.error('Failed to save secretary:', err)
    
    if (err.response?.status === 422) {
      const errors = err.response.data.errors
      Object.keys(errors).forEach(key => {
        formErrors[key] = errors[key][0]
      })
    } else {
      showSnackbar(t('secretaries.save_error'), 'error')
    }
  } finally {
    saving.value = false
  }
}

// Save Permissions Only
async function savePermissions() {
  if (!selectedSecretaryForPermissions.value) return

  savingPermissions.value = true

  try {
    await SecretaryService.updatePermissions(
      selectedSecretaryForPermissions.value.id,
      permissionsData.value
    )
    
    showSnackbar(t('secretaries.permissions_updated'), 'success')
    permissionsDialog.value = false
    loadSecretaries()
    
  } catch (err) {
    console.error('Failed to update permissions:', err)
    showSnackbar(t('secretaries.permissions_error'), 'error')
  } finally {
    savingPermissions.value = false
  }
}

// Toggle Status
async function toggleStatus(secretary) {
  try {
    await SecretaryService.toggleStatus(secretary.id)
    showSnackbar(t('secretaries.status_updated'), 'success')
    loadSecretaries()
  } catch (err) {
    console.error('Failed to toggle status:', err)
    showSnackbar(t('secretaries.status_error'), 'error')
  }
}

// Confirm Delete
function confirmDelete(secretary) {
  secretaryToDelete.value = secretary
  deleteDialog.value = true
}

// Delete Secretary
async function deleteSecretary() {
  deleting.value = true

  try {
    await SecretaryService.delete(secretaryToDelete.value.id)
    
    showSnackbar(t('secretaries.deleted'), 'success')
    deleteDialog.value = false
    loadSecretaries()
    
  } catch (err) {
    console.error('Failed to delete secretary:', err)
    showSnackbar(t('secretaries.delete_error'), 'error')
  } finally {
    deleting.value = false
  }
}

// ==================== Helpers ====================

function getAvatarColor(name) {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function showSnackbar(message, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

function isBasePermission(permission) {
  return baseRolePermissions.value.includes(permission)
}

function getCategoryIcon(category) {
  const icons = {
    patients: 'mdi-account-group',
    cases: 'mdi-file-document',
    bills: 'mdi-receipt',
    reservations: 'mdi-calendar-clock',
    notes: 'mdi-note-text'
  }
  return icons[category] || 'mdi-shield-key'
}

function getCategoryColor(category) {
  const colors = {
    patients: 'primary',
    cases: 'success',
    bills: 'warning',
    reservations: 'info',
    notes: 'secondary'
  }
  return colors[category] || 'grey'
}

function getSelectedCountInCategory(category, permissions) {
  return Object.keys(permissions).filter(p => 
    secretaryData.permissions.includes(p)
  ).length
}

function getSelectedCountInCategoryForPermissions(category, permissions) {
  return Object.keys(permissions).filter(p => 
    permissionsData.value.includes(p)
  ).length
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadSecretaries()
  loadAvailablePermissions()
})
</script>

<style scoped>
.secretaries-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.toolbar-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.secretaries-table {
  min-height: 400px;
}

/* RTL Support */
[dir="rtl"] .secretaries-page {
  text-align: right;
}

/* Responsive */
@media (max-width: 960px) {
  .secretaries-page {
    padding: 16px;
  }
}
</style>
