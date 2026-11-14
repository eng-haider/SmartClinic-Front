<template>
  <v-container fluid class="app-page">
    <h1 class="text-h5 font-weight-bold text-primary mb-4">إعدادات WhatsApp</h1>

    <v-skeleton-loader
      v-if="settingsStore.loadingSettings"
      type="article, actions"
    />

    <v-form
      v-else
      ref="form"
      @submit.prevent="onSave"
    >
      <!-- Step 1: how messages are sent -->
      <v-card class="mb-4" rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold">1. كيف تريد إرسال رسائل الواتساب؟</v-card-title>
        <v-card-text>
          <v-row>
            <v-col v-for="mode in sendModes" :key="mode.value" cols="12" md="6">
              <v-card
                class="mode-card h-100"
                :class="{ 'mode-card--active': formData.send_mode === mode.value }"
                variant="outlined"
                rounded="lg"
                @click="formData.send_mode = mode.value"
              >
                <v-card-text class="d-flex ga-3 align-start">
                  <v-icon size="32" :color="formData.send_mode === mode.value ? 'primary' : 'grey'">{{ mode.icon }}</v-icon>
                  <div class="flex-grow-1">
                    <div class="text-subtitle-1 font-weight-bold">{{ mode.title }}</div>
                    <div class="text-body-2 text-medium-emphasis mt-1">{{ mode.description }}</div>
                  </div>
                  <v-icon v-if="formData.send_mode === mode.value" color="primary">mdi-check-circle</v-icon>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-alert v-if="formData.send_mode === 'device'" type="success" variant="tonal" class="mb-4">
        لا تحتاج أي إعداد آخر. عند إضافة حجز فعّل خيار "إرسال تذكير واتساب"، فيفتح واتساب على جهازك برسالة جاهزة وتضغط إرسال.
      </v-alert>

      <template v-else>
        <!-- Step 2: booking reminder -->
        <v-card class="mb-4" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">2. تذكير الحجز</v-card-title>
          <v-card-text>
            <v-switch
              v-model="formData.booking_reminder_enabled"
              label="أرسل للمريض تذكيراً تلقائياً قبل موعده"
              color="success"
              inset
              hide-details
            />

            <v-row v-if="formData.booking_reminder_enabled" class="mt-2">
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.booking_reminder_minutes"
                  :items="reminderTimes"
                  label="متى يُرسل التذكير؟"
                  prepend-inner-icon="mdi-clock-outline"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.booking_reminder_template"
                  label="اسم القالب في Gupshup"
                  placeholder="booking_reminder"
                  hint="اسم القالب المعتمد كما هو مكتوب في Gupshup (أو Meta)"
                  persistent-hint
                  :rules="[requiredRule]"
                  variant="outlined"
                  dir="ltr"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.booking_reminder_text"
                  label="نص الرسالة"
                  rows="3"
                  auto-grow
                  :rules="[requiredRule]"
                  variant="outlined"
                />
                <div class="d-flex flex-wrap align-center ga-2">
                  <span class="text-caption text-medium-emphasis">أضف إلى النص:</span>
                  <v-chip
                    v-for="variable in reminderVariables"
                    :key="variable.key"
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="insertVariable('booking_reminder_text', variable.key)"
                  >
                    {{ variable.label }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12">
                <v-alert type="info" variant="tonal">
                  <div class="font-weight-bold mb-2">
                    في Gupshup أنشئ قالباً بنفس الاسم وبهذا النص بالضبط، ثم انتظر الموافقة عليه:
                  </div>
                  <div class="template-preview pa-3 rounded mb-2">{{ providerTemplate.text }}</div>
                  <div v-if="providerTemplate.legend.length" class="text-caption mb-1">
                    <span v-for="(label, index) in providerTemplate.legend" :key="index" class="me-3">
                      <span dir="ltr">{{ '{' + '{' + (index + 1) + '}' + '}' }}</span> = {{ label }}
                    </span>
                  </div>
                  <v-btn size="small" variant="text" prepend-icon="mdi-content-copy" @click="copyText(providerTemplate.text)">
                    نسخ النص
                  </v-btn>
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Step 3: patients book from WhatsApp (WhatsAppBookingBot on the API) -->
        <v-card class="mb-4" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">3. الحجز عبر الواتساب</v-card-title>
          <v-card-text>
            <v-switch
              v-model="formData.booking_bot_enabled"
              label="المريض يحجز موعداً بنفسه من الواتساب"
              color="success"
              inset
              hide-details
            />

            <v-row v-if="formData.booking_bot_enabled" class="mt-2">
              <v-col cols="12">
                <v-alert type="info" variant="tonal" density="compact">
                  عندما يراسل المريض رقم العيادة يرد عليه النظام: يختار اليوم ثم الوقت من المواعيد المتاحة
                  (حسب أوقات الدوام ومدة الموعد في إعدادات العيادة)، ثم يكتب اسمه إن لم يكن مسجلاً.
                  يصل الطلب إلى صفحة طلبات الحجز، وعند الموافقة أو الرفض تصله رسالة على الواتساب.
                  يجب إعداد الـ Webhook في الخطوة 4 ليستلم النظام رسائل المرضى.
                </v-alert>
              </v-col>

              <v-col cols="12">
                <v-alert type="success" variant="tonal" density="compact" icon="mdi-whatsapp">
                  وأيضاً كل حجز جديد يُضاف للمريض من أي صفحة (المواعيد، صفحة المراجع، قائمة الانتظار…)
                  أو من المساعد الذكي، تصل المريض عليه رسالة تأكيد الموعد أدناه على الواتساب تلقائياً.
                </v-alert>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.booking_approved_text"
                  label="رسالة تأكيد الموعد"
                  rows="3"
                  auto-grow
                  :rules="[requiredRule]"
                  variant="outlined"
                />
                <div class="d-flex flex-wrap align-center ga-2">
                  <span class="text-caption text-medium-emphasis">أضف إلى النص:</span>
                  <v-chip
                    v-for="variable in reminderVariables"
                    :key="variable.key"
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="insertVariable('booking_approved_text', variable.key)"
                  >
                    {{ variable.label }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.booking_approved_template"
                  label="اسم قالب التأكيد في Gupshup"
                  placeholder="booking_approved"
                  hint="مطلوب ليصل التأكيد لمريض لم يراسل العيادة خلال آخر 24 ساعة (مثل الحجوزات من الصفحات). بدونه تصل الرسالة فقط داخل نافذة الـ 24 ساعة"
                  persistent-hint
                  variant="outlined"
                  dir="ltr"
                />
              </v-col>

              <v-col v-if="formData.booking_approved_template" cols="12">
                <v-alert type="info" variant="tonal">
                  <div class="font-weight-bold mb-2">
                    في Gupshup أنشئ قالباً بنفس الاسم وبهذا النص بالضبط، ثم انتظر الموافقة عليه:
                  </div>
                  <div class="template-preview pa-3 rounded mb-2">{{ approvedTemplate.text }}</div>
                  <div v-if="approvedTemplate.legend.length" class="text-caption mb-1">
                    <span v-for="(label, index) in approvedTemplate.legend" :key="index" class="me-3">
                      <span dir="ltr">{{ '{' + '{' + (index + 1) + '}' + '}' }}</span> = {{ label }}
                    </span>
                  </div>
                  <v-btn size="small" variant="text" prepend-icon="mdi-content-copy" @click="copyText(approvedTemplate.text)">
                    نسخ النص
                  </v-btn>
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Step 4: connect the WhatsApp account -->
        <v-card class="mb-4" rounded="xl">
          <v-card-title class="text-subtitle-1 font-weight-bold">4. ربط حساب الواتساب</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-btn-toggle
                  v-model="formData.driver"
                  color="primary"
                  variant="outlined"
                  mandatory
                  divided
                >
                  <v-btn value="gupshup">Gupshup</v-btn>
                  <v-btn value="meta">Meta Cloud API</v-btn>
                </v-btn-toggle>
              </v-col>

              <template v-if="formData.driver === 'gupshup'">
                <v-col cols="12">
                  <v-alert type="info" variant="tonal" density="compact">
                    القيم من لوحة apps.gupshup.io: اسم التطبيق، ومعرّف التطبيق (appId في رابط صفحة التطبيق)،
                    ورقم المرسل، ومفتاح API من إعدادات الحساب.
                  </v-alert>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.gupshup_app_name"
                    label="اسم التطبيق (App Name)"
                    placeholder="SmartClinicpluse"
                    :rules="[requiredRule]"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.gupshup_app_id"
                    label="معرّف التطبيق (App ID)"
                    placeholder="2790f1ec-7a6a-470e-a370-7f2673301768"
                    :rules="[requiredRule]"
                    variant="outlined"
                    dir="ltr"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.gupshup_source_number"
                    label="رقم المرسل"
                    placeholder="9647700281899"
                    :rules="[requiredRule]"
                    variant="outlined"
                    dir="ltr"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.gupshup_api_key"
                    :type="showAccessToken ? 'text' : 'password'"
                    label="مفتاح API (API Key)"
                    :placeholder="savedKeyHint"
                    persistent-placeholder
                    :hint="savedKeyHint ? KEEP_KEY_HINT : ''"
                    persistent-hint
                    :rules="savedKeyHint ? [] : [requiredRule]"
                    :append-inner-icon="showAccessToken ? 'mdi-eye-off' : 'mdi-eye'"
                    autocomplete="new-password"
                    variant="outlined"
                    @click:append-inner="showAccessToken = !showAccessToken"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.country_code"
                    label="رمز الدولة"
                    placeholder="964"
                    hint="يضاف إلى أرقام المرضى المحلية (07...) عند الإرسال"
                    persistent-hint
                    variant="outlined"
                    dir="ltr"
                  />
                </v-col>
              </template>

              <template v-else>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.whatsapp_phone_number_id"
                    label="WhatsApp Phone Number ID"
                    :rules="[requiredRule]"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.whatsapp_business_account_id"
                    label="WhatsApp Business Account ID"
                    :rules="[requiredRule]"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.whatsapp_access_token"
                    :type="showAccessToken ? 'text' : 'password'"
                    label="WhatsApp Access Token"
                    :placeholder="savedKeyHint"
                    persistent-placeholder
                    :hint="savedKeyHint ? KEEP_KEY_HINT : ''"
                    persistent-hint
                    :rules="savedKeyHint ? [] : [requiredRule]"
                    :append-inner-icon="showAccessToken ? 'mdi-eye-off' : 'mdi-eye'"
                    autocomplete="new-password"
                    variant="outlined"
                    @click:append-inner="showAccessToken = !showAccessToken"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <div class="d-flex align-center ga-2">
                    <v-text-field
                      v-model="formData.whatsapp_webhook_verify_token"
                      label="Webhook Verify Token"
                      :rules="[requiredRule]"
                      variant="outlined"
                      class="flex-grow-1"
                    />
                    <v-btn
                      color="secondary"
                      variant="tonal"
                      @click="generateRandomToken"
                    >
                      Generate Random
                    </v-btn>
                  </div>
                </v-col>
              </template>

              <v-col cols="12">
                <v-btn
                  color="info"
                  variant="tonal"
                  prepend-icon="mdi-connection"
                  :loading="settingsStore.testingConnection"
                  @click="onTestConnection"
                >
                  اختبار الاتصال
                </v-btn>
              </v-col>
            </v-row>

            <v-alert
              v-if="testFeedback"
              :type="testFeedback.success ? 'success' : 'error'"
              variant="tonal"
              class="mt-4"
            >
              <template #title>
                {{ testFeedback.success ? 'تم التحقق من الاتصال' : 'فشل اختبار الاتصال' }}
              </template>

              <div v-if="testFeedback.success && testFeedback.approved_templates" class="d-flex flex-column ga-2">
                <div>القوالب المعتمدة في Gupshup:</div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip v-for="name in testFeedback.approved_templates" :key="name" size="small" dir="ltr">
                    {{ name }}
                  </v-chip>
                  <span v-if="!testFeedback.approved_templates.length">-</span>
                </div>
              </div>

              <div v-else-if="testFeedback.success" class="d-flex flex-column ga-2">
                <div>رقم الهاتف: {{ testFeedback.phone_number || '-' }}</div>
                <div>الاسم الموثّق: {{ testFeedback.verified_name || '-' }}</div>
                <div class="d-flex align-center ga-2">
                  <span>جودة الرقم:</span>
                  <v-chip :color="qualityChipColor(testFeedback.quality_rating)" size="small">
                    {{ testFeedback.quality_rating || 'UNKNOWN' }}
                  </v-chip>
                </div>
              </div>

              <div v-else>
                {{ testFeedback.message || 'حدث خطأ أثناء التحقق من الاتصال.' }}
              </div>
            </v-alert>

            <v-expansion-panels class="mt-4" variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  دليل إعداد Webhook (لاستلام ردود المرضى وحالة الرسائل)
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-skeleton-loader
                    v-if="settingsStore.loadingWebhookInfo"
                    type="paragraph"
                  />

                  <div v-else-if="settingsStore.webhookInfo">
                    <div class="d-flex align-center ga-2 mb-3">
                      <v-text-field
                        :model-value="settingsStore.webhookInfo.callback_url"
                        label="Callback URL"
                        readonly
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                      <v-btn
                        icon="mdi-content-copy"
                        variant="text"
                        @click="copyText(settingsStore.webhookInfo.callback_url)"
                      />
                    </div>

                    <div v-if="settingsStore.webhookInfo.verify_token" class="d-flex align-center ga-2 mb-4">
                      <v-text-field
                        :model-value="settingsStore.webhookInfo.verify_token"
                        label="Verify Token"
                        readonly
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                      <v-btn
                        icon="mdi-content-copy"
                        variant="text"
                        @click="copyText(settingsStore.webhookInfo.verify_token)"
                      />
                    </div>

                    <v-timeline density="compact" side="end" align="start">
                      <v-timeline-item
                        v-for="(instruction, index) in settingsStore.webhookInfo.instructions || []"
                        :key="index"
                        dot-color="primary"
                        size="small"
                      >
                        <div class="text-body-2">{{ instruction }}</div>
                      </v-timeline-item>
                    </v-timeline>

                    <v-alert v-if="settingsStore.webhookInfo.verify_token" type="info" variant="tonal" class="mt-4">
                      Set these values in your Meta Developer Dashboard → WhatsApp → Configuration
                    </v-alert>
                    <v-alert v-else type="info" variant="tonal" class="mt-4">
                      أضف رابط Callback URL في apps.gupshup.io → تطبيقك → Webhooks. الرابط سري، لا تشاركه.
                    </v-alert>
                  </div>

                  <div v-else class="text-medium-emphasis text-center py-4">
                    احفظ الإعدادات أولاً ليظهر رابط الـ Webhook.
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </template>

      <v-btn
        color="primary"
        size="large"
        type="submit"
        prepend-icon="mdi-content-save"
        :loading="settingsStore.savingSettings"
      >
        حفظ الإعدادات
      </v-btn>
    </v-form>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="bottom end"
      timeout="4000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useMessagingSettingsStore } from '@/stores/messaging/settingsStore'

// Same default as BookingReminderService::DEFAULT_TEXT on the API
const DEFAULT_REMINDER_TEXT = 'مرحباً {{patient_name}}، نذكرك بموعدك في {{clinic_name}} يوم {{date}} الساعة {{time}}.'
// Same default as BookingRequestMessenger::DEFAULT_APPROVED_TEXT on the API
const DEFAULT_APPROVED_TEXT = 'مرحباً {{patient_name}}، تم تأكيد موعدك في {{clinic_name}} يوم {{date}} الساعة {{time}}.'

const sendModes = [
  {
    value: 'device',
    icon: 'mdi-cellphone',
    title: 'من واتساب الجهاز',
    description: 'أنت ترسل الرسالة بنفسك: عند الحجز يفتح واتساب على جهازك برسالة جاهزة. مجاني ولا يحتاج إعداد.'
  },
  {
    value: 'api',
    icon: 'mdi-robot-outline',
    title: 'تلقائي عبر API',
    description: 'النظام يرسل تذكير الحجز وحده في الوقت الذي تختاره. يحتاج حساب Gupshup أو Meta.'
  }
]

const reminderTimes = [
  { title: 'قبل الموعد بـ 15 دقيقة', value: 15 },
  { title: 'قبل الموعد بـ 30 دقيقة', value: 30 },
  { title: 'قبل الموعد بساعة', value: 60 },
  { title: 'قبل الموعد بساعتين', value: 120 },
  { title: 'قبل الموعد بـ 3 ساعات', value: 180 },
  { title: 'قبل الموعد بـ 6 ساعات', value: 360 },
  { title: 'قبل الموعد بـ 12 ساعة', value: 720 },
  { title: 'قبل الموعد بيوم (24 ساعة)', value: 1440 }
]

const reminderVariables = [
  { key: 'patient_name', label: 'اسم المريض' },
  { key: 'date', label: 'التاريخ' },
  { key: 'time', label: 'الوقت' },
  { key: 'doctor_name', label: 'اسم الطبيب' },
  { key: 'clinic_name', label: 'اسم العيادة' }
]

const settingsStore = useMessagingSettingsStore()
const form = ref(null)
const showAccessToken = ref(false)

const formData = ref({
  whatsapp_phone_number_id: '',
  // Write-only: the API never sends the saved key back, so this is only a new one
  whatsapp_access_token: '',
  whatsapp_business_account_id: '',
  whatsapp_webhook_verify_token: '',
  // 'device': staff send from their own WhatsApp; 'api': the system sends by itself
  send_mode: 'device',
  booking_reminder_enabled: true,
  booking_reminder_minutes: 60,
  booking_reminder_template: 'booking_reminder',
  booking_reminder_text: DEFAULT_REMINDER_TEXT,
  booking_bot_enabled: false,
  booking_approved_template: '',
  booking_approved_text: DEFAULT_APPROVED_TEXT,
  // 'meta' or 'gupshup'; Gupshup's API key is saved as whatsapp_access_token
  driver: 'gupshup',
  gupshup_app_name: '',
  gupshup_app_id: '',
  gupshup_source_number: '',
  gupshup_api_key: '',
  country_code: '964'
})

// Saved meta is sent back whole, so switching provider keeps the other one's details
const savedMeta = ref({})

// The key saved on the API: only which provider it is for and its last characters.
// Left empty, the key field keeps it; it does not carry over to the other provider.
const KEEP_KEY_HINT = 'المفتاح محفوظ ولا يُعرض لأسباب أمنية. اتركه فارغاً للإبقاء عليه، أو اكتب مفتاحاً جديداً لاستبداله.'
const savedKey = ref(null)
const savedKeyHint = computed(() =>
  savedKey.value?.driver === formData.value.driver ? savedKey.value.hint : '')

function rememberSavedKey(settings) {
  savedKey.value = settings?.has_access_token
    ? { driver: settings.meta?.driver === 'gupshup' ? 'gupshup' : 'meta', hint: settings.access_token_hint }
    : null
}

const snackbar = ref({
  show: false,
  message: '',
  color: 'error'
})

const testFeedback = computed(() => settingsStore.testResult)

// The approved template is the message text with {{1}}, {{2}}… where the placeholders are;
// the API sends the values in that same order
function toProviderTemplate(message) {
  const legend = []
  const text = (message || '').replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    legend.push(reminderVariables.find(v => v.key === key)?.label || key)
    return `{{${legend.length}}}`
  })
  return { text, legend }
}

const providerTemplate = computed(() => toProviderTemplate(formData.value.booking_reminder_text))
const approvedTemplate = computed(() => toProviderTemplate(formData.value.booking_approved_text))

function insertVariable(field, key) {
  const text = formData.value[field] || ''
  formData.value[field] = `${text}${text && !text.endsWith(' ') ? ' ' : ''}{{${key}}}`
}

const requiredRule = (v) => !!v || 'هذا الحقل مطلوب'

function notify(message, color = 'error') {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

function qualityChipColor(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'GREEN') return 'success'
  if (normalized === 'YELLOW') return 'warning'
  if (normalized === 'RED') return 'error'
  return 'grey'
}

function generateRandomToken() {
  formData.value.whatsapp_webhook_verify_token = Math.random().toString(36).slice(2, 14)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || '')
    notify('تم النسخ بنجاح', 'success')
  } catch {
    notify('تعذر نسخ النص')
  }
}

function buildPayload() {
  const data = formData.value
  const meta = {
    ...savedMeta.value,
    send_mode: data.send_mode,
    booking_reminder_enabled: data.booking_reminder_enabled,
    booking_reminder_minutes: data.booking_reminder_minutes,
    booking_reminder_template: data.booking_reminder_template,
    booking_reminder_text: data.booking_reminder_text,
    booking_bot_enabled: data.booking_bot_enabled,
    booking_approved_template: data.booking_approved_template,
    booking_approved_text: data.booking_approved_text,
    driver: data.driver,
    gupshup_app_name: data.gupshup_app_name,
    gupshup_app_id: data.gupshup_app_id,
    gupshup_source_number: data.gupshup_source_number,
    country_code: data.country_code
  }
  // Sending from the device means the system sends nothing by API
  const isActive = data.send_mode === 'api'

  const payload = data.driver === 'gupshup'
    ? { whatsapp_access_token: data.gupshup_api_key, is_active: isActive, meta }
    : {
        whatsapp_phone_number_id: data.whatsapp_phone_number_id,
        whatsapp_access_token: data.whatsapp_access_token,
        whatsapp_business_account_id: data.whatsapp_business_account_id,
        whatsapp_webhook_verify_token: data.whatsapp_webhook_verify_token,
        is_active: isActive,
        meta
      }
  // Without a new key the API keeps (and tests) the saved one
  if (!payload.whatsapp_access_token) delete payload.whatsapp_access_token
  return payload
}

async function onSave() {
  const validation = await form.value?.validate()
  if (!validation?.valid) return

  try {
    const payload = buildPayload()
    const result = await settingsStore.save(payload)
    savedMeta.value = payload.meta
    rememberSavedKey(result?.data)
    formData.value.gupshup_api_key = ''
    formData.value.whatsapp_access_token = ''
    notify('تم حفظ الإعدادات بنجاح', 'success')
    // The webhook URL depends on the provider (and Gupshup's secret is made on save)
    await settingsStore.fetchWebhookInfo()
  } catch (error) {
    notify(error.message)
  }
}

async function onTestConnection() {
  try {
    await settingsStore.testConnection(buildPayload())
    notify('تم تنفيذ اختبار الاتصال', 'success')
  } catch (error) {
    notify(error.message)
  }
}

onMounted(async () => {
  try {
    const [allSettings] = await Promise.all([
      settingsStore.fetchSettings(),
      settingsStore.fetchWebhookInfo()
    ])

    // The API returns every provider's row; this page edits the WhatsApp one
    const settings = [].concat(allSettings || []).find(s => s?.provider === 'whatsapp')

    if (settings) {
      const meta = settings.meta || {}
      const usesGupshup = meta.driver === 'gupshup'
      savedMeta.value = meta
      rememberSavedKey(settings)
      formData.value = {
        ...formData.value,
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id || formData.value.whatsapp_phone_number_id,
        whatsapp_business_account_id: settings.whatsapp_business_account_id || formData.value.whatsapp_business_account_id,
        whatsapp_webhook_verify_token: settings.whatsapp_webhook_verify_token || '',
        // Clinics set up before this choice existed sent by API whenever it was switched on
        send_mode: meta.send_mode || (settings.is_active ? 'api' : 'device'),
        booking_reminder_enabled: meta.booking_reminder_enabled ?? formData.value.booking_reminder_enabled,
        booking_reminder_minutes: meta.booking_reminder_minutes || formData.value.booking_reminder_minutes,
        booking_reminder_template: meta.booking_reminder_template || formData.value.booking_reminder_template,
        booking_reminder_text: meta.booking_reminder_text || formData.value.booking_reminder_text,
        booking_bot_enabled: meta.booking_bot_enabled ?? formData.value.booking_bot_enabled,
        booking_approved_template: meta.booking_approved_template || '',
        booking_approved_text: meta.booking_approved_text || formData.value.booking_approved_text,
        driver: usesGupshup ? 'gupshup' : 'meta',
        gupshup_app_name: meta.gupshup_app_name || '',
        gupshup_app_id: meta.gupshup_app_id || '',
        gupshup_source_number: meta.gupshup_source_number || '',
        country_code: meta.country_code || '964'
      }
    }
  } catch (error) {
    notify(error.message)
  }
})
</script>

<style scoped>
.mode-card {
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.mode-card--active {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.template-preview {
  background: rgba(var(--v-theme-surface), 0.7);
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
