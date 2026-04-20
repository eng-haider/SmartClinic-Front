<template>
  <v-card v-if="patient" class="mb-4 ophthal-header-card" elevation="2" rounded="lg">
    <v-card-text class="pa-4">
      <div class="d-flex align-start ga-4 flex-wrap">
        <!-- Avatar -->
        <v-avatar size="80" class="d-none d-sm-flex" color="blue-lighten-4">
          <v-img v-if="patient.photo" :src="patient.photo" cover />
          <v-icon v-else size="44" color="blue-darken-1">mdi-account</v-icon>
        </v-avatar>

        <!-- Info -->
        <div class="flex-grow-1">
          <div class="d-flex align-center flex-wrap ga-2 mb-2">
            <h1 class="text-h5 font-weight-bold">{{ patient.name }}</h1>
            <v-chip
              size="small"
              :color="patient.sex === 1 ? 'blue' : 'pink'"
              variant="flat"
            >
              <v-icon start size="14">
                {{ patient.sex === 1 ? 'mdi-gender-male' : 'mdi-gender-female' }}
              </v-icon>
              {{ patient.sex === 1 ? $t('patients.male') : $t('patients.female') }}
            </v-chip>
            <v-chip size="small" color="grey" variant="outlined">
              ID: {{ patient.id }}
            </v-chip>
          </div>

          <div class="d-flex flex-wrap ga-4 text-body-2 text-grey-darken-1">
            <span v-if="patient.phone" class="d-flex align-center ga-1">
              <v-icon size="16" color="primary">mdi-phone</v-icon>
              <a :href="`tel:${patient.phone}`" class="text-decoration-none">{{ patient.phone }}</a>
            </span>
            <span v-if="patient.birth_date" class="d-flex align-center ga-1">
              <v-icon size="16" color="primary">mdi-cake-variant</v-icon>
              {{ formatDate(patient.birth_date) }} ({{ age }} {{ $t('patients.years') }})
            </span>
            <span v-if="patient.address" class="d-flex align-center ga-1">
              <v-icon size="16" color="primary">mdi-map-marker</v-icon>
              {{ patient.address }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="d-flex ga-2 flex-wrap">
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-pencil" size="small" @click="$emit('edit')">
            {{ $t('common.edit') }}
          </v-btn>
          <v-btn color="amber-darken-2" variant="tonal" prepend-icon="mdi-receipt-text" size="small" @click="$emit('bill')">
            {{ $t('bill.bill') || 'فاتورة' }}
          </v-btn>
          <v-btn color="warning" variant="tonal" prepend-icon="mdi-pill" size="small" @click="$emit('recipe')">
            {{ $t('patients.recipes') || 'وصفة' }}
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  patient: { type: Object, required: true },
})

defineEmits(['edit', 'bill', 'recipe'])

const age = computed(() => {
  if (!props.patient?.birth_date) return '—'
  const diff = Date.now() - new Date(props.patient.birth_date).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
</script>

<style scoped>
.ophthal-header-card {
  border-inline-start: 4px solid rgb(var(--v-theme-primary));
}
</style>
