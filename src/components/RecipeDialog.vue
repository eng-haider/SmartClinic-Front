<template>
  <v-dialog v-model="internalDialog" max-width="900" persistent scrollable>
    <v-card rounded="xl" class="recipe-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <div class="d-flex align-center gap-2">
          <v-icon color="white">mdi-pill</v-icon>
          <span class="text-white text-h6">
            {{ isEditing ? $t('recipes.edit_recipe') : $t('recipes.add_recipe') }}
          </span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="handleClose"
        />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="recipeForm" v-model="formValid">
          <!-- Patient Info (if patient is passed) -->
          <v-alert
            v-if="patientInfo"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <div class="d-flex align-center gap-2">
              <v-icon>mdi-account</v-icon>
              <span class="font-weight-medium">{{ patientInfo.name }}</span>
              <span v-if="patientInfo.phone" class="text-caption">• {{ patientInfo.phone }}</span>
            </div>
          </v-alert>

          <!-- Patient Search (if no patient passed) -->
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
            density="comfortable"
            prepend-inner-icon="mdi-account-search"
            :rules="[rules.required]"
            class="mb-4"
            clearable
            no-filter
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar color="primary" size="40">
                    <span class="text-white">{{ getInitials(item.raw.name) }}</span>
                  </v-avatar>
                </template>
                <template v-slot:subtitle>
                  <span dir="ltr">{{ item.raw.phone }}</span>
                </template>
              </v-list-item>
            </template>
            
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-title>
                  {{ patientSearch?.length >= 3 
                    ? $t('recipes.no_patients_found') 
                    : $t('recipes.type_to_search') 
                  }}
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-autocomplete>

          <!-- Doctor Selection -->
          <v-select
            v-model="recipeData.doctors_id"
            :items="doctors"
            :label="$t('recipes.select_doctor')"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-doctor"
            :rules="[rules.required]"
            class="mb-4"
          />

          <!-- Prescription Notes -->
          <v-textarea
            v-model="recipeData.notes"
            :label="$t('recipes.prescription_notes')"
            :placeholder="$t('recipes.notes_placeholder')"
            variant="outlined"
            density="comfortable"
            rows="2"
            auto-grow
            class="mb-4"
            prepend-inner-icon="mdi-note-text"
          />

          <!-- Medications Section -->
          <v-divider class="mb-4" />
          
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-subtitle-1 font-weight-bold d-flex align-center gap-2">
              <v-icon color="primary">mdi-pill</v-icon>
              {{ $t('recipes.medications') }}
              <v-chip size="small" color="primary" variant="tonal">
                {{ recipeData.recipe_items.length }}
              </v-chip>
            </h3>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-plus"
              @click="addMedication"
            >
              {{ $t('recipes.add_medication') }}
            </v-btn>
          </div>

          <!-- Medications List -->
          <v-card
            v-for="(med, index) in recipeData.recipe_items"
            :key="index"
            variant="outlined"
            class="mb-3 medication-card"
            rounded="lg"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <v-chip size="small" color="primary" variant="flat">
                  {{ $t('recipes.medication') }} #{{ index + 1 }}
                </v-chip>
                <v-btn
                  v-if="recipeData.recipe_items.length > 1"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removeMedication(index)"
                />
              </div>

              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.medication_name"
                    :label="$t('recipes.medication_name')"
                    :placeholder="$t('recipes.medication_name_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-pill"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.dosage"
                    :label="$t('recipes.dosage')"
                    :placeholder="$t('recipes.dosage_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-scale-balance"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.frequency"
                    :label="$t('recipes.frequency')"
                    :placeholder="$t('recipes.frequency_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-clock-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.duration"
                    :label="$t('recipes.duration')"
                    :placeholder="$t('recipes.duration_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-calendar-range"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Empty State -->
          <v-alert
            v-if="recipeData.recipe_items.length === 0"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center gap-2">
              <v-icon>mdi-alert</v-icon>
              {{ $t('recipes.no_medications') }}
            </div>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleClose"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!formValid || recipeData.recipe_items.length === 0"
          @click="handleSave"
        >
          <v-icon start>mdi-content-save</v-icon>
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import RecipeService from '@/services/recipe.service'
import api from '@/services/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: Number,
    default: null
  },
  patientInfo: {
    type: Object,
    default: null
  },
  doctors: {
    type: Array,
    default: () => []
  },
  defaultDoctorId: {
    type: Number,
    default: null
  },
  recipe: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])

const { t } = useI18n()
const authStore = useAuthStore()

// Form state
const recipeForm = ref(null)
const formValid = ref(false)
const saving = ref(false)
const searchingPatients = ref(false)
const patientSearch = ref('')
const patientOptions = ref([])

// Recipe data
const recipeData = ref({
  patient: null,
  doctors_id: null,
  notes: '',
  recipe_items: [
    { medication_name: '', dosage: '', frequency: '', duration: '' }
  ]
})

// Computed
const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEditing = computed(() => !!props.recipe?.id)

// Validation rules
const rules = {
  required: v => !!v || t('validation.required')
}

// Methods
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const addMedication = () => {
  recipeData.value.recipe_items.push({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: ''
  })
}

const removeMedication = (index) => {
  recipeData.value.recipe_items.splice(index, 1)
}

const resetForm = () => {
  recipeData.value = {
    patient: null,
    doctors_id: props.defaultDoctorId || authStore.user?.id || null,
    notes: '',
    recipe_items: [
      { medication_name: '', dosage: '', frequency: '', duration: '' }
    ]
  }
}

const loadRecipeData = () => {
  if (props.recipe) {
    recipeData.value = {
      patient: props.recipe.patient || null,
      doctors_id: props.recipe.doctors_id,
      notes: props.recipe.notes || '',
      recipe_items: props.recipe.recipe_items?.length 
        ? props.recipe.recipe_items.map(item => ({
            medication_name: item.medication_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration
          }))
        : [{ medication_name: '', dosage: '', frequency: '', duration: '' }]
    }
  } else {
    resetForm()
  }
}

const searchPatients = async (search) => {
  if (!search || search.length < 3) {
    patientOptions.value = []
    return
  }

  try {
    searchingPatients.value = true
    const response = await api.get('/patients', {
      params: {
        search,
        per_page: 20
      }
    })
    patientOptions.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error searching patients:', error)
    patientOptions.value = []
  } finally {
    searchingPatients.value = false
  }
}

const handleSave = async () => {
  if (!formValid.value || recipeData.value.recipe_items.length === 0) return

  try {
    saving.value = true
    
    const payload = {
      patient_id: props.patientId || recipeData.value.patient?.id,
      doctors_id: recipeData.value.doctors_id,
      notes: recipeData.value.notes,
      recipe_items: recipeData.value.recipe_items.filter(item => 
        item.medication_name && item.dosage && item.frequency && item.duration
      )
    }

    let response
    if (isEditing.value) {
      response = await RecipeService.update(props.recipe.id, payload)
    } else {
      response = await RecipeService.create(payload)
    }

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

// Watchers
watch(patientSearch, (val) => {
  if (val && val.length >= 3) {
    searchPatients(val)
  }
})

watch(() => props.modelValue, (val) => {
  if (val) {
    loadRecipeData()
    if (props.defaultDoctorId) {
      recipeData.value.doctors_id = props.defaultDoctorId
    } else if (authStore.user?.id) {
      recipeData.value.doctors_id = authStore.user.id
    }
  }
})

watch(() => props.recipe, () => {
  if (props.modelValue) {
    loadRecipeData()
  }
})

onMounted(() => {
  if (props.modelValue) {
    loadRecipeData()
  }
})
</script>

<style scoped>
.recipe-dialog {
  font-family: 'Cairo', sans-serif;
}

.medication-card {
  transition: all 0.2s ease;
}

.medication-card:hover {
  border-color: rgb(var(--v-theme-primary));
}

/* RTL Support */
:deep(.v-input__prepend-inner) {
  margin-inline-end: 8px;
}
</style>
