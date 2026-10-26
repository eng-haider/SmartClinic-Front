<template>
  <v-card variant="flat" class="report-search mb-4">
    <v-row dense align="center">
      <v-col cols="12" :sm="filters.length ? 6 : 12" :md="filters.length ? 5 : 12">
        <v-text-field
          :model-value="search"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          @update:model-value="$emit('update:search', $event)"
        />
      </v-col>
      <v-col v-for="filter in filters" :key="filter.key" cols="6" sm="3" md="2">
        <v-select
          :model-value="filter.modelValue"
          :items="filter.items"
          item-title="label"
          item-value="value"
          :label="filter.label"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="$emit('update:filter', { key: filter.key, value: $event })"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
defineProps({
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  // [{ key, label, modelValue, items: [{label, value}] }]
  filters: { type: Array, default: () => [] }
})

defineEmits(['update:search', 'update:filter'])
</script>

<style scoped>
.report-search {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  padding: 12px 16px;
}
</style>
