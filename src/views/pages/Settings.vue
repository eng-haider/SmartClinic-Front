<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('settings.title') }}</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-tabs v-model="activeTab" bg-color="primary">
            <v-tab value="caseCategories">
              <v-icon start>mdi-tag-multiple</v-icon>
              {{ $t('settings.caseCategories') }}
            </v-tab>
            <v-tab value="general">
              <v-icon start>mdi-cog</v-icon>
              {{ $t('settings.general') }}
            </v-tab>
            <v-tab value="clinic">
              <v-icon start>mdi-hospital-building</v-icon>
              {{ $t('settings.clinic') }}
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Case Categories Tab -->
            <v-window-item value="caseCategories">
              <CaseCategories />
            </v-window-item>

            <!-- General Settings Tab -->
            <v-window-item value="general">
              <v-card-text>
                <v-alert type="info" variant="tonal">
                  {{ $t('messages.featureComingSoon') }}
                </v-alert>
              </v-card-text>
            </v-window-item>

            <!-- Clinic Settings Tab -->
            <v-window-item value="clinic">
              <v-card-text class="pa-6">
                <!-- Loading State -->
                <div v-if="loadingSettings" class="text-center py-8">
                  <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                  <p class="mt-4 text-medium-emphasis">{{ $t('common.loading') }}</p>
                </div>

                <!-- Error State -->
                <v-alert v-else-if="settingsError" type="error" variant="tonal" class="mb-4">
                  {{ settingsError }}
                  <template v-slot:append>
                    <v-btn variant="text" @click="loadClinicSettings">{{ $t('common.retry') || 'Retry' }}</v-btn>
                  </template>
                </v-alert>

                <!-- Settings Form -->
                <v-form v-else ref="settingsForm" v-model="formValid" @submit.prevent="saveAllSettings">
                  <!-- Logo Upload Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-image</v-icon>
                      {{ $t('clinicSettings.logo') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row align="center">
                        <v-col cols="12" md="4" class="text-center">
                          <v-avatar size="150" class="border elevation-2" color="grey-lighten-3">
                            <v-img 
                              v-if="logoPreview || clinicForm.logo" 
                              :src="logoPreview || clinicForm.logo"
                              cover
                            ></v-img>
                            <v-icon v-else size="64" color="grey">mdi-hospital-building</v-icon>
                          </v-avatar>
                        </v-col>
                        <v-col cols="12" md="8">
                          <v-file-input
                            v-model="logoFile"
                            :label="$t('clinicSettings.uploadLogo')"
                            accept="image/png, image/jpeg, image/jpg, image/gif, image/svg+xml"
                            prepend-icon="mdi-camera"
                            variant="outlined"
                            :hint="$t('clinicSettings.logoHint')"
                            persistent-hint
                            @update:modelValue="handleLogoChange"
                            :disabled="!canEdit"
                          ></v-file-input>
                          <v-btn
                            v-if="logoFile"
                            color="primary"
                            class="mt-3"
                            :loading="uploadingLogo"
                            :disabled="!canEdit"
                            @click="uploadLogo"
                          >
                            <v-icon start>mdi-upload</v-icon>
                            {{ $t('clinicSettings.uploadLogo') }}
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Basic Information Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-information</v-icon>
                      {{ $t('clinicSettings.basicInfo') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.clinic_name"
                            :label="$t('clinicSettings.clinicName')"
                            prepend-inner-icon="mdi-hospital-building"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.phone"
                            :label="$t('clinicSettings.phone')"
                            prepend-inner-icon="mdi-phone"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.email"
                            :label="$t('clinicSettings.email')"
                            prepend-inner-icon="mdi-email"
                            variant="outlined"
                            type="email"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.website"
                            :label="$t('clinicSettings.website')"
                            prepend-inner-icon="mdi-web"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-textarea
                            v-model="clinicForm.address"
                            :label="$t('clinicSettings.address')"
                            prepend-inner-icon="mdi-map-marker"
                            variant="outlined"
                            rows="2"
                            :disabled="!canEdit"
                          ></v-textarea>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Appointment Settings Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-calendar-clock</v-icon>
                      {{ $t('clinicSettings.appointmentSettings') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="clinicForm.appointment_duration"
                            :label="$t('clinicSettings.appointmentDuration')"
                            prepend-inner-icon="mdi-clock-outline"
                            variant="outlined"
                            type="number"
                            suffix="min"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="clinicForm.max_daily_appointments"
                            :label="$t('clinicSettings.maxDailyAppointments')"
                            prepend-inner-icon="mdi-calendar-multiple"
                            variant="outlined"
                            type="number"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="clinicForm.booking_buffer"
                            :label="$t('clinicSettings.bookingBuffer')"
                            prepend-inner-icon="mdi-timer-sand"
                            variant="outlined"
                            type="number"
                            suffix="min"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-switch
                            v-model="clinicForm.enable_online_booking"
                            :label="$t('clinicSettings.enableOnlineBooking')"
                            color="primary"
                            :disabled="!canEdit"
                          ></v-switch>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Notification Settings Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-bell</v-icon>
                      {{ $t('clinicSettings.notificationSettings') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row>
                        <v-col cols="12" md="4">
                          <v-switch
                            v-model="clinicForm.enable_sms"
                            :label="$t('clinicSettings.enableSms')"
                            color="primary"
                            :disabled="!canEdit"
                          ></v-switch>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-switch
                            v-model="clinicForm.enable_email"
                            :label="$t('clinicSettings.enableEmail')"
                            color="primary"
                            :disabled="!canEdit"
                          ></v-switch>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-switch
                            v-model="clinicForm.enable_whatsapp"
                            :label="$t('clinicSettings.enableWhatsapp')"
                            color="primary"
                            :disabled="!canEdit"
                          ></v-switch>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="clinicForm.reminder_hours"
                            :label="$t('clinicSettings.reminderHours')"
                            prepend-inner-icon="mdi-bell-ring"
                            variant="outlined"
                            type="number"
                            suffix="hours"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Financial Settings Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-currency-usd</v-icon>
                      {{ $t('clinicSettings.financialSettings') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="clinicForm.currency"
                            :label="$t('clinicSettings.currency')"
                            :items="currencyOptions"
                            prepend-inner-icon="mdi-currency-usd"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-select>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="clinicForm.tax_rate"
                            :label="$t('clinicSettings.taxRate')"
                            prepend-inner-icon="mdi-percent"
                            variant="outlined"
                            type="number"
                            suffix="%"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="clinicForm.late_payment_fee"
                            :label="$t('clinicSettings.latePaymentFee')"
                            prepend-inner-icon="mdi-cash-clock"
                            variant="outlined"
                            type="number"
                            suffix="%"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.payment_terms"
                            :label="$t('clinicSettings.paymentTerms')"
                            prepend-inner-icon="mdi-file-document"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Display Settings Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-palette</v-icon>
                      {{ $t('clinicSettings.displaySettings') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.theme_color"
                            :label="$t('clinicSettings.themeColor')"
                            prepend-inner-icon="mdi-palette"
                            variant="outlined"
                            :disabled="!canEdit"
                          >
                            <template v-slot:append-inner>
                              <v-menu :close-on-content-click="false">
                                <template v-slot:activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    :color="clinicForm.theme_color"
                                    icon
                                    size="small"
                                    variant="flat"
                                  ></v-btn>
                                </template>
                                <v-color-picker
                                  v-model="clinicForm.theme_color"
                                  mode="hexa"
                                  :disabled="!canEdit"
                                ></v-color-picker>
                              </v-menu>
                            </template>
                          </v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="clinicForm.language"
                            :label="$t('clinicSettings.language')"
                            :items="languageOptions"
                            prepend-inner-icon="mdi-translate"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-select>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="clinicForm.date_format"
                            :label="$t('clinicSettings.dateFormat')"
                            :items="dateFormatOptions"
                            prepend-inner-icon="mdi-calendar"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-select>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="clinicForm.time_format"
                            :label="$t('clinicSettings.timeFormat')"
                            :items="timeFormatOptions"
                            prepend-inner-icon="mdi-clock"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-select>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Social Media Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-share-variant</v-icon>
                      {{ $t('clinicSettings.socialMedia') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.facebook"
                            :label="$t('clinicSettings.facebook')"
                            prepend-inner-icon="mdi-facebook"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.instagram"
                            :label="$t('clinicSettings.instagram')"
                            prepend-inner-icon="mdi-instagram"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.twitter"
                            :label="$t('clinicSettings.twitter')"
                            prepend-inner-icon="mdi-twitter"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="clinicForm.whatsapp"
                            :label="$t('clinicSettings.whatsappNumber')"
                            prepend-inner-icon="mdi-whatsapp"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Medical/Dental Settings Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-tooth</v-icon>
                      {{ $t('clinicSettings.medicalSettings') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <!-- Tooth Condition Colors -->
                      <h3 class="text-h6 mb-3">{{ $t('clinicSettings.toothConditionColors') }}</h3>
                      <p class="text-caption text-medium-emphasis mb-4">
                        {{ $t('clinicSettings.toothConditionColorsHint') }}
                      </p>
                      <v-row>
                        <v-col 
                          v-for="(condition, index) in toothConditionColors" 
                          :key="condition.id"
                          cols="12" 
                          sm="6" 
                          md="4"
                        >
                          <v-card variant="outlined" class="pa-3">
                            <v-row align="center">
                              <v-col cols="3">
                                <v-avatar :color="condition.color" size="40"></v-avatar>
                              </v-col>
                              <v-col cols="9">
                                <v-text-field
                                  v-model="condition.name"
                                  :label="$t('clinicSettings.conditionName') + ' ' + (index + 1)"
                                  variant="outlined"
                                  density="compact"
                                  hide-details
                                  :disabled="!canEdit"
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12" class="pt-2">
                                <v-menu :close-on-content-click="false">
                                  <template v-slot:activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      :color="condition.color"
                                      block
                                      variant="flat"
                                      size="small"
                                      :disabled="!canEdit"
                                    >
                                      {{ condition.color }}
                                    </v-btn>
                                  </template>
                                  <v-color-picker
                                    v-model="condition.color"
                                    mode="hexa"
                                    :disabled="!canEdit"
                                    @update:modelValue="updateConditionHexCode(condition)"
                                  ></v-color-picker>
                                </v-menu>
                              </v-col>
                            </v-row>
                          </v-card>
                        </v-col>
                      </v-row>

                      <!-- <v-divider class="my-6"></v-divider> -->

                      <!-- Tooth Statuses - COMMENTED OUT -->
                      <!-- <h3 class="text-h6 mb-3">{{ $t('clinicSettings.toothStatuses') }}</h3>
                      <p class="text-caption text-medium-emphasis mb-4">
                        {{ $t('clinicSettings.toothStatusesHint') }}
                      </p>
                      <v-row>
                        <v-col 
                          v-for="status in toothStatuses" 
                          :key="status.id"
                          cols="12" 
                          sm="6" 
                          md="4"
                        >
                          <v-card variant="outlined" class="pa-3">
                            <v-row align="center">
                              <v-col cols="2" class="text-center">
                                <span class="text-h6">{{ status.icon }}</span>
                              </v-col>
                              <v-col cols="10">
                                <v-text-field
                                  v-model="status.name"
                                  :label="$t('clinicSettings.statusName')"
                                  variant="outlined"
                                  density="compact"
                                  hide-details
                                  :disabled="!canEdit"
                                ></v-text-field>
                              </v-col>
                              <v-col cols="8" class="pt-2">
                                <v-menu :close-on-content-click="false">
                                  <template v-slot:activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      :color="status.color"
                                      block
                                      variant="flat"
                                      size="small"
                                      :disabled="!canEdit"
                                    >
                                      {{ status.color }}
                                    </v-btn>
                                  </template>
                                  <v-color-picker
                                    v-model="status.color"
                                    mode="hexa"
                                    :disabled="!canEdit"
                                  ></v-color-picker>
                                </v-menu>
                              </v-col>
                              <v-col cols="4" class="pt-2">
                                <v-switch
                                  v-model="status.is_active"
                                  :label="$t('common.active')"
                                  color="primary"
                                  hide-details
                                  density="compact"
                                  :disabled="!canEdit"
                                ></v-switch>
                              </v-col>
                            </v-row>
                          </v-card>
                        </v-col>
                      </v-row> -->
                    </v-card-text>
                  </v-card>

                  <!-- Working Hours Section -->
                  <v-card variant="outlined" class="mb-6">
                    <v-card-title class="bg-grey-lighten-4">
                      <v-icon start>mdi-clock-outline</v-icon>
                      {{ $t('clinicSettings.workingHours') }}
                    </v-card-title>
                    <v-card-text class="pa-4">
                      <v-row v-for="(day, index) in weekDays" :key="day.value">
                        <v-col cols="12" md="3" class="d-flex align-center">
                          <v-checkbox
                            v-model="workingHours[day.value].enabled"
                            :label="day.label"
                            hide-details
                            :disabled="!canEdit"
                          ></v-checkbox>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-text-field
                            v-model="workingHours[day.value].from"
                            :label="$t('clinicSettings.from')"
                            type="time"
                            variant="outlined"
                            density="compact"
                            :disabled="!workingHours[day.value].enabled || !canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-text-field
                            v-model="workingHours[day.value].to"
                            :label="$t('clinicSettings.to')"
                            type="time"
                            variant="outlined"
                            density="compact"
                            :disabled="!workingHours[day.value].enabled || !canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" v-if="index < weekDays.length - 1">
                          <v-divider></v-divider>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- Save Button -->
                  <v-row v-if="canEdit">
                    <v-col cols="12" class="text-end">
                      <v-btn
                        color="primary"
                        size="large"
                        :loading="savingSettings"
                        @click="saveAllSettings"
                      >
                        <v-icon start>mdi-content-save</v-icon>
                        {{ $t('common.save') }}
                      </v-btn>
                    </v-col>
                  </v-row>

                  <!-- Read-only Notice -->
                  <v-alert v-if="!canEdit" type="info" variant="tonal" class="mt-4">
                    {{ $t('clinicSettings.readOnlyNotice') }}
                  </v-alert>
                </v-form>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">
          {{ $t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CaseCategories from '@/views/settings/CaseCategories.vue'
import { useAuthStore } from '@/stores/authNew'
import { PERMISSIONS } from '@/constants/permissions'
import {
  getClinicSettings,
  bulkUpdateClinicSettings,
  uploadClinicLogo
} from '@/services/clinicSettings.service'
import { useClinicSettings } from '@/composables/useClinicSettings'

const { t } = useI18n()
const authStore = useAuthStore()
const { resetCache } = useClinicSettings()

const activeTab = ref('caseCategories')

// Permission check
const canEdit = computed(() => {
  return authStore.hasPermission(PERMISSIONS.EDIT_CLINIC_SETTINGS)
})

// Settings state
const loadingSettings = ref(false)
const savingSettings = ref(false)
const uploadingLogo = ref(false)
const settingsError = ref(null)
const formValid = ref(true)

// Logo handling
const logoFile = ref(null)
const logoPreview = ref(null)

// Clinic form data
const clinicForm = ref({
  clinic_name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  logo: '',
  // Appointment settings
  appointment_duration: 30,
  enable_online_booking: false,
  booking_buffer: 15,
  max_daily_appointments: 20,
  // Notification settings
  enable_sms: false,
  enable_email: false,
  enable_whatsapp: false,
  reminder_hours: 24,
  // Financial settings
  currency: 'IQD',
  tax_rate: 0,
  late_payment_fee: 0,
  payment_terms: '',
  // Display settings
  theme_color: '#1976D2',
  language: 'ar',
  date_format: 'DD/MM/YYYY',
  time_format: '12h',
  // Social media
  facebook: '',
  instagram: '',
  twitter: '',
  whatsapp: ''
})

// Working hours structure
const workingHours = ref({
  sunday: { enabled: false, from: '09:00', to: '17:00' },
  monday: { enabled: true, from: '09:00', to: '17:00' },
  tuesday: { enabled: true, from: '09:00', to: '17:00' },
  wednesday: { enabled: true, from: '09:00', to: '17:00' },
  thursday: { enabled: true, from: '09:00', to: '17:00' },
  friday: { enabled: false, from: '09:00', to: '17:00' },
  saturday: { enabled: false, from: '09:00', to: '17:00' }
})

// Medical/Dental Settings
const toothConditionColors = ref([
  { id: 1, name: '', color: '#FF5252', hex_code: '#FF5252' },
  { id: 2, name: '', color: '#2196F3', hex_code: '#2196F3' },
  { id: 3, name: '', color: '#4CAF50', hex_code: '#4CAF50' },
  { id: 4, name: '', color: '#FFEB3B', hex_code: '#FFEB3B' },
  { id: 5, name: '', color: '#FF9800', hex_code: '#FF9800' },
  { id: 6, name: '', color: '#9C27B0', hex_code: '#9C27B0' }
])

const toothStatuses = ref([
  { id: 1, name: 'Healthy', color: '#22C55E', icon: '✓', is_active: true },
  { id: 2, name: 'Cavity', color: '#EF4444', icon: '⚠', is_active: true },
  { id: 3, name: 'Filled', color: '#3B82F6', icon: '■', is_active: true },
  { id: 4, name: 'Missing', color: '#6B7280', icon: '✗', is_active: true },
  { id: 5, name: 'Crown', color: '#F59E0B', icon: '♔', is_active: true },
  { id: 6, name: 'Root Canal', color: '#8B5CF6', icon: '⊕', is_active: true },
  { id: 7, name: 'Implant', color: '#14B8A6', icon: '⊛', is_active: true },
  { id: 8, name: 'Bridge', color: '#EC4899', icon: '⊞', is_active: true }
])

// Options
const currencyOptions = [
  { title: 'IQD - Iraqi Dinar', value: 'IQD' },
  { title: 'USD - US Dollar', value: 'USD' },
  { title: 'EUR - Euro', value: 'EUR' },
  { title: 'GBP - British Pound', value: 'GBP' },
  { title: 'AED - UAE Dirham', value: 'AED' }
]

const languageOptions = [
  { title: 'العربية', value: 'ar' },
  { title: 'English', value: 'en' },
  { title: 'کوردی', value: 'ku' }
]

const dateFormatOptions = [
  { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
]

const timeFormatOptions = [
  { title: '12-hour (AM/PM)', value: '12h' },
  { title: '24-hour', value: '24h' }
]

const weekDays = computed(() => [
  { value: 'sunday', label: t('clinicSettings.days.sunday') },
  { value: 'monday', label: t('clinicSettings.days.monday') },
  { value: 'tuesday', label: t('clinicSettings.days.tuesday') },
  { value: 'wednesday', label: t('clinicSettings.days.wednesday') },
  { value: 'thursday', label: t('clinicSettings.days.thursday') },
  { value: 'friday', label: t('clinicSettings.days.friday') },
  { value: 'saturday', label: t('clinicSettings.days.saturday') }
])

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showNotification = (message, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// Update condition hex code when color changes
const updateConditionHexCode = (condition) => {
  condition.hex_code = condition.color
}

// Load clinic settings
const loadClinicSettings = async () => {
  loadingSettings.value = true
  settingsError.value = null
  
  try {
    const response = await getClinicSettings()
    
    if (response.success && response.data) {
      // Process settings by category
      const data = response.data
      
      // Flatten settings from categories
      const flattenSettings = (categories) => {
        const flat = {}
        Object.values(categories).forEach(category => {
          if (category.settings) {
            category.settings.forEach(setting => {
              flat[setting.setting_key] = setting.setting_value
            })
          }
        })
        return flat
      }
      
      const settings = flattenSettings(data)
      
      // Map to form
      clinicForm.value = {
        clinic_name: settings.clinic_name || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || settings.clinic_address || '',
        website: settings.website || '',
        logo: settings.logo || '',
        appointment_duration: parseInt(settings.appointment_duration) || 30,
        enable_online_booking: Boolean(settings.enable_online_booking),
        booking_buffer: parseInt(settings.booking_buffer) || 15,
        max_daily_appointments: parseInt(settings.max_daily_appointments) || 20,
        enable_sms: Boolean(settings.enable_sms),
        enable_email: Boolean(settings.enable_email),
        enable_whatsapp: Boolean(settings.enable_whatsapp),
        reminder_hours: parseInt(settings.reminder_hours) || 24,
        currency: settings.currency || 'IQD',
        tax_rate: parseInt(settings.tax_rate) || 0,
        late_payment_fee: parseInt(settings.late_payment_fee) || 0,
        payment_terms: settings.payment_terms || '',
        theme_color: settings.theme_color || '#1976D2',
        language: settings.language || 'ar',
        date_format: settings.date_format || 'DD/MM/YYYY',
        time_format: settings.time_format || '12h',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        whatsapp: settings.whatsapp || ''
      }
      
      // Parse working hours if available
      if (settings.working_hours) {
        try {
          const hours = typeof settings.working_hours === 'string' 
            ? JSON.parse(settings.working_hours) 
            : settings.working_hours
          
          if (typeof hours === 'object') {
            Object.keys(hours).forEach(day => {
              if (workingHours.value[day]) {
                const dayHours = hours[day]
                if (typeof dayHours === 'string') {
                  // Format: "9:00 AM - 5:00 PM"
                  workingHours.value[day].enabled = dayHours.toLowerCase() !== 'closed'
                  if (workingHours.value[day].enabled) {
                    const parts = dayHours.split(' - ')
                    if (parts.length === 2) {
                      workingHours.value[day].from = convertTo24Hour(parts[0])
                      workingHours.value[day].to = convertTo24Hour(parts[1])
                    }
                  }
                } else if (typeof dayHours === 'object') {
                  workingHours.value[day] = { ...workingHours.value[day], ...dayHours }
                }
              }
            })
          }
        } catch (e) {
          console.error('Error parsing working hours:', e)
        }
      }

      // Parse tooth condition colors
      if (settings.tooth_condition_colors) {
        try {
          const colors = typeof settings.tooth_condition_colors === 'string'
            ? JSON.parse(settings.tooth_condition_colors)
            : settings.tooth_condition_colors
          
          if (Array.isArray(colors)) {
            toothConditionColors.value = colors
          }
        } catch (e) {
          console.error('Error parsing tooth condition colors:', e)
        }
      }

      // Parse tooth statuses
      if (settings.tooth_statuses) {
        try {
          const statuses = typeof settings.tooth_statuses === 'string'
            ? JSON.parse(settings.tooth_statuses)
            : settings.tooth_statuses
          
          if (Array.isArray(statuses)) {
            toothStatuses.value = statuses
          }
        } catch (e) {
          console.error('Error parsing tooth statuses:', e)
        }
      }
    }
  } catch (error) {
    console.error('Error loading clinic settings:', error)
    settingsError.value = t('errors.fetchFailed')
  } finally {
    loadingSettings.value = false
  }
}

// Convert 12-hour format to 24-hour
const convertTo24Hour = (time12h) => {
  if (!time12h) return '09:00'
  
  // Handle if already in 24h format
  if (!time12h.toLowerCase().includes('am') && !time12h.toLowerCase().includes('pm')) {
    return time12h
  }
  
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':')
  
  if (hours === '12') {
    hours = modifier.toLowerCase() === 'am' ? '00' : '12'
  } else if (modifier.toLowerCase() === 'pm') {
    hours = parseInt(hours, 10) + 12
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes || '00'}`
}

// Handle logo file change
const handleLogoChange = (file) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    logoPreview.value = null
  }
}

// Upload logo
const uploadLogo = async () => {
  if (!logoFile.value) return
  
  uploadingLogo.value = true
  
  try {
    const response = await uploadClinicLogo(logoFile.value)
    
    if (response.success) {
      clinicForm.value.logo = response.data?.logo_url || response.data?.setting_value
      showNotification(t('clinicSettings.logoUploadSuccess'))
      logoFile.value = null
      logoPreview.value = null
    }
  } catch (error) {
    console.error('Error uploading logo:', error)
    showNotification(t('errors.uploadFailed'), 'error')
  } finally {
    uploadingLogo.value = false
  }
}

// Save all settings
const saveAllSettings = async () => {
  savingSettings.value = true
  
  try {
    // Prepare working hours as JSON
    const workingHoursFormatted = {}
    Object.keys(workingHours.value).forEach(day => {
      if (workingHours.value[day].enabled) {
        workingHoursFormatted[day] = `${workingHours.value[day].from} - ${workingHours.value[day].to}`
      } else {
        workingHoursFormatted[day] = 'Closed'
      }
    })
    
    // Prepare settings array for bulk update
    const settings = [
      { key: 'clinic_name', value: clinicForm.value.clinic_name, type: 'string' },
      { key: 'phone', value: clinicForm.value.phone, type: 'string' },
      { key: 'email', value: clinicForm.value.email, type: 'string' },
      { key: 'address', value: clinicForm.value.address, type: 'string' },
      { key: 'website', value: clinicForm.value.website, type: 'string' },
      { key: 'appointment_duration', value: clinicForm.value.appointment_duration, type: 'integer' },
      { key: 'enable_online_booking', value: clinicForm.value.enable_online_booking, type: 'boolean' },
      { key: 'booking_buffer', value: clinicForm.value.booking_buffer, type: 'integer' },
      { key: 'max_daily_appointments', value: clinicForm.value.max_daily_appointments, type: 'integer' },
      { key: 'enable_sms', value: clinicForm.value.enable_sms, type: 'boolean' },
      { key: 'enable_email', value: clinicForm.value.enable_email, type: 'boolean' },
      { key: 'enable_whatsapp', value: clinicForm.value.enable_whatsapp, type: 'boolean' },
      { key: 'reminder_hours', value: clinicForm.value.reminder_hours, type: 'integer' },
      { key: 'currency', value: clinicForm.value.currency, type: 'string' },
      { key: 'tax_rate', value: clinicForm.value.tax_rate, type: 'integer' },
      { key: 'late_payment_fee', value: clinicForm.value.late_payment_fee, type: 'integer' },
      { key: 'payment_terms', value: clinicForm.value.payment_terms, type: 'string' },
      { key: 'theme_color', value: clinicForm.value.theme_color, type: 'string' },
      { key: 'language', value: clinicForm.value.language, type: 'string' },
      { key: 'date_format', value: clinicForm.value.date_format, type: 'string' },
      { key: 'time_format', value: clinicForm.value.time_format, type: 'string' },
      { key: 'facebook', value: clinicForm.value.facebook, type: 'string' },
      { key: 'instagram', value: clinicForm.value.instagram, type: 'string' },
      { key: 'twitter', value: clinicForm.value.twitter, type: 'string' },
      { key: 'whatsapp', value: clinicForm.value.whatsapp, type: 'string' },
      { key: 'working_hours', value: workingHoursFormatted, type: 'json' },
      { key: 'tooth_condition_colors', value: toothConditionColors.value, type: 'json' }
      // { key: 'tooth_statuses', value: toothStatuses.value, type: 'json' } // Commented out
    ]
    
    const response = await bulkUpdateClinicSettings(settings)
    
    if (response.success) {
      showNotification(t('clinicSettings.saveSuccess'))
      // Reset cache to reflect changes across the app
      await resetCache()
    } else {
      showNotification(t('errors.saveFailed'), 'error')
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    showNotification(t('errors.saveFailed'), 'error')
  } finally {
    savingSettings.value = false
  }
}

// Load settings when clinic tab is selected
watch(activeTab, (newTab) => {
  if (newTab === 'clinic' && !clinicForm.value.clinic_name) {
    loadClinicSettings()
  }
})

onMounted(() => {
  // Pre-load clinic settings if starting on that tab
  if (activeTab.value === 'clinic') {
    loadClinicSettings()
  }
})
</script>

<style scoped>
.border {
  border: 2px solid #e0e0e0 !important;
}
</style>
