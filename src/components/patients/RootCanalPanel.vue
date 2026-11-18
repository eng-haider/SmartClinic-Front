<template>
  <!-- The case's details: a light gray bordered box set in from the row's start, so it
       reads as part of this case and not as the next one. Opened and closed by the
       "حشوة الجذر" toggle next to the category chip. -->
  <div ref="rootEl" class="rc-panel" @click.stop>
    <div class="rc-panel-inner">
      <div v-if="note" class="rc-note">
        <span class="rc-note-label">{{ $t('rootCanal.oldNote') }}:</span>
        <span dir="auto">{{ note }}</span>
      </div>

      <section v-for="(section, i) in sections" :key="section.key" class="rc-section">
        <div class="rc-section-head">
          <span class="rc-section-title" dir="ltr">{{ section.title }}</span>
          <span class="rc-section-hint">{{ section.hint }}</span>
          <v-spacer />

          <!-- Autosave status, once for the whole record -->
          <template v-if="i === 0">
            <span v-if="status === 'saving'" class="rc-status">
              <v-progress-circular indeterminate size="10" width="2" />{{ $t('rootCanal.saving') }}
            </span>
            <span v-else-if="status === 'saved'" class="rc-status rc-status--saved">
              <v-icon size="14">mdi-check-circle-outline</v-icon>{{ $t('rootCanal.saved') }}
            </span>
            <span v-else-if="status === 'error'" class="rc-status rc-status--error">
              <v-icon size="14">mdi-alert-circle-outline</v-icon>{{ error }}
              <v-btn size="x-small" variant="text" color="error" class="rc-text-btn" @click="saveNow">
                {{ $t('rootCanal.retry') }}
              </v-btn>
            </span>
            <span v-else-if="readonly" class="rc-status">{{ $t('rootCanal.readOnly') }}</span>
          </template>

          <v-btn
            v-if="section.key === 'obturation' && canCopyCanals"
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-content-copy"
            class="rc-text-btn"
            @click="copyCanalsToObturation"
          >
            {{ $t('rootCanal.copyCanals') }}
          </v-btn>
        </div>

        <div class="rc-grid">
          <!-- Column labels, once per section (desktop) -->
          <div class="rc-row rc-row--head" aria-hidden="true">
            <div class="rc-fields">
              <span v-for="col in section.columns" :key="col.label" dir="ltr">{{ col.label }}</span>
            </div>
            <span v-if="!readonly" class="rc-row-end" />
          </div>

          <!-- One row per canal -->
          <div v-for="(row, r) in rows[section.key]" :key="r" class="rc-row">
            <div class="rc-fields">
              <label v-for="(col, c) in section.columns" :key="col.label" class="rc-cell">
                <span class="rc-cell-label" dir="ltr">{{ col.label }}</span>
                <input
                  v-model="row[c]"
                  dir="ltr"
                  :data-rc="`${section.key}-${r}-${c}`"
                  :aria-label="`${section.title}: ${col.label}`"
                  :placeholder="readonly ? '' : col.placeholder"
                  :list="c === 0 ? canalListId : undefined"
                  :readonly="readonly"
                  maxlength="100"
                  autocomplete="off"
                  class="rc-input"
                  :class="{ 'rc-input--canal': c === 0 }"
                />
              </label>
            </div>
            <div v-if="!readonly" class="rc-row-end">
              <v-btn
                icon
                variant="text"
                :size="xs ? 'small' : 'x-small'"
                color="error"
                :title="$t('rootCanal.removeCanal')"
                :aria-label="$t('rootCanal.removeCanal')"
                @click="removeRow(section.key, r)"
              >
                <v-icon :size="xs ? 18 : 16">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </div>

          <div v-if="readonly && !rows[section.key].length" class="rc-empty">
            {{ $t('rootCanal.empty') }}
          </div>
        </div>

        <v-btn
          v-if="!readonly"
          size="small"
          variant="text"
          color="primary"
          prepend-icon="mdi-plus"
          class="rc-text-btn rc-add"
          @click="addRow(section.key)"
        >
          {{ $t('rootCanal.addCanal') }}
        </v-btn>
      </section>

      <datalist :id="canalListId">
        <option v-for="name in CANAL_NAMES" :key="name" :value="name" />
      </datalist>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import api from '@/services/api'
import { emptyRootCanalRow, isFilledRootCanalRow, parseRootStuffing } from '@/utils/rootCanal'

const props = defineProps({
  /** Case id the record belongs to. */
  caseId: { type: [Number, String], required: true },
  /** cases.root_stuffing when the panel opens (JSON string, object or old free text). */
  rootStuffing: { type: [String, Object], default: null },
  readonly: { type: Boolean, default: false },
  /**
   * Called with the stored root_stuffing after each save (`@saved`). A prop rather
   * than an emit: the last save can finish after the panel is closed, and Vue
   * drops emits from an unmounted component.
   */
  onSaved: { type: Function, default: null },
})

const { t } = useI18n()
const { xs } = useDisplay()

// Common canal names offered while typing the canal column.
const CANAL_NAMES = ['MB', 'MB2', 'DB', 'P', 'M', 'D', 'ML', 'DL', 'B', 'L', 'MD', 'Single']
// Several cases can be open at once, so ids and lookups stay inside this panel.
const canalListId = `root-canal-names-${props.caseId}`
const rootEl = ref(null)
const SAVE_DELAY = 800

const sections = computed(() => [
  {
    key: 'accessOpening',
    title: 'Access Opening',
    hint: t('rootCanal.accessHint'),
    columns: [
      { label: 'Canal', placeholder: 'MB' },
      { label: 'Working length', placeholder: '21 mm' },
      { label: 'Reference point', placeholder: 'MB cusp' },
      { label: 'File used', placeholder: 'K-file #15' },
    ],
  },
  {
    key: 'obturation',
    title: 'Obturation',
    hint: t('rootCanal.obturationHint'),
    columns: [
      { label: 'Canal', placeholder: 'MB' },
      { label: 'Last file size', placeholder: '#30' },
      { label: 'Sealer type & duration', placeholder: 'AH Plus · 24h' },
      { label: 'Gutta percha size', placeholder: '30/.04' },
    ],
  },
])

// Rows are loaded once when the panel opens; later prop updates (our own saves)
// must not reset what is being typed.
const parsed = parseRootStuffing(props.rootStuffing)
const rows = reactive({ accessOpening: parsed.accessOpening, obturation: parsed.obturation })
const note = parsed.note

const filledRows = (list) => list
  .filter(isFilledRootCanalRow)
  .map((row) => row.map((cell) => String(cell ?? '').trim()))

const serialize = () => JSON.stringify([filledRows(rows.accessOpening), filledRows(rows.obturation)])

let lastSaved = serialize()
if (!props.readonly) {
  // Start with one empty canal row in each table so typing can begin right away.
  if (!rows.accessOpening.length) rows.accessOpening.push(emptyRootCanalRow())
  if (!rows.obturation.length) rows.obturation.push(emptyRootCanalRow())
}

// ---- Autosave: shortly after typing stops, and on close ----
const status = ref('')
const error = ref('')
let timer = null
let saving = false
let saveAgain = false

const saveNow = async () => {
  clearTimeout(timer)
  timer = null
  if (props.readonly) return
  if (saving) {
    saveAgain = true
    return
  }
  const snapshot = serialize()
  if (snapshot === lastSaved) return

  saving = true
  status.value = 'saving'
  try {
    const [accessOpening, obturation] = JSON.parse(snapshot)
    const res = await api.put(`/cases/${props.caseId}/root-stuffing`, {
      access_opening: accessOpening,
      oburation: obturation,
      note: note || null,
    })
    lastSaved = snapshot
    props.onSaved?.(res?.data?.root_stuffing ?? null)
    status.value = 'saved'
    error.value = ''
  } catch (err) {
    status.value = 'error'
    error.value = err?.response?.data?.message || t('rootCanal.saveFailed')
    saveAgain = false
  } finally {
    saving = false
  }
  // Something changed while saving: save that too.
  if (saveAgain) {
    saveAgain = false
    saveNow()
  }
}

watch(rows, () => {
  if (props.readonly || serialize() === lastSaved) return
  clearTimeout(timer)
  timer = setTimeout(saveNow, SAVE_DELAY)
}, { deep: true })

onBeforeUnmount(() => {
  if (timer) saveNow()
})

// ---- Rows ----
const focusCell = (key, rowIndex) => nextTick(() => {
  rootEl.value?.querySelector(`[data-rc="${key}-${rowIndex}-0"]`)?.focus()
})

const addRow = (key) => {
  const row = emptyRootCanalRow()
  // A new obturation canal takes the name of the matching Access Opening canal.
  if (key === 'obturation') {
    row[0] = String(rows.accessOpening[rows.obturation.length]?.[0] ?? '').trim()
  }
  rows[key].push(row)
  focusCell(key, rows[key].length - 1)
}

const removeRow = (key, index) => {
  rows[key].splice(index, 1)
}

const accessCanalNames = computed(() =>
  rows.accessOpening.map((row) => String(row[0] ?? '').trim()).filter(Boolean)
)

const canCopyCanals = computed(() =>
  !props.readonly && accessCanalNames.value.length > 0 && !rows.obturation.some(isFilledRootCanalRow)
)

const copyCanalsToObturation = () => {
  rows.obturation = accessCanalNames.value.map((name) => [name, '', '', ''])
}
</script>

<style scoped>
.rc-panel {
  box-sizing: border-box;
  /* Never widen the table: add no intrinsic width to the row, then fill it. */
  width: 0;
  min-width: 100%;
  /* Set in from the row's start (right in RTL): nested under its case */
  padding: 0 8px 12px;
  padding-inline-start: 28px;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

/* Light gray box with a thin border; kept a readable width on wide tables */
.rc-panel-inner {
  box-sizing: border-box;
  max-width: 940px;
  padding: 6px 14px 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 10px;
}

.rc-note {
  margin-bottom: 8px;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.rc-note-label {
  font-weight: 600;
}

/* Sections stack, separated by the table's own divider */
.rc-section + .rc-section {
  margin-top: 6px;
  padding-top: 8px;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.rc-section-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 8px;
  row-gap: 2px;
  min-height: 30px;
  margin-bottom: 2px;
}

.rc-section-title {
  font-size: 0.875rem;
  font-weight: 700;
}

.rc-section-hint {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.rc-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.rc-status--saved {
  color: rgb(var(--v-theme-success));
}

.rc-status--error {
  color: rgb(var(--v-theme-error));
}

.rc-text-btn {
  letter-spacing: 0;
  text-indent: 0;
}

.rc-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* A canal row: the fields, then the delete icon at the row's end. Every row of
   both sections uses the same columns, so Canal lines up across sections. */
.rc-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rc-fields {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 8px;
}

.rc-row-end {
  flex: 0 0 32px;
  display: flex;
  justify-content: center;
}

.rc-row--head {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.rc-row--head .rc-fields > span {
  padding-inline: 9px; /* lines up with the text inside the inputs */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rc-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rc-cell-label {
  display: none;
}

.rc-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 8px;
  font: inherit;
  font-size: 0.875rem;
  color: inherit;
  background: rgb(var(--v-theme-surface)); /* white fields on the gray box */
  border: 1px solid rgba(var(--v-theme-on-surface), 0.22);
  border-radius: 4px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.rc-input::placeholder {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

.rc-input:hover:not([readonly]) {
  border-color: rgba(var(--v-theme-on-surface), 0.45);
}

.rc-input:focus {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
}

.rc-input[readonly] {
  border-color: rgba(var(--v-theme-on-surface), 0.12);
}

.rc-input--canal {
  font-weight: 600;
}

.rc-empty {
  padding: 4px 0;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.rc-add {
  margin-top: 4px;
}

/* Phones: label above every field, two fields per line where they fit, one on
   narrow screens; nothing wider than the card. */
@media (max-width: 599.98px) {
  .rc-panel {
    padding: 2px 10px 12px;
  }

  .rc-panel-inner {
    max-width: none;
    padding: 4px 8px 6px;
  }

  .rc-row--head {
    display: none;
  }

  .rc-grid {
    gap: 0;
  }

  .rc-row {
    padding: 10px 0;
  }

  .rc-row:not(.rc-row--head) + .rc-row {
    border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .rc-fields {
    /* At most two columns: each is at least half the width, or 98px (one column below that) */
    grid-template-columns: repeat(auto-fit, minmax(max(98px, calc((100% - 8px) / 2)), 1fr));
    align-items: end;
    row-gap: 10px;
  }

  .rc-row-end {
    flex-basis: 40px;
  }

  .rc-cell-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.3;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  }

  .rc-input {
    height: 40px;
    font-size: 16px; /* no iOS zoom on focus */
  }
}
</style>
