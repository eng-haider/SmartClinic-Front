<template>
  <v-card variant="flat" class="report-empty">
    <v-icon size="48" color="grey-lighten-1">{{ icon }}</v-icon>
    <h3 class="text-subtitle-1 text-grey mt-3">{{ text || $t('reports.common.noData') }}</h3>
    <p class="text-body-2 text-grey-darken-1 mt-1">{{ hint || $t('reports.common.noDataHint') }}</p>
  </v-card>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'mdi-folder-search-outline' },
  text: { type: String, default: null },
  hint: { type: String, default: null }
})
</script>

<style scoped>
.report-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  text-align: center;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
}
</style>
