<template>
  <v-container fluid class="py-6">
    <v-card>
      <v-card-title class="text-h6">إعدادات WhatsApp</v-card-title>
      <v-divider />

      <v-card-text>
        <v-skeleton-loader
          v-if="settingsStore.loadingSettings"
          type="article, actions"
        />

        <v-form
          v-else
          ref="form"
          @submit.prevent="onSave"
        >
          <v-row>
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
                :rules="[requiredRule]"
                :append-inner-icon="showAccessToken ? 'mdi-eye-off' : 'mdi-eye'"
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

            <v-col cols="12">
              <v-switch
                v-model="formData.is_active"
                label="تفعيل تكامل WhatsApp"
                color="success"
                inset
              />
            </v-col>

            <v-col cols="12" class="d-flex ga-3 flex-wrap">
              <v-btn
                color="info"
                :loading="settingsStore.testingConnection"
                @click="onTestConnection"
              >
                Test Connection
              </v-btn>

              <v-btn
                color="primary"
                type="submit"
                :loading="settingsStore.savingSettings"
              >
                Save Settings
              </v-btn>
            </v-col>
          </v-row>
        </v-form>

        <v-alert
          v-if="testFeedback"
          :type="testFeedback.success ? 'success' : 'error'"
          variant="tonal"
          class="mt-4"
        >
          <template #title>
            {{ testFeedback.success ? 'تم التحقق من الاتصال' : 'فشل اختبار الاتصال' }}
          </template>

          <div v-if="testFeedback.success" class="d-flex flex-column ga-2">
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

        <v-expansion-panels class="mt-6" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              دليل إعداد Webhook
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

                <div class="d-flex align-center ga-2 mb-4">
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

                <v-alert type="info" variant="tonal" class="mt-4">
                  Set these values in your Meta Developer Dashboard → WhatsApp → Configuration
                </v-alert>
              </div>

              <div v-else class="text-medium-emphasis text-center py-4">
                لا توجد بيانات webhook حاليًا.
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>

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

const settingsStore = useMessagingSettingsStore()
const form = ref(null)
const showAccessToken = ref(false)

const formData = ref({
  whatsapp_phone_number_id: '117809261413484',
  whatsapp_access_token: 'EAAOXKj6735YBRdoky1vDiBo8w1c7pLmVjZBhGZB9Df9ZCaNKLHfiEfMwZCTXIfXuMt5yc9ZC0BD9LJOXROkXJHWfhAKJldUk3ICJW0TqTXZBKR9r7G5Wuf0ba8YitcQfAaYWHabp9McJXGAyLnr3kab19yyQrErlZAV5b6Qy5Yr2edpLfgZCFQjMRmn7ZC6jrpoRflNPoc66JDZAAx1pHeORNtwaQfiEbwSGnV9HEWxOTQiSGq1ieldOUT1y4DdxFC2SBWYkyZB810wLJePPX80jxVhyb93',
  whatsapp_business_account_id: '1010632627052438',
  whatsapp_webhook_verify_token: '',
  is_active: true
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'error'
})

const testFeedback = computed(() => settingsStore.testResult)

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

async function onSave() {
  const validation = await form.value?.validate()
  if (!validation?.valid) return

  try {
    await settingsStore.save(formData.value)
    notify('تم حفظ الإعدادات بنجاح', 'success')
  } catch (error) {
    notify(error.message)
  }
}

async function onTestConnection() {
  const validation = await form.value?.validate()
  if (!validation?.valid) return

  try {
    await settingsStore.testConnection(
      formData.value.whatsapp_phone_number_id,
      formData.value.whatsapp_access_token
    )
    notify('تم تنفيذ اختبار الاتصال', 'success')
  } catch (error) {
    notify(error.message)
  }
}

onMounted(async () => {
  try {
    const [settings] = await Promise.all([
      settingsStore.fetchSettings(),
      settingsStore.fetchWebhookInfo()
    ])

    if (settings) {
      formData.value = {
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id || '117809261413484',
        whatsapp_access_token: settings.whatsapp_access_token || 'EAAOXKj6735YBRdoky1vDiBo8w1c7pLmVjZBhGZB9Df9ZCaNKLHfiEfMwZCTXIfXuMt5yc9ZC0BD9LJOXROkXJHWfhAKJldUk3ICJW0TqTXZBKR9r7G5Wuf0ba8YitcQfAaYWHabp9McJXGAyLnr3kab19yyQrErlZAV5b6Qy5Yr2edpLfgZCFQjMRmn7ZC6jrpoRflNPoc66JDZAAx1pHeORNtwaQfiEbwSGnV9HEWxOTQiSGq1ieldOUT1y4DdxFC2SBWYkyZB810wLJePPX80jxVhyb93',
        whatsapp_business_account_id: settings.whatsapp_business_account_id || '1010632627052438',
        whatsapp_webhook_verify_token: settings.whatsapp_webhook_verify_token || '',
        is_active: settings.is_active ?? true
      }
    }
  } catch (error) {
    notify(error.message)
  }
})
</script>
