<template>
  <!-- One case can cover several teeth (saved as a JSON list in tooth_num) -->
  <v-autocomplete
    v-if="showToothField"
    v-model="selectedTeeth"
    :items="toothItems"
    :label="$t('patients.toothNumber') + (toothFieldRequired ? ' *' : '')"
    :rules="toothFieldRequired ? [v => (Array.isArray(v) && v.length > 0) || $t('validation.required')] : []"
    multiple
    chips
    closable-chips
    variant="outlined"
    density="comfortable"
    class="mb-3"
    prepend-inner-icon="mdi-tooth"
    :hint="$t('teeth.multiToothHint')"
    persistent-hint
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClinicSettings } from '@/composables/useClinicSettings'
import { parseToothNumbers, serializeToothNumbers } from '@/components/teeth/toothNotation'

const props = defineProps({
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

const { t } = useI18n()
const { formatToothLabel } = useClinicSettings()

// FDI numbers per quadrant: 8 permanent teeth, 5 baby teeth
const quadrantTeeth = (quadrants, count) =>
  quadrants.flatMap(q => Array.from({ length: count }, (_, i) => q * 10 + i + 1))

const toothItems = computed(() => [
  { type: 'subheader', title: t('teeth.permanent') },
  ...quadrantTeeth([1, 2, 3, 4], 8).map(n => ({ title: formatToothLabel(n), value: n })),
  { type: 'subheader', title: t('teeth.baby') },
  ...quadrantTeeth([5, 6, 7, 8], 5).map(n => ({ title: formatToothLabel(n), value: n }))
])

// The form keeps tooth_num as the stored string; it is only rewritten when the
// selection changes, so editing other fields leaves an old free-text value alone.
const selectedTeeth = computed({
  get: () => parseToothNumbers(props.modelValue.tooth_num),
  set: (teeth) => {
    props.modelValue.tooth_num = serializeToothNumbers(teeth) ?? ''
  }
})
</script>
