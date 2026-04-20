<template>
  <v-col cols="12" md="6">
    <div class="info-item">
      <v-icon color="info" size="24">mdi-tooth</v-icon>
      <div>
        <div class="text-caption text-grey">{{ $t('cases.tooth_num') }}</div>
        <div class="font-weight-medium text-h6">{{ caseData?.tooth_num || '-' }}</div>
      </div>
    </div>
  </v-col>
</template>

<script setup>
defineProps({
  caseData: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
}
</style>
