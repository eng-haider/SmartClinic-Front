<template>
  <v-dialog v-model="isOpen" max-width="560" scrollable :fullscreen="smAndDown">
    <v-card class="add-case-card" :rounded="smAndDown ? 0 : 'lg'" @keydown.enter.ctrl.prevent="saveCase" @keydown.enter.meta.prevent="saveCase">
      <!-- Header: what is being added, at a glance -->
      <div class="add-case-header">
        <v-avatar :color="headerColor" variant="tonal" size="42" rounded="lg">
          <v-icon size="24">{{ editingCase ? 'mdi-pencil-outline' : 'mdi-tooth-outline' }}</v-icon>
        </v-avatar>
        <div class="add-case-header__text">
          <div class="text-subtitle-1 font-weight-bold">
            {{ editingCase ? $t('patients.editCase') : $t('patients.addCase') }}
          </div>
          <div v-if="selectedCategory || teethLabel" class="d-flex flex-wrap ga-1 mt-1">
            <v-chip
              v-if="selectedCategory"
              size="small"
              :color="headerColor"
              variant="flat"
              label
              prepend-icon="mdi-tag-outline"
            >
              {{ getCategoryItemTitle(selectedCategory) }}
            </v-chip>
            <v-chip v-if="teethLabel" size="small" variant="tonal" label prepend-icon="mdi-tooth">
              {{ teethLabel }}
            </v-chip>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="isOpen = false" />
      </div>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="formRef" v-model="isValid" @submit.prevent="saveCase">
          <v-select
            v-model="form.category_id"
            :items="categoryItems"
            :item-title="getCategoryItemTitle"
            item-value="id"
            :label="$t('patients.category')"
            :rules="[v => !!v || $t('validation.required')]"
            prepend-inner-icon="mdi-tag-outline"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          >
            <template #append>
              <v-btn
                v-permission="PERMISSIONS.CREATE_CASE"
                icon="mdi-plus"
                size="small"
                variant="tonal"
                color="primary"
                :title="$t('caseCategories.addCategory') || 'Add Category'"
                @click.stop="openNewCategoryDialog"
              />
            </template>
          </v-select>

          <DentalCaseForm v-model="form" :show-tooth-field="showToothField" :tooth-field-required="showToothField" />

          <v-row dense class="mb-1">
            <v-col cols="12" sm="6">
              <!-- Native input so the thousands separators don't move the cursor -->
              <div class="price-field">
                <span class="price-field__label">{{ $t('cases.price') }}</span>
                <div class="price-field__box">
                  <v-icon size="20" class="price-field__icon">mdi-cash</v-icon>
                  <input
                    class="price-field__input"
                    type="text"
                    inputmode="numeric"
                    :value="formatNumberWithCommas(form.price)"
                    @focus="onPriceFocus"
                    @input="onPriceInput"
                    @blur="onPriceBlur"
                  />
                  <span class="price-field__suffix">IQD</span>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.case_date"
                :label="$t('common.date')"
                type="date"
                variant="outlined"
                density="comfortable"
                hide-details
                class="date-field"
              />
            </v-col>
          </v-row>

          <div class="field-label mt-3">{{ $t('patients.status') }}</div>
          <v-btn-toggle
            v-model="form.status"
            mandatory
            divided
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="status-toggle mb-4"
          >
            <v-btn value="pending" :color="form.status === 'pending' ? 'warning' : undefined">
              <v-icon start>mdi-progress-clock</v-icon>
              {{ $t('common.pending') }}
            </v-btn>
            <v-btn value="completed" :color="form.status === 'completed' ? 'success' : undefined">
              <v-icon start>mdi-check-circle-outline</v-icon>
              {{ $t('common.completed') }}
            </v-btn>
          </v-btn-toggle>

          <v-textarea
            ref="notesRef"
            v-model="form.description"
            :label="$t('patients.description')"
            prepend-inner-icon="mdi-note-text-outline"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
            hide-details
            class="mb-4"
          />

          <!-- Materials stay one tap away so the main form stays short -->
          <v-expansion-panels v-model="materialsPanel" variant="accordion" class="materials-panel">
            <v-expansion-panel value="materials" elevation="0">
              <v-expansion-panel-title>
                <v-icon size="20" class="me-2" color="primary">mdi-package-variant-closed</v-icon>
                <span class="font-weight-medium">{{ $t('warehouse.materials') }}</span>
                <v-chip v-if="materialsCount" size="x-small" color="primary" variant="flat" class="ms-2">
                  {{ materialsCount }}
                </v-chip>
              </v-expansion-panel-title>
              <v-expansion-panel-text eager>
                <WarehouseItemsPicker
                  v-model="form.warehouse_items"
                  :reserved="editingCase?.warehouse_items || []"
                  hide-label
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-alert
            v-if="saveError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
            closable
            @click:close="saveError = ''"
          >
            {{ saveError }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="add-case-actions">
        <v-btn variant="text" :disabled="loading" @click="isOpen = false">{{ $t('common.cancel') }}</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          min-width="140"
          prepend-icon="mdi-check"
          :loading="loading"
          :disabled="!isValid"
          @click="saveCase"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Quick "add category" dialog, so a category can be created without leaving the patient page -->
  <v-dialog v-model="newCategoryDialog" max-width="420" persistent>
    <v-card>
      <v-card-title>{{ $t('caseCategories.addCategory') || 'Add Category' }}</v-card-title>
      <v-card-text>
        <v-form ref="newCategoryFormRef" @submit.prevent="createNewCategory">
          <v-text-field
            v-model="newCategoryName"
            :label="$t('caseCategories.categoryName') || 'Category Name'"
            :rules="[v => !!v || $t('validation.required')]"
            variant="outlined"
            density="comfortable"
            autofocus
            @keyup.enter="createNewCategory"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" :disabled="creatingCategory" @click="newCategoryDialog = false">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="elevated" :loading="creatingCategory" @click="createNewCategory">{{ $t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import api from '@/services/api'
import warehouseService from '@/services/warehouse.service'
import { createCaseCategory } from '@/services/caseCategory.service'
import { getDefaultCategoryType } from '@/config/specialties'
import { useAuthStore } from '@/stores/authNew'
import { useClinicSettings } from '@/composables/useClinicSettings'
import { PERMISSIONS } from '@/constants/permissions'
import DentalCaseForm from './DentalCaseForm.vue'
import WarehouseItemsPicker from '@/components/WarehouseItemsPicker.vue'
import { parseToothNumbers, serializeToothNumbers } from '@/components/teeth/toothNotation'
import { toDateInputValue } from '@/utils/dateInput'
import { selectableCategories } from '@/utils/caseCategories'

const { t, locale } = useI18n()
const { smAndDown } = useDisplay()
const authStore = useAuthStore()
const { formatToothLabel } = useClinicSettings()

const props = defineProps({
  modelValue: Boolean,
  patientId: [Number, String],
  editingCase: Object,
  // Prefill for a new case picked from the teeth chart / beauty chips:
  // { category, toothNumber } — toothNumber is one tooth, a list, or null.
  preset: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  },
  doctors: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'category-created'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const notesRef = ref(null)
const isValid = ref(false)
const loading = ref(false)
const saveError = ref('')
const materialsPanel = ref(null)

// Inline "add category" — lets the user create a case category without leaving
// the patient page. New categories inherit the clinic's default type (e.g.
// 'general' for non-dental clinics).
const newCategoryDialog = ref(false)
const newCategoryFormRef = ref(null)
const newCategoryName = ref('')
const creatingCategory = ref(false)

const openNewCategoryDialog = () => {
  newCategoryName.value = ''
  newCategoryDialog.value = true
}

const createNewCategory = async () => {
  const valid = await newCategoryFormRef.value?.validate()
  if (valid && valid.valid === false) return
  if (!newCategoryName.value?.trim()) return

  try {
    creatingCategory.value = true
    const response = await createCaseCategory({
      name: newCategoryName.value.trim(),
      clinic_id: authStore.user?.clinic_id || null,
      order: (props.categories?.length || 0) + 1,
      item_cost: 0,
      category_type: getDefaultCategoryType(authStore.specialty),
      without_detect_tooth: true,
    })
    const created = response?.data || response
    // Ask the parent to refresh its category list, then preselect the new one.
    emit('category-created', created)
    if (created?.id) form.value.category_id = created.id
    newCategoryDialog.value = false
  } catch (err) {
    console.error('Error creating case category:', err)
  } finally {
    creatingCategory.value = false
  }
}

// While true, a category change is a prefill (opening the dialog), not the
// user picking another category, so it must not reset price / teeth / materials.
const suppressCategoryDefaults = ref(false)

// Fetch the category's default kit and load it into the picker so the user sees
// the items linked to that case category and can tweak the quantities.
const loadCategoryKit = async (categoryId) => {
  if (!categoryId) return
  try {
    const kit = await warehouseService.getCategoryKit(categoryId)
    form.value.warehouse_items = (kit || []).map(row => ({
      warehouse_item_id: row.item?.id ?? row.warehouse_item_id,
      quantity: Number(row.quantity) || 1,
    }))
  } catch (e) {
    form.value.warehouse_items = []
  }
}

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = () => ({
  category_id: null,
  tooth_num: '',
  description: '',
  status: 'pending',
  price: 0,
  case_date: today(),
  warehouse_items: []
})

const form = ref(emptyForm())

// Inactive categories can't be picked, except the one the edited case already has.
const categoryItems = computed(() => selectableCategories(
  props.categories,
  props.editingCase?.case_categores_id || props.editingCase?.category?.id
))

const selectedCategory = computed(() => {
  if (!form.value.category_id) return null
  return props.categories.find(c => c.id === form.value.category_id)
})

const headerColor = computed(() => selectedCategory.value?.color || 'primary')

// Teeth picked on the chart before the dialog opened. Their field stays visible
// even for a category that wouldn't normally ask for a tooth (e.g. ortho), so
// the user can see — and adjust — what will be saved.
const hasPresetTeeth = ref(false)

const showToothField = computed(() => {
  if (hasPresetTeeth.value) return true
  if (!selectedCategory.value) return false
  // Coerce: an undefined here would make DentalCaseForm fall back to its
  // default (show the field).
  const requiresTooth = !!selectedCategory.value.requires_tooth_detection
  const isBeauty = selectedCategory.value.category_type === 'beauty'
  const isOrtho = !!selectedCategory.value.is_orthodontic
  return requiresTooth && !isBeauty && !isOrtho
})

const teethLabel = computed(() => {
  const teeth = parseToothNumbers(form.value.tooth_num)
  return teeth.length ? formatToothLabel(teeth) : ''
})

const materialsCount = computed(() => (form.value.warehouse_items || []).length)

watch(() => form.value.category_id, (newCategoryId) => {
  if (!newCategoryId || suppressCategoryDefaults.value) return

  const category = props.categories.find(c => c.id === newCategoryId)
  if (!category) return

  if (!showToothField.value) {
    form.value.tooth_num = ''
  }

  if (!props.editingCase) {
    form.value.price = category.item_cost || 0
  }

  loadCategoryKit(newCategoryId)
})

const getCategoryItemTitle = (item) => {
  if (locale.value === 'ar') return item.name_ar || item.name
  return item.name_en || item.name
}

// Put the cursor in the notes once the dialog has finished opening, so a case
// picked from the chart can be described straight away.
const focusNotes = () => {
  setTimeout(() => notesRef.value?.focus?.(), 250)
}

watch(isOpen, (newVal) => {
  if (!newVal) return

  saveError.value = ''
  materialsPanel.value = null
  // The prefill below sets category_id; keep the category watcher from
  // treating it as a manual change.
  suppressCategoryDefaults.value = true

  if (props.editingCase) {
    hasPresetTeeth.value = false
    form.value = {
      category_id: props.editingCase.case_categores_id || props.editingCase.category?.id,
      tooth_num: props.editingCase.tooth_num || '',
      description: props.editingCase.description || props.editingCase.notes || '',
      status: props.editingCase.status_id === 3 ? 'completed' : 'pending',
      price: props.editingCase.price || 0,
      case_date: toDateInputValue(props.editingCase.case_date || props.editingCase.created_at),
      warehouse_items: (props.editingCase.warehouse_items || []).map(i => ({
        warehouse_item_id: i.id ?? i.warehouse_item_id,
        quantity: Number(i.quantity) || 1,
      }))
    }
  } else {
    const category = props.preset?.category || null
    const teeth = serializeToothNumbers(props.preset?.toothNumber) ?? ''
    hasPresetTeeth.value = !!teeth
    form.value = {
      ...emptyForm(),
      category_id: category?.id ?? null,
      tooth_num: teeth,
      // The category's default price (set in Settings → Case Categories)
      price: category?.item_cost || 0,
    }
    if (category?.id) {
      loadCategoryKit(category.id)
      focusNotes()
    }
    formRef.value?.resetValidation()
  }

  // Re-enable category defaults after the watcher has seen the prefill, so a
  // later manual category change still pulls in that category's price and kit.
  nextTick(() => { suppressCategoryDefaults.value = false })
})

const formatNumberWithCommas = (value) => {
  if (!value) return ''
  return new Intl.NumberFormat('en-US').format(value)
}

const onPriceFocus = (event) => {
  event.target.select()
}

const onPriceInput = (event) => {
  const input = event.target
  const cursorPos = input.selectionStart
  const oldVal = input.value
  const rawDigits = oldVal.replace(/[^0-9]/g, '')
  if (!rawDigits) {
    input.value = ''
    form.value.price = 0
    return
  }
  const num = parseInt(rawDigits, 10)
  const formatted = new Intl.NumberFormat('en-US').format(num)
  const rawBeforeCursor = oldVal.slice(0, cursorPos).replace(/[^0-9]/g, '').length
  let digitCount = 0, newCursor = formatted.length
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ',') digitCount++
    if (digitCount === rawBeforeCursor) { newCursor = i + 1; break }
  }
  input.value = formatted
  input.setSelectionRange(newCursor, newCursor)
  // Keep the model in sync while typing, so Ctrl+Enter saves the typed price.
  form.value.price = num
}

const onPriceBlur = (event) => {
  event.target.value = formatNumberWithCommas(form.value.price)
}

const saveCase = async () => {
  if (loading.value) return
  const result = await formRef.value?.validate()
  if (result && result.valid === false) return

  try {
    loading.value = true
    saveError.value = ''
    const payload = {
      patient_id: props.patientId,
      case_categores_id: form.value.category_id,
      tooth_num: form.value.tooth_num || null,
      description: form.value.description,
      status_id: form.value.status === 'completed' ? 3 : 2,
      notes: form.value.description,
      price: form.value.price || null,
      case_date: form.value.case_date || today(),
      warehouse_items: form.value.warehouse_items || []
    }

    if (props.editingCase) {
      await api.put(`/cases/${props.editingCase.id}`, payload)
    } else {
      await api.post('/cases', payload)
    }

    isOpen.value = false
    emit('success')
  } catch (err) {
    console.error('Error saving dental case:', err)
    saveError.value = err.response?.data?.message || t('errors.saveFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-case-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.add-case-header__text {
  flex: 1;
  min-width: 0;
}

.add-case-actions {
  padding: 12px 16px;
}

.field-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 6px;
  padding-inline-start: 2px;
}

.status-toggle {
  width: 100%;
}

.status-toggle :deep(.v-btn) {
  flex: 1 1 0;
}

/* Price: a native input styled like an outlined Vuetify field */
.price-field {
  position: relative;
}

.price-field__label {
  position: absolute;
  top: -8px;
  inset-inline-start: 10px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  z-index: 1;
}

.price-field__box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid rgba(var(--v-border-color), 0.38);
  border-radius: 4px;
  transition: border-color 0.2s;
}

.price-field__box:hover {
  border-color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.price-field__box:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
}

.price-field__box:focus-within .price-field__icon {
  color: rgb(var(--v-theme-primary));
}

.price-field__icon {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.price-field__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  text-align: start;
}

.price-field__suffix {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.materials-panel {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
}
</style>
