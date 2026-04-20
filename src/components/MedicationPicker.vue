<template>
  <v-combobox
    v-model="internalValue"
    :items="suggestions"
    :loading="searching"
    item-title="name"
    item-value="name"
    :return-object="false"
    :label="label"
    :placeholder="placeholder"
    variant="outlined"
    density="compact"
    prepend-inner-icon="mdi-pill"
    clearable
    no-filter
    v-bind="$attrs"
    @click="loadAll"
    @update:search="onSearch"
    @update:model-value="onSelect"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps" :title="item.raw.name ?? item.raw">
        <template #append>
          <v-icon size="14" color="success" class="ms-2">mdi-check-circle-outline</v-icon>
        </template>
      </v-list-item>
    </template>

    <template #append-inner>
      <v-tooltip v-if="isSaved" location="top">
        <template #activator="{ props: tip }">
          <v-icon v-bind="tip" size="16" color="success">mdi-check-circle</v-icon>
        </template>
        مخزّن في مكتبة العيادة
      </v-tooltip>
    </template>
  </v-combobox>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import MedicationService from '@/services/medication.service'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:       { type: String, default: 'اسم الدواء' },
  placeholder: { type: String, default: 'اختر أو اكتب اسم الدواء…' },
})

const emit = defineEmits(['update:modelValue'])

const suggestions  = ref([])
const searching    = ref(false)
let   searchTimer  = null

const internalValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', typeof v === 'object' ? v?.name ?? '' : v ?? ''),
})

const isSaved = computed(() =>
  !!props.modelValue &&
  suggestions.value.some(
    s => (s.name ?? s).toLowerCase() === props.modelValue.toLowerCase()
  )
)

const loadAll = async () => {
  if (suggestions.value.length > 0) return
  searching.value = true
  try {
    const data = await MedicationService.getAll()
    suggestions.value = Array.isArray(data) ? data : []
  } catch {
    suggestions.value = []
  } finally {
    searching.value = false
  }
}

const onSearch = (val) => {
  clearTimeout(searchTimer)
  if (!val || val.length < 1) {
    loadAll()
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const data = await MedicationService.getAll({ search: val })
      suggestions.value = Array.isArray(data) ? data : []
    } catch {
      suggestions.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

const onSelect = (val) => {
  const name = typeof val === 'object' ? val?.name ?? '' : val ?? ''
  emit('update:modelValue', name)
}

onMounted(() => {
  loadAll()
})

// Pre-load suggestions when a value is already set (edit mode)
watch(() => props.modelValue, (v) => {
  if (v && suggestions.value.length === 0) onSearch(v)
}, { immediate: true })
</script>
