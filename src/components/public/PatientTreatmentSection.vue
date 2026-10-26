<template>
  <section id="treatment" class="public-card public-card-pad" aria-labelledby="treatment-title">
    <div class="public-card-heading">
      <div><p class="public-section-kicker">{{ labels.treatmentPlan }}</p><h2 id="treatment-title">{{ labels.currentTreatment }}</h2></div>
      <button v-if="treatment" class="public-text-button" type="button" @click="$emit('show-details')">{{ labels.viewDetails }}</button>
    </div>
    <div v-if="treatment" class="treatment-summary">
      <div class="treatment-mainline">
        <span v-if="treatment.tooth" class="tooth-token"><small>{{ labels.tooth }}</small>{{ treatment.tooth }}</span>
        <div><p class="treatment-name">{{ categoryName(treatment.category) }}</p><p class="treatment-subline doctor-chip"><img v-if="showPhoto(treatment.doctor_photo)" :src="treatment.doctor_photo" alt="" class="doctor-photo doctor-photo--lg" referrerpolicy="no-referrer" @error="failedPhotos[treatment.doctor_photo] = true">{{ treatment.doctor || labels.clinicTeam }}</p></div>
      </div>
      <div><span v-if="statusName(treatment.status)" class="public-badge">{{ statusName(treatment.status) }}</span><p class="treatment-subline">{{ labels.started }} {{ formatDate(treatment.date, locale) }}</p></div>
    </div>
    <div v-else class="public-empty"><span class="public-empty-icon"><v-icon>mdi-clipboard-text-outline</v-icon></span><p>{{ labels.noTreatment }}</p></div>

    <template v-if="timeline?.length">
      <div class="public-card-heading" style="margin-top: 25px"><h3 style="margin:0;font-size:1rem">{{ labels.treatmentTimeline }}</h3></div>
      <div class="public-timeline">
        <article v-for="(item, index) in timeline.slice(0, 4)" :key="`${item.date}-${index}`" class="timeline-item">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div><div class="timeline-date">{{ formatDate(item.date, locale) }}</div><p class="timeline-title">{{ categoryName(item.category) }}</p><p v-if="item.doctor || statusName(item.status)" class="timeline-meta"><span v-if="item.doctor" class="doctor-chip"><img v-if="showPhoto(item.doctor_photo)" :src="item.doctor_photo" alt="" class="doctor-photo" referrerpolicy="no-referrer" @error="failedPhotos[item.doctor_photo] = true">{{ item.doctor }}</span><template v-if="item.doctor && statusName(item.status)"> · </template>{{ statusName(item.status) }}</p></div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { reactive } from 'vue'
import { formatPublicDate as formatDate } from '@/utils/publicExperience'
const props = defineProps({ treatment: { type: Object, default: null }, timeline: { type: Array, default: () => [] }, locale: { type: String, default: 'en' }, labels: { type: Object, required: true } })
defineEmits(['show-details'])
const categoryName = (category) => props.locale === 'ar' ? (category?.name_ar || category?.name || category?.name_en || props.labels.treatment) : (category?.name_en || category?.name || category?.name_ar || props.labels.treatment)
// Doctor photos are short-lived signed links; one that fails just leaves the name.
const failedPhotos = reactive({})
const showPhoto = (url) => Boolean(url) && !failedPhotos[url]
const statusName = (status) => props.locale === 'ar' ? (status?.name_ar || status?.name_en || '') : (status?.name_en || status?.name_ar || '')
</script>
