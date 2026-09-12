<template>
  <v-data-table-server
    :page="page"
    :items-per-page="itemsPerPage"
    :sort-by="sortBy"
    :headers="headers"
    :items="items"
    :items-length="total"
    :loading="loading"
    :items-per-page-options="[10, 15, 25, 50, 100]"
    :items-per-page-text="t('bills.per_page')"
    :page-text="`${t('bills.showing')} {0}–{1} ${t('bills.of')} {2}`"
    :no-data-text="t('bills.workspace.empty_payments')"
    :loading-text="t('common.loading')"
    mobile-breakpoint="600"
    density="comfortable"
    hover
    class="payment-table"
    @update:page="$emit('update:page', $event)"
    @update:items-per-page="$emit('update:itemsPerPage', $event)"
    @update:sort-by="$emit('update:sortBy', $event)"
  >
    <template #item.id="{ item }"><span class="bill-number">#{{ item.id }}</span></template>
    <template #item.patient="{ item }">
      <div class="py-3">
        <div class="font-weight-bold">{{ item.patient?.name || '—' }}</div>
        <span class="patient-phone" dir="ltr">{{ item.patient?.phone || '—' }}</span>
      </div>
    </template>
    <template #item.category="{ item }">
      {{ item.billable?.category?.name || '—' }}
    </template>
    <template #item.price="{ item }">
      <span class="amount font-weight-bold">{{ formatCurrency(item.price) }}</span>
    </template>
    <template #item.is_paid="{ item }">
      <v-chip :color="item.is_paid ? 'success' : 'warning'" size="small" variant="tonal"
        :prepend-icon="item.is_paid ? 'mdi-check-circle-outline' : 'mdi-clock-outline'">
        {{ t(`bills.workspace.${item.is_paid ? 'paid_bill' : 'unpaid_bill'}`) }}
      </v-chip>
    </template>
    <template #item.doctor="{ item }">{{ item.doctor?.name || '—' }}</template>
    <template #item.created_at="{ item }">
      <div class="date-cell">{{ formatDate(item.created_at) }}</div>
    </template>
    <template #item.actions="{ item }">
      <div class="d-flex align-center ga-1">
        <v-btn icon="mdi-eye-outline" variant="tonal" color="primary" size="small"
          :aria-label="`${t('bills.bill_details')} #${item.id}`" @click="$emit('view', item)">
          <v-icon>mdi-eye-outline</v-icon>
          <v-tooltip activator="parent">{{ t('bills.bill_details') }}</v-tooltip>
        </v-btn>
        <v-btn v-if="allowDelete" icon="mdi-delete-outline" variant="text" color="error" size="small"
          :aria-label="`${t('common.delete')} #${item.id}`" @click="$emit('delete', item)">
          <v-icon>mdi-delete-outline</v-icon>
          <v-tooltip activator="parent">{{ t('common.delete') }}</v-tooltip>
        </v-btn>
      </div>
    </template>
    <template #no-data><slot name="empty" /></template>
    <template #loading><v-skeleton-loader type="table-row@5" /></template>
  </v-data-table-server>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: Boolean,
  page: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 15 },
  sortBy: { type: Array, default: () => [{ key: 'created_at', order: 'desc' }] },
  showPatient: { type: Boolean, default: true },
  showStatus: Boolean,
  allowDelete: Boolean,
  formatCurrency: { type: Function, required: true },
  formatDate: { type: Function, required: true }
})
defineEmits(['update:page', 'update:itemsPerPage', 'update:sortBy', 'view', 'delete'])
const { t } = useI18n()
const headers = computed(() => [
  { title: t('bills.bill_number'), key: 'id', sortable: false },
  ...(props.showPatient ? [{ title: t('bills.patient'), key: 'patient', sortable: false }] : []),
  { title: t('cases.category'), key: 'category', sortable: false },
  { title: t('bills.price'), key: 'price', sortable: true },
  ...(props.showStatus ? [{ title: t('bills.status'), key: 'is_paid', sortable: false }] : []),
  { title: t('bills.doctor'), key: 'doctor', sortable: false },
  { title: t('bills.workspace.payment_date'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false }
])
</script>

<style scoped>
.payment-table :deep(th) { background: rgba(var(--v-theme-primary), .045); font-weight: 700 !important; white-space: nowrap; }
.bill-number { color: rgb(var(--v-theme-primary)); font-weight: 700; }
.amount { white-space: nowrap; font-variant-numeric: tabular-nums; }
.patient-phone { color: rgba(var(--v-theme-on-surface), .65); font-size: .82rem; display: inline-block; }
.date-cell { min-width: 120px; font-size: .85rem; }
.payment-table :deep(.v-data-table-footer) { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); padding: 12px; }
</style>
