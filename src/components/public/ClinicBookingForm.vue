<template>
  <section id="booking" class="public-card public-card-pad booking-card" aria-labelledby="booking-title">
    <template v-if="!submitted">
      <h2 id="booking-title">{{ labels.title }}</h2>
      <p>{{ labels.intro }}</p>
      <form class="booking-form" novalidate @submit.prevent="submit">
        <div class="booking-field"><label for="booking-name">{{ labels.name }}</label><input id="booking-name" v-model.trim="form.name" autocomplete="name" :aria-invalid="Boolean(errors.name)" :aria-describedby="errors.name ? 'booking-name-error' : undefined" required><small v-if="errors.name" id="booking-name-error" class="booking-error">{{ errors.name }}</small></div>
        <div class="booking-field"><label for="booking-phone">{{ labels.phone }}</label><input id="booking-phone" v-model.trim="form.phone" type="tel" inputmode="tel" autocomplete="tel" :aria-invalid="Boolean(errors.phone)" :aria-describedby="errors.phone ? 'booking-phone-error' : undefined" required><small v-if="errors.phone" id="booking-phone-error" class="booking-error">{{ errors.phone }}</small></div>
        <div class="booking-form-row">
          <div class="booking-field"><label for="booking-date">{{ labels.date }}</label><input id="booking-date" v-model="form.preferred_date" type="date" :min="today" :aria-invalid="Boolean(errors.preferred_date)" required><small v-if="errors.preferred_date" class="booking-error">{{ errors.preferred_date }}</small></div>
          <div class="booking-field"><label for="booking-time">{{ labels.time }} <span style="font-weight:400">{{ labels.optional }}</span></label><input id="booking-time" v-model="form.preferred_time" type="time"></div>
        </div>
        <div class="booking-field"><label for="booking-note">{{ labels.note }} <span style="font-weight:400">{{ labels.optional }}</span></label><textarea id="booking-note" v-model.trim="form.note" maxlength="1000"></textarea></div>
        <p v-if="serverError" class="booking-error" role="alert">{{ serverError }}</p>
        <button class="public-button public-button--primary public-button--wide" type="submit" :disabled="submitting"><v-icon size="18">mdi-calendar-check-outline</v-icon>{{ submitting ? labels.sending : labels.submit }}</button>
      </form>
    </template>
    <div v-else class="booking-confirmation" role="status">
      <span class="public-empty-icon"><v-icon>mdi-check</v-icon></span>
      <h3>{{ labels.confirmedTitle }}</h3>
      <p>{{ labels.confirmedText }}</p>
      <p v-if="form.preferred_date" class="public-badge">{{ selectedDate }}</p>
      <button v-if="form.preferred_date" class="public-button public-button--soft" type="button" @click="$emit('calendar', form)"><v-icon size="18">mdi-calendar-plus-outline</v-icon>{{ labels.addCalendar }}</button>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import bookingRequestService from '@/services/bookingRequest.service'
import { formatPublicDate } from '@/utils/publicExperience'

const props = defineProps({ clinicId: { type: String, required: true }, locale: { type: String, default: 'en' }, labels: { type: Object, required: true } })
defineEmits(['calendar'])
const form = reactive({ name: '', phone: '', preferred_date: '', preferred_time: '', note: '' })
const errors = reactive({})
const submitted = ref(false)
const submitting = ref(false)
const serverError = ref('')
const today = new Date().toLocaleDateString('en-CA')
const selectedDate = computed(() => `${formatPublicDate(form.preferred_date, props.locale)}${form.preferred_time ? ` · ${form.preferred_time}` : ''}`)

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!form.name) errors.name = props.labels.nameRequired
  if (!form.phone || form.phone.replace(/\D/g, '').length < 7) errors.phone = props.labels.phoneRequired
  if (!form.preferred_date) errors.preferred_date = props.labels.dateRequired
  return Object.keys(errors).length === 0
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await bookingRequestService.submitPublic(props.clinicId, { ...form, preferred_time: form.preferred_time || null, note: form.note || null })
    submitted.value = true
  } catch (error) {
    const fieldErrors = error?.response?.data?.errors || {}
    Object.entries(fieldErrors).forEach(([key, messages]) => { errors[key] = Array.isArray(messages) ? messages[0] : messages })
    serverError.value = Object.keys(fieldErrors).length ? '' : props.labels.sendError
  } finally {
    submitting.value = false
  }
}
</script>
