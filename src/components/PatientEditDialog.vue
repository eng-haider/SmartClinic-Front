<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>{{ $t('patients.editPatient') }}</span>
      <v-btn icon variant="text" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-form ref="formRef" v-model="valid" @submit.prevent="savePatient">
        <!-- Name -->
        <v-text-field
          v-model="form.name"
          :label="$t('patients.name')"
          :rules="[rules.required, rules.minLength(3), rules.maxLength(255)]"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account"
          class="mb-3"
        />

        <!-- Phone -->
        <v-text-field
          v-model="form.phone"
          :label="$t('patients.phone')"
          :rules="[rules.required, rules.phone]"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-phone"
          type="tel"
          class="mb-3"
        />

        <!-- Phone 2 -->
        <v-text-field
          v-model="form.phone2"
          :label="$t('patients.phone2')"
          :rules="[rules.phone]"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-phone-plus"
          type="tel"
          class="mb-3"
        />

        <!-- Email -->
        <v-text-field
          v-model="form.email"
          :label="$t('patients.email')"
          :rules="[rules.email]"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-email"
          type="email"
          class="mb-3"
        />

        <!-- Sex -->
        <v-radio-group
          v-model="form.sex"
          :label="$t('patients.sex')"
          inline
          class="mb-3"
        >
          <v-radio :label="$t('patients.male')" :value="1" />
          <v-radio :label="$t('patients.female')" :value="2" />
        </v-radio-group>

        <!-- Birth Date -->
        <v-text-field
          v-model="form.birth_date"
          :label="$t('patients.birthDate')"
          type="date"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-calendar"
          class="mb-3"
        />

        <!-- Address -->
        <v-text-field
          v-model="form.address"
          :label="$t('patients.address')"
          :rules="[rules.maxLength(255)]"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-map-marker"
          class="mb-3"
        />

        <!-- Systemic Conditions -->
        <v-textarea
          v-model="form.systemic_conditions"
          :label="$t('patients.systemicConditions')"
          variant="outlined"
          density="comfortable"
          rows="2"
          prepend-inner-icon="mdi-medical-bag"
          class="mb-3"
        />

        <!-- Notes -->
        <v-textarea
          v-model="form.notes"
          :label="$t('patients.notes')"
          variant="outlined"
          density="comfortable"
          rows="2"
          prepend-inner-icon="mdi-note-text"
          class="mb-3"
        />

        <!-- Credit Balance -->
        <v-text-field
          v-model.number="form.credit_balance"
          :label="$t('patients.creditBalance')"
          type="number"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-cash"
          class="mb-3"
        />
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="$emit('close')">
        {{ $t('common.cancel') }}
      </v-btn>
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!valid"
        @click="savePatient"
      >
        {{ $t('common.save') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

const props = defineProps({
  patient: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const { t } = useI18n()

// Form
const formRef = ref(null)
const valid = ref(false)
const loading = ref(false)
const form = ref({
  name: '',
  phone: '',
  phone2: '',
  email: '',
  sex: 1,
  age: null,
  birth_date: '',
  address: '',
  systemic_conditions: '',
  notes: '',
  credit_balance: 0
})

// Validation Rules
const rules = {
  required: v => !!v || t('validation.required'),
  minLength: (min) => v => !v || v.length >= min || t('validation.minLength', { min }),
  maxLength: (max) => v => !v || v.length <= max || t('validation.maxLength', { max }),
  phone: v => !v || /^[\d\s+()-]{7,20}$/.test(v) || t('validation.phone'),
  email: v => !v || /.+@.+\..+/.test(v) || t('validation.email')
}

// Initialize form with patient data
const initForm = () => {
  if (props.patient) {
    form.value = {
      name: props.patient.name || '',
      phone: props.patient.phone || '',
      phone2: props.patient.phone2 || '',
      email: props.patient.email || '',
      sex: props.patient.sex || 1,
      age: props.patient.age || null,
      birth_date: props.patient.birth_date || '',
      address: props.patient.address || '',
      systemic_conditions: props.patient.systemic_conditions || '',
      notes: props.patient.notes || '',
      credit_balance: props.patient.credit_balance || 0
    }
  }
}

// Save patient
const savePatient = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  try {
    loading.value = true
    const response = await api.put(`/patients/${props.patient.id}`, form.value)
    const updatedPatient = response.data.data || response.data
    emit('saved', { ...props.patient, ...updatedPatient })
  } catch (err) {
    console.error('Error saving patient:', err)
  } finally {
    loading.value = false
  }
}

// Watch for patient changes
watch(() => props.patient, initForm, { immediate: true })
</script>
