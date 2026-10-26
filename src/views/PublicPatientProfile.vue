<template>
  <div class="public-experience" :dir="isRtl ? 'rtl' : 'ltr'" :style="brandTokens">
    <PatientPortalHeader
      :clinic-name="clinic.name"
      :logo="clinicLogo"
      :whatsapp="clinicWhatsApp"
      :locale="activeLocale"
      :labels="labels"
      @toggle-language="toggleLanguage"
    />

    <PatientPortalSkeleton v-if="loading" :slow="slowNetwork" :labels="labels" />

    <main v-else-if="portal" class="public-patient-main public-shell">
      <div class="public-greeting">
        <p class="public-eyebrow">{{ greeting }}</p>
        <h1>{{ labels.hello }}, {{ firstName }}</h1>
        <p>{{ labels.latestInfo }}</p>
      </div>

      <p v-if="slowNetwork" class="public-notice"><v-icon size="18">mdi-wifi-strength-1-alert</v-icon>{{ labels.slowNetwork }}</p>

      <div class="public-grid public-grid--patient">
        <div class="public-stack">
          <PatientAppointmentCard
            :appointment="portal.next_appointment"
            :locale="activeLocale"
            :labels="labels"
            :book-url="clinic.enable_online_booking && clinic.public_website_path ? `${clinic.public_website_path}#booking` : ''"
            @calendar="addAppointmentCalendar"
            @show-details="appointmentDialog = true"
          />

          <nav class="public-quick-actions" :aria-label="labels.quickActions">
            <a href="#appointments" class="public-quick-action"><v-icon size="22">mdi-calendar-outline</v-icon><span>{{ labels.appointments }}</span></a>
            <a href="#treatment" class="public-quick-action"><v-icon size="22">mdi-stethoscope</v-icon><span>{{ labels.treatment }}</span></a>
            <a href="#payments" class="public-quick-action"><v-icon size="22">mdi-credit-card-outline</v-icon><span>{{ labels.payments }}</span></a>
            <a href="#more" class="public-quick-action"><v-icon size="22">mdi-file-document-outline</v-icon><span>{{ labels.prescription }}</span></a>
          </nav>

          <PatientTreatmentSection
            :treatment="portal.current_treatment"
            :timeline="portal.treatment_timeline"
            :locale="activeLocale"
            :labels="labels"
            @show-details="treatmentDialog = true"
          />

          <PatientCasePhotos
            v-if="hasCasePhotos"
            :photos="portal.photos"
            :timeline="portal.treatment_timeline"
            :locale="activeLocale"
            :labels="labels"
          />
        </div>

        <aside class="public-stack">
          <PatientFinanceSection
            :summary="portal.financial_summary"
            :payments="portal.payment_history"
            :locale="activeLocale"
            :labels="labels"
          />
          <PatientSharedItems :labels="labels" />
          <section v-if="hasContactActions" class="public-card public-card-pad patient-help" aria-labelledby="help-title">
            <div class="public-card-heading"><div><p class="public-section-kicker">{{ labels.needHelp }}</p><h2 id="help-title">{{ labels.contactClinic }}</h2></div><v-icon color="var(--clinic-primary)">mdi-help-circle-outline</v-icon></div>
            <div class="help-actions">
              <a v-if="clinicWhatsApp" class="public-button public-button--primary" :href="clinicWhatsApp" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-whatsapp</v-icon>{{ labels.whatsapp }}</a>
              <a v-if="clinicPhone" class="public-button public-button--line" :href="clinicPhone"><v-icon size="18">mdi-phone-outline</v-icon>{{ labels.call }}</a>
              <a v-if="clinicMaps" class="public-button public-button--line" :href="clinicMaps" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-map-marker-outline</v-icon>{{ labels.directions }}</a>
            </div>
          </section>
        </aside>
      </div>
    </main>

    <main v-else class="public-shell public-error-state">
      <section class="public-card public-error-card" role="alert">
        <span class="public-empty-icon" style="margin:auto"><v-icon>mdi-shield-alert-outline</v-icon></span>
        <h1>{{ labels.linkUnavailable }}</h1>
        <p>{{ labels.linkUnavailableHint }}</p>
        <button class="public-button public-button--primary" type="button" @click="fetchPortal">{{ labels.tryAgain }}</button>
      </section>
    </main>

    <v-dialog v-model="appointmentDialog" max-width="460" aria-labelledby="appointment-dialog-title">
      <section class="public-card public-card-pad" v-if="portal?.next_appointment">
        <div class="public-card-heading"><h2 id="appointment-dialog-title">{{ labels.appointmentDetails }}</h2><button class="public-icon-button" type="button" :aria-label="labels.close" @click="appointmentDialog = false"><v-icon>mdi-close</v-icon></button></div>
        <p class="appointment-date">{{ formatDate(portal.next_appointment.date, activeLocale, { weekday: 'long' }) }}</p>
        <p class="appointment-time" dir="ltr">{{ formatTime(portal.next_appointment.time, activeLocale) }}</p>
        <p v-if="portal.next_appointment.doctor" class="treatment-subline">{{ portal.next_appointment.doctor }}</p>
        <button class="public-button public-button--soft" type="button" style="margin-top:16px" @click="addAppointmentCalendar"><v-icon size="18">mdi-calendar-plus-outline</v-icon>{{ labels.addCalendar }}</button>
      </section>
    </v-dialog>

    <v-dialog v-model="treatmentDialog" max-width="560" aria-labelledby="treatment-dialog-title">
      <section class="public-card public-card-pad">
        <div class="public-card-heading"><h2 id="treatment-dialog-title">{{ labels.treatmentTimeline }}</h2><button class="public-icon-button" type="button" :aria-label="labels.close" @click="treatmentDialog = false"><v-icon>mdi-close</v-icon></button></div>
        <PatientTreatmentSection :treatment="portal?.current_treatment" :timeline="portal?.treatment_timeline" :locale="activeLocale" :labels="labels" />
      </section>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { patientService } from '@/services/patient.service'
import PatientPortalHeader from '@/components/public/PatientPortalHeader.vue'
import PatientPortalSkeleton from '@/components/public/PatientPortalSkeleton.vue'
import PatientAppointmentCard from '@/components/public/PatientAppointmentCard.vue'
import PatientTreatmentSection from '@/components/public/PatientTreatmentSection.vue'
import PatientCasePhotos from '@/components/public/PatientCasePhotos.vue'
import PatientFinanceSection from '@/components/public/PatientFinanceSection.vue'
import PatientSharedItems from '@/components/public/PatientSharedItems.vue'
import { clinicBrandTokens, downloadCalendar, formatPublicDate as formatDate, formatPublicTime as formatTime, mapsHref, phoneHref, whatsappHref } from '@/utils/publicExperience'
import { resolveLogoUrl } from '@/composables/useClinicSettings'
import { usePublicPageMeta } from '@/composables/usePublicPageMeta'

const route = useRoute()
const { locale } = useI18n()
const loading = ref(true)
const portal = ref(null)
const slowNetwork = ref(false)
const appointmentDialog = ref(false)
const treatmentDialog = ref(false)
let slowTimer

const activeLocale = computed(() => ['ar', 'en'].includes(locale.value) ? locale.value : 'en')
const isRtl = computed(() => activeLocale.value === 'ar')
const clinic = computed(() => portal.value?.clinic || {})
const clinicLogo = computed(() => resolveLogoUrl(clinic.value.logo))
const brandTokens = computed(() => clinicBrandTokens(clinic.value.theme_color))
const firstName = computed(() => String(portal.value?.name || '').trim().split(/\s+/)[0] || labels.value.patient)
const clinicPhone = computed(() => phoneHref(clinic.value.phone))
const clinicWhatsApp = computed(() => whatsappHref(clinic.value.whatsapp || (clinic.value.enable_whatsapp ? clinic.value.phone : '')))
const clinicMaps = computed(() => mapsHref(clinic.value.location || clinic.value.address))
const hasCasePhotos = computed(() => Boolean(portal.value?.photos?.length) || (portal.value?.treatment_timeline || []).some((item) => item.images?.length))
const hasContactActions = computed(() => Boolean(clinicPhone.value || clinicWhatsApp.value || clinicMaps.value))
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (activeLocale.value === 'ar') return hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير'
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

const copy = {
  en: { portal: 'Patient portal', changeLanguage: 'Change language', contact: 'Contact', hello: 'Hello', patient: 'there', latestInfo: 'Here is your latest clinic information.', slowNetwork: 'This is taking a little longer than usual. Your information is still loading.', quickActions: 'Quick actions', appointments: 'Appointments', treatment: 'Treatment', payments: 'Payments', prescription: 'Prescription', yourSchedule: 'Your schedule', nextAppointment: 'Next appointment', viewDetails: 'View details', addCalendar: 'Add to calendar', noAppointment: 'No upcoming appointments.', bookAppointment: 'Book appointment', treatmentPlan: 'Treatment plan', currentTreatment: 'Current treatment', treatmentTimeline: 'Treatment timeline', tooth: 'Tooth', clinicTeam: 'Clinic team', started: 'Started', noTreatment: 'No active treatment right now.', finance: 'Your account', treatmentTotal: 'Treatment total', paid: 'Paid', remaining: 'Remaining', paymentHistory: 'Payment history', noPayments: 'No payments recorded yet.', noBalance: 'No remaining balance.', yourRecords: 'Your records', prescriptionsDocuments: 'Prescriptions & documents', noSharedItems: 'No prescriptions or documents have been shared yet.', sharedItemsHint: 'When your clinic shares an item, it will appear here.', needHelp: 'Need help?', contactClinic: 'Contact clinic', whatsapp: 'WhatsApp', call: 'Call clinic', directions: 'Directions', linkUnavailable: 'This link is unavailable', linkUnavailableHint: 'It may have expired or been turned off. Please contact the clinic for a new link.', tryAgain: 'Try again', appointmentDetails: 'Appointment details', close: 'Close', treatmentPhotos: 'Treatment photos', casePhotos: 'Case photos', openPhoto: 'Open photo', previousPhoto: 'Previous', nextPhoto: 'Next', photoUnavailable: "This photo couldn't load. Refresh the page and try again.", photoTypes: { before: 'Before', after: 'After', xray: 'X-ray', treatment: 'Treatment', prescription: 'Prescription' } },
  ar: { portal: 'بوابة المريض', changeLanguage: 'تغيير اللغة', contact: 'تواصل', hello: 'مرحباً', patient: 'بك', latestInfo: 'إليك أحدث معلوماتك من العيادة.', slowNetwork: 'يستغرق الأمر وقتاً أطول من المعتاد. ما زالت معلوماتك قيد التحميل.', quickActions: 'إجراءات سريعة', appointments: 'المواعيد', treatment: 'العلاج', payments: 'المدفوعات', prescription: 'الوصفة', yourSchedule: 'مواعيدك', nextAppointment: 'موعدك القادم', viewDetails: 'عرض التفاصيل', addCalendar: 'إضافة للتقويم', noAppointment: 'لا توجد مواعيد قادمة.', bookAppointment: 'احجز موعداً', treatmentPlan: 'خطة العلاج', currentTreatment: 'العلاج الحالي', treatmentTimeline: 'سجل العلاج', tooth: 'سن', clinicTeam: 'فريق العيادة', started: 'بدأ في', noTreatment: 'لا يوجد علاج نشط حالياً.', finance: 'حسابك', treatmentTotal: 'إجمالي العلاج', paid: 'المدفوع', remaining: 'المتبقي', paymentHistory: 'سجل الدفعات', noPayments: 'لا توجد دفعات مسجلة بعد.', noBalance: 'لا يوجد مبلغ متبقٍ.', yourRecords: 'سجلاتك', prescriptionsDocuments: 'الوصفات والمستندات', noSharedItems: 'لم تتم مشاركة وصفات أو مستندات بعد.', sharedItemsHint: 'عندما تشارك العيادة عنصراً، سيظهر هنا.', needHelp: 'هل تحتاج مساعدة؟', contactClinic: 'تواصل مع العيادة', whatsapp: 'واتساب', call: 'اتصل بالعيادة', directions: 'الاتجاهات', linkUnavailable: 'هذا الرابط غير متاح', linkUnavailableHint: 'ربما انتهت صلاحيته أو تم إيقافه. يرجى التواصل مع العيادة للحصول على رابط جديد.', tryAgain: 'أعد المحاولة', appointmentDetails: 'تفاصيل الموعد', close: 'إغلاق', treatmentPhotos: 'صور العلاج', casePhotos: 'صور الحالة', openPhoto: 'فتح الصورة', previousPhoto: 'السابقة', nextPhoto: 'التالية', photoUnavailable: 'تعذّر تحميل الصورة. حدّث الصفحة وحاول مرة أخرى.', photoTypes: { before: 'قبل', after: 'بعد', xray: 'أشعة', treatment: 'علاج', prescription: 'وصفة' } },
}
const labels = computed(() => copy[activeLocale.value])

const title = computed(() => clinic.value.name ? `${clinic.value.name} | ${labels.value.portal}` : labels.value.portal)
usePublicPageMeta({ title, noindex: true })

function toggleLanguage() {
  locale.value = activeLocale.value === 'ar' ? 'en' : 'ar'
  localStorage.setItem('locale', locale.value)
  document.documentElement.lang = locale.value
  document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
}

function addAppointmentCalendar() {
  const appointment = portal.value?.next_appointment
  if (!appointment) return
  downloadCalendar({ title: clinic.value.name || labels.value.nextAppointment, date: appointment.date, time: appointment.time, description: appointment.doctor || '', location: clinic.value.address || '' })
}

async function fetchPortal() {
  const token = String(route.params.token || '')
  loading.value = true
  portal.value = null
  slowNetwork.value = false
  clearTimeout(slowTimer)
  slowTimer = setTimeout(() => { slowNetwork.value = true }, 1500)
  try {
    const response = await patientService.getPublicPatientByToken(token, route.query.clinic)
    portal.value = response?.data || null
  } catch {
    portal.value = null
  } finally {
    clearTimeout(slowTimer)
    loading.value = false
  }
}

onMounted(fetchPortal)
onBeforeUnmount(() => clearTimeout(slowTimer))
watch(() => route.params.token, (token, previous) => { if (token && token !== previous) fetchPortal() })
</script>
