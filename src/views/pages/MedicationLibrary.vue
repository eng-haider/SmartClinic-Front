<template>
  <div class="medications-page" dir="rtl">

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold text-primary">مكتبة الأدوية</h1>
        <p class="text-grey text-body-2 mt-1">قائمة الأدوية المحفوظة للعيادة — تُستخدم عند كتابة الوصفات</p>
      </div>
      <v-btn color="primary" variant="elevated" prepend-icon="mdi-plus" @click="addDialog = true">
        إضافة دواء
      </v-btn>
    </div>

    <!-- Search -->
    <v-text-field
      v-model="search"
      placeholder="بحث عن دواء…"
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      class="mb-4"
      style="max-width:400px"
      @update:model-value="onSearchChange"
    />

    <!-- Loading skeletons -->
    <div v-if="loading" class="d-flex flex-column gap-3">
      <v-skeleton-loader v-for="i in 6" :key="i" type="list-item" rounded="lg" />
    </div>

    <!-- List -->
    <v-card v-else-if="medications.length" variant="outlined" rounded="xl">
      <v-list lines="one">
        <template v-for="(med, i) in medications" :key="med.id">
          <v-list-item :title="med.name" class="med-row">
            <template #prepend>
              <v-avatar color="primary" variant="tonal" size="36">
                <v-icon size="18">mdi-pill</v-icon>
              </v-avatar>
            </template>
            <template #append>
              <v-btn
                icon
                size="small"
                color="error"
                variant="text"
                :loading="med._deleting"
                @click="confirmDelete(med)"
              >
                <v-icon size="18">mdi-trash-can-outline</v-icon>
              </v-btn>
            </template>
          </v-list-item>
          <v-divider v-if="i < medications.length - 1" />
        </template>
      </v-list>
    </v-card>

    <!-- Empty state -->
    <div v-else class="text-center py-16 text-grey">
      <v-icon size="64" color="grey-lighten-2">mdi-pill-off</v-icon>
      <p class="mt-3 text-body-1">لا توجد أدوية مضافة</p>
      <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" class="mt-2" @click="addDialog = true">
        إضافة أول دواء
      </v-btn>
    </div>

    <!-- ── Add Dialog ─────────────────────────────────────────── -->
    <v-dialog v-model="addDialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <div class="d-flex align-center gap-2">
            <v-icon color="white">mdi-pill</v-icon>
            <span class="text-white">إضافة دواء</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeAddDialog" />
        </v-card-title>
        <v-card-text class="pa-5">
          <v-text-field
            v-model="newMedName"
            label="اسم الدواء *"
            placeholder="مثال: أموكسيسيلين 500mg"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-pill"
            :error-messages="addError"
            autofocus
            @keyup.enter="submitAdd"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeAddDialog">إلغاء</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="addLoading"
            :disabled="!newMedName.trim()"
            @click="submitAdd"
          >
            حفظ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Delete Confirm Dialog ──────────────────────────────── -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="xl">
        <v-card-text class="pa-5 text-center">
          <v-icon size="52" color="error" class="mb-3">mdi-trash-can-outline</v-icon>
          <p class="text-body-1 font-weight-bold mb-1">حذف الدواء</p>
          <p class="text-body-2 text-grey">هل أنت متأكد من حذف <strong>{{ pendingDelete?.name }}</strong>؟</p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-center gap-2">
          <v-btn variant="tonal" @click="deleteDialog = false">إلغاء</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleteLoading" @click="executeDelete">
            حذف
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="bottom end">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" color="white" @click="snackbar.show = false">إغلاق</v-btn>
      </template>
    </v-snackbar>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MedicationService from '@/services/medication.service'

// ── State ─────────────────────────────────────────────────────
const medications  = ref([])
const loading      = ref(false)
const search       = ref('')
let   searchTimer  = null

// Add dialog
const addDialog  = ref(false)
const newMedName = ref('')
const addLoading = ref(false)
const addError   = ref('')

// Delete dialog
const deleteDialog   = ref(false)
const pendingDelete  = ref(null)
const deleteLoading  = ref(false)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })
const notify = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// ── Fetch ──────────────────────────────────────────────────────
const fetchMedications = async (q = '') => {
  loading.value = true
  try {
    const params = q ? { search: q } : {}
    medications.value = await MedicationService.getAll(params)
  } catch {
    notify('فشل تحميل قائمة الأدوية', 'error')
  } finally {
    loading.value = false
  }
}

const onSearchChange = (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchMedications(val || ''), 300)
}

// ── Add ────────────────────────────────────────────────────────
const submitAdd = async () => {
  const name = newMedName.value.trim()
  if (!name) return
  addError.value  = ''
  addLoading.value = true
  try {
    const { status, data } = await MedicationService.create(name)
    if (status === 201) {
      medications.value.unshift(data)
      notify('تمت إضافة الدواء بنجاح')
    } else {
      // 200 — already exists
      notify('الدواء موجود مسبقاً في المكتبة', 'info')
    }
    closeAddDialog()
  } catch (err) {
    const errors = err?.response?.data?.errors
    addError.value = errors?.name?.[0] || err?.response?.data?.message || 'حدث خطأ'
  } finally {
    addLoading.value = false
  }
}

const closeAddDialog = () => {
  addDialog.value  = false
  newMedName.value = ''
  addError.value   = ''
}

// ── Delete ─────────────────────────────────────────────────────
const confirmDelete = (med) => {
  pendingDelete.value = med
  deleteDialog.value  = true
}

const executeDelete = async () => {
  if (!pendingDelete.value) return
  const med = pendingDelete.value
  // Optimistic remove
  const idx = medications.value.findIndex(m => m.id === med.id)
  if (idx !== -1) medications.value.splice(idx, 1)
  deleteDialog.value  = false
  deleteLoading.value = true
  try {
    await MedicationService.remove(med.id)
    notify('تم حذف الدواء')
  } catch (err) {
    // Restore on error
    if (idx !== -1) medications.value.splice(idx, 0, med)
    const status = err?.response?.status
    if (status === 404) notify('الدواء غير موجود', 'warning')
    else notify('فشل حذف الدواء', 'error')
  } finally {
    deleteLoading.value = false
    pendingDelete.value = null
  }
}

onMounted(() => fetchMedications())
</script>

<style scoped>
.medications-page { max-width: 720px; margin: 0 auto; padding: 24px; }
.med-row { transition: background 0.15s; }
.med-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
</style>
