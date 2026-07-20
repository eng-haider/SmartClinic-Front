<template>
  <div class="warehouse-items-picker">
    <label class="picker-label">{{ $t('warehouse.materials') }}</label>
    <div class="picker-hint">{{ $t('warehouse.materialsHint') }}</div>

    <!-- Selected rows -->
    <div v-if="rows.length" class="picker-rows">
      <div v-for="(row, idx) in rows" :key="idx" class="picker-row">
        <v-select
          v-model="row.warehouse_item_id"
          :items="availableItemsFor(row.warehouse_item_id)"
          item-title="label"
          item-value="id"
          :label="$t('warehouse.selectItem')"
          variant="outlined"
          density="compact"
          hide-details
          class="picker-row-select"
        />
        <v-text-field
          :model-value="row.quantity"
          @update:model-value="val => row.quantity = sanitizeQty(val)"
          type="number"
          min="1"
          :max="maxQtyFor(row.warehouse_item_id)"
          :label="$t('warehouse.quantity')"
          variant="outlined"
          density="compact"
          hide-details
          :error="isRowOverStock(row)"
          class="picker-row-qty"
        />
        <v-btn icon variant="text" size="small" color="error" @click="removeRow(idx)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
    <div v-else class="picker-empty">{{ $t('warehouse.noMaterials') }}</div>

    <!-- Failed to load the catalogue: let the user retry instead of a dead button. -->
    <div v-if="loadError" class="picker-error">
      <span>{{ $t('warehouse.loadFailed') || 'Could not load items' }}</span>
      <v-btn variant="text" size="x-small" color="primary" @click="loadItems">
        {{ $t('common.retry') || 'Retry' }}
      </v-btn>
    </div>

    <!-- Catalogue loaded but genuinely empty. -->
    <div v-else-if="loaded && !items.length" class="picker-empty">
      {{ $t('warehouse.noItems') || 'No items in warehouse' }}
    </div>

    <v-btn
      variant="tonal"
      size="small"
      prepend-icon="mdi-plus"
      class="mt-2"
      :loading="loading"
      :disabled="!canAddRow"
      @click="addRow"
    >
      {{ $t('warehouse.addMaterial') }}
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import warehouseService from '@/services/warehouse.service'

const { t } = useI18n()

const props = defineProps({
  // v-model: array of { warehouse_item_id, quantity }
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const items = ref([])          // full warehouse item list (with stock)
const rows = ref([])           // editable rows backing the picker
const loading = ref(false)     // catalogue request in flight
const loaded = ref(false)      // catalogue request has completed at least once
const loadError = ref(false)   // last catalogue request failed

// Load the warehouse catalogue (large page size — clinics have few items).
async function loadItems() {
  loading.value = true
  loadError.value = false
  try {
    // getItems resolves to the API envelope { data: [...], pagination }.
    const res = await warehouseService.getItems({ per_page: 200 })
    // Be tolerant of the envelope shape: { data: [...] } | { data: { data: [...] } } | [...]
    const list = Array.isArray(res) ? res
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res?.data?.data) ? res.data.data
      : []
    items.value = list
    loaded.value = true
  } catch (e) {
    items.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}
loadItems()

// The committed payload for a set of rows: only fully-filled rows, normalized
// the same way we emit. Blank/in-progress rows are intentionally dropped here.
function committedPayload(list) {
  return list
    .filter(r => r.warehouse_item_id)
    // A blank quantity counts as 1 rather than dropping the chosen item.
    .map(r => ({ warehouse_item_id: r.warehouse_item_id, quantity: Math.max(1, Number(r.quantity) || 1) }))
}

// Sync incoming model into editable rows (deep copy so we don't mutate the parent ref).
watch(
  () => props.modelValue,
  (val) => {
    const incoming = (val || []).map(r => ({
      warehouse_item_id: r.warehouse_item_id ?? r.id ?? null,
      quantity: Number(r.quantity) || 1,
    }))
    // Only re-seed from the parent when the *committed* rows actually differ.
    // Without this, the emit→parent→modelValue round-trip would wipe a freshly
    // added blank row (it's filtered out of the emit, so the parent sends []
    // back) before the user can pick an item — making "Add material" look dead.
    if (JSON.stringify(incoming) !== JSON.stringify(committedPayload(rows.value))) {
      rows.value = incoming
    }
  },
  { immediate: true }
)

// Emit a clean payload whenever rows change.
watch(
  rows,
  (val) => {
    emit('update:modelValue', committedPayload(val))
  },
  { deep: true }
)

// Allow an empty string while typing; otherwise coerce to a positive integer.
function sanitizeQty(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10)
  return Number.isNaN(n) ? '' : n
}

function itemById(id) {
  return items.value.find(i => i.id === id)
}

function stockOf(id) {
  return Number(itemById(id)?.quantity ?? 0)
}

function maxQtyFor(id) {
  const s = stockOf(id)
  return s > 0 ? s : undefined
}

// Items already chosen in other rows can't be picked again.
function availableItemsFor(currentId) {
  const used = new Set(rows.value.map(r => r.warehouse_item_id).filter(Boolean))
  return items.value
    .filter(i => i.id === currentId || !used.has(i.id))
    .map(i => ({
      id: i.id,
      label: `${i.name} (${Number(i.quantity)} ${t('warehouse.available')})`,
    }))
}

// The "add" button stays usable unless the catalogue is loaded, non-empty, and
// every item is already chosen. While loading, on error, or before the first
// load, we still allow adding a (blank) row so the button is never a dead end.
const canAddRow = computed(() => {
  if (!loaded.value || !items.value.length) return true
  const used = new Set(rows.value.map(r => r.warehouse_item_id).filter(Boolean))
  return items.value.some(i => !used.has(i.id))
})

function isRowOverStock(row) {
  if (!row.warehouse_item_id) return false
  return Number(row.quantity) > stockOf(row.warehouse_item_id)
}

function addRow() {
  rows.value.push({ warehouse_item_id: null, quantity: 1 })
}

function removeRow(idx) {
  rows.value.splice(idx, 1)
}
</script>

<style scoped>
.warehouse-items-picker {
  margin-bottom: 16px;
}

.picker-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.78);
}

.picker-hint {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.picker-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.picker-row-select {
  flex: 1;
  min-width: 0;
}

.picker-row-qty {
  width: 110px;
  flex: 0 0 110px;
}

.picker-empty {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  padding: 6px 0;
}

.picker-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  padding: 6px 0;
}
</style>
