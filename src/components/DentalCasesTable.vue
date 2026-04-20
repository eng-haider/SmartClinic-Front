<template>
  <v-data-table
    :headers="headers"
    :items="cases"
    :items-per-page="-1"
    density="compact"
    class="elevation-0 rounded-lg"
    :hide-default-footer="true"
  >
    <!-- Tooth number -->
    <template #item.tooth_num="{ item }">
      <v-chip v-if="item.tooth_num" size="small" color="info" variant="flat">
        <v-icon start size="14">mdi-tooth</v-icon>
        {{ item.tooth_num }}
      </v-chip>
      <span v-else class="text-grey text-caption">{{ $t('patients.general') }}</span>
    </template>

    <!-- Category -->
    <template #item.category="{ item }">
      <v-chip
        size="small"
        :color="item.category?.color || getCategoryColor(item.category?.id || item.case_categores_id)"
        variant="tonal"
      >
        {{ item.category?.name || getCategoryName(item.category?.id || item.case_categores_id) }}
      </v-chip>
    </template>

    <!-- Doctor -->
    <template #item.doctor="{ item }">
      <div class="d-flex align-center ga-1">
        <v-icon size="14" color="primary">mdi-doctor</v-icon>
        <span class="text-body-2">{{ item.doctor?.name || '-' }}</span>
      </div>
    </template>

    <!-- Price — native input, zero Vue reactivity while typing -->
    <template #item.price="{ item }">
      <div class="price-cell">
        <input
          class="price-input"
          type="text"
          inputmode="numeric"
          :value="formatNumberWithCommas(item.price)"
          @focus="onPriceFocus"
          @input="onPriceInputNative"
          @blur="onPriceBlur(item, $event)"
        />
        <span class="price-suffix">IQD</span>
      </div>
    </template>

    <!-- Bills paid chips -->
    <template #item.bills="{ item }">
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="bill in (item.bills || [])"
          :key="bill.id"
          color="success"
          size="small"
          variant="flat"
        >
          {{ formatNumberWithCommas(bill.price) }}
        </v-chip>
        <span v-if="!item.bills?.length" class="text-grey text-caption">-</span>
      </div>
    </template>

    <!-- Remaining -->
    <template #item.remaining="{ item }">
      <v-chip v-if="getRemainingAmount(item) > 0" size="small" color="warning" variant="flat">
        <v-icon start size="12">mdi-cash-clock</v-icon>
        {{ formatNumberWithCommas(getRemainingAmount(item)) }}
      </v-chip>
      <v-chip v-else size="small" color="success" variant="flat">
        <v-icon start size="12">mdi-check-circle</v-icon>
        {{ $t('patients.fullyPaid') }}
      </v-chip>
    </template>

    <!-- Status — status icon + toggle switch -->
    <template #item.status="{ item }">
      <div class="d-flex align-center ga-2">
        <v-icon
          :color="getStatusId(item) === 3 ? 'success' : 'warning'"
          size="20"
        >
          {{ getStatusId(item) === 3 ? 'mdi-check-circle' : 'mdi-clock-outline' }}
        </v-icon>
        <v-switch
          :model-value="getStatusId(item) === 3"
          color="success"
          density="compact"
          hide-details
          inset
          @update:model-value="emit('update-status', item, $event ? '3' : '2')"
        />
      </div>
    </template>

    <!-- Date -->
    <template #item.case_date="{ item }">
      <span class="text-caption">{{ formatDate(item.case_date || item.created_at) }}</span>
    </template>

    <!-- Notes — textarea with v-btn in append-inner slot + closable chips -->
    <template #item.notes="{ item }">
      <div class="notes-column" style="max-width:400px;">
        <v-textarea
          v-model="newNoteContent[item.id]"
          :placeholder="$t('patients.addNote') || 'Add Note'"
          density="compact"
          variant="outlined"
          hide-details
          auto-grow
          rows="1"
          no-resize
          class="mb-2"
          @keyup.enter.prevent="submitNote(item.id)"
        >
          <template #append-inner>
            <v-btn
              icon
              variant="elevated"
              size="x-small"
              color="primary"
              :disabled="!newNoteContent[item.id]?.trim()"
              @click.stop="submitNote(item.id)"
            >
              <v-icon size="18">mdi-send</v-icon>
            </v-btn>
          </template>
        </v-textarea>
        <div class="notes-list">
          <v-chip
            v-for="note in getCaseNotes(item.id)"
            :key="note.id"
            size="small"
            variant="tonal"
            closable
            class="ma-1"
            @click:close="emit('delete-note', note.id, item.id)"
          >
            {{ note.content }}
          </v-chip>
        </div>
      </div>
    </template>

    <!-- Actions -->
    <template #item.actions="{ item }">
      <div class="d-inline-flex ga-0">
        <v-tooltip :text="$t('common.view') || 'View'" location="top">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon variant="text" size="x-small" color="info" @click.stop="emit('view', item)">
              <v-icon size="16">mdi-eye-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip v-if="canEdit" :text="$t('common.edit') || 'Edit'" location="top">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon variant="text" size="x-small" color="primary" @click.stop="emit('edit', item)">
              <v-icon size="16">mdi-pencil-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip :text="$t('common.delete') || 'Delete'" location="top">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon variant="text" size="x-small" color="error" @click.stop="emit('delete', item)">
              <v-icon size="16">mdi-delete-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  cases:         { type: Array,   default: () => [] },
  categories:    { type: Array,   default: () => [] },
  statusOptions: { type: Array,   default: () => [] },
  caseNotes:     { type: Object,  default: () => ({}) },
  canEdit:       { type: Boolean, default: false },
})

const emit = defineEmits(['save-case', 'update-status', 'view', 'edit', 'delete', 'add-note', 'delete-note'])

const { t, locale } = useI18n()

const newNoteContent = ref({})

const headers = computed(() => [
  { title: t('patients.toothNumber'), key: 'tooth_num',  sortable: true },
  { title: t('patients.category'),    key: 'category',   sortable: true },
  { title: t('common.doctor'),        key: 'doctor',     sortable: true },
  { title: t('cases.price'),          key: 'price',      sortable: true },
  { title: t('patients.bills'),       key: 'bills',      sortable: false },
  { title: t('patients.remaining'),   key: 'remaining',  sortable: false },
  { title: t('patients.status'),      key: 'status',     sortable: false },
  { title: t('common.date'),          key: 'case_date',  sortable: true },
  { title: t('patients.notes'),       key: 'notes',      sortable: false },
  { title: t('common.actions'),       key: 'actions',    sortable: false, align: 'center' },
])

const getCategoryName = (categoryId) => {
  const cat = props.categories.find(c => c.id === categoryId)
  if (!cat) return '-'
  if (locale.value === 'ar') return cat.name_ar || cat.name
  if (locale.value === 'ku') return cat.name_ku || cat.name_en || cat.name
  return cat.name_en || cat.name
}

const getCategoryColor = (categoryId) => {
  return props.categories.find(c => c.id === categoryId)?.color || 'primary'
}

const formatNumberWithCommas = (value) => {
  if (!value) return ''
  return new Intl.NumberFormat('en-US').format(value)
}

// Native DOM price handlers — no Vue reactivity during typing
const onPriceFocus = (event) => {
  const input = event.target
  // Show raw number so user types freely
  const raw = input.value.replace(/,/g, '')
  input.value = raw
  // Select all for easy overwrite
  input.select()
}

const onPriceInputNative = (event) => {
  const input = event.target
  const cursorPos = input.selectionStart
  const oldVal = input.value
  const rawDigits = oldVal.replace(/[^0-9]/g, '')
  if (!rawDigits) { input.value = ''; return }
  const formatted = new Intl.NumberFormat('en-US').format(parseInt(rawDigits, 10))
  // Compute new cursor position
  const rawBeforeCursor = oldVal.slice(0, cursorPos).replace(/,/g, '').length
  let digitCount = 0, newCursor = formatted.length
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ',') digitCount++
    if (digitCount === rawBeforeCursor) { newCursor = i + 1; break }
  }
  // Direct DOM mutation — no Vue involved
  input.value = formatted
  input.setSelectionRange(newCursor, newCursor)
}

const onPriceBlur = (item, event) => {
  const raw = event.target.value.replace(/,/g, '')
  const num = parseFloat(raw)
  if (!isNaN(num)) item.price = num
  else item.price = 0
  // Re-display formatted after blur
  event.target.value = formatNumberWithCommas(item.price)
  emit('save-case', item)
}

const getRemainingAmount = (item) => {
  const totalPaid = (item.bills || []).reduce((sum, b) => sum + (b.price || 0), 0)
  return Math.max(0, (item.price || 0) - totalPaid)
}

const getStatusId = (item) => {
  if (item.status && typeof item.status === 'object' && item.status.id) return item.status.id
  if (typeof item.status === 'number') return item.status
  if (typeof item.status === 'string' && !isNaN(item.status)) return parseInt(item.status)
  if (item.status === 'completed') return 3
  if (item.status === 'pending') return 2
  return 2
}

const getCaseNotes = (caseId) => props.caseNotes[caseId] || []

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const submitNote = (caseId) => {
  const content = newNoteContent.value[caseId]
  if (!content?.trim()) return
  emit('add-note', caseId, content)
  newNoteContent.value[caseId] = ''
}
</script>

<style scoped>
.price-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 140px;
}
.price-input {
  width: 100px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(0,0,0,0.38);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background: transparent;
  outline: none;
  text-align: end;
  transition: border-color 0.15s;
}
.price-input:focus {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
}
.price-suffix {
  font-size: 12px;
  color: rgba(0,0,0,0.54);
  font-weight: 500;
  white-space: nowrap;
}
</style>
