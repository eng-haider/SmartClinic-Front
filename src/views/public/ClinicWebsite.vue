<template>
  <div ref="pageRoot" class="public-experience clinic-site" :dir="isRtl ? 'rtl' : 'ltr'" :style="brandTokens">
    <ClinicSiteHeader v-if="site" :name="clinic.name" :logo="logo" :labels="labels" />

    <main v-if="loading" class="public-site-shell clinic-section public-skeleton" aria-label="Loading clinic website">
      <div class="clinic-hero-grid"><div class="public-stack"><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-block"></div></div><div class="skeleton-block"></div></div>
    </main>

    <main v-else-if="site" id="top">
      <section class="clinic-hero">
        <div class="public-site-shell clinic-hero-grid">
          <div>
            <span class="clinic-kicker">{{ clinic.name }}</span>
            <h1>{{ labels.heroTitle }}</h1>
            <p>{{ clinic.description || labels.heroDescription }}</p>
            <div class="clinic-hero-actions">
              <a v-if="clinic.enable_online_booking" class="public-button public-button--primary" href="#booking"><v-icon size="18">mdi-calendar-plus-outline</v-icon>{{ labels.book }}</a>
              <a v-if="whatsapp" class="public-button public-button--line" :href="whatsapp" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-whatsapp</v-icon>{{ labels.whatsapp }}</a>
            </div>
          </div>
          <img v-if="clinic.hero_image && !heroFailed" class="clinic-hero-image" :src="clinic.hero_image" :alt="clinic.name" width="560" height="430" @error="heroFailed = true">
          <div v-else class="clinic-hero-placeholder" aria-hidden="true"><v-icon>mdi-cross</v-icon><strong>{{ clinic.name }}</strong></div>
        </div>
      </section>

      <section v-if="clinic.enable_online_booking" class="clinic-section clinic-section--muted">
        <div class="public-site-shell"><ClinicBookingForm :clinic-id="site.booking_clinic_id" :locale="activeLocale" :labels="labels.booking" @calendar="addBookingCalendar" /></div>
      </section>

      <section v-if="services.length" id="services" class="clinic-section">
        <div class="public-site-shell">
          <div class="clinic-section-heading"><div><h2>{{ labels.services }}</h2><p>{{ labels.servicesIntro }}</p></div></div>
          <div class="clinic-services">
            <article v-for="(service, index) in visibleServices" :key="`${service.name}-${index}`" class="clinic-service"><v-icon>mdi-stethoscope</v-icon><h3>{{ serviceName(service) }}</h3><p>{{ service.type || labels.clinicService }}</p></article>
          </div>
        </div>
      </section>

      <section id="about" class="clinic-section clinic-section--muted">
        <div class="public-site-shell clinic-details-grid">
          <section class="public-card clinic-info-card" aria-labelledby="about-title">
            <h2 id="about-title">{{ labels.about }}</h2>
            <p>{{ clinic.description || labels.aboutFallback }}</p>
            <div v-if="doctors.length" class="clinic-doctors" :aria-label="labels.doctors">
              <article v-for="(doctor, index) in doctors" :key="`${doctor.name}-${index}`" class="clinic-doctor"><span class="doctor-avatar" aria-hidden="true">{{ initials(doctor.name) }}</span><div><strong>{{ doctor.name }}</strong><p>{{ doctor.title || labels.clinicTeam }}</p></div></article>
            </div>
          </section>
          <section v-if="hours.length" class="public-card clinic-info-card" aria-labelledby="hours-title">
            <h2 id="hours-title">{{ labels.hours }}</h2>
            <div class="hours-list"><div v-for="hour in hours" :key="hour.key" class="hours-row" :class="{ 'hours-row--today': hour.today }"><span>{{ hour.label }}</span><time>{{ hour.value }}</time></div></div>
          </section>
        </div>
      </section>

      <section id="contact" class="clinic-section">
        <div class="public-site-shell clinic-details-grid">
          <section class="public-card clinic-info-card" aria-labelledby="contact-title">
            <h2 id="contact-title">{{ labels.contact }}</h2>
            <p>{{ labels.contactIntro }}</p>
            <div class="clinic-contact-list">
              <a v-if="phone" class="clinic-contact-link" :href="phone"><v-icon>mdi-phone-outline</v-icon><span dir="ltr">{{ clinic.phone }}</span></a>
              <a v-if="whatsapp" class="clinic-contact-link" :href="whatsapp" target="_blank" rel="noopener noreferrer"><v-icon>mdi-whatsapp</v-icon><span>{{ labels.whatsapp }}</span></a>
              <a v-if="email" class="clinic-contact-link" :href="`mailto:${email}`"><v-icon>mdi-email-outline</v-icon><span>{{ email }}</span></a>
              <a v-if="directions" class="clinic-contact-link" :href="directions" target="_blank" rel="noopener noreferrer"><v-icon>mdi-map-marker-outline</v-icon><span>{{ clinic.address || labels.directions }}</span></a>
              <a v-for="social in socials" :key="social.name" class="clinic-contact-link" :href="social.href" target="_blank" rel="noopener noreferrer"><v-icon>mdi-open-in-new</v-icon><span>{{ social.name }}</span></a>
            </div>
          </section>
          <section v-if="clinic.address || clinic.location" class="public-card clinic-info-card" aria-labelledby="location-title">
            <h2 id="location-title">{{ labels.location }}</h2><p>{{ clinic.address || clinic.location }}</p>
            <a v-if="directions" class="public-button public-button--soft" style="margin-top:20px" :href="directions" target="_blank" rel="noopener noreferrer"><v-icon size="18">mdi-map-marker-outline</v-icon>{{ labels.getDirections }}</a>
          </section>
        </div>
      </section>
    </main>

    <main v-else class="public-site-shell public-error-state"><section class="public-card public-error-card" role="alert"><span class="public-empty-icon" style="margin:auto"><v-icon>mdi-hospital-building-outline</v-icon></span><h1>{{ labels.unavailable }}</h1><p>{{ labels.unavailableHint }}</p><button class="public-button public-button--primary" type="button" @click="loadSite">{{ labels.tryAgain }}</button></section></main>

    <footer v-if="site" class="clinic-footer"><div class="public-site-shell clinic-footer-grid"><div><strong>{{ clinic.name }}</strong><p v-if="clinic.address">{{ clinic.address }}</p></div><a href="/about">{{ labels.poweredBy }}</a></div></footer>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ClinicSiteHeader from '@/components/public/ClinicSiteHeader.vue'
import ClinicBookingForm from '@/components/public/ClinicBookingForm.vue'
import { publicClinicService } from '@/services/publicClinic.service'
import { clinicBrandTokens, downloadCalendar, externalHref, mapsHref, phoneHref, whatsappHref } from '@/utils/publicExperience'
import { resolveLogoUrl } from '@/composables/useClinicSettings'
import { usePublicPageMeta } from '@/composables/usePublicPageMeta'

const route = useRoute()
const { locale } = useI18n()
const loading = ref(true)
const site = ref(null)
// The hero URL is free text in settings; a link that isn't an image falls back to the placeholder.
const heroFailed = ref(false)
const pageRoot = ref(null)
const activeLocale = computed(() => ['ar', 'en'].includes(locale.value) ? locale.value : 'en')
const isRtl = computed(() => activeLocale.value === 'ar')
const clinic = computed(() => site.value?.clinic || {})
const logo = computed(() => resolveLogoUrl(clinic.value.logo))
const brandTokens = computed(() => clinicBrandTokens(clinic.value.theme_color))
const services = computed(() => site.value?.services || [])
const visibleServices = computed(() => services.value.slice(0, 8))
const doctors = computed(() => site.value?.doctors || [])
const phone = computed(() => phoneHref(clinic.value.phone))
const whatsapp = computed(() => whatsappHref(clinic.value.whatsapp || (clinic.value.enable_whatsapp ? clinic.value.phone : '')))
const email = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clinic.value.email || '') ? clinic.value.email : '')
const directions = computed(() => mapsHref(clinic.value.location || clinic.value.address))
const socials = computed(() => [
  ['Instagram', clinic.value.instagram], ['Facebook', clinic.value.facebook], ['X', clinic.value.twitter],
].map(([name, href]) => ({ name, href: externalHref(href) })).filter(item => item.href))

const words = {
  en: { navigation: 'Clinic navigation', menu: 'Open menu', home: 'Home', services: 'Services', about: 'About', contact: 'Contact', book: 'Book appointment', whatsapp: 'WhatsApp', heroTitle: 'Professional healthcare, made personal.', heroDescription: 'Clear, considered care from a clinic that puts your comfort first.', heroDefault: 'Personal care, thoughtfully delivered by a team that is here for you.', servicesIntro: 'Care designed around what you need.', clinicService: 'Clinic service', doctors: 'Doctors', clinicTeam: 'Clinic team', aboutFallback: 'A clinic focused on making every visit feel clear, comfortable and personal.', hours: 'Working hours', contactIntro: 'Choose the easiest way to reach the clinic.', location: 'Location', directions: 'Directions', getDirections: 'Get directions', unavailable: 'This clinic website is unavailable', unavailableHint: 'Please check the link or contact the clinic directly.', tryAgain: 'Try again', poweredBy: 'Powered by Smart Clinic', booking: { title: 'Request an appointment', intro: 'Choose a preferred time. The clinic will contact you to confirm your visit.', name: 'Your name', phone: 'Phone number', date: 'Preferred date', time: 'Preferred time', note: 'A note for the clinic', optional: 'optional', submit: 'Send appointment request', sending: 'Sending request…', nameRequired: 'Please enter your name.', phoneRequired: 'Please enter a valid phone number.', dateRequired: 'Please choose a preferred date.', sendError: 'We could not send your request right now. Please try again or contact the clinic.', confirmedTitle: 'Appointment request received', confirmedText: 'The clinic will contact you to confirm your appointment.', addCalendar: 'Add to calendar' } },
  ar: { navigation: 'تنقل العيادة', menu: 'فتح القائمة', home: 'الرئيسية', services: 'الخدمات', about: 'عن العيادة', contact: 'تواصل', book: 'احجز موعداً', whatsapp: 'واتساب', heroTitle: 'رعاية صحية مهنية، بلمسة شخصية.', heroDescription: 'رعاية واضحة ومدروسة من عيادة تضع راحتك أولاً.', heroDefault: 'رعاية شخصية يقدمها فريق موجود دائماً لأجلك.', servicesIntro: 'رعاية مصممة وفقاً لما تحتاجه.', clinicService: 'خدمة العيادة', doctors: 'الأطباء', clinicTeam: 'فريق العيادة', aboutFallback: 'عيادة تركز على جعل كل زيارة واضحة ومريحة وشخصية.', hours: 'ساعات العمل', contactIntro: 'اختر أسهل طريقة للتواصل مع العيادة.', location: 'الموقع', directions: 'الاتجاهات', getDirections: 'احصل على الاتجاهات', unavailable: 'موقع العيادة غير متاح', unavailableHint: 'يرجى التحقق من الرابط أو التواصل مع العيادة مباشرة.', tryAgain: 'أعد المحاولة', poweredBy: 'مدعوم من سمارت كلينك', booking: { title: 'اطلب موعداً', intro: 'اختر الوقت المفضل لديك، وستتواصل العيادة لتأكيد الزيارة.', name: 'الاسم', phone: 'رقم الهاتف', date: 'التاريخ المفضل', time: 'الوقت المفضل', note: 'ملاحظة للعيادة', optional: 'اختياري', submit: 'إرسال طلب الموعد', sending: 'جارٍ إرسال الطلب…', nameRequired: 'يرجى إدخال الاسم.', phoneRequired: 'يرجى إدخال رقم هاتف صحيح.', dateRequired: 'يرجى اختيار التاريخ المفضل.', sendError: 'تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى أو التواصل مع العيادة.', confirmedTitle: 'تم استلام طلب الموعد', confirmedText: 'ستتواصل العيادة معك لتأكيد الموعد.', addCalendar: 'إضافة للتقويم' } },
}
const labels = computed(() => words[activeLocale.value])
const serviceName = (service) => activeLocale.value === 'ar' ? (service.name_ar || service.name || service.name_en) : (service.name_en || service.name || service.name_ar)
const initials = (name) => String(name || '').trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const dayNames = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] }
const hours = computed(() => dayKeys.map((key, index) => {
  const raw = clinic.value.working_hours?.[key]
  const value = typeof raw === 'object' ? (raw.enabled ? `${raw.from} – ${raw.to}` : labels.value.closed || 'Closed') : (raw || (activeLocale.value === 'ar' ? 'مغلق' : 'Closed'))
  return { key, label: dayNames[activeLocale.value][index], value, today: new Date().getDay() === index }
}).filter(item => item.value))

const title = computed(() => clinic.value.name || 'Clinic')
const description = computed(() => clinic.value.description || labels.value.heroDescription)
const structuredData = computed(() => !site.value ? null : {
  '@context': 'https://schema.org', '@type': 'MedicalClinic', name: clinic.value.name,
  url: `${window.location.origin}/clinic/${site.value.slug}`, telephone: clinic.value.phone || undefined,
  logo: logo.value || undefined, image: clinic.value.hero_image || logo.value || undefined,
  address: clinic.value.address ? { '@type': 'PostalAddress', streetAddress: clinic.value.address } : undefined,
  openingHours: hours.value.map(hour => `${hour.key.slice(0, 2)} ${hour.value}`).filter(hour => !/closed|مغلق/i.test(hour)),
  availableService: visibleServices.value.map(service => ({ '@type': 'MedicalProcedure', name: serviceName(service) })),
})
usePublicPageMeta({ title, description, image: computed(() => clinic.value.hero_image || logo.value), canonical: computed(() => `${window.location.origin}/clinic/${route.params.slug || ''}`), structuredData })

function addBookingCalendar(form) {
  downloadCalendar({ title: clinic.value.name || labels.value.book, date: form.preferred_date, time: form.preferred_time, description: labels.value.booking.confirmedText, location: clinic.value.address || '' })
}

async function loadSite() {
  loading.value = true
  site.value = null
  heroFailed.value = false
  try {
    const response = await publicClinicService.getBySlug(String(route.params.slug || ''))
    site.value = response?.data || null
  } catch {
    site.value = null
  } finally {
    loading.value = false
  }
  scrollToHash()
}

// Links such as the patient portal's "Book appointment" arrive with #booking,
// but the section only exists once the site has loaded. Images and fonts above
// it can still resize (or fail) afterwards, so keep it aligned for a few
// seconds - and stop as soon as the visitor scrolls somewhere else.
async function scrollToHash() {
  if (!route.hash) return
  await nextTick()
  const target = document.getElementById(decodeURIComponent(route.hash.slice(1)))
  if (!target) return
  let scrolledTo = null
  const observer = new ResizeObserver(() => {
    if (scrolledTo !== null && window.scrollY !== scrolledTo) return observer.disconnect()
    target.scrollIntoView({ block: 'start' })
    scrolledTo = window.scrollY
  })
  // The page root, not body: body keeps a fixed height while content overflows it.
  observer.observe(pageRoot.value || target)
  setTimeout(() => observer.disconnect(), 3000)
}

onMounted(loadSite)
watch(() => route.params.slug, (slug, previous) => { if (slug && slug !== previous) loadSite() })
</script>
