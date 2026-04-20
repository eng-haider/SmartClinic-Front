<template>
  <v-text-field
    v-if="showToothField"
    v-model="modelValue.tooth_num"
    :label="$t('patients.toothNumber') + (toothFieldRequired ? ' *' : '')"
    :rules="toothFieldRequired ? [v => !!v || $t('validation.required')] : []"
    variant="outlined"
    density="comfortable"
    class="mb-3"
    prepend-inner-icon="mdi-tooth"
    :hint="toothFieldRequired ? ($t('patients.toothNumberRequired') || 'Tooth number is required for this procedure') : ''"
    persistent-hint
  />
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  showToothField: {
    type: Boolean,
    default: true
  },
  toothFieldRequired: {
    type: Boolean,
    default: false
  }
})
</script>
