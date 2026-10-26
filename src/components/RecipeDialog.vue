<template>
  <v-dialog v-model="internalDialog" max-width="1100" persistent scrollable>
    <v-card rounded="xl" class="recipe-dialog">
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <div class="d-flex align-center gap-2">
          <v-icon color="white">mdi-pill</v-icon>
          <span class="text-white text-h6">
            {{ isEditing ? $t('recipes.edit_recipe') : $t('recipes.add_recipe') }}
          </span>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="handleClose" />
      </v-card-title>

      <v-card-text class="pa-5">
        <v-row>
          <!-- ── Write ── -->
          <v-col cols="12" md="7">
            <v-form ref="recipeForm" v-model="formValid">
              <v-alert v-if="patientInfo" type="info" variant="tonal" density="compact" class="mb-3">
                <div class="d-flex align-center gap-2">
                  <v-icon>mdi-account</v-icon>
                  <span class="font-weight-medium">{{ patientInfo.name }}</span>
                  <span v-if="patientInfo.phone" class="text-caption">• {{ patientInfo.phone }}</span>
                </div>
              </v-alert>

              <v-autocomplete
                v-if="!patientId"
                v-model="recipeData.patient"
                v-model:search="patientSearch"
                :items="patientOptions"
                :label="$t('recipes.select_patient')"
                :loading="searchingPatients"
                item-title="name"
                item-value="id"
                return-object
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-account-search"
                :rules="[rules.required]"
                class="mb-3"
                clearable
                no-filter
              >
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template #subtitle><span dir="ltr">{{ item.raw.phone }}</span></template>
                  </v-list-item>
                </template>
                <template #no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ patientSearch?.length >= 3 ? $t('recipes.no_patients_found') : $t('recipes.type_to_search') }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-autocomplete>

              <v-select
                v-model="recipeData.doctors_id"
                :items="doctors"
                :label="$t('recipes.select_doctor')"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-doctor"
                :rules="[rules.required]"
                class="mb-4"
              />

              <RxLinesEditor v-model="recipeData.lines" :placeholder="$t('rx.paper.line_placeholder')" />

              <v-textarea
                v-model="recipeData.notes"
                :label="$t('recipes.prescription_notes')"
                :placeholder="$t('recipes.notes_placeholder')"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                class="mt-4"
              />
            </v-form>
          </v-col>

          <!-- ── Paper ── -->
          <v-col cols="12" md="5">
            <RxPaper
              :template="resolved"
              :patient="paperPatient"
              :doctor-name="selectedDoctorName"
              :lines="recipeData.lines"
              :notes="recipeData.notes"
              :date="today"
              class="recipe-dialog__paper"
              @open-template="templateDialog = true"
              @error="showToast"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">{{ $t('common.cancel') }}</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!formValid || !writtenLines.length"
          prepend-icon="mdi-content-save"
          @click="handleSave"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <RxTemplateDialog v-model="templateDialog" />
    <v-snackbar v-model="toast.show" :color="toast.color" :timeout="3500">{{ toast.message }}</v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import RecipeService from '@/services/recipe.service'
import MedicationService from '@/services/medication.service'
import RxLinesEditor from '@/components/prescription/RxLinesEditor.vue'
import RxPaper from '@/components/prescription/RxPaper.vue'
import RxTemplateDialog from '@/components/prescription/RxTemplateDialog.vue'
import { useRxTemplate } from '@/composables/useRxTemplate'
import { linesFromItems, itemsFromLines, filledLines } from '@/utils/rxLines'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  patientId: { type: Number, default: null },
  patientInfo: { type: Object, default: null },
  doctors: { type: Array, default: () => [] },
  defaultDoctorId: { type: Number, default: null },
  recipe: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])

const { t, locale } = useI18n()
const authStore = useAuthStore()
const { resolved } = useRxTemplate()

const recipeForm = ref(null)
const formValid = ref(false)
const saving = ref(false)
const searchingPatients = ref(false)
const patientSearch = ref('')
const patientOptions = ref([])
const templateDialog = ref(false)
const toast = reactive({ show: false, message: '', color: 'error' })

const recipeData = ref({
  patient: null,
  doctors_id: null,
  notes: '',
  lines: ['']
})

const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEditing = computed(() => !!props.recipe?.id)
const writtenLines = computed(() => filledLines(recipeData.value.lines))

const rules = { required: v => !!v || t('validation.required') }

const selectedDoctorName = computed(() =>
  props.doctors?.find(d => d.id === recipeData.value.doctors_id)?.name || ''
)

const paperPatient = computed(() => {
  const p = props.patientInfo || recipeData.value.patient || {}
  return { name: p.name || '', age: p.age || '', phone: p.phone || '' }
})

const today = computed(() =>
  new Date().toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-GB')
)

const showToast = (message, color = 'error') => Object.assign(toast, { show: true, message, color })

const resetForm = () => {
  recipeData.value = {
    patient: null,
    doctors_id: props.defaultDoctorId || authStore.user?.id || null,
    notes: '',
    lines: ['']
  }
}

const loadRecipeData = () => {
  if (!props.recipe) { resetForm(); return }
  recipeData.value = {
    patient: props.recipe.patient || null,
    doctors_id: props.recipe.doctors_id,
    notes: props.recipe.notes || '',
    lines: linesFromItems(props.recipe.recipe_items || props.recipe.recipeItems)
  }
}

const searchPatients = async (search) => {
  if (!search || search.length < 3) { patientOptions.value = []; return }
  try {
    searchingPatients.value = true
    const isPhone = /^\d+$/.test(search.trim())
    const params = { per_page: 20 }
    params[isPhone ? 'filter[phone]' : 'filter[name]'] = search.trim()
    const response = await api.get('/patients', { params })
    patientOptions.value = response.data?.data || response.data || []
  } catch {
    patientOptions.value = []
  } finally {
    searchingPatients.value = false
  }
}

/**
 * Lines are free text, so only the opening word is a drug name worth keeping.
 * Anything with a digit is a dose, not a name.
 */
const saveNewMedications = async (lines) => {
  const names = [...new Set(
    lines
      .map(line => line.trim().split(/\s+/)[0])
      .filter(name => name.length >= 3 && !/\d/.test(name))
  )]
  await Promise.allSettled(names.map(name => MedicationService.create(name)))
}

const handleSave = async () => {
  if (!formValid.value || !writtenLines.value.length) return

  try {
    saving.value = true
    await saveNewMedications(writtenLines.value)

    const payload = {
      patient_id: props.patientId || recipeData.value.patient?.id,
      doctors_id: recipeData.value.doctors_id,
      notes: recipeData.value.notes,
      recipe_items: itemsFromLines(recipeData.value.lines)
    }

    const response = isEditing.value
      ? await RecipeService.update(props.recipe.id, payload)
      : await RecipeService.create(payload)

    emit('saved', response.data || response)
    handleClose()
  } catch (error) {
    console.error('Error saving recipe:', error)
    emit('error', error)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  resetForm()
  internalDialog.value = false
}

let patientSearchTimeout = null
watch(patientSearch, (val) => {
  clearTimeout(patientSearchTimeout)
  if (!val || val.length < 3) { patientOptions.value = []; return }
  patientSearchTimeout = setTimeout(() => searchPatients(val), 400)
})

watch(() => props.modelValue, (val) => {
  if (!val) return
  loadRecipeData()
  if (props.defaultDoctorId) {
    recipeData.value.doctors_id = props.defaultDoctorId
  } else if (!recipeData.value.doctors_id && authStore.user?.id) {
    recipeData.value.doctors_id = authStore.user.id
  }
})

watch(() => props.recipe, () => {
  if (props.modelValue) loadRecipeData()
})

onMounted(() => {
  if (props.modelValue) loadRecipeData()
})

</script>

<style scoped>
.recipe-dialog { font-family: 'Cairo', sans-serif; }

.recipe-dialog__paper :deep(.rx-paper-view__host) { zoom: 0.6; }

:deep(.v-input__prepend-inner) { margin-inline-end: 8px; }
</style>
