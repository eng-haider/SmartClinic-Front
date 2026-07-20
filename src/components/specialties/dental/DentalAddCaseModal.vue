<template>
  <v-dialog v-model="isOpen" max-width="500" scrollable>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ editingCase ? $t('patients.editCase') : $t('patients.addCase') }}</span>
        <v-btn icon variant="text" @click="isOpen = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="isValid">
          <v-select
            v-model="form.category_id"
            :items="categories"
            :item-title="getCategoryItemTitle"
            item-value="id"
            :label="$t('patients.category')"
            :rules="[v => !!v || $t('validation.required')]"
            variant="outlined"
            density="comfortable"
            class="mb-3"
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

          <v-textarea
            v-model="form.description"
            :label="$t('patients.description')"
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mb-3"
          />
          <div class="price-field-wrapper mb-3">
            <label class="price-field-label">{{ $t('cases.price') }}</label>
            <div class="price-field-inner">
              <input
                class="price-native-input"
                type="text"
                inputmode="numeric"
                :value="formatNumberWithCommas(form.price)"
                @focus="onPriceFocus"
                @input="onPriceInputNative"
                @blur="onPriceBlur($event)"
              />
              <span class="price-field-suffix">IQD</span>
            </div>
          </div>
          <v-select
            v-model="form.status"
            :items="statusOptions"
            :label="$t('patients.status')"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.case_date"
            :label="$t('common.date')"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <WarehouseItemsPicker v-model="form.warehouse_items" />
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="isOpen = false" :disabled="loading">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="elevated" :loading="loading" @click="saveCase" :disabled="!isValid">{{ $t('common.save') }}</v-btn>
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
import api from '@/services/api'
import warehouseService from '@/services/warehouse.service'
import { createCaseCategory } from '@/services/caseCategory.service'
import { getDefaultCategoryType } from '@/config/specialties'
import { useAuthStore } from '@/stores/authNew'
import { PERMISSIONS } from '@/constants/permissions'
import DentalCaseForm from './DentalCaseForm.vue'
import WarehouseItemsPicker from '@/components/WarehouseItemsPicker.vue'

const { t, locale } = useI18n()
const authStore = useAuthStore()

const props = defineProps({
  modelValue: Boolean,
  patientId: [Number, String],
  editingCase: Object,
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
const isValid = ref(false)
const loading = ref(false)

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
// While true, changing the category must not overwrite the materials the user
// is already editing (e.g. the existing items prefilled when opening an edit).
const suppressKitLoad = ref(false)

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

const form = ref({
  category_id: null,
  tooth_num: '',
  description: '',
  status: 'pending',
  price: 0,
  case_date: new Date().toISOString().split('T')[0],
  warehouse_items: []
})

const statusOptions = computed(() => [
  { title: t('common.pending'), value: '2' },
  { title: t('common.completed'), value: '3' }
])

const selectedCategory = computed(() => {
  if (!form.value.category_id) return null
  return props.categories.find(c => c.id === form.value.category_id)
})

const showToothField = computed(() => {
  if (!selectedCategory.value) return false
  const requiresTooth = selectedCategory.value.requires_tooth_detection
  const isBeauty = selectedCategory.value.category_type === 'beauty'
  return requiresTooth && !isBeauty
})

watch(() => form.value.category_id, (newCategoryId) => {
  if (!newCategoryId) return
  
  const category = props.categories.find(c => c.id === newCategoryId)
  if (!category) return
  
  if (!showToothField.value) {
    form.value.tooth_num = ''
  }

  if (category.item_cost && !props.editingCase) {
    form.value.price = category.item_cost
  }

  // Pull in the category's linked materials, but not while prefilling an edit
  // (the case's own consumed items take precedence there).
  if (!suppressKitLoad.value) {
    loadCategoryKit(newCategoryId)
  }
})

const getCategoryItemTitle = (item) => {
  if (locale.value === 'ar') return item.name_ar || item.name
  return item.name_en || item.name
}

watch(isOpen, (newVal) => {
  if (newVal) {
    if (props.editingCase) {
      // Keep the existing consumed items; don't let setting category_id below
      // overwrite them with the category's default kit.
      suppressKitLoad.value = true
      form.value = {
        category_id: props.editingCase.case_categores_id || props.editingCase.category?.id,
        tooth_num: props.editingCase.tooth_num || '',
        description: props.editingCase.description || '',
        status: props.editingCase.status_id === 3 ? 'completed' : 'pending',
        price: props.editingCase.price || 0,
        case_date: props.editingCase.case_date || '',
        warehouse_items: (props.editingCase.warehouse_items || []).map(i => ({
          warehouse_item_id: i.id ?? i.warehouse_item_id,
          quantity: Number(i.quantity) || 1,
        }))
      }
      // Re-enable kit loading after the category-watcher has run for the prefill,
      // so a later manual category change still pulls in that category's kit.
      nextTick(() => { suppressKitLoad.value = false })
    } else {
      form.value = {
        category_id: null,
        tooth_num: '',
        description: '',
        status: 'pending',
        price: 0,
        case_date: new Date().toISOString().split('T')[0],
        warehouse_items: []
      }
      if (formRef.value) formRef.value.resetValidation()
    }
  }
})

const formatNumberWithCommas = (value) => {
  if (!value) return ''
  return new Intl.NumberFormat('en-US').format(value)
}

const onPriceFocus = (event) => {
  const input = event.target
  const raw = input.value.replace(/,/g, '')
  input.value = raw
  input.select()
}

const onPriceInputNative = (event) => {
  const input = event.target
  const cursorPos = input.selectionStart
  const oldVal = input.value
  const rawDigits = oldVal.replace(/[^0-9]/g, '')
  if (!rawDigits) { input.value = ''; return }
  const formatted = new Intl.NumberFormat('en-US').format(parseInt(rawDigits, 10))
  const rawBeforeCursor = oldVal.slice(0, cursorPos).replace(/,/g, '').length
  let digitCount = 0, newCursor = formatted.length
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ',') digitCount++
    if (digitCount === rawBeforeCursor) { newCursor = i + 1; break }
  }
  input.value = formatted
  input.setSelectionRange(newCursor, newCursor)
}

const onPriceBlur = (event) => {
  const raw = event.target.value.replace(/,/g, '')
  const num = parseFloat(raw)
  form.value.price = isNaN(num) ? 0 : num
  event.target.value = formatNumberWithCommas(form.value.price)
}

const saveCase = async () => {
  if (!formRef.value?.validate()) return

  try {
    loading.value = true
    const payload = {
      patient_id: props.patientId,
      case_categores_id: form.value.category_id,
      tooth_num: form.value.tooth_num || null,
      description: form.value.description,
      status_id: form.value.status === 'completed' ? 3 : 2,
      notes: form.value.description,
      price: form.value.price || null,
      case_date: form.value.case_date || new Date().toISOString().split('T')[0],
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
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.price-field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-field-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  padding-inline-start: 2px;
}

.price-field-inner {
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  padding: 10px 12px;
  gap: 8px;
  transition: border-color 0.2s;
}

.price-field-inner:focus-within {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  padding: 9px 11px;
}

.price-native-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
  text-align: start;
  min-width: 0;
}

.price-field-suffix {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  font-weight: 500;
}
</style>
