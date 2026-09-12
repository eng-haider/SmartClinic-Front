<template>
  <v-container fluid class="settings-page pa-4" :class="{ 'settings-page--with-save': showMobileSave }">
    <v-row class="mobile-page-heading">
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('settings.title') }}</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="settings-workspace">
          <nav v-if="xs" class="settings-mobile-nav" :aria-label="$t('settings.title')">
            <button v-for="tab in settingsTabs" :key="tab.value" type="button"
              :aria-pressed="activeTab === tab.value" @click="activeTab = tab.value">
              <v-icon size="23">{{ tab.icon }}</v-icon>
              <span>{{ tab.title }}</span>
            </button>
          </nav>
          <v-tabs v-else v-model="activeTab" bg-color="primary">
            <v-tab value="caseCategories">
              <v-icon start>mdi-tag-multiple</v-icon>
              {{ $t('settings.caseCategories') }}
            </v-tab>
            <v-tab value="clinic">
              <v-icon start>mdi-hospital-building</v-icon>
              {{ $t('settings.clinic') }}
            </v-tab>
            <v-tab value="ai">
              <v-icon start>mdi-robot</v-icon>
              AI
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="settings-panels">
            <!-- Case Categories Tab -->
            <v-window-item value="caseCategories">
              <CaseCategories />
            </v-window-item>

            <!-- Clinic Settings Tab -->
            <v-window-item value="clinic">
              <v-card-text class="pa-6 clinic-settings-content">
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
                  <SettingsSection id="clinic-logo" :title="$t('clinicSettings.logo')" icon="mdi-image">
                    <v-card-text class="pa-4">
                      <v-row align="center">
                        <v-col cols="12" md="4" class="text-center">
                          <v-avatar :size="xs ? 88 : 150" class="border elevation-2" color="grey-lighten-3">
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
                  </SettingsSection>

                  <!-- Basic Information Section -->
                  <SettingsSection id="clinic-basicInfo" :title="$t('clinicSettings.basicInfo')" icon="mdi-information" initially-open>
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
                          <v-btn
                            variant="tonal"
                            color="primary"
                            prepend-icon="mdi-crosshairs-gps"
                            :loading="detectingLocation"
                            :disabled="!canEdit"
                            @click="detectClinicLocation"
                          >{{ $t('clinicSettings.detectLocation') }}</v-btn>
                          <p class="text-caption text-medium-emphasis mt-2">{{ $t('clinicSettings.detectLocationHint') }}</p>
                          <v-alert v-if="locationError" type="error" variant="tonal" class="mt-2" role="alert">{{ locationError }}</v-alert>
                          <iframe
                            v-if="clinicForm.address.trim()"
                            :src="clinicMapUrl"
                            :title="$t('clinicSettings.clinicMap')"
                            width="100%"
                            height="250"
                            style="border: 0; border-radius: 12px; margin-top: 12px"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                          ></iframe>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </SettingsSection>

                  <!-- Appointment Settings Section -->
                  <SettingsSection id="clinic-appointmentSettings" :title="$t('clinicSettings.appointmentSettings')" icon="mdi-calendar-clock">
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
                  </SettingsSection>

                  <!-- Notification Settings Section -->
                  <SettingsSection id="clinic-notificationSettings" :title="$t('clinicSettings.notificationSettings')" icon="mdi-bell">
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
                  </SettingsSection>

                  <!-- Financial Settings Section -->
                  <SettingsSection id="clinic-financialSettings" :title="$t('clinicSettings.financialSettings')" icon="mdi-currency-usd">
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
                  </SettingsSection>

                  <!-- Display Settings Section -->
                  <SettingsSection id="clinic-displaySettings" :title="$t('clinicSettings.displaySettings')" icon="mdi-palette">
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

                        <!-- Dental Chart Subsection -->
                        <v-col cols="12">
                          <v-divider class="my-4"></v-divider>
                          <div class="text-h6 mb-4">
                            <v-icon start color="primary">mdi-tooth-outline</v-icon>
                            {{ $t('clinicSettings.dentalChart') }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="clinicForm.baby_teeth_notation"
                            :label="$t('clinicSettings.babyTeethNotation')"
                            :items="babyTeethNotationOptions"
                            :hint="$t('clinicSettings.babyTeethNotationHint')"
                            persistent-hint
                            prepend-inner-icon="mdi-alphabetical-variant"
                            variant="outlined"
                            :disabled="!canEdit"
                          ></v-select>
                        </v-col>

                        <!-- Tooth Colors Subsection -->
                        <v-col cols="12">
                          <v-divider class="my-4"></v-divider>
                          <div class="text-h6 mb-4">
                            <v-icon start color="primary">mdi-tooth</v-icon>
                            {{ $t('clinicSettings.toothColors') || 'Tooth Colors for Dental Chart' }}
                          </div>
                        </v-col>
                        
                        <v-col 
                          v-for="(colorItem, index) in toothColors"
                          :key="colorItem.id"
                          cols="12" 
                          sm="6" 
                          md="4"
                        >
                          <v-card variant="outlined" class="pa-3">
                            <div class="d-flex align-center justify-space-between mb-3">
                              <span class="text-subtitle-1 font-weight-medium">
                                {{ $t(`toothStatus.${colorItem.id}`) || colorItem.name }}
                              </span>
                              <v-chip 
                                :color="colorItem.color"
                                size="small"
                                class="tooth-color-chip"
                              >
                                <v-icon start size="small">mdi-tooth</v-icon>
                              </v-chip>
                            </div>
                            
                            <!-- Name Input -->
                            <v-text-field
                              v-model="toothColors[index].name"
                              :label="$t('clinicSettings.statusName') || 'Status Name'"
                              variant="outlined"
                              density="compact"
                              hide-details
                              class="mb-3"
                              :disabled="!canEdit"
                              prepend-inner-icon="mdi-label"
                            ></v-text-field>
                            
                            <!-- Color Input -->
                            <v-text-field
                              v-model="toothColors[index].color"
                              :label="$t('clinicSettings.colorCode') || 'Color Code'"
                              variant="outlined"
                              density="compact"
                              hide-details
                              :disabled="!canEdit"
                            >
                              <template v-slot:append-inner>
                                <v-menu :close-on-content-click="false">
                                  <template v-slot:activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      :color="toothColors[index].color"
                                      icon="mdi-eyedropper"
                                      size="small"
                                      variant="flat"
                                      :disabled="!canEdit"
                                    ></v-btn>
                                  </template>
                                  <v-color-picker
                                    v-model="toothColors[index].color"
                                    mode="hexa"
                                    :disabled="!canEdit"
                                  ></v-color-picker>
                                </v-menu>
                              </template>
                            </v-text-field>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </SettingsSection>

                  <!-- Social Media Section -->
                  <SettingsSection id="clinic-socialMedia" :title="$t('clinicSettings.socialMedia')" icon="mdi-share-variant">
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
                  </SettingsSection>

                  <!-- Medical/Dental Settings Section -->
                  <SettingsSection id="clinic-medicalSettings" :title="$t('clinicSettings.medicalSettings')" icon="mdi-tooth">
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
                  </SettingsSection>

                  <!-- Working Hours Section -->
                  <SettingsSection id="clinic-workingHours" :title="$t('clinicSettings.workingHours')" icon="mdi-clock-outline">
                    <v-card-text class="pa-4">
                      <v-row v-for="(day, index) in weekDays" :key="day.value" class="working-day">
                        <v-col cols="12" md="3" class="d-flex align-center">
                          <v-checkbox
                            v-model="workingHours[day.value].enabled"
                            :label="day.label"
                            hide-details
                            :disabled="!canEdit"
                          ></v-checkbox>
                        </v-col>
                        <v-col cols="6" md="4">
                          <v-text-field
                            v-model="workingHours[day.value].from"
                            :label="$t('clinicSettings.from')"
                            type="time"
                            variant="outlined"
                            density="compact"
                            :disabled="!workingHours[day.value].enabled || !canEdit"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="6" md="4">
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
                  </SettingsSection>

                  <!-- Save Button -->
                  <v-row v-if="canEdit && !xs">
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

            <!-- AI Settings Tab -->
            <v-window-item value="ai">
              <v-card-text class="pa-6">
                <v-card variant="outlined" class="mb-6" rounded="xl">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon start color="primary">mdi-brain</v-icon>
                    مزامنة قاعدة البيانات مع الذكاء الاصطناعي
                  </v-card-title>
                  <v-card-text class="pa-5">
                    <v-alert type="info" variant="tonal" class="mb-5" rounded="lg">
                      <p class="mb-0">هذا سيقوم بتحويل جميع بيانات العيادة (المرضى، المواعيد، الحالات، الفواتير) إلى بيانات يمكن للمساعد الذكي البحث فيها. قم بالمزامنة بعد إضافة أو تعديل بيانات كبيرة.</p>
                    </v-alert>

                    <v-btn
                      color="primary"
                      size="large"
                      :loading="aiSyncing"
                      :disabled="aiSyncing"
                      @click="syncAiDatabase"
                      prepend-icon="mdi-sync"
                      rounded="lg"
                      elevation="2"
                      id="ai-sync-btn"
                    >
                      مزامنة قاعدة البيانات مع AI
                    </v-btn>

                    <!-- Sync Results -->
                    <v-expand-transition>
                      <v-card v-if="aiSyncStats" variant="tonal" color="success" class="mt-5" rounded="lg">
                        <v-card-text>
                          <div class="d-flex align-center mb-3">
                            <v-icon start color="success">mdi-check-circle</v-icon>
                            <span class="text-subtitle-1 font-weight-bold">تمت المزامنة بنجاح!</span>
                          </div>
                          <v-row>
                            <v-col cols="6" sm="3">
                              <div class="text-center">
                                <div class="text-h5 font-weight-bold">{{ aiSyncStats.patients }}</div>
                                <div class="text-caption">مرضى</div>
                              </div>
                            </v-col>
                            <v-col cols="6" sm="3">
                              <div class="text-center">
                                <div class="text-h5 font-weight-bold">{{ aiSyncStats.reservations }}</div>
                                <div class="text-caption">مواعيد</div>
                              </div>
                            </v-col>
                            <v-col cols="6" sm="3">
                              <div class="text-center">
                                <div class="text-h5 font-weight-bold">{{ aiSyncStats.cases }}</div>
                                <div class="text-caption">حالات</div>
                              </div>
                            </v-col>
                            <v-col cols="6" sm="3">
                              <div class="text-center">
                                <div class="text-h5 font-weight-bold">{{ aiSyncStats.bills }}</div>
                                <div class="text-caption">فواتير</div>
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-expand-transition>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="showMobileSave" class="settings-mobile-save">
      <v-btn color="primary" variant="flat" block size="large" rounded="lg"
        prepend-icon="mdi-content-save-outline" :loading="savingSettings"
        :disabled="uploadingLogo" @click="saveAllSettings">
        {{ $t('common.save') }}
      </v-btn>
    </div>

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
import { useDisplay } from 'vuetify'
import SettingsSection from '@/components/SettingsSection.vue'
import CaseCategories from '@/views/settings/CaseCategories.vue'
import aiService from '@/services/ai.service'
import { useAuthStore } from '@/stores/authNew'
import { PERMISSIONS } from '@/constants/permissions'
import {
  getClinicSettings,
  bulkUpdateClinicSettings,
  uploadClinicLogo
} from '@/services/clinicSettings.service'
import { useClinicSettings } from '@/composables/useClinicSettings'
import { DEFAULT_TOOTH_NOTATION, normalizeToothNotation } from '@/components/teeth/toothNotation'

const { t } = useI18n()
const { xs } = useDisplay()
const authStore = useAuthStore()
const { resetCache } = useClinicSettings()

const activeTab = ref('caseCategories')
const settingsTabs = computed(() => [
  { value: 'caseCategories', title: t('settings.caseCategories'), icon: 'mdi-tag-multiple-outline' },
  { value: 'clinic', title: t('settings.clinic'), icon: 'mdi-hospital-building' },
  { value: 'ai', title: 'AI', icon: 'mdi-robot-outline' }
])
const showMobileSave = computed(() => xs.value && activeTab.value === 'clinic' && canEdit.value && !loadingSettings.value && !settingsError.value)

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

// AI Sync state
const aiSyncing = ref(false)
const aiSyncStats = ref(null)

const syncAiDatabase = async () => {
  aiSyncing.value = true
  aiSyncStats.value = null
  try {
    const response = await aiService.syncEmbeddings()
    if (response.success) {
      aiSyncStats.value = response.stats
      snackbarColor.value = 'success'
      snackbarText.value = response.message || 'تمت المزامنة بنجاح'
    } else {
      snackbarColor.value = 'error'
      snackbarText.value = response.message || 'فشلت المزامنة'
    }
  } catch (error) {
    console.error('AI Sync Error:', error)
    snackbarColor.value = 'error'
    snackbarText.value = 'حدث خطأ في مزامنة قاعدة البيانات'
  } finally {
    aiSyncing.value = false
    snackbar.value = true
  }
}

const detectingLocation = ref(false)
const locationError = ref('')
const clinicMapUrl = computed(() =>
  `https://maps.google.com/maps?q=${encodeURIComponent(clinicForm.value.address.trim())}&z=16&output=embed`
)

function detectClinicLocation() {
  if (!canEdit.value || detectingLocation.value) return
  locationError.value = ''
  if (!navigator.geolocation) {
    locationError.value = t('clinicSettings.locationUnavailable')
    return
  }
  detectingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      clinicForm.value.address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
      detectingLocation.value = false
    },
    (error) => {
      locationError.value = t(error.code === 1
        ? 'clinicSettings.locationDenied'
        : 'clinicSettings.locationUnavailable')
      detectingLocation.value = false
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  )
}

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
  // Dental chart: how baby (primary) teeth are labelled - 'fdi' | 'universal' | 'palmer'
  baby_teeth_notation: DEFAULT_TOOTH_NOTATION,
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

// Tooth Colors from API (tooth_colors setting)
const toothColors = ref([
  { id: 'healthy', name: 'Healthy', color: '#4CAF50' },
  { id: 'cavity', name: 'Cavity', color: '#F44336' },
  { id: 'filling', name: 'Filling', color: '#2196F3' },
  { id: 'crown', name: 'Crown', color: '#FFC107' },
  { id: 'missing', name: 'Missing', color: '#9E9E9E' },
  { id: 'implant', name: 'Implant', color: '#00BCD4' },
  { id: 'root_canal', name: 'Root Canal', color: '#9C27B0' }
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

// Baby teeth can be shown as FDI numbers, Universal letters (A-T) or
// Palmer letters (A-E per quadrant). Permanent teeth stay on FDI numbers.
const babyTeethNotationOptions = computed(() => [
  { title: `${t('clinicSettings.babyTeethNotationFdi')} (51-85)`, value: 'fdi' },
  { title: `${t('clinicSettings.babyTeethNotationUniversal')} (A - T)`, value: 'universal' },
  { title: `${t('clinicSettings.babyTeethNotationPalmer')} (A - E)`, value: 'palmer' }
])

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
        baby_teeth_notation: normalizeToothNotation(settings.baby_teeth_notation),
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

      // Parse tooth colors (from display settings)
      if (settings.tooth_colors) {
        try {
          const colors = typeof settings.tooth_colors === 'string'
            ? JSON.parse(settings.tooth_colors)
            : settings.tooth_colors
          
          if (Array.isArray(colors) && colors.length > 0) {
            toothColors.value = colors
          }
        } catch (e) {
          console.error('Error parsing tooth colors:', e)
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
      clinicForm.value.logo = response.data?.logo_url
        || response.data?.setting?.logo_url
        || response.data?.setting?.setting_value
      showNotification(t('clinicSettings.logoUploadSuccess'))
      logoFile.value = null
      logoPreview.value = null
      // Refresh the shared settings cache so the new logo shows up everywhere
      // (prescriptions, bills, reports) without a full page reload.
      await resetCache()
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
      { key: 'baby_teeth_notation', value: clinicForm.value.baby_teeth_notation, type: 'string' },
      { key: 'facebook', value: clinicForm.value.facebook, type: 'string' },
      { key: 'instagram', value: clinicForm.value.instagram, type: 'string' },
      { key: 'twitter', value: clinicForm.value.twitter, type: 'string' },
      { key: 'whatsapp', value: clinicForm.value.whatsapp, type: 'string' },
      { key: 'working_hours', value: workingHoursFormatted, type: 'json' },
      { key: 'tooth_condition_colors', value: toothConditionColors.value, type: 'json' },
      { key: 'tooth_colors', value: toothColors.value, type: 'json' }
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
.settings-mobile-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.settings-mobile-nav button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.75);
  font-size: 0.8125rem;
  text-align: start;
}

.settings-mobile-nav button[aria-pressed="true"] {
  background: rgba(var(--v-theme-primary), 0.09);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.4);
  font-weight: 700;
}

.settings-mobile-nav button:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.settings-mobile-save {
  position: fixed;
  inset-inline: 0;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  z-index: 20;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:global(.flutter-app .settings-mobile-save) {
  bottom: 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

:global(body.keyboard-is-open .settings-mobile-save) {
  bottom: 0;
}

@media (max-width: 599px) {
  .settings-page {
    padding: 12px !important;
  }

  .settings-page--with-save {
    padding-bottom: 96px !important;
  }

  .settings-workspace {
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }

  .settings-panels :deep(.v-window-item > .v-card-text) {
    padding: 0 !important;
  }

  .clinic-settings-content :deep(.v-row) {
    margin: -6px;
  }

  .clinic-settings-content :deep(.v-row > [class*="v-col"]) {
    padding: 6px;
    min-width: 0;
  }

  .settings-page :deep(.v-card-title) {
    font-size: 0.9375rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .settings-page :deep(.v-btn__content) {
    white-space: normal;
  }

  .settings-page :deep(.v-btn:not(.v-btn--icon)) {
    height: auto;
    min-height: 44px;
    padding-block: 10px;
    letter-spacing: 0;
  }

  .settings-page :deep(input.v-field__input),
  .settings-page :deep(textarea.v-field__input) {
    font-size: 16px;
  }

  .working-day + .working-day {
    margin-top: 8px;
  }
}

.border {
  border: 2px solid #e0e0e0 !important;
}

.tooth-color-chip {
  min-width: 80px;
  font-family: monospace;
  font-size: 11px;
}
</style>
