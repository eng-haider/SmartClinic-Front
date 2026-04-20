<template>
  <SmartTable
    :columns="columns"
    :items="cases"
    :actions="actions"
    :loading="false"
    :empty-text="$t('cases.no_cases') || 'No cases'"
    empty-icon="mdi-clipboard-text-outline"
    :sticky-header="false"
    @click:row="emit('click:row', $event)"
    @action="emit('action', $event)"
  />
</template>

<script setup>
import SmartTable from '@/components/SmartTable.vue'

defineProps({
  cases:   { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  actions: { type: Array, default: () => [] },
})

const emit = defineEmits(['click:row', 'action'])
</script>
