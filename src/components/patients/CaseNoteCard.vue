<template>
  <div class="cnc-card">
    <div class="cnc-rail">
      <div class="cnc-avatar" :style="{ background: avatarColor }">{{ initials }}</div>
      <div class="cnc-rail-line" />
    </div>

    <div class="cnc-body">
      <div class="cnc-header">
        <div class="cnc-meta">
          <span class="cnc-doctor">{{ doctorName }}</span>

          <v-tooltip :text="formatFull(note.created_at)" location="top">
            <template #activator="{ props: tp }">
              <span v-bind="tp" class="cnc-time">
                <v-icon size="12" class="me-1">mdi-clock-outline</v-icon>{{ formatRelative(note.created_at) }}
              </span>
            </template>
          </v-tooltip>

          <v-tooltip v-if="isEdited" :text="formatFull(note.updated_at)" location="top">
            <template #activator="{ props: tp }">
              <span v-bind="tp" class="cnc-edited">
                <v-icon size="10" class="me-1">mdi-pencil</v-icon>معدّلة · {{ formatRelative(note.updated_at) }}
              </span>
            </template>
          </v-tooltip>
        </div>

        <div v-if="!editing" class="cnc-actions">
          <v-btn v-if="canEdit" icon size="x-small" variant="text" @click="startEdit">
            <v-icon size="15">mdi-pencil-outline</v-icon>
          </v-btn>
          <v-btn v-if="canDelete" icon size="x-small" variant="text" color="error" @click="emit('delete')">
            <v-icon size="15">mdi-trash-can-outline</v-icon>
          </v-btn>
        </div>
      </div>

      <template v-if="!editing">
        <OrthoMetaBadges v-if="parsed.meta" :meta="parsed.meta" class="mb-2" />
        <div v-if="parsed.text" class="cnc-content">{{ parsed.text }}</div>
      </template>
      <div v-else class="cnc-edit">
        <v-textarea
          v-model="editText"
          variant="outlined"
          density="comfortable"
          rows="3"
          auto-grow
          hide-details
          autofocus
        />
        <div class="d-flex ga-2 justify-end mt-2">
          <v-btn size="small" variant="text" @click="cancelEdit">إلغاء</v-btn>
          <v-btn size="small" color="primary" variant="elevated" :loading="saving" @click="submitEdit">
            حفظ التعديل
          </v-btn>
        </div>
      </div>

      <div v-if="images.length || canEdit" class="cnc-images-label">
        <v-icon size="13" class="me-1">mdi-image-multiple-outline</v-icon>الصور المرفقة
      </div>
      <NoteImageAttachments
        v-if="images.length || canEdit"
        :images="displayImages"
        :disabled="!canEdit"
        v-model:selected-type="newImageType"
        add-label="إضافة صورة"
        @add-files="emit('add-images', $event)"
        @remove="onRemoveImage"
        @open="emit('open-lightbox', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import NoteImageAttachments from './NoteImageAttachments.vue'
import OrthoMetaBadges from './OrthoMetaBadges.vue'
import { parseOrthoLine, composeNoteContent } from '@/utils/orthoNote'
import { parseImageTag, setImageTag } from '@/utils/noteImageTag'

const props = defineProps({
  note: { type: Object, required: true },
  images: { type: Array, default: () => [] },
  isOrthoCase: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'delete', 'add-images', 'remove-image', 'open-lightbox'])

const editing = ref(false)
const editText = ref('')
const editMeta = reactive({ noteDate: null, appliance: null, phase: null, duration: null })
const newImageType = ref('other')

// note.content may carry a hidden [images:id,id] tag (see utils/noteImageTag.js)
// on top of the [تقويم] quick-fields tag — strip that first so neither the
// ortho parser nor the displayed/edited text ever sees it.
const visibleContent = computed(() => parseImageTag(props.note.content).text)
const parsed = computed(() => parseOrthoLine(visibleContent.value))

const doctorName = computed(() => props.note.creator?.name || 'غير معروف')

const initials = computed(() => {
  const name = doctorName.value.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
})

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6']
const avatarColor = computed(() => {
  const name = doctorName.value
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
})

const isEdited = computed(() => {
  const { created_at, updated_at } = props.note
  if (!updated_at || !created_at) return false
  return new Date(updated_at).getTime() - new Date(created_at).getTime() > 60000
})

const displayImages = computed(() =>
  props.images.map((img) => ({
    key: img.id ?? img.key,
    url: img.url,
    name: img.name,
    type: img.type,
    status: 'done',
  }))
)

const onRemoveImage = (key) => {
  const found = props.images.find((img) => (img.id ?? img.key) === key)
  if (found) emit('remove-image', found)
}

const startEdit = () => {
  const p = parsed.value
  editMeta.noteDate = p.meta?.noteDate ?? null
  editMeta.appliance = p.meta?.appliance ?? null
  editMeta.phase = p.meta?.phase ?? null
  editMeta.duration = p.meta?.duration ?? null
  editText.value = p.text
  editing.value = true
}
const cancelEdit = () => {
  editing.value = false
}
const submitEdit = () => {
  const bodyContent = props.isOrthoCase
    ? composeNoteContent(editMeta, editText.value)
    : editText.value.trim()
  // Re-attach whichever images this note already had — editing the text/quick-fields
  // shouldn't drop them.
  const { imageIds } = parseImageTag(props.note.content)
  const content = setImageTag(bodyContent, imageIds)
  if (!content) return
  emit('update', content)
}

// Parent flips `saving` true→false once the PUT settles (success or failure);
// close the editor either way — a failure already shows an error toast, and
// re-opening edit mode is one click away.
watch(
  () => props.saving,
  (isSaving, wasSaving) => {
    if (wasSaving && !isSaving) editing.value = false
  }
)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatFull = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
}

const formatRelative = (dateStr) => {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'الآن'
  if (diffMin < 60) return `منذ ${diffMin} ${diffMin === 1 ? 'دقيقة' : 'دقائق'}`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `منذ ${diffHr} ${diffHr === 1 ? 'ساعة' : 'ساعات'}`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `منذ ${diffDay} ${diffDay === 1 ? 'يوم' : 'أيام'}`
  return formatFull(dateStr)
}
</script>

<style scoped>
.cnc-card {
  display: flex;
  gap: 12px;
  padding: 4px 0 20px;
}
.cnc-card:last-child {
  padding-bottom: 4px;
}

.cnc-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.cnc-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cnc-rail-line {
  flex: 1;
  width: 2px;
  background: rgba(0, 0, 0, 0.08);
  margin-top: 6px;
  border-radius: 1px;
}
.cnc-card:last-child .cnc-rail-line {
  display: none;
}

.cnc-body {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}

.cnc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.cnc-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 2px;
}
.cnc-doctor {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}
.cnc-time {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  color: #94a3b8;
}
.cnc-edited {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 999px;
  padding: 1px 8px;
}
.cnc-actions {
  display: flex;
  flex-shrink: 0;
}

.cnc-content {
  font-size: 13.5px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
}

.cnc-images-label {
  display: flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 10px;
}
</style>
