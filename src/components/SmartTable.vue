<template>
  <div class="smart-table-wrapper">
    <!-- Loading State -->
    <div v-if="loading" class="smart-table-skeleton">
      <div class="skeleton-header">
        <div v-for="col in columns" :key="col.key" class="skeleton-cell" :style="{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }">
          <div class="skeleton-bar" style="width: 60%; height: 12px;" />
        </div>
      </div>
      <div v-for="i in 8" :key="i" class="skeleton-row">
        <div v-for="col in columns" :key="col.key" class="skeleton-cell" :style="{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }">
          <div class="skeleton-bar" :style="{ width: (40 + Math.random() * 40) + '%' }" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!items || items.length === 0" class="smart-table-empty">
      <v-icon :icon="emptyIcon" size="64" color="grey-lighten-2" />
      <h3 class="text-h6 text-grey mt-3">{{ emptyText }}</h3>
      <p class="text-body-2 text-grey-darken-1 mt-1">{{ emptySubtext }}</p>
      <slot name="empty-action" />
    </div>

    <!-- Table -->
    <div v-else class="smart-table-container" :class="{ 'smart-table-sticky': stickyHeader }">
      <table class="smart-table">
        <thead>
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              :style="getHeaderStyle(col)"
              :class="['smart-th', { 'sortable': col.sortable, 'sorted': sortKey === col.key }]"
              @click="col.sortable ? toggleSort(col.key) : null"
            >
              <div class="th-content">
                <span>{{ col.label }}</span>
                <v-icon
                  v-if="col.sortable"
                  size="14"
                  class="sort-icon"
                  :class="{ 'active': sortKey === col.key }"
                >
                  {{ sortKey === col.key ? (sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down') : 'mdi-arrow-up-down' }}
                </v-icon>
              </div>
            </th>
            <th v-if="actions && actions.length" class="smart-th actions-th" style="width: 120px; text-align: center;">
              {{ actionsLabel }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in sortedItems"
            :key="row.id || idx"
            class="smart-tr"
            :class="{ 'clickable': clickable }"
            @click="clickable ? $emit('click:row', row) : null"
          >
            <td
              v-for="col in visibleColumns"
              :key="col.key"
              class="smart-td"
              :style="getCellStyle(col)"
            >
              <!-- Slot override per column -->
              <slot :name="`item.${col.key}`" :item="row" :value="getCellValue(row, col)">
                <!-- Built-in type renderers -->
                <component
                  :is="getCellRenderer(col.type)"
                  v-bind="getCellProps(row, col)"
                />
              </slot>
            </td>
            <td v-if="actions && actions.length" class="smart-td actions-td">
              <div class="actions-row">
                <template v-for="action in actions" :key="action.key">
                  <v-tooltip :text="action.label" location="top">
                    <template #activator="{ props: tp }">
                      <button
                        v-if="!action.hidden || !action.hidden(row)"
                        v-bind="tp"
                        class="action-btn"
                        :class="[`action-${action.color || 'default'}`]"
                        @click.stop="$emit('action', { key: action.key, item: row })"
                      >
                        <v-icon :icon="action.icon" size="16" />
                      </button>
                    </template>
                  </v-tooltip>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && items && items.length > 0 && pagination" class="smart-table-footer">
      <div class="footer-info text-caption text-grey">
        {{ paginationFrom }}–{{ paginationTo }} / {{ paginationTotal }}
      </div>
      <v-pagination
        v-if="paginationLastPage > 1"
        :model-value="pagination.page"
        :length="paginationLastPage"
        :total-visible="5"
        density="compact"
        size="small"
        @update:model-value="$emit('update:page', $event)"
      />
      <v-select
        :model-value="pagination.perPage"
        :items="[10, 15, 25, 50]"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 80px;"
        @update:model-value="$emit('update:per-page', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref } from 'vue'
import { VChip, VIcon, VAvatar, VTooltip } from 'vuetify/components'

const props = defineProps({
  columns: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  actions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  clickable: { type: Boolean, default: true },
  stickyHeader: { type: Boolean, default: true },
  emptyIcon: { type: String, default: 'mdi-folder-search-outline' },
  emptyText: { type: String, default: 'No data found' },
  emptySubtext: { type: String, default: '' },
  actionsLabel: { type: String, default: '' },
  // Server pagination: { page, perPage, total }
  pagination: { type: Object, default: null },
  // Client sort override (for server-side, parent handles sort)
  serverSort: { type: Boolean, default: false },
})

defineEmits(['click:row', 'action', 'update:page', 'update:per-page', 'sort'])

const sortKey = ref(null)
const sortDir = ref('asc')

const visibleColumns = computed(() =>
  props.columns.filter(c => c.visible !== false)
)

// Client-side sort (only when not server-side)
const sortedItems = computed(() => {
  if (props.serverSort || !sortKey.value) return props.items
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.items].sort((a, b) => {
    const va = getCellValue(a, { key }) ?? ''
    const vb = getCellValue(b, { key }) ?? ''
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
})

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

// Pagination helpers
const paginationTotal = computed(() => props.pagination?.total ?? props.items?.length ?? 0)
const paginationFrom = computed(() => {
  if (!props.pagination) return 1
  return ((props.pagination.page - 1) * props.pagination.perPage) + 1
})
const paginationTo = computed(() => {
  if (!props.pagination) return props.items?.length ?? 0
  return Math.min(props.pagination.page * props.pagination.perPage, paginationTotal.value)
})
const paginationLastPage = computed(() => {
  if (!props.pagination) return 1
  return Math.ceil(paginationTotal.value / props.pagination.perPage) || 1
})

// Get nested value by dot-notation key
function getCellValue(row, col) {
  const key = col.key
  if (col.getter) return col.getter(row)
  
  // Simple key
  if (!key.includes('.')) return row[key]
  
  // Dot-notation path
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

function getHeaderStyle(col) {
  const s = {}
  if (col.width) s.width = col.width
  if (col.minWidth) s.minWidth = col.minWidth
  if (col.align) s.textAlign = col.align
  return s
}

function getCellStyle(col) {
  const s = {}
  if (col.width) s.width = col.width
  if (col.minWidth) s.minWidth = col.minWidth
  if (col.align) s.textAlign = col.align
  return s
}

// ====== Built-in cell type renderers ======

const CellText = (props) => h('span', { class: 'cell-text' }, props.value ?? '-')

const CellBadge = (props) => {
  const colorMap = props.colorMap || {}
  const val = props.value
  const key = props.rawValue ?? val
  const color = colorMap[key] || props.color || 'grey'
  return h(VChip, { size: 'small', variant: 'tonal', color }, () => val ?? '-')
}

const CellChip = (props) => {
  if (!props.value && props.value !== 0) return h('span', { class: 'text-grey' }, '-')
  return h(VChip, {
    size: 'small',
    variant: 'flat',
    color: props.color || 'primary',
  }, () => [
    props.icon ? h(VIcon, { icon: props.icon, size: 14, start: true }) : null,
    props.value,
  ])
}

const CellCurrency = (props) => {
  const val = props.value
  if (val === null || val === undefined) return h('span', { class: 'text-grey' }, '-')
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
  }).format(val)
  return h('span', { class: 'cell-currency' }, `${formatted} ${props.suffix || 'IQD'}`)
}

const CellDate = (props) => {
  if (!props.value) return h('span', { class: 'text-grey' }, '-')
  const d = new Date(props.value)
  const formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  return h('span', { class: 'cell-date' }, formatted)
}

const CellAvatar = (props) => {
  const name = props.value || ''
  const subtitle = props.subtitle || ''
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
  const color = colors[name.charCodeAt(0) % colors.length] || 'grey'
  
  return h('div', { class: 'd-flex align-center ga-2' }, [
    h(VAvatar, { size: 32, color }, () => h('span', { class: 'text-white text-caption font-weight-bold' }, initials)),
    h('div', {}, [
      h('div', { class: 'font-weight-medium text-body-2' }, name || '-'),
      subtitle ? h('div', { class: 'text-caption text-grey' }, subtitle) : null,
    ]),
  ])
}

const CellTruncate = (props) => {
  const val = props.value || '-'
  const maxW = props.maxWidth || '160px'
  // Wrap in a span; parent can add tooltip via slot override if needed
  return h('span', {
    class: 'd-inline-block text-truncate',
    style: { maxWidth: maxW },
    title: val,
  }, val)
}

const CellIconText = (props) => {
  return h('div', { class: 'd-flex align-center ga-2' }, [
    props.icon ? h(VIcon, { icon: props.icon, size: 16, color: props.iconColor || 'primary' }) : null,
    h('span', { class: 'text-body-2' }, props.value || '-'),
  ])
}

// Cell renderer map
function getCellRenderer(type) {
  const map = {
    text: CellText,
    badge: CellBadge,
    chip: CellChip,
    currency: CellCurrency,
    date: CellDate,
    avatar: CellAvatar,
    truncate: CellTruncate,
    'icon-text': CellIconText,
  }
  return map[type] || CellText
}

function getCellProps(row, col) {
  const value = getCellValue(row, col)
  const base = { value }
  
  if (col.type === 'badge') {
    base.colorMap = col.colorMap || {}
    base.color = typeof col.color === 'function' ? col.color(row) : col.color
    base.rawValue = col.rawValueGetter ? col.rawValueGetter(row) : value
  }
  if (col.type === 'chip') {
    base.color = typeof col.color === 'function' ? col.color(row) : col.color
    base.icon = typeof col.icon === 'function' ? col.icon(row) : col.icon
  }
  if (col.type === 'currency') {
    base.suffix = col.suffix || 'IQD'
  }
  if (col.type === 'avatar') {
    base.subtitle = col.subtitleGetter ? col.subtitleGetter(row) : ''
  }
  if (col.type === 'truncate') {
    base.maxWidth = col.maxWidth
  }
  if (col.type === 'icon-text') {
    base.icon = typeof col.icon === 'function' ? col.icon(row) : col.icon
    base.iconColor = typeof col.iconColor === 'function' ? col.iconColor(row) : col.iconColor
  }
  
  return base
}
</script>

<style scoped>
.smart-table-wrapper {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

/* ===== Skeleton ===== */
.smart-table-skeleton {
  padding: 0;
}
.skeleton-header {
  display: flex;
  gap: 16px;
  padding: 14px 20px;
  background: #f8f9fb;
  border-bottom: 1px solid #eef0f3;
}
.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.skeleton-cell {
  display: flex;
  align-items: center;
}
.skeleton-bar {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, #eef0f3 25%, #f5f6f8 50%, #eef0f3 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Empty ===== */
.smart-table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

/* ===== Table ===== */
.smart-table-container {
  overflow-x: auto;
}
.smart-table-sticky {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}
.smart-table-sticky thead {
  position: sticky;
  top: 0;
  z-index: 2;
}

.smart-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

/* Header */
.smart-th {
  padding: 10px 16px;
  background: #f8f9fb;
  border-bottom: 2px solid #eef0f3;
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  text-align: start;
  user-select: none;
}
.smart-th.sortable {
  cursor: pointer;
}
.smart-th.sortable:hover {
  color: #334155;
  background: #f1f3f5;
}
.th-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sort-icon {
  opacity: 0.3;
  transition: opacity 0.15s;
}
.sort-icon.active {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}
.actions-th {
  text-align: center;
}

/* Rows */
.smart-tr {
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.12s;
}
.smart-tr:last-child {
  border-bottom: none;
}
.smart-tr.clickable {
  cursor: pointer;
}
.smart-tr:hover {
  background: #f8fafc;
}
.smart-tr.clickable:hover {
  background: #f0f4ff;
}

/* Cells */
.smart-td {
  padding: 10px 16px;
  vertical-align: middle;
  color: #334155;
  line-height: 1.4;
}
.actions-td {
  text-align: center;
}
.actions-row {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* Action buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  color: #94a3b8;
}
.action-btn:hover {
  background: #f1f5f9;
}
.action-btn.action-primary:hover { color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.08); }
.action-btn.action-info:hover { color: rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.08); }
.action-btn.action-success:hover { color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.08); }
.action-btn.action-warning:hover { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.08); }
.action-btn.action-error:hover { color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.08); }

/* Cell type styles */
.cell-text {
  color: #334155;
}
.cell-currency {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}
.cell-date {
  color: #64748b;
  font-size: 12px;
}

/* Footer / Pagination */
.smart-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid #eef0f3;
  gap: 12px;
}
.footer-info {
  white-space: nowrap;
}

/* RTL support */
:root[dir="rtl"] .smart-th,
:root[dir="rtl"] .smart-td {
  text-align: right;
}
</style>
