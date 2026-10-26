<template>
  <section id="photos" class="public-card public-card-pad" aria-labelledby="photos-title">
    <div class="public-card-heading">
      <div><p class="public-section-kicker">{{ labels.yourRecords }}</p><h2 id="photos-title">{{ labels.treatmentPhotos }}</h2></div>
      <span class="public-badge">{{ allPhotos.length }}</span>
    </div>

    <div class="case-photo-groups">
      <div v-for="(group, groupIndex) in groups" :key="groupIndex" class="case-photo-group">
        <p class="case-photo-group-title">
          <strong>{{ group.title }}</strong>
          <span v-if="group.tooth || group.date">{{ [group.tooth ? `${labels.tooth} ${group.tooth}` : '', group.date ? formatDate(group.date, locale) : ''].filter(Boolean).join(' · ') }}</span>
        </p>
        <div class="case-photo-grid">
          <button
            v-for="photo in group.photos"
            :key="photo.index"
            class="case-photo-thumb"
            type="button"
            :aria-label="`${labels.openPhoto}: ${photoCaption(photo)}`"
            @click="open(photo.index)"
          >
            <img v-if="!failed[photo.index]" :src="photo.url" :alt="photoCaption(photo)" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="failed[photo.index] = true" />
            <v-icon v-else size="26" aria-hidden="true">mdi-image-off-outline</v-icon>
            <span v-if="typeName(photo.type)" class="case-photo-tag">{{ typeName(photo.type) }}</span>
          </button>
        </div>
      </div>
    </div>

    <v-dialog v-model="viewerOpen" max-width="920" aria-labelledby="photo-viewer-title">
      <section v-if="current" class="public-card case-photo-viewer" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
        <div class="public-card-heading case-photo-viewer-heading">
          <div><p class="public-section-kicker">{{ activeIndex + 1 }} / {{ allPhotos.length }}</p><h2 id="photo-viewer-title">{{ photoCaption(current) }}</h2></div>
          <button class="public-icon-button" type="button" :aria-label="labels.close" @click="viewerOpen = false"><v-icon>mdi-close</v-icon></button>
        </div>
        <div class="case-photo-stage">
          <img v-if="!failed[activeIndex]" :key="current.url" :src="current.url" :alt="photoCaption(current)" referrerpolicy="no-referrer" @error="failed[activeIndex] = true" />
          <div v-else class="public-empty public-empty--center"><span class="public-empty-icon"><v-icon>mdi-image-off-outline</v-icon></span><p>{{ labels.photoUnavailable }}</p></div>
        </div>
        <div v-if="allPhotos.length > 1" class="case-photo-nav">
          <button class="public-button public-button--line" type="button" @click="step(-1)"><v-icon size="18">{{ locale === 'ar' ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>{{ labels.previousPhoto }}</button>
          <button class="public-button public-button--line" type="button" @click="step(1)">{{ labels.nextPhoto }}<v-icon size="18">{{ locale === 'ar' ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon></button>
        </div>
      </section>
    </v-dialog>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { formatPublicDate as formatDate } from '@/utils/publicExperience'

const props = defineProps({ photos: { type: Array, default: () => [] }, timeline: { type: Array, default: () => [] }, locale: { type: String, default: 'en' }, labels: { type: Object, required: true } })

const viewerOpen = ref(false)
const activeIndex = ref(0)
// Signed URLs expire after a few minutes; a failed load shows a placeholder instead of a broken image.
const failed = reactive({})

// The patient's own gallery (the dashboard's "Case Photos") comes first, then
// photos attached to individual cases. Each photo carries a page-wide index so
// the viewer can step across groups.
const groups = computed(() => {
  let index = 0
  const sources = [
    { title: props.labels.casePhotos, tooth: null, date: null, images: props.photos },
    ...props.timeline.map((item) => ({ title: categoryName(item.category), tooth: item.tooth, date: item.date, images: item.images })),
  ]
  return sources
    .filter((group) => group.images?.length)
    .map((group) => ({ ...group, photos: group.images.map((image) => ({ ...image, groupTitle: group.title, groupTooth: group.tooth, index: index++ })) }))
})
const allPhotos = computed(() => groups.value.flatMap((group) => group.photos))
const current = computed(() => allPhotos.value[activeIndex.value] || null)

watch(() => [props.photos, props.timeline], () => { Object.keys(failed).forEach((key) => delete failed[key]) })

const categoryName = (category) => props.locale === 'ar' ? (category?.name_ar || category?.name || category?.name_en || props.labels.treatment) : (category?.name_en || category?.name || category?.name_ar || props.labels.treatment)
const typeName = (type) => props.labels.photoTypes?.[type] || ''
const photoCaption = (photo) => [typeName(photo.type), photo.groupTitle, (photo.tooth || photo.groupTooth) ? `${props.labels.tooth} ${photo.tooth || photo.groupTooth}` : ''].filter(Boolean).join(' · ')

function open(index) {
  activeIndex.value = index
  viewerOpen.value = true
}

function step(direction) {
  const count = allPhotos.value.length
  if (count > 1) activeIndex.value = (activeIndex.value + direction + count) % count
}

// Arrow keys follow the reading direction: in Arabic, left means "next".
function onKeydown(event) {
  if (!viewerOpen.value) return
  if (event.key === 'ArrowLeft') step(props.locale === 'ar' ? 1 : -1)
  else if (event.key === 'ArrowRight') step(props.locale === 'ar' ? -1 : 1)
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>
