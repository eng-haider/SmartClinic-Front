<template>
  <div class="rx-write">
    <div class="rx-write__sheet">
      <div class="rx-write__sym">&#8478;</div>

      <div class="rx-write__lines">
        <div
          v-for="(line, index) in lines"
          :key="index"
          class="rx-write__row"
          :class="{ 'rx-write__row--active': activeIndex === index }"
        >
          <span class="rx-write__num">{{ index + 1 }}.</span>

          <input
            :ref="(el) => setInputRef(el, index)"
            :value="line"
            class="rx-write__input"
            type="text"
            dir="auto"
            :maxlength="RX_LINE_MAX"
            :placeholder="index === 0 ? placeholder : ''"
            @input="onInput(index, $event.target.value)"
            @focus="activeIndex = index"
            @blur="onBlur"
            @keydown.enter.prevent="onEnter(index)"
            @keydown.down.prevent="focusLine(index + 1)"
            @keydown.up.prevent="focusLine(index - 1)"
            @keydown.backspace="onBackspace(index, $event)"
          />

          <v-btn
            v-if="lines.length > 1"
            icon="mdi-close"
            variant="text"
            size="x-small"
            class="rx-write__remove"
            :aria-label="$t('common.delete')"
            @click="removeLine(index)"
          />

          <!-- Library suggestions, shown only while the drug name is being typed -->
          <div v-if="activeIndex === index && visibleSuggestions.length" class="rx-write__suggest">
            <button
              v-for="name in visibleSuggestions"
              :key="name"
              type="button"
              class="rx-write__suggest-item"
              @mousedown.prevent="applySuggestion(index, name)"
            >
              <v-icon size="14" class="me-1">mdi-pill</v-icon>{{ name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="rx-write__tools">
      <button
        v-for="chip in shortcuts"
        :key="chip"
        type="button"
        class="rx-write__chip"
        @mousedown.prevent="appendToActive(chip)"
      >
        {{ chip }}
      </button>
      <v-spacer />
      <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addLine">
        {{ $t('rx.paper.add_line') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import MedicationService from '@/services/medication.service'
import { RX_LINE_MAX } from '@/utils/rxLines'

const props = defineProps({
  modelValue: { type: Array, default: () => [''] },
  placeholder: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const lines = computed(() => (props.modelValue?.length ? props.modelValue : ['']))

const activeIndex = ref(0)
const library = ref([])
const inputRefs = ref([])

// Shorthand a doctor would otherwise retype on every line.
const shortcuts = ['1x1', '2x1', '3x1', '× 5 days', '× 7 days', 'PRN']

const setInputRef = (el, index) => {
  if (el) inputRefs.value[index] = el
}

const commit = (next) => emit('update:modelValue', next.length ? next : [''])

const onInput = (index, value) => {
  const next = [...lines.value]
  next[index] = value
  commit(next)
}

const focusLine = async (index) => {
  if (index < 0 || index >= lines.value.length) return
  await nextTick()
  const el = inputRefs.value[index]
  if (el) {
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }
}

const addLine = async (at = lines.value.length) => {
  const next = [...lines.value]
  next.splice(at, 0, '')
  commit(next)
  await focusLine(at)
}

const removeLine = (index) => {
  if (lines.value.length <= 1) { commit(['']); return }
  const next = [...lines.value]
  next.splice(index, 1)
  commit(next)
  focusLine(Math.max(0, index - 1))
}

const onEnter = (index) => addLine(index + 1)

const onBackspace = (index, event) => {
  if (event.target.value === '' && lines.value.length > 1) {
    event.preventDefault()
    removeLine(index)
  }
}

const onBlur = () => {
  // Let a suggestion's mousedown land before the list unmounts.
  setTimeout(() => { activeIndex.value = -1 }, 120)
}

/* ── Medication library ──────────────────────────────────────────
   Suggestions only help while the drug name is being typed. Once the
   line has a space the doctor has moved on to the dose, so they stop. */
const visibleSuggestions = computed(() => {
  const current = (lines.value[activeIndex.value] || '').trim()
  if (!current || current.includes(' ')) return []

  const needle = current.toLowerCase()
  return library.value
    .filter((name) => name.toLowerCase().includes(needle) && name.toLowerCase() !== needle)
    .slice(0, 6)
})

const applySuggestion = async (index, name) => {
  const next = [...lines.value]
  next[index] = `${name} `
  commit(next)
  await focusLine(index)
}

const appendToActive = async (text) => {
  const index = activeIndex.value >= 0 ? activeIndex.value : lines.value.length - 1
  const next = [...lines.value]
  const current = next[index] || ''
  next[index] = current ? `${current.trimEnd()} ${text}` : text
  commit(next)
  await focusLine(index)
}

onMounted(async () => {
  try {
    const data = await MedicationService.getAll()
    library.value = (Array.isArray(data) ? data : [])
      .map((m) => (typeof m === 'string' ? m : m?.name))
      .filter(Boolean)
  } catch {
    library.value = []
  }
})

defineExpose({ focusLine, addLine })
</script>

<style scoped>
.rx-write__sheet {
  display: flex;
  gap: 12px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
}

.rx-write__sym {
  font-size: 2rem;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
  color: rgb(var(--v-theme-primary));
}

.rx-write__lines { flex: 1 1 auto; }

.rx-write__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dotted #ccc;
}

.rx-write__row--active { border-bottom-color: rgb(var(--v-theme-primary)); }

.rx-write__num {
  min-width: 20px;
  font-weight: 700;
  font-size: 0.8rem;
  color: rgb(var(--v-theme-primary));
}

.rx-write__input {
  flex: 1 1 auto;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 0;
  font: inherit;
  font-size: 1rem;
  color: inherit;
}

.rx-write__input::placeholder { color: #aaa; font-size: 0.9rem; }

.rx-write__remove { opacity: 0; transition: opacity 0.15s ease; }
.rx-write__row:hover .rx-write__remove,
.rx-write__row--active .rx-write__remove { opacity: 0.6; }

/* ── Suggestions ── */
.rx-write__suggest {
  position: absolute;
  inset-inline-start: 28px;
  top: 100%;
  z-index: 5;
  min-width: 200px;
  max-width: 320px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.rx-write__suggest-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.875rem;
  text-align: start;
  cursor: pointer;
}

.rx-write__suggest-item:hover { background: rgba(var(--v-theme-primary), 0.08); }

/* ── Shortcut chips ── */
.rx-write__tools {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.rx-write__chip {
  padding: 3px 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  cursor: pointer;
}

.rx-write__chip:hover { background: rgba(var(--v-theme-primary), 0.08); }
</style>
