<template>
  <section id="appointments" class="public-card public-card-pad appointment-card" :aria-labelledby="titleId">
    <div class="public-card-heading">
      <div><p class="public-section-kicker">{{ labels.yourSchedule }}</p><h2 :id="titleId">{{ labels.nextAppointment }}</h2></div>
      <v-icon color="var(--clinic-primary)" aria-hidden="true">mdi-calendar-outline</v-icon>
    </div>

    <div v-if="appointment" class="appointment-card-content">
      <div>
        <div class="appointment-date">{{ formatDate(appointment.date, locale, { weekday: 'long' }) }}</div>
        <div class="appointment-time" dir="ltr">{{ formatTime(appointment.time, locale) }}</div>
      </div>
      <div class="appointment-meta">
        <span v-if="appointment.doctor"><v-icon size="17">mdi-account-outline</v-icon>{{ appointment.doctor }}</span>
        <span v-if="appointment.status"><v-icon size="17">mdi-stethoscope</v-icon>{{ statusName }}</span>
      </div>
      <div class="appointment-actions">
        <button class="public-button public-button--soft" type="button" @click="$emit('show-details')"><v-icon size="18">mdi-information-outline</v-icon>{{ labels.viewDetails }}</button>
        <button class="public-button public-button--line" type="button" @click="$emit('calendar')"><v-icon size="18">mdi-calendar-plus-outline</v-icon>{{ labels.addCalendar }}</button>
      </div>
    </div>
    <div v-else class="public-empty">
      <span class="public-empty-icon"><v-icon>mdi-calendar-blank-outline</v-icon></span>
      <p>{{ labels.noAppointment }}</p>
      <a v-if="bookUrl" class="public-button public-button--primary appointment-book" :href="bookUrl"><v-icon size="18">mdi-calendar-plus-outline</v-icon>{{ labels.bookAppointment }}</a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { formatPublicDate as formatDate, formatPublicTime as formatTime } from '@/utils/publicExperience'

const props = defineProps({ appointment: { type: Object, default: null }, locale: { type: String, default: 'en' }, labels: { type: Object, required: true }, bookUrl: { type: String, default: '' } })
defineEmits(['calendar', 'show-details'])
const titleId = 'next-appointment-title'
const statusName = computed(() => props.locale === 'ar'
  ? (props.appointment?.status?.name_ar || props.appointment?.status?.name_en)
  : (props.appointment?.status?.name_en || props.appointment?.status?.name_ar))
</script>
