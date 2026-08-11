<template>
  <v-container fluid class="patient-detail-page pa-4" style="font-family: 'Cairo', sans-serif;">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Patient Content -->
    <template v-else-if="patient">
      <!-- Patient Header Card -->
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <div class="patient-header">
            <!-- Patient Avatar (hidden on mobile) -->
            <v-avatar size="100" class="patient-avatar d-none d-sm-block">
              <v-img
                v-if="patient.photo"
                :src="getPhotoUrl(patient.photo)"
                :alt="patient.name"
                cover
              />
              <v-icon v-else size="60" color="grey-lighten-1">mdi-account</v-icon>
            </v-avatar>

            <!-- Patient Info -->
            <div class="patient-info flex-grow-1">
              <div class="d-flex align-center flex-wrap gap-2 mb-2">
                <h1 class="text-h5 font-weight-bold">{{ patient.name }}</h1>
                <v-chip
                  size="small"
                  :color="patient.sex === 1 ? 'blue' : 'pink'"
                  variant="flat"
                >
                  <v-icon start size="16">
                    {{ patient.sex === 1 ? 'mdi-gender-male' : 'mdi-gender-female' }}
                  </v-icon>
                  {{ patient.sex === 1 ? $t('patients.male') : $t('patients.female') }}
                </v-chip>
                <v-chip size="small" color="grey" variant="outlined">
                  ID: {{ patient.id }}
                </v-chip>
              </div>

              <div class="info-grid">
                <div class="info-item" v-if="patient.phone">
                  <v-icon size="18" color="primary">mdi-phone</v-icon>
                  <a :href="`tel:${patient.phone}`" class="text-decoration-none">
                    {{ patient.phone }}
                  </a>
                </div>
                <div class="info-item" v-if="patient.phone2">
                  <v-icon size="18" color="primary">mdi-phone-plus</v-icon>
                  <a :href="`tel:${patient.phone2}`" class="text-decoration-none">
                    {{ patient.phone2 }}
                  </a>
                </div>
                <div class="info-item" v-if="patient.email">
                  <v-icon size="18" color="primary">mdi-email</v-icon>
                  <a :href="`mailto:${patient.email}`" class="text-decoration-none">
                    {{ patient.email }}
                  </a>
                </div>
                <div class="info-item" v-if="patient.birth_date">
                  <v-icon size="18" color="primary">mdi-cake-variant</v-icon>
                  <span>{{ formatDate(patient.birth_date) }} ({{ calculateAge(patient.birth_date) }} {{ $t('patients.years') }})</span>
                </div>
                <div class="info-item" v-if="patient.address">
                  <v-icon size="18" color="primary">mdi-map-marker</v-icon>
                  <span>{{ patient.address }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="patient-actions">
              <!-- General Report (prominent) -->
              <v-btn
                class="report-btn"
                variant="flat"
                rounded="lg"
                prepend-icon="mdi-file-document-multiple-outline"
                @click="openReport"
              >
                <v-tooltip activator="parent" location="bottom">
                  {{ $t('report.title') }}
                </v-tooltip>
                {{ $t('report.button') }}
              </v-btn>
              <v-btn
                v-if="canEditPatient"
                color="primary"
                variant="tonal"
                rounded="lg"
                @click="editPatient"
                prepend-icon="mdi-pencil"
              >
                {{ $t('common.edit') }}
              </v-btn>
              <v-btn
                v-if="canCreateReservation"
                color="success"
                variant="tonal"
                rounded="lg"
                @click="openBooking"
                prepend-icon="mdi-calendar-plus"
              >
                {{ $t('patients.booking') }}
              </v-btn>
              <v-btn
                v-if="canViewBills"
                color="amber-darken-2"
                variant="tonal"
                rounded="lg"
                @click="openBillDialog"
                prepend-icon="mdi-receipt-text-outline"
              >
                <v-tooltip activator="parent" location="bottom">
                  {{ $t('bill.view_print_bill') }}
                </v-tooltip>
                {{ $t('bill.bill') }}
              </v-btn>
              <v-btn
                v-if="canViewRecipes"
                color="warning"
                variant="tonal"
                rounded="lg"
                @click="openRecipes"
                prepend-icon="mdi-prescription"
              >
                <v-tooltip activator="parent" location="bottom">
                  {{ $t('rx.title') }}
                </v-tooltip>
                {{ $t('patients.recipes') }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Quick Stats - Grid Layout -->
      <v-row class="mb-4" dense>
        <!-- Cases Stats -->
        <v-col v-if="canViewCases" cols="6" sm="4" md="2">
          <v-card elevation="1" rounded="lg" class="stat-card-mini fill-height">
            <v-card-text class="pa-3 text-center">
              <v-icon size="24" color="primary">{{ casesIcon }}</v-icon>
              <div class="text-h5 font-weight-bold mt-1">{{ patientCases.length }}</div>
              <div class="text-caption text-grey" style="line-height: 1.2;">{{ $t('patients.totalCases') }}</div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Last Visit (hidden on mobile) -->
        <v-col cols="6" sm="4" md="2" class="d-none d-sm-block">
          <v-card elevation="1" rounded="lg" class="stat-card-mini fill-height">
            <v-card-text class="pa-3 text-center">
              <v-icon size="24" color="info">mdi-calendar</v-icon>
              <div class="text-h6 font-weight-bold mt-1">{{ formatDate(patient.last_visit) || '-' }}</div>
              <div class="text-caption text-grey" style="line-height: 1.2;">{{ $t('patients.lastVisit') }}</div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Bills Stats -->
        <v-col v-if="canViewBills" cols="6" sm="4" md="2">
          <v-card elevation="1" rounded="lg" class="stat-card-mini fill-height">
            <v-card-text class="pa-3 text-center">
              <v-icon size="24" color="info">mdi-cash-multiple</v-icon>
              <div class="text-h5 font-weight-bold mt-1">{{ formatCurrency(totalBills) }}</div>
              <div class="text-caption text-grey" style="line-height: 1.2;">{{ $t('patients.totalBills') }}</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col v-if="canViewBills" cols="6" sm="4" md="2">
          <v-card elevation="1" rounded="lg" class="stat-card-mini fill-height">
            <v-card-text class="pa-3 text-center">
              <v-icon size="24" color="success">mdi-check-circle</v-icon>
              <div class="text-h5 font-weight-bold mt-1">{{ formatCurrency(totalPaid) }}</div>
              <div class="text-caption text-grey" style="line-height: 1.2;">{{ $t('patients.paidBills') }}</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col v-if="canViewBills" cols="6" sm="4" md="2">
          <v-card elevation="1" rounded="lg" class="stat-card-mini fill-height">
            <v-card-text class="pa-3 text-center">
              <v-icon size="24" color="warning">mdi-cash-clock</v-icon>
              <div class="text-h5 font-weight-bold mt-1">{{ formatCurrency(totalUnpaid) }}</div>
              <div class="text-caption text-grey" style="line-height: 1.2;">{{ $t('patients.remainingAmount') }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Specialty Patient View (e.g. Teeth Chart) -->
      <component
        v-if="canViewCases && specialtyViews[authStore.specialty]"
        :is="specialtyViews[authStore.specialty]"
        :categories="categories"
        :patient-cases="patientCases"
        :patient-data="patient"
        :beauty-categories="beautyCategories"
        @tooth-selected="handleToothSelected"
        @tooth-right-click="handleToothRightClick"
        @case-added="handleCaseAdded"
        @case-removed="handleCaseRemoved"
        @general-examination="openGeneralExamination"
        @color-changed="handleToothColorChanged"
        @beauty-category-click="handleBeautyCategoryClick"
      />

      <!-- General Patient Note -->
      <v-card elevation="2" rounded="lg" class="mb-4">
        <v-card-title class="d-flex align-center ga-2 py-3 px-4">
          <v-icon color="primary" size="20">mdi-note-text-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold">{{ $t('patients.general_note') }}</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-textarea
            v-model="patientNote"
            :placeholder="$t('patients.general_note_hint')"
            variant="outlined"
            auto-grow
            rows="3"
            hide-details
            :readonly="!canEditPatient"
            prepend-inner-icon="mdi-pencil-outline"
            color="primary"
          />
        </v-card-text>
        <v-card-actions v-if="canEditPatient" class="px-4 pb-4 pt-0 justify-end">
          <v-btn
            color="primary"
            variant="elevated"
            :loading="savingPatientNote"
            prepend-icon="mdi-content-save"
            @click="savePatientNote"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Cases Section -->
      <v-card v-if="canViewCases" elevation="2" rounded="lg" class="mb-4">
        <v-card-text class="pa-3 pa-sm-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-subtitle-1 font-weight-bold">
              <v-icon start color="primary" size="20">mdi-clipboard-list</v-icon>
              {{ $t('patients.cases') }}
              <v-chip size="x-small" color="primary" variant="tonal" class="ml-1">{{ patientCases.length }}</v-chip>
            </h3>
            <div class="d-flex ga-2">
              <!-- Mobile: Icon only -->
              <v-tooltip :text="$t('ai.analyzePatient')" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="indigo"
                    variant="tonal"
                    icon
                    size="small"
                    :disabled="!patientCases.length"
                    class="d-sm-none"
                    @click="analyzePatientWithAi"
                  >
                    <v-icon>mdi-robot-happy-outline</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <!-- Desktop: Full button with text -->
              <v-btn
                color="indigo"
                variant="tonal"
                prepend-icon="mdi-robot-happy-outline"
                :disabled="!patientCases.length"
                @click="analyzePatientWithAi"
                class="d-none d-sm-inline-flex"
              >
                {{ $t('ai.analyzePatient') }}
              </v-btn>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddCaseModal">
                {{ $t('cases.add_case') || 'إضافة حالة' }}
              </v-btn>
            </div>
          </div>

          <!-- Cases v-data-table (all specialties) -->
          <v-data-table
            :headers="caseHeaders"
            :items="filteredCases"
            :items-per-page="-1"
            item-value="id"
            :expanded="expandedOrthoCaseIds"
            density="compact"
            mobile-breakpoint="sm"
            :hide-default-footer="true"
            class="elevation-0 rounded-lg cases-data-table"
          >
            <!-- Tooth number -->
            <template #item.tooth_num="{ item }">
              <v-chip v-if="item.tooth_num" size="small" color="info" variant="flat">
                <v-icon start size="13">mdi-tooth</v-icon>
                {{ item.tooth_num }}
              </v-chip>
              <span v-else class="text-grey text-caption">{{ $t('patients.general') }}</span>
            </template>

            <!-- Category -->
            <template #item.category="{ item }">
              <v-chip
                size="small"
                :color="item.category?.color || getCategoryColor(item.category?.id || item.case_categores_id)"
                variant="tonal"
              >
                {{ item.category?.name || getCategoryName(item.category?.id || item.case_categores_id) }}
              </v-chip>
            </template>

            <!-- Doctor -->
            <template #item.doctor="{ item }">
              <div class="d-flex align-center ga-1">
                <v-icon size="14" color="primary">mdi-doctor</v-icon>
                <span class="text-body-2">{{ item.doctor?.name || '-' }}</span>
              </div>
            </template>

            <!-- Price -->
            <template #item.price="{ item }">
              <input
                :value="item.price ? formatNumberWithCommas(item.price) : ''"
                type="text"
                inputmode="numeric"
                class="case-price-input"
                @focus="(e) => { e.target.value = item.price || ''; e.target.select() }"
                @input="(e) => { const d = e.target.value.replace(/[^0-9]/g, ''); e.target.value = d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '' }"
                @blur="(e) => { item.price = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; saveCaseBackground(item) }"
                @keyup.enter="(e) => e.target.blur()"
              />
            </template>

            <!-- Paid -->
            <template #item.paid="{ item }">
              <div class="d-flex flex-wrap align-center ga-1">
                <v-chip
                  v-for="bill in (item.bills || [])"
                  :key="bill.id"
                  size="small"
                  color="success"
                  variant="flat"
                >
                  <v-icon start size="12">mdi-cash-check</v-icon>
                  {{ formatNumberWithCommas(bill.price || 0) }}
                </v-chip>
                <span v-if="!(item.bills || []).length" class="text-grey text-caption">لاتوجد</span>

                <!-- Quick add-bill: inline popover with a price field -->
                <v-menu
                  v-if="canCreateBill && hasPrice(item) && getCaseRemainingAmount(item) > 0"
                  :model-value="quickBill.open && quickBill.caseId === item.id"
                  @update:model-value="val => val ? openQuickBill(item) : (quickBill.open = false)"
                  :close-on-content-click="false"
                  location="bottom"
                >
                  <template #activator="{ props: mp }">
                    <v-tooltip :text="$t('patients.addBill') || 'Add bill'" location="top">
                      <template #activator="{ props: tp }">
                        <v-btn v-bind="{ ...mp, ...tp }" icon variant="text" size="x-small" color="success" @click.stop>
                          <v-icon size="16">mdi-cash-plus</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
                  </template>
                  <v-card width="300" rounded="lg" class="quick-bill-card">
                    <!-- Header -->
                    <div class="quick-bill-header">
                      <v-icon color="success" size="22">mdi-cash-plus</v-icon>
                      <span class="quick-bill-title">{{ $t('patients.addPayment') || 'إضافة دفعة' }}</span>
                    </div>

                    <div class="pa-4 pt-3">
                      <!-- Remaining summary -->
                      <div class="quick-bill-remaining">
                        <span class="text-caption text-grey">{{ $t('patients.remainingToPay') || $t('patients.remaining') }}</span>
                        <span class="quick-bill-remaining-value">{{ formatNumberWithCommas(quickBillRemaining) }} IQD</span>
                      </div>

                      <v-text-field
                        :model-value="quickBill.price ? formatNumberWithCommas(quickBill.price) : ''"
                        @update:model-value="quickBill.price = parseFormattedNumber($event)"
                        @keyup.enter="submitQuickBill"
                        :label="$t('patients.paymentAmount') || 'المبلغ المدفوع'"
                        :placeholder="$t('patients.enterAmount') || 'أدخل المبلغ'"
                        type="text"
                        inputmode="numeric"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-cash"
                        suffix="IQD"
                        :error="quickBill.price > quickBillRemaining"
                        :error-messages="quickBill.price > quickBillRemaining ? ($t('patients.exceedsRemaining') || 'المبلغ أكبر من المتبقي') : []"
                        autofocus
                        class="mt-1 mb-2"
                      />

                      <div class="d-flex ga-2">
                        <v-btn variant="text" size="small" class="flex-grow-1" @click="quickBill.open = false">
                          {{ $t('common.cancel') }}
                        </v-btn>
                        <v-btn
                          color="primary"
                          size="small"
                          class="flex-grow-1"
                          :loading="quickBillLoading"
                          :disabled="!quickBill.price || quickBill.price > quickBillRemaining"
                          @click="submitQuickBill"
                        >
                          <v-icon start size="16">mdi-check</v-icon>
                          {{ $t('patients.confirmPayment') || 'تأكيد' }}
                        </v-btn>
                      </div>
                    </div>
                  </v-card>
                </v-menu>
              </div>
            </template>

            <!-- Remaining -->
            <template #item.remaining="{ item }">
              <span v-if="!hasPrice(item)" class="text-grey text-caption">-</span>
              <v-chip v-else-if="getCaseRemainingAmount(item) > 0" size="small" color="warning" variant="flat">
                <v-icon start size="12">mdi-cash-clock</v-icon>
                {{ formatNumberWithCommas(getCaseRemainingAmount(item)) }}
              </v-chip>
              <v-chip v-else size="small" color="success" variant="flat">
                <v-icon start size="12">mdi-check-circle</v-icon>
                {{ $t('patients.fullyPaid') || 'مدفوع' }}
              </v-chip>
            </template>

            <!-- Status -->
            <template #item.status="{ item }">
              <div class="d-flex align-center ga-1">
                <v-switch
                  :model-value="getCaseStatusId(item) === 3"
                  color="success"
                  hide-details
                  density="compact"
                  class="case-status-switch"
                  :disabled="savingCase"
                  @update:model-value="(val) => updateCaseStatus(item, val ? 3 : 2)"
                />
                <span
                  class="text-caption font-weight-medium"
                  :class="getCaseStatusId(item) === 3 ? 'text-success' : 'text-warning'"
                >
                  {{ getCaseStatusId(item) === 3 ? $t('common.completed') : $t('common.pending') }}
                </span>
              </div>
            </template>

            <!-- Date -->
            <template #item.case_date="{ item }">
              <span class="text-caption">{{ formatDate(item.case_date || item.created_at) }}</span>
            </template>

            <!-- Notes: orthodontics cases show their full detail panel automatically
                 below the row (see #expanded-row) — this cell is just a small
                 indicator. Every other category keeps the simple, always-visible
                 note box — no click needed, easy for any user. -->
            <template #item.notes="{ item }">
              <div v-if="isOrthoCase(item)" class="ortho-row-indicator">
                <v-icon size="14">mdi-tooth-outline</v-icon>
                {{ $t('caseCategories.isOrthodontic') || 'تقويم' }}
                <v-chip v-if="getCaseNotesCount(item.id)" size="x-small" color="indigo" variant="flat" class="ms-1">
                  {{ getCaseNotesCount(item.id) }}
                </v-chip>
              </div>

              <div v-else class="notes-container" style="min-width:210px;max-width:260px">
                <div class="d-flex align-start ga-1 mb-1">
                  <v-textarea
                    v-model="noteInputs[item.id]"
                    placeholder="ملاحظات الحالة الرئيسية..."
                    variant="outlined"
                    density="compact"
                    rows="1"
                    auto-grow
                    hide-details
                    class="notes-textarea flex-grow-1"
                    @click.stop
                  />
                  <v-btn
                    v-if="canCreateNote"
                    icon
                    size="small"
                    color="primary"
                    variant="tonal"
                    :loading="savingNoteFor === item.id"
                    @click.stop="submitInlineNote(item.id)"
                  >
                    <v-icon size="18">mdi-plus</v-icon>
                  </v-btn>
                </div>
                <div
                  v-for="note in getCaseNotes(item.id)"
                  :key="note.id"
                  class="d-flex align-start ga-1 mt-1 pa-1 rounded"
                  style="background:rgba(0,0,0,0.04)"
                >
                  <div class="text-caption flex-grow-1" style="white-space:pre-wrap;line-height:1.4">{{ note.content }}</div>
                  <v-btn
                    v-if="canDeleteNote"
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click.stop="deleteNote(note.id, item.id)"
                  >
                    <v-icon size="12">mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-inline-flex ga-0">
                <v-tooltip :text="$t('ai.analyzeCase')" location="top">
                  <template #activator="{ props: tp }">
                    <v-btn v-bind="tp" icon variant="text" size="x-small" class="ai-case-btn" @click.stop="analyzeCaseWithAi(item)">
                      <v-icon size="17">mdi-robot-happy-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('common.view') || 'View'" location="top">
                  <template #activator="{ props: tp }">
                    <v-btn v-bind="tp" icon variant="text" size="x-small" color="info" @click.stop="openCaseDrawer(item)">
                      <v-icon size="16">mdi-eye-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip v-if="canEditCase" :text="$t('common.edit') || 'Edit'" location="top">
                  <template #activator="{ props: tp }">
                    <v-btn v-bind="tp" icon variant="text" size="x-small" color="primary" @click.stop="editCase(item)">
                      <v-icon size="16">mdi-pencil-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip :text="$t('common.delete') || 'Delete'" location="top">
                  <template #activator="{ props: tp }">
                    <v-btn v-bind="tp" icon variant="text" size="x-small" color="error" @click.stop="deleteCase(item)">
                      <v-icon size="16">mdi-delete-outline</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>

            <!-- Expanded row: roomy in-page notes panel (no dialog/overlay) -->
            <template #expanded-row="{ columns, item }">
              <tr class="case-notes-panel-row">
                <td :colspan="columns.length" class="pa-0">
                  <div class="case-notes-panel">
                    <!-- Roomy notes textarea -->
                    <div class="case-notes-section">
                      <div class="d-flex align-center justify-space-between">
                        <div class="case-notes-section-title">
                          <v-icon size="15" class="me-1">mdi-note-edit-outline</v-icon>ملاحظات الحالة
                        </div>
                        <span v-if="draftStatus[item.id] === 'saving'" class="draft-status draft-status--saving">
                          <v-progress-circular indeterminate size="10" width="2" class="me-1" />جارٍ الحفظ...
                        </span>
                        <span v-else-if="draftStatus[item.id] === 'saved'" class="draft-status draft-status--saved">
                          <v-icon size="12" class="me-1">mdi-check-circle</v-icon>تم الحفظ
                        </span>
                      </div>
                      <div
                        class="case-notes-dropzone"
                        :class="{ 'case-notes-dropzone--drag': noteDropActive === item.id }"
                        @dragover.prevent="noteDropActive = item.id"
                        @dragleave.prevent="noteDropActive = null"
                        @drop.prevent="onNoteDrop($event, item.id)"
                      >
                        <v-textarea
                          v-model="getOrthoForm(item.id).text"
                          :placeholder="'اكتب كل تفاصيل الحالة هنا... (يمكنك سحب الصور أو لصقها هنا)'"
                          variant="outlined"
                          rows="4"
                          auto-grow
                          density="comfortable"
                          hide-details
                          class="case-notes-textarea"
                          @update:model-value="scheduleDraftSave(item.id)"
                          @paste="onNotePaste($event, item.id)"
                        />
                      </div>
                      <NoteImageAttachments
                        :images="getOrthoForm(item.id).images"
                        v-model:selected-type="getOrthoForm(item.id).imageType"
                        add-label="أضف صورة (JPG, PNG, WEBP)"
                        @add-files="({ files, type }) => addPendingImages(item.id, files, type)"
                        @remove="removePendingImage(item.id, $event)"
                        @open="openLightbox(getOrthoForm(item.id).images, $event)"
                      />
                    </div>

                    <div class="d-flex align-center justify-space-between mt-3 flex-wrap ga-2">
                      <OrthoMetaBadges v-if="orthoHeaderLine(item.id)" :meta="getOrthoForm(item.id)" />
                      <v-spacer v-else />
                      <v-tooltip
                        v-if="canCreateNote"
                        :text="canSaveOrthoNote(item.id) ? '' : 'أدخل نصًا أو اختر حقلاً أو أضف صورة قبل الحفظ'"
                        location="top"
                        :disabled="canSaveOrthoNote(item.id)"
                      >
                        <template #activator="{ props: tp }">
                          <v-btn
                            v-bind="tp"
                            color="primary"
                            variant="elevated"
                            size="small"
                            :loading="savingNoteFor === item.id"
                            :disabled="!canSaveOrthoNote(item.id)"
                            prepend-icon="mdi-content-save"
                            @click="saveCasePanelNote(item)"
                          >
                            حفظ الملاحظة
                          </v-btn>
                        </template>
                      </v-tooltip>
                    </div>

                    <!-- Timeline of previous notes -->
                    <div class="existing-notes-wrap">
                      <div class="existing-notes-title">
                        <v-icon size="14" class="me-1">mdi-history</v-icon>الملاحظات السابقة
                        <span v-if="getCaseNotes(item.id).length" class="existing-notes-count">{{ getCaseNotes(item.id).length }}</span>
                      </div>
                      <div v-if="getCaseNotes(item.id).length" class="existing-notes-timeline">
                        <CaseNoteCard
                          v-for="note in getCaseNotes(item.id)"
                          :key="note.id"
                          :note="note"
                          :images="getResolvedNoteImages(note, item.id)"
                          :is-ortho-case="isOrthoCase(item)"
                          :can-edit="canEditNote"
                          :can-delete="canDeleteNote"
                          :saving="updatingNoteId === note.id"
                          @update="updateNote(note, item.id, $event)"
                          @delete="deleteNote(note.id, item.id)"
                          @add-images="addImagesToExistingNote(note, item.id, $event)"
                          @remove-image="deleteNoteImage($event, note, item.id)"
                          @open-lightbox="openLightbox(getResolvedNoteImages(note, item.id), $event)"
                        />
                      </div>
                      <div v-else class="existing-notes-empty">لا توجد ملاحظات سابقة بعد</div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- No data -->
            <template #no-data>
              <div class="text-center py-6 text-grey">
                <v-icon size="48" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
                <p class="text-body-2 mt-2">{{ $t('patients.no_cases') || 'لا توجد حالات' }}</p>
              </div>
            </template>
          </v-data-table>

        </v-card-text>
      </v-card>

              <!-- Case Photos Section -->
      <v-card v-if="canViewCases" elevation="2" rounded="lg" class="mb-4">
        <v-card-text class="pa-3 pa-sm-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <h4 class="text-subtitle-1 font-weight-bold">
                  <v-icon start color="primary" size="20">mdi-image-multiple</v-icon>
                  {{ $t('patients.casePhotos') || 'Case Photos' }}
                </h4>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ casePhotos.length }}
                </v-chip>
              </div>

                <!-- Drop Zone -->
                <div
                  class="drop-zone"
                  :class="{ 'drop-zone-active': isDragging }"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleCasePhotoDrop"
                  @click="triggerCasePhotoInput"
                >
                  <input
                    ref="casePhotoInput"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    @change="handleCasePhotoSelect"
                  />
                  <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cloud-upload</v-icon>
                  <p class="text-body-2 text-grey mb-1">
                    {{ $t('patients.dropPhotosHere') || 'Drop photos here or click to upload' }}
                  </p>
                  <p class="text-caption text-grey-darken-1">
                    {{ $t('patients.supportedFormats') || 'Supported formats: JPG, PNG, GIF' }}
                  </p>
                </div>

                <!-- Uploading Progress -->
                <v-progress-linear
                  v-if="uploadingCasePhoto"
                  indeterminate
                  color="primary"
                  class="mt-3"
                />

                <!-- Photos Grid -->
                <v-row v-if="casePhotos.length" class="mt-3">
                  <v-col
                    v-for="(photo, index) in casePhotos"
                    :key="photo.id || index"
                    cols="4"
                    sm="3"
                    md="2"
                  >
                    <v-card class="case-photo-card" hover @click="viewCasePhoto(photo)">
                      <v-img
                        :src="getCasePhotoUrl(photo)"
                        aspect-ratio="1"
                        cover
                        class="rounded"
                      >
                        <template #placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular indeterminate size="24" color="grey-lighten-5" />
                          </div>
                        </template>
                        <template #error>
                          <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                            <div class="text-center">
                              <v-icon size="32" color="grey">mdi-image-broken</v-icon>
                              <p class="text-caption mt-1">Failed to load</p>
                            </div>
                          </div>
                        </template>
                        <div class="photo-overlay">
                          <v-btn
                            icon
                            size="x-small"
                            color="error"
                            variant="flat"
                            @click.stop="deleteCasePhoto(photo)"
                          >
                            <v-icon size="16">mdi-delete</v-icon>
                          </v-btn>
                        </div>
                      </v-img>
                      <v-card-text class="pa-1 text-center text-caption">
                        {{ formatDate(photo.created_at) }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
        </v-card-text>
      </v-card>

      <!-- Bills Section -->
      <v-card v-if="canViewBills" elevation="2" rounded="lg" class="mb-4">
        <v-card-text class="pa-3 pa-sm-4">
              <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
                <h3 class="text-subtitle-1 font-weight-bold">
                  <v-icon start color="success" size="20">mdi-receipt</v-icon>
                  {{ $t('patients.bill') }}
                </h3>
                <div class="d-flex ga-1 flex-wrap">
                  <v-chip color="info" size="x-small" variant="flat">
                    {{ formatCurrency(totalBills) }}
                  </v-chip>

                  <v-chip color="warning" size="x-small" variant="flat">
                    {{ formatCurrency(totalUnpaid) }}
                  </v-chip>
                  
                  <v-chip color="success" size="x-small" variant="flat">
                    {{ formatCurrency(totalPaid) }}
                  </v-chip>
                  
                </div>
              </div>

              <!-- Compact Add Bill Form -->
              <v-card v-if="canCreateBill" variant="outlined" class="mb-3 pa-3" rounded="lg">
                <v-row dense align="center">
                  <v-col cols="12" sm="5">
                    <v-select
                      v-model="newBill.case_id"
                      :items="unpaidCases"
                      :item-title="getCaseBillingTitle"
                      item-value="id"
                      :label="$t('caseManagement.selectCase')"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-clipboard-list"
                      :no-data-text="$t('patients.no_unpaid_cases') || 'No unpaid cases'"
                      color="primary"
                      class="case-select-compact"
                      :menu-props="{ maxHeight: 300 }"
                      hide-details
                    >
                      <template #selection="{ item }">
                        <div class="d-flex align-center ga-1">
                          <v-chip size="x-small" :color="item.raw.category?.color || 'primary'" variant="flat">
                            {{ item.raw.category?.name || getCategoryName(item.raw.case_categores_id) }}
                          </v-chip>
                          <span v-if="item.raw.tooth_num" class="text-caption">#{{ item.raw.tooth_num }}</span>
                          <span class="text-caption text-grey-darken-1">{{ formatNumberWithCommas(getRemainingAmount(item.raw)) }} IQD</span>
                        </div>
                      </template>
                      <template #item="{ props, item }">
                        <v-list-item 
                          v-bind="props" 
                          class="py-2 px-3"
                          :title="null"
                          :subtitle="null"
                          density="compact"
                        >
                          <div class="case-item-compact">
                            <div class="d-flex align-center ga-1 mb-1">
                              <v-chip size="x-small" :color="item.raw.category?.color || 'primary'" variant="flat">
                                {{ item.raw.category?.name || getCategoryName(item.raw.case_categores_id) }}
                              </v-chip>
                              <v-chip v-if="item.raw.tooth_num" size="x-small" color="info" variant="tonal">
                                <v-icon start size="10">mdi-tooth</v-icon>
                                {{ item.raw.tooth_num }}
                              </v-chip>
                            </div>
                            <div class="d-flex align-center ga-2">
                              <span class="text-caption text-grey-darken-1">{{ formatNumberWithCommas(item.raw.price) }} IQD</span>
                              <v-chip
                                v-if="getRemainingAmount(item.raw) > 0"
                                size="x-small"
                                color="warning"
                                variant="flat"
                              >
                                {{ $t('patients.remaining') }}: {{ formatNumberWithCommas(getRemainingAmount(item.raw)) }}
                              </v-chip>
                              <v-chip v-else-if="hasPrice(item.raw)" size="x-small" color="success" variant="outlined">
                                <v-icon start size="10">mdi-check-circle</v-icon>
                                {{ $t('patients.fullyPaid') || 'Paid' }}
                              </v-chip>
                            </div>
                          </div>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="7" sm="4">
                    <v-text-field 
                      :model-value="formatNumberWithCommas(newBill.price)"
                      @update:model-value="newBill.price = parseFormattedNumber($event)"
                      :label="$t('cases.price')"
                      type="text"
                      variant="outlined"
                    
                      prepend-inner-icon="mdi-currency-usd"
                      suffix="IQD"
                      :color="newBill.price > selectedCaseRemainingAmount ? 'error' : 'primary'"
                      :error="newBill.price > selectedCaseRemainingAmount"
                      hide-details="auto"
                      class="price-input-compact"
                    />
                  </v-col>
                  <v-col cols="5" sm="3">
                    <v-btn 
                      color="primary" 
                      block 
                      size="default"
                      @click="createBill" 
                      :loading="addingBill" 
                      :disabled="!newBill.case_id || !newBill.price || newBill.price > selectedCaseRemainingAmount"
                      rounded="lg"
                    >
                      <v-icon start size="18">mdi-plus</v-icon>
                      {{ $t('common.add') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>

              <!-- Bills Table -->
              <v-data-table
                :headers="billHeaders"
                :items="patientBills"
                :items-per-page="-1"
                class="elevation-0 rounded-lg bills-table-compact"
                density="compact"
                mobile-breakpoint="sm"
                :hide-default-footer="true"
              >
                <template #item.category="{ item }">
                  <v-chip 
                    v-if="item.billable?.category"
                    size="small" 
                    :color="item.billable.category.color || 'primary'"
                    variant="tonal"
                  >
                    {{ getBillableCategoryName(item) }}
                  </v-chip>
                  <span v-else class="text-grey text-body-2">-</span>
                </template>
                <template #item.tooth_num="{ item }">
                  <v-chip
                    v-if="item.billable?.tooth_num"
                    size="small"
                    color="primary"
                    variant="outlined"
                  >
                    <v-icon start size="14">mdi-tooth</v-icon>
                    {{ item.billable.tooth_num }}
                  </v-chip>
                  <span v-else class="text-grey text-body-2">{{ $t('patients.general') }}</span>
                </template>
                <template #item.doctor="{ item }">
                  <span v-if="item.billable?.doctor" class="text-body-2">{{ item.billable.doctor.name }}</span>
                  <span v-else class="text-grey text-body-2">-</span>
                </template>
                <template #item.price="{ item }">
                  <span class="font-weight-bold text-body-2">
                    {{ item.price ? formatNumberWithCommas(item.price) : '—' }}
                    <span class="text-caption text-grey ms-1">IQD</span>
                  </span>
                </template>

                <template #item.bill_date="{ item }">
                  <span class="text-body-2">{{ formatDate(item.bill_date || item.created_at) }}</span>
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex ga-0">
                    <v-tooltip :text="$t('common.edit') || 'Edit'" location="top">
                      <template #activator="{ props: tp }">
                        <v-btn v-bind="tp" icon variant="text" size="small" color="primary" @click="openBillDateDialog(item)">
                          <v-icon size="16">mdi-pencil-outline</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
                    <v-btn v-if="canDeleteBill" icon variant="text" size="small" color="error" @click="deleteBill(item)">
                      <v-icon size="16">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
                <template #no-data>
                  <div class="text-center py-3 text-grey">
                    <v-icon size="36" color="grey-lighten-2">mdi-receipt-text-outline</v-icon>
                    <p class="text-caption mt-1">{{ $t('patients.no_bills') }}</p>
                  </div>
                </template>
              </v-data-table>
        </v-card-text>
      </v-card>

   
    </template>

    <!-- Patient Not Found -->
    <v-alert v-else type="warning">
      {{ $t('patients.notFound') }}
    </v-alert>

    <!-- Edit Patient Dialog -->
    <v-dialog v-model="editDialog" max-width="600" scrollable>
      <PatientEditDialog
        v-if="editDialog"
        :patient="patient"
        @close="editDialog = false"
        @saved="onPatientSaved"
      />
    </v-dialog>

    <!-- Dynamic Add Case Modal -->
    <component
      v-if="addCaseModalComponent"
      :is="addCaseModalComponent"
      v-model="showAddCaseModal"
      :patient-id="patient?.id || route.params.id"
      :doctors="doctors"
      :categories="categories"
      :editing-case="editingCase"
      @success="onCaseSaved"
      @category-created="onCategoryCreated"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('common.confirmDelete') }}</v-card-title>
        <v-card-text>{{ $t('patients.deleteCaseConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn color="error" :loading="deletingCase" @click="confirmDeleteCase">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Viewer Dialog -->
    <v-dialog v-model="imageViewerDialog" max-width="900">
      <v-card>
        <v-toolbar color="transparent" flat>
          <v-toolbar-title>{{ $t('patients.imageViewer') }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="imageViewerDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-img
            v-if="selectedImage"
            :src="getImageUrl(selectedImage)"
            max-height="600"
            contain
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Case Photo Viewer Dialog -->
    <v-dialog v-model="casePhotoViewerDialog" max-width="900">
      <v-card>
        <v-toolbar color="transparent" flat>
          <v-toolbar-title>{{ $t('patients.casePhoto') || 'Case Photo' }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="casePhotoViewerDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-img
            v-if="selectedCasePhoto"
            :src="getCasePhotoUrl(selectedCasePhoto)"
            max-height="600"
            contain
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Clinical note image lightbox (zoom / pan / navigate / download / fullscreen) -->
    <ImageLightbox
      v-model="lightboxOpen"
      :images="lightboxImages"
      :index="lightboxIndex"
      @update:index="lightboxIndex = $event"
    />

    <!-- Edit Bill Dialog -->
    <v-dialog v-model="billDateDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center ga-2 pa-4">
          <v-icon color="primary">mdi-receipt-text-edit</v-icon>
          {{ $t('bills.edit_bill') || 'تعديل الفاتورة' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="billEditPrice"
                :label="$t('cases.price') || 'المبلغ'"
                type="text"
                inputmode="numeric"
                variant="outlined"
                density="compact"
                suffix="IQD"
                prepend-inner-icon="mdi-cash"
                hide-details="auto"
                @input="(e) => { const d = e.target.value.replace(/[^0-9]/g, ''); e.target.value = d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''; billEditPrice = e.target.value }"
              />
            </v-col>
            <v-col cols="12" class="mt-3">
              <v-text-field
                v-model="billDateValue"
                type="date"
                :label="$t('bills.created_at') || 'تاريخ الفاتورة'"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-calendar"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="billDateDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="elevated" :loading="savingBillDate" @click="saveBillDate">
            <v-icon start>mdi-content-save</v-icon>
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Booking Dialog -->
    <BookingDialog
      v-model="bookingDialog"
      :selected-date="selectedBookingDate"
      :patient-id="patient?.id"
      :doctors="doctors"
      :default-doctor-id="defaultDoctorId"
      @saved="handleBookingSaved"
      @error="handleBookingError"
    />

    <!-- Recipe Dialog -->
    <RecipeDialog
      v-model="recipeDialog"
      :patient-id="patient?.id"
      :patient-info="patient"
      :doctors="doctors"
      :recipe="selectedRecipe"
      :default-doctor-id="defaultDoctorId"
      @saved="handleRecipeSaved"
      @error="handleRecipeError"
    />

    <!-- Recipe Print (Hidden) -->
    <RecipePrint
      ref="recipePrintRef"
      :recipe="recipeToPrint"
      :clinic-settings="clinicSettings"
    />

    <!-- Bill Preview Dialog -->
    <BillPreviewDialog
      v-model="billDialog"
      :reservation="billReservation"
      :bills="patientBills"
      :clinic-settings="clinicSettings"
      @close="billDialog = false"
    />

    <!-- General Patient Report Dialog -->
    <PatientReportDialog
      v-model="reportDialog"
      :patient="patient"
      :cases="patientCases"
      :bills="patientBills"
      :categories="categories"
      :images="aiPatientImages"
      :clinic-settings="clinicSettings"
    />

    <!-- Case Detail Drawer -->
    <CaseDrawer
      v-model="caseDrawerOpen"
      :case-data="drawerCase"
      :notes="drawerCaseNotes"
      :show-patient="false"
      :show-view-full="false"
      @edit="editCase"
    />

    <!-- AI Insight Drawer (per-case & whole-patient analysis) -->
    <AiInsightDrawer
      v-model="aiDrawer.open"
      :title="aiDrawer.title"
      :loading="aiDrawer.loading"
      :response="aiDrawer.response"
      :error="aiDrawer.error"
      :sources="aiDrawer.sources"
      :context-text="aiDrawer.contextText"
      :analyzed-image="aiDrawer.analyzedImage"
      :patient-images="aiPatientImages"
      @retry="retryAiAnalysis"
      @analyze-image="analyzeImageWithAi"
      @error="onAiDrawerError"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import api from '@/services/api'
import PatientEditDialog from '@/components/PatientEditDialog.vue'
import BookingDialog from '@/components/BookingDialog.vue'
import RecipeDialog from '@/components/RecipeDialog.vue'
import RecipePrint from '@/components/RecipePrint.vue'
import BillPreviewDialog from '@/components/BillPreviewDialog.vue'
import PatientReportDialog from '@/components/PatientReportDialog.vue'
import CaseDrawer from '@/components/CaseDrawer.vue'
import SmartTable from '@/components/SmartTable.vue'
import AiInsightDrawer from '@/components/ai/AiInsightDrawer.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import CaseNoteCard from '@/components/patients/CaseNoteCard.vue'
import NoteImageAttachments from '@/components/patients/NoteImageAttachments.vue'
import OrthoMetaBadges from '@/components/patients/OrthoMetaBadges.vue'
import aiService from '@/services/ai.service'
import { formatXrayAnalysis } from '@/utils/aiFormat'
import { extractImageFiles, isSupportedImage, makeImageKey } from '@/utils/imageFiles'
import { buildOrthoLine } from '@/utils/orthoNote'
import { parseImageTag, setImageTag } from '@/utils/noteImageTag'
import RecipeService from '@/services/recipe.service'
import billService from '@/services/bill.service'
import reservationService from '@/services/reservation.service'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { PERMISSIONS } from '@/constants/permissions'
import { addCaseModals, specialtyViews, getSmartPatientCaseColumns } from '@/config/specialties'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const { mobile: isMobile } = useDisplay()

// Permissions
const { hasPermissionFor, hasPermission, hasAnyPermission } = usePermissions()

// Permission computed refs for template
const canViewCases = computed(() => hasPermissionFor('case'))
const canViewBills = computed(() => {
  // Check for any bill-related permission
  return hasPermissionFor('bill') || hasAnyPermission([
    PERMISSIONS.VIEW_ALL_BILLS,
    PERMISSIONS.VIEW_CLINIC_BILLS,
    PERMISSIONS.VIEW_OWN_BILLS,
    PERMISSIONS.CREATE_BILL,
    PERMISSIONS.EDIT_BILL,
    PERMISSIONS.DELETE_BILL,
    PERMISSIONS.MARK_BILL_PAID
  ])
})
const canViewRecipes = computed(() => hasPermissionFor('recipe'))
const canEditPatient = computed(() => hasPermission(PERMISSIONS.EDIT_PATIENT))
const canCreateReservation = computed(() => hasPermission(PERMISSIONS.CREATE_RESERVATION))
const canCreateCase = computed(() => hasPermission(PERMISSIONS.CREATE_CASE))
const canEditCase = computed(() => hasPermission(PERMISSIONS.EDIT_CASE))
const canDeleteCase = computed(() => hasPermission(PERMISSIONS.DELETE_CASE))
const canCreateBill = computed(() => hasPermission(PERMISSIONS.CREATE_BILL))
const canDeleteBill = computed(() => hasPermission(PERMISSIONS.DELETE_BILL))
const canMarkBillPaid = computed(() => hasPermission(PERMISSIONS.MARK_BILL_PAID))
const canCreateRecipe = computed(() => hasPermission(PERMISSIONS.CREATE_RECIPE))
const canViewNotes = computed(() => hasPermission(PERMISSIONS.VIEW_NOTES))
const canCreateNote = computed(() => hasPermission(PERMISSIONS.CREATE_NOTE))
const canDeleteNote = computed(() => hasPermission(PERMISSIONS.DELETE_NOTE))
const canEditNote = computed(() => hasPermission(PERMISSIONS.EDIT_NOTE))

// Debug permissions in development
if (import.meta.env.DEV) {
  watch(() => canViewBills.value, (newVal) => {
    console.log('🔍 PatientDetail - canViewBills:', newVal)
    console.log('📋 User permissions:', authStore.userPermissions)
  }, { immediate: true })
}

// State
const loading = ref(true)
const error = ref(null)
const patient = ref(null)
const patientNote = ref('')
const savingPatientNote = ref(false)
const patientCases = ref([])
const patientImages = ref([])
const categories = ref([])
const activeTab = ref('teeth')
const caseSearch = ref('')

// Booking
const bookingDialog = ref(false)
const doctors = ref([])
const selectedBookingDate = ref(new Date().toISOString().split('T')[0]) // Today's date in YYYY-MM-DD format

// Recipes
const recipeDialog = ref(false)
const patientRecipes = ref([])
const selectedRecipe = ref(null)
const recipeViewDialog = ref(false)
const recipePrintRef = ref(null)
const recipeToPrint = ref(null)
const clinicSettings = ref(null)

// Dialogs
const editDialog = ref(false)
const showAddCaseModal = ref(false)
// Resolve the add-case modal for the current specialty, falling back to the
// generic (dental) modal for any specialty that has no dedicated modal
// (e.g. 'general', 'dermatology'). Using `|| 'dental'` alone only handles an
// empty specialty; an unmapped-but-truthy specialty would leave this undefined
// and the "Add case" dialog would silently never render.
const addCaseModalComponent = computed(
  () => addCaseModals[authStore.specialty] || addCaseModals.dental
)
// Icon for the "total cases" stat card, per specialty. The tooth icon only
// makes sense for dental clinics; ophthalmology and general clinics get a
// neutral/relevant icon instead.
const casesIcon = computed(() => {
  const icons = { dental: 'mdi-tooth', ophthalmology: 'mdi-eye' }
  return icons[authStore.specialty] || 'mdi-medical-bag'
})
const deleteDialog = ref(false)
const imageViewerDialog = ref(false)
const billDialog = ref(false)
const reportDialog = ref(false)

// Bill
const billReservation = ref(null)

// Case
const editingCase = ref(null)
const deletingCase = ref(false)
const savingCase = ref(false)
const caseToDelete = ref(null)

// Case Drawer
const caseDrawerOpen = ref(false)
const drawerCase = ref(null)
const drawerCaseNotes = ref([])

// Case Notes inline state
const savingNoteFor = ref(null)

// ===== AI Insight Drawer =====
const aiDrawer = ref({
  open: false,
  loading: false,
  title: '',
  response: '',
  error: '',
  sources: [],
  contextText: '',
  analyzedImage: ''
})
// Remembers the last run as a callable so "retry / regenerate" can re-run any flow
const lastAiRun = ref(null)

// Existing patient images (from /images/by-imageable) offered for one-click AI analysis
const aiPatientImages = computed(() =>
  (casePhotos.value || [])
    .map(p => ({ id: p.id, url: getCasePhotoUrl(p) }))
    .filter(p => p.url)
)

const sexLabel = (sex) => (sex === 1 || sex === '1' ? t('patients.male') : t('patients.female'))

// Map UI locale -> instruction telling the AI which language to answer in
const aiLanguageName = () => {
  const map = { ar: 'العربية', en: 'English', ku: 'الكردية', pl: 'polskim' }
  return map[locale.value] || 'العربية'
}

// Build a readable, self-contained summary for ONE case
const buildCaseContext = (item) => {
  const lines = []
  lines.push(`${t('patients.name')}: ${patient.value?.name || '-'}`)
  lines.push(`${t('patients.sex') || 'Gender'}: ${sexLabel(patient.value?.sex)}`)
  if (patient.value?.birth_date) {
    lines.push(`${t('patients.age') || 'Age'}: ${calculateAge(patient.value.birth_date)}`)
  }
  lines.push('---')
  lines.push(`${t('patients.category')}: ${item.category?.name || getCategoryName(item.category?.id || item.case_categores_id) || '-'}`)
  if (item.tooth_num) lines.push(`${t('patients.toothNumber') || 'Tooth'}: ${item.tooth_num}`)
  lines.push(`${t('common.doctor')}: ${item.doctor?.name || '-'}`)
  lines.push(`${t('status') || 'Status'}: ${getCaseStatusId(item) === 3 ? t('common.completed') : t('common.pending')}`)
  lines.push(`${t('common.date')}: ${formatDate(item.case_date || item.created_at) || '-'}`)
  if (item.price) lines.push(`${t('cases.price')}: ${item.price}`)
  if (item.description) lines.push(`${t('common.message') || 'Description'}: ${item.description}`)
  const notes = getCaseNotes(item.id).map(n => n.content).filter(Boolean)
  if (notes.length) lines.push(`${t('patients.notes') || 'Notes'}:\n- ${notes.join('\n- ')}`)
  return lines.join('\n')
}

// Build a readable, self-contained summary for the WHOLE patient
const buildPatientContext = () => {
  const lines = []
  lines.push(`${t('patients.name')}: ${patient.value?.name || '-'}`)
  lines.push(`${t('patients.sex') || 'Gender'}: ${sexLabel(patient.value?.sex)}`)
  if (patient.value?.birth_date) lines.push(`${t('patients.age') || 'Age'}: ${calculateAge(patient.value.birth_date)}`)
  if (patient.value?.phone) lines.push(`${t('patients.phone') || 'Phone'}: ${patient.value.phone}`)
  if (patientNote.value) lines.push(`${t('patients.general_note')}: ${patientNote.value}`)
  lines.push('---')
  lines.push(`${t('patients.cases')} (${patientCases.value.length}):`)
  patientCases.value.forEach((c, i) => {
    const cat = c.category?.name || getCategoryName(c.category?.id || c.case_categores_id) || '-'
    const st = getCaseStatusId(c) === 3 ? t('common.completed') : t('common.pending')
    const tooth = c.tooth_num ? ` | ${t('patients.toothNumber') || 'Tooth'} ${c.tooth_num}` : ''
    const price = c.price ? ` | ${t('cases.price')} ${c.price}` : ''
    lines.push(`${i + 1}. ${cat}${tooth} | ${st}${price} | ${formatDate(c.case_date || c.created_at) || '-'}`)
  })
  return lines.join('\n')
}

const runAiAnalysis = async (prompt) => {
  lastAiRun.value = () => runAiAnalysis(prompt)
  aiDrawer.value.loading = true
  aiDrawer.value.response = ''
  aiDrawer.value.error = ''
  aiDrawer.value.sources = []
  aiDrawer.value.analyzedImage = ''
  try {
    const response = await aiService.chat(prompt)
    const payload = response.data || response
    if (response.success !== false) {
      aiDrawer.value.response = payload.answer || payload.raw_response || '—'
      aiDrawer.value.sources = payload.sources || []
    } else {
      aiDrawer.value.error = response.message || t('ai.errorGeneric')
    }
  } catch (err) {
    console.error('AI analysis error:', err)
    if (err.response?.status === 403) {
      aiDrawer.value.error = err.response?.data?.message || t('ai.notEnabled')
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      aiDrawer.value.error = t('ai.errorTimeout')
    } else {
      aiDrawer.value.error = t('ai.errorGeneric')
    }
  } finally {
    aiDrawer.value.loading = false
  }
}

// Per-case AI analysis (icon in each case row)
const analyzeCaseWithAi = (item) => {
  const context = buildCaseContext(item)
  aiDrawer.value.title = t('ai.caseContextTitle')
  aiDrawer.value.contextText = context
  aiDrawer.value.open = true
  const prompt = [
    `أنت مساعد طبي مساعد للطبيب. أجب باللغة ${aiLanguageName()}.`,
    'بناءً على بيانات هذه الحالة، قدّم بإيجاز ووضوح:',
    '1) ملخص الحالة. 2) ملاحظات أو تنبيهات سريرية محتملة. 3) خطوات العلاج/المتابعة المقترحة. 4) شرح مبسط يمكن قوله للمريض.',
    '',
    context
  ].join('\n')
  runAiAnalysis(prompt)
}

// Map an AI error to a user-facing message
const aiErrorMessage = (err) => {
  if (err?.response?.status === 403) return err.response?.data?.message || t('ai.notEnabled')
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) return t('ai.errorTimeout')
  return t('ai.errorGeneric')
}

// Whole-patient AI summary (button next to cases header).
// Calls BOTH the text chat API (all patient data) and the vision API (patient image),
// then shows both responses together as one result.
const analyzePatientWithAi = async () => {
  const context = buildPatientContext()
  aiDrawer.value.title = t('ai.patientContextTitle')
  aiDrawer.value.contextText = context
  aiDrawer.value.open = true
  aiDrawer.value.loading = true
  aiDrawer.value.response = ''
  aiDrawer.value.error = ''
  aiDrawer.value.sources = []
  aiDrawer.value.analyzedImage = ''
  lastAiRun.value = analyzePatientWithAi

  const prompt = [
    `أنت مساعد طبي مساعد للطبيب. أجب باللغة ${aiLanguageName()}.`,
    'بناءً على بيانات هذا المريض وكل حالاته، قدّم بإيجاز ووضوح:',
    '1) ملخص عام لحالة المريض. 2) الأنماط أو الملاحظات المهمة عبر الحالات. 3) التوصيات والمتابعة المقترحة. 4) أي تنبيهات تستحق انتباه الطبيب.',
    '',
    context
  ].join('\n')

  // Resolve the patient's first image to base64 (if any) for the vision call
  let imageBase64 = null
  const firstImage = aiPatientImages.value[0]
  if (firstImage) {
    imageBase64 = await urlToBase64(firstImage.url)
    if (imageBase64) aiDrawer.value.analyzedImage = imageBase64
  }

  // Fire both APIs together
  const tasks = [aiService.chat(prompt)]
  if (imageBase64) {
    tasks.push(aiService.analyzeXray({ imageBase64, patientId: patient.value?.id || null, context }))
  }
  const results = await Promise.allSettled(tasks)

  const parts = []
  let lastErr = null

  // 1) Text summary
  const textRes = results[0]
  if (textRes.status === 'fulfilled' && textRes.value?.success !== false) {
    const payload = textRes.value.data || textRes.value
    const answer = payload.answer || payload.raw_response || ''
    if (answer) parts.push(`## ${t('ai.summarySection')}\n\n${answer}`)
    aiDrawer.value.sources = payload.sources || []
  } else if (textRes.status === 'rejected') {
    lastErr = textRes.reason
    console.error('AI text summary error:', textRes.reason)
  }

  // 2) Image analysis
  if (imageBase64 && results[1]) {
    const imgRes = results[1]
    if (imgRes.status === 'fulfilled' && imgRes.value?.success !== false) {
      const payload = imgRes.value.data || imgRes.value
      const analysis = payload.analysis || payload.data?.analysis
      const raw = payload.raw_response || payload.data?.raw_response
      const imgText = analysis ? formatXrayAnalysis(analysis) : (raw || payload.answer || '')
      if (imgText) parts.push(imgText)
    } else if (imgRes.status === 'rejected') {
      lastErr = lastErr || imgRes.reason
      console.error('AI image analysis error:', imgRes.reason)
    }
  }

  if (parts.length) {
    aiDrawer.value.response = parts.join('\n\n---\n\n')
  } else {
    aiDrawer.value.error = lastErr ? aiErrorMessage(lastErr) : t('ai.errorGeneric')
  }
  aiDrawer.value.loading = false
}

const retryAiAnalysis = () => {
  if (lastAiRun.value) lastAiRun.value()
}

// Fetch a remote image URL and convert it to a base64 data URL.
// Returns null if it can't be loaded (e.g. CORS / network).
const urlToBase64 = async (url) => {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Image analysis: send an uploaded image OR an existing patient image to the AI vision API.
// The endpoint only accepts image_base64, so existing images (URLs) are converted first.
const analyzeImageWithAi = async ({ imageBase64 = null, imageUrl = null }) => {
  if (!imageBase64 && !imageUrl) return
  const origArgs = { imageBase64, imageUrl }
  lastAiRun.value = () => analyzeImageWithAi(origArgs)   // remember for retry / regenerate
  aiDrawer.value.loading = true
  aiDrawer.value.response = ''
  aiDrawer.value.error = ''
  aiDrawer.value.sources = []
  aiDrawer.value.analyzedImage = imageBase64 || imageUrl

  // Existing images come back as URLs — convert to base64 before sending.
  if (!imageBase64 && imageUrl) {
    imageBase64 = await urlToBase64(imageUrl)
    if (!imageBase64) {
      aiDrawer.value.error = t('ai.imageLoadError')
      aiDrawer.value.loading = false
      return
    }
    aiDrawer.value.analyzedImage = imageBase64
  }

  try {
    // Send the image (base64) together with the current case/patient context ("old" data)
    const response = await aiService.analyzeXray({
      imageBase64,
      patientId: patient.value?.id || null,
      context: aiDrawer.value.contextText || null
    })
    const payload = response.data || response
    if (response.success !== false) {
      const analysis = payload.analysis || payload.data?.analysis
      const rawResponse = payload.raw_response || payload.data?.raw_response
      aiDrawer.value.response = analysis
        ? formatXrayAnalysis(analysis)
        : (rawResponse || payload.answer || '—')
    } else {
      aiDrawer.value.error = response.message || t('ai.errorGeneric')
    }
  } catch (err) {
    console.error('AI image analysis error:', err)
    if (err.response?.status === 403) {
      aiDrawer.value.error = err.response?.data?.message || t('ai.notEnabled')
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      aiDrawer.value.error = t('ai.errorTimeout')
    } else {
      aiDrawer.value.error = t('ai.errorGeneric')
    }
  } finally {
    aiDrawer.value.loading = false
  }
}

// Surface validation errors from the drawer (bad file type/size)
const onAiDrawerError = (msg) => {
  showSnackbar(msg, 'error')
}

// Inline notes panel (shown below the row — no dialog/overlay) with
// ortho quick-fields (note date / appliance / phase / duration).
const orthoForms = reactive({}) // { [caseId]: { noteDate, appliance, phase, duration, text, images } }

const todayDateString = () => new Date().toISOString().slice(0, 10)

// Autosave: drafts (quick-fields + text, not the pending image files — those
// can't survive a reload) persist to localStorage while typing so an
// accidental navigation/refresh doesn't lose an in-progress note.
const draftKey = (caseId) => `case-note-draft-${caseId}`
const draftStatus = reactive({}) // { [caseId]: 'saving' | 'saved' | null }
const draftTimers = {}

const getOrthoForm = (caseId) => {
  if (!orthoForms[caseId]) {
    let draft = null
    try {
      const raw = localStorage.getItem(draftKey(caseId))
      if (raw) draft = JSON.parse(raw)
    } catch {
      draft = null
    }
    orthoForms[caseId] = {
      noteDate: draft?.noteDate ?? todayDateString(),
      appliance: draft?.appliance ?? null,
      phase: draft?.phase ?? null,
      duration: draft?.duration ?? null,
      text: draft?.text ?? '',
      images: [],
      imageType: 'other',
    }
  }
  return orthoForms[caseId]
}

const scheduleDraftSave = (caseId) => {
  draftStatus[caseId] = 'saving'
  clearTimeout(draftTimers[caseId])
  draftTimers[caseId] = setTimeout(() => {
    const f = orthoForms[caseId]
    if (!f) return
    const { noteDate, appliance, phase, duration, text } = f
    if (appliance || phase || duration || text?.trim()) {
      localStorage.setItem(draftKey(caseId), JSON.stringify({ noteDate, appliance, phase, duration, text }))
    } else {
      localStorage.removeItem(draftKey(caseId))
    }
    draftStatus[caseId] = 'saved'
    setTimeout(() => {
      if (draftStatus[caseId] === 'saved') draftStatus[caseId] = null
    }, 2000)
  }, 600)
}

const clearNoteDraft = (caseId) => {
  clearTimeout(draftTimers[caseId])
  localStorage.removeItem(draftKey(caseId))
  draftStatus[caseId] = null
}

// Pending image attachments for the note being composed (not yet uploaded —
// the note must exist server-side first since images attach to a note id).
const addPendingImages = (caseId, files, type) => {
  const f = getOrthoForm(caseId)
  const valid = files.filter(isSupportedImage)
  if (!valid.length) {
    showSnackbar('صيغ الصور المدعومة: JPG, PNG, WEBP فقط', 'warning')
    return
  }
  for (const file of valid) {
    f.images.push({
      key: makeImageKey(),
      file,
      url: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
      type: type || f.imageType || 'other',
    })
  }
}

const removePendingImage = (caseId, key) => {
  const f = getOrthoForm(caseId)
  const idx = f.images.findIndex((img) => img.key === key)
  if (idx === -1) return
  URL.revokeObjectURL(f.images[idx].url)
  f.images.splice(idx, 1)
}

const noteDropActive = ref(null)
const onNoteDrop = (event, caseId) => {
  noteDropActive.value = null
  const files = extractImageFiles(event.dataTransfer)
  if (files.length) addPendingImages(caseId, files)
}
const onNotePaste = (event, caseId) => {
  const files = extractImageFiles(event.clipboardData)
  if (files.length) addPendingImages(caseId, files)
}

// Fullscreen image viewer (shared by the composer previews and every saved note)
const lightboxOpen = ref(false)
const lightboxImages = ref([])
const lightboxIndex = ref(0)
const openLightbox = (images, index) => {
  lightboxImages.value = images.map((img) => ({ url: img.url, name: img.name }))
  lightboxIndex.value = index
  lightboxOpen.value = true
}

// Ortho quick-fields only apply to categories flagged is_orthodontic
// (a regular 'dental' category, e.g. تقويم — not a separate category_type).
const isOrthoCase = (item) => {
  if (item.category?.is_orthodontic !== undefined) return !!item.category.is_orthodontic
  const cat = categories.value.find(c => c.id === (item.category?.id || item.case_categores_id))
  return !!cat?.is_orthodontic
}

// One-line summary tag built from whichever ortho quick-fields are filled
// (shared with the saved-note editor via utils/orthoNote.js so both sides
// build/parse the exact same format).
const orthoHeaderLine = (caseId) => {
  const f = orthoForms[caseId]
  return f ? buildOrthoLine(f) : ''
}

const canSaveOrthoNote = (caseId) => {
  const f = orthoForms[caseId]
  return !!(f && (orthoHeaderLine(caseId) || f.text?.trim() || f.images?.length))
}

// Orthodontics cases show their detail panel automatically — no click needed.
// (Notes for every case are already prefetched in fetchPatientCases.)
const expandedOrthoCaseIds = computed(() =>
  filteredCases.value.filter(isOrthoCase).map(c => c.id)
)

// Original always-visible note box for every non-orthodontics category.
const noteInputs = ref({})

const submitInlineNote = async (caseId) => {
  const text = noteInputs.value[caseId]?.trim()
  if (!text) return
  savingNoteFor.value = caseId
  await addNoteToCase(caseId, text)
  noteInputs.value[caseId] = ''
  savingNoteFor.value = null
}

const saveCasePanelNote = async (item) => {
  const f = getOrthoForm(item.id)
  const content = [orthoHeaderLine(item.id), f.text.trim()].filter(Boolean).join('\n')
  if (!content && !f.images.length) return
  savingNoteFor.value = item.id
  const noteId = await addNoteToCase(item.id, content || '📷 مرفقات صور', f.images)
  savingNoteFor.value = null
  if (!noteId) return
  // Clear the free-text box and pending images but keep the quick-fields for a possible follow-up entry.
  f.text = ''
  f.images.forEach((img) => URL.revokeObjectURL(img.url))
  f.images = []
  clearNoteDraft(item.id)
}

const openCaseDrawer = (item) => {
  drawerCase.value = item
  drawerCaseNotes.value = getCaseNotes(item.id)
  caseDrawerOpen.value = true
}

const getStatusLabel = (item) => {
  const s = item.status
  if (!s) return '-'
  if (typeof s === 'object') {
    const loc = localStorage.getItem('locale') || 'ar'
    if (loc === 'ar') return s.name_ar || s.name || '-'
    if (loc === 'ku') return s.name_ku || s.name_en || s.name || '-'
    return s.name_en || s.name || '-'
  }
  return String(s)
}

const openAddCaseModal = () => {
  editingCase.value = null
  showAddCaseModal.value = true
}

const onCaseSaved = async () => {
  showSnackbar(t('messages.caseSaved') || 'Case saved successfully', 'success')
  await fetchPatientCases()
}



// Inline additions & bills
const selectedToothNum = ref(null)
const preselectedCategory = ref(null)
const patientBills = ref([])
const newBill = ref({ case_id: null, price: 0 })
const addingBill = ref(false)

// Notes
const caseNotes = ref({}) // { caseId: [notes] }
const savingNote = ref(false)

// Image Viewer
const selectedImage = ref(null)

// Case Photos
const casePhotos = ref([])
const casePhotoInput = ref(null)
const isDragging = ref(false)
const uploadingCasePhoto = ref(false)
const casePhotoViewerDialog = ref(false)
const selectedCasePhoto = ref(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Status Options
const statusOptions = computed(() => [
  { title: t('common.pending'), value: '2' },
  { title: t('common.completed'), value: '3' }
])

// Case Table Headers (unified for all specialties)
const caseHeaders = computed(() => [
  { title: t('patients.toothNumber'), key: 'tooth_num',  sortable: true },
  { title: t('patients.category'),    key: 'category',   sortable: false },
  { title: t('common.doctor'),        key: 'doctor',     sortable: false },
  { title: t('cases.price'),          key: 'price',      sortable: true },
  { title: t('patients.paidBills') || 'المدفوع', key: 'paid', sortable: false },
  { title: t('patients.remaining'),   key: 'remaining',  sortable: false },
  { title: t('patients.status'),      key: 'status',     sortable: false },
  { title: t('common.date'),          key: 'case_date',  sortable: true },
  { title: 'الملاحظات',              key: 'notes',      sortable: false, align: 'center' },
  { title: t('common.actions'),       key: 'actions',    sortable: false, align: 'center' },
])

const getCaseStatusId = (item) => {
  if (item.status && typeof item.status === 'object' && item.status.id) return item.status.id
  if (typeof item.status === 'number') return item.status
  if (typeof item.status === 'string' && !isNaN(item.status)) return parseInt(item.status)
  if (item.status === 'completed') return 3
  return 2
}

const getCaseRemainingAmount = (item) => {
  const totalPaid = (item.bills || []).reduce((sum, b) => sum + (b.price || 0), 0)
  return Math.max(0, (item.price || 0) - totalPaid)
}

// A case with no (or zero) price has nothing to pay — don't show a payment chip.
const hasPrice = (item) => Number(item?.price) > 0

// Case Table Headers (unified for all specialties)
const caseColumns = computed(() => getSmartPatientCaseColumns(authStore.specialty, t))

const caseTableActions = computed(() => {
  const actions = [
    { key: 'view', icon: 'mdi-eye-outline', color: 'info', tooltip: t('common.view') || 'View' },
  ]
  if (canEditCase.value) {
    actions.push({ key: 'edit', icon: 'mdi-pencil-outline', color: 'primary', tooltip: t('common.edit') || 'Edit' })
  }
  actions.push({ key: 'delete', icon: 'mdi-delete-outline', color: 'error', tooltip: t('common.delete') || 'Delete' })
  return actions
})

const handleCaseAction = ({ key, item }) => {
  if (key === 'view') openCaseDrawer(item)
  else if (key === 'edit') editCase(item)
  else if (key === 'delete') deleteCase(item)
}

const billHeaders = computed(() => [
  { title: t('datatable.bill_number') || 'ID', key: 'id' },
  { title: t('patients.category'), key: 'category' },
  { title: t('patients.toothNumber'), key: 'tooth_num' },
  { title: t('common.doctor'), key: 'doctor' },
  { title: t('cases.price'), key: 'price' },
  { title: t('common.date'), key: 'bill_date' },
  { title: t('common.actions'), key: 'actions' }
])

// Computed
const completedCases = computed(() => {
  return patientCases.value.filter(c => c.status === 'completed').length
})

const filteredCases = computed(() => {
  if (!caseSearch.value) return patientCases.value
  const search = caseSearch.value.toLowerCase()
  return patientCases.value.filter(c => {
    return (
      (c.tooth_num && String(c.tooth_num).includes(search)) ||
      c.description?.toLowerCase().includes(search) ||
      getCategoryName(c.category_id).toLowerCase().includes(search)
    )
  })
})

const beautyCategories = computed(() => {
  return categories.value.filter(c => c.category_type === 'beauty')
})

const canFilterByDoctor = computed(() => {
  const role = authStore.user?.role
  return ['secretary', 'adminDoctor', 'accounter', 'admin'].includes(role)
})

const defaultDoctorId = computed(() => {
  return canFilterByDoctor.value 
    ? (doctors.value.length > 0 ? doctors.value[0].id : null)
    : authStore.user?.doctor_id
})

// Methods
const fetchPatient = async () => {
  try {
    loading.value = true
    error.value = null
    const id = route.params.id
    // Using new API: GET /api/patients/{id}
    const response = await api.get(`/patients/${id}`)
    patient.value = response.data.data || response.data
    patientNote.value = patient.value.notes || patient.value.note || ''
  } catch (err) {
    console.error('Error fetching patient:', err)
    error.value = err.response?.data?.message || t('errors.fetchFailed')
  } finally {
    loading.value = false
  }
}

const savePatientNote = async () => {
  if (!patient.value) return
  savingPatientNote.value = true
  try {
    await api.put(`/patients/${patient.value.id}`, {
      ...patient.value,
      note: patientNote.value,
      notes: patientNote.value
    })
    patient.value.note = patientNote.value
    patient.value.notes = patientNote.value
    showSnackbar(t('patients.note_saved'), 'success')
  } catch (err) {
    console.error('Error saving patient note:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingPatientNote.value = false
  }
}

const fetchPatientCases = async () => {
  try {
    const id = route.params.id
    // Using Spatie Query Builder format: filter[field]=value
    const response = await api.get(`/cases`, {
      params: {
        'filter[patient_id]': id,
        'include': 'category,status,doctor,bills,warehouseItems,ophthalmologyEncounterDetails',
        'sort': '-created_at',
        'per_page': 1000
      }
    })
    patientCases.value = response.data.data || response.data || []

    // Normalize case_date for editable date field
    for (const caseItem of patientCases.value) {
      if (!caseItem.case_date && caseItem.created_at) {
        caseItem.case_date = caseItem.created_at
      }
      if (caseItem.id) {
        await Promise.all([fetchCaseNotes(caseItem.id), fetchCaseImages(caseItem.id)])
      }
    }
  } catch (err) {
    console.error('Error fetching cases:', err)
  }
}

// Get unpaid cases for billing
const unpaidCases = computed(() => {
  const filtered = patientCases.value.filter(c => {
    // Filter out temporary cases
    if (String(c.id).startsWith('tmp-')) return false
    
    // Show only cases where is_paid is explicitly false or 0
    // Check both boolean false and numeric 0
    const isPaid = c.is_paid
    const isUnpaid = isPaid === false || isPaid === 0 || isPaid === '0'
    
    console.log(`Case ${c.id}: is_paid=${isPaid}, isUnpaid=${isUnpaid}`)
    
    return isUnpaid
  })
  
  console.log('Total cases:', patientCases.value.length, 'Unpaid cases:', filtered.length)
  return filtered
})

const fetchPatientImages = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/patient-images`, {
      params: {
        'filter[patient_id]': id
      }
    })
    patientImages.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching images:', err)
  }
}

const fetchCategories = async () => {
  try {
    const response = await api.get('/case-categories')
    categories.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

// A category was created inline from the add-case modal — reload the list so
// the new category (already preselected in the modal) shows its full data.
const onCategoryCreated = () => {
  fetchCategories()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const calculateAge = (birthDate) => {
  if (!birthDate) return '-'
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatNumberWithCommas = (value) => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const parseFormattedNumber = (value) => {
  if (!value) return 0
  return parseInt(value.toString().replace(/,/g, ''), 10) || 0
}

const getPhotoUrl = (photo) => {
  if (!photo) return ''
  if (photo.startsWith('http')) return photo
  return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'}/storage/${photo}`
}

const getImageUrl = (image) => {
  const url = image.url || image.path || image
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'}/storage/${url}`
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  if (!category) return '-'
  if (locale.value === 'ar') return category.name_ar || category.name
  return category.name_en || category.name
}

const getCategoryItemTitle = (item) => {
  if (locale.value === 'ar') return item.name_ar || item.name
  if (locale.value === 'ku') return item.name_ku || item.name_en || item.name
  return item.name_en || item.name
}

const getCategoryColor = (categoryId) => {
  const colors = ['primary', 'success', 'warning', 'info', 'error', 'secondary']
  return colors[categoryId % colors.length]
}


// Patient Actions
const editPatient = () => {
  editDialog.value = true
}

const onPatientSaved = (updatedPatient) => {
  patient.value = updatedPatient
  editDialog.value = false
  showSnackbar(t('messages.patientUpdated'), 'success')
}

const openBooking = () => {
  bookingDialog.value = true
}

const handleBookingSaved = (response) => {
  showSnackbar(t('reservations.booking_success') || 'Booking created successfully', 'success')
  // Optionally refresh patient data or navigate to reservations
}

const handleBookingError = (error) => {
  showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
}

const loadDoctors = async () => {
  try {
    const response = await reservationService.getDoctors()
    if (Array.isArray(response)) {
      doctors.value = response
    } else if (response.data) {
      doctors.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      doctors.value = []
    }
  } catch (error) {
    console.error('Failed to load doctors:', error)
    doctors.value = []
  }
}

const openRecipes = () => {
  selectedRecipe.value = null
  recipeDialog.value = true
}

// Bill Methods
// Inline quick-bill popover state (opened from a case row in the Paid column).
const quickBill = ref({ open: false, caseId: null, price: 0 })

// Open the inline payment popover for a case. The amount starts empty so the
// user types what was actually paid (they can tap "pay full" for the balance).
const openQuickBill = (item) => {
  quickBill.value = {
    open: true,
    caseId: item.id,
    price: 0,
  }
}

const quickBillCase = computed(() =>
  patientCases.value.find(c => c.id === quickBill.value.caseId) || null
)

const quickBillRemaining = computed(() =>
  quickBillCase.value ? getCaseRemainingAmount(quickBillCase.value) : 0
)

const quickBillLoading = ref(false)

// Submit the inline bill. Kept self-contained (not reusing createBill) so the
// popover's spinner stops and the menu closes as soon as the bill is saved,
// instead of waiting on the heavier full-list refresh that runs afterwards.
const submitQuickBill = async () => {
  if (!quickBill.value.caseId || !quickBill.value.price) return
  if (quickBill.value.price > quickBillRemaining.value) {
    showSnackbar(t('validation.billPriceExceedsRemaining'), 'error')
    return
  }

  quickBillLoading.value = true
  try {
    await billService.createForCase({
      patient_id: patient.value.id,
      case_id: quickBill.value.caseId,
      price: quickBill.value.price,
      is_paid: true,
    })
    try {
      await api.put(`/cases/${quickBill.value.caseId}`, { is_paid: 1 })
    } catch (updateErr) {
      console.error('Error updating case paid status:', updateErr)
    }
    playCashRegisterSound()
    showSnackbar(t('caseManagement.billCreated'), 'success')

    // Close the popover right away; refresh the lists in the background.
    quickBill.value = { open: false, caseId: null, price: 0 }
    Promise.all([fetchPatientBills(), fetchPatientCases()])
  } catch (err) {
    console.error('Error creating bill:', err)
    showSnackbar(t('errors.saveFailed'), 'error')
  } finally {
    quickBillLoading.value = false
  }
}

const openReport = () => {
  reportDialog.value = true
}

const openBillDialog = () => {
  // Create a pseudo reservation object from patient data with bills
  billReservation.value = {
    id: patient.value?.id,
    patient: patient.value,
    reservation_start_date: new Date().toISOString().split('T')[0],
    doctor: doctors.value.find(d => d.id === defaultDoctorId.value) || doctors.value[0]
  }
  billDialog.value = true
}

// Recipe Methods
const fetchPatientRecipes = async () => {
  if (!route.params.id) return
  try {
    const response = await RecipeService.getPatientRecipes(route.params.id)
    patientRecipes.value = response.data?.data || response.data || []
  } catch (err) {
    console.error('Error loading recipes:', err)
  }
}

const fetchClinicSettings = async () => {
  try {
    const storedClinic = localStorage.getItem('clinic')
    if (storedClinic) {
      clinicSettings.value = JSON.parse(storedClinic)
      return
    }
    const response = await api.get('/settings/clinic')
    clinicSettings.value = response.data || response || {
      name: 'Smart Clinic',
      address: '',
      phone: '',
      logo: null
    }
  } catch (error) {
    console.error('Error fetching clinic settings:', error)
    clinicSettings.value = {
      name: 'Smart Clinic',
      address: '',
      phone: '',
      logo: null
    }
  }
}

const handleRecipeSaved = async (recipe) => {
  showSnackbar(t('recipes.saved_success') || 'Recipe saved successfully', 'success')
  await fetchPatientRecipes()
}

const handleRecipeError = (error) => {
  showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
}

const printRecipe = async (recipe) => {
  try {
    const response = await RecipeService.getById(recipe.id)
    const fullRecipe = response.data?.data || response.data || response
    if (!fullRecipe.recipe_items && fullRecipe.recipeItems) {
      fullRecipe.recipe_items = fullRecipe.recipeItems
    }
    recipeToPrint.value = fullRecipe
  } catch {
    recipeToPrint.value = recipe
  }
  setTimeout(() => {
    if (recipePrintRef.value) {
      recipePrintRef.value.print()
    }
  }, 150)
}

// Teeth Chart Handlers
const handleToothSelected = (toothNum) => {
  console.log('Tooth selected:', toothNum)
}

const handleToothRightClick = ({ event, toothNum }) => {
  console.log('Tooth right click:', toothNum)
}

// Save tooth details when color changes
const handleToothColorChanged = async (toothDetailsJson) => {
  if (!patient.value?.id) return
  
  try {
    const toothDetails = JSON.parse(toothDetailsJson)
    
    await api.put(`/patients/${patient.value.id}/tooth-details`, {
      tooth_details: toothDetails
    })
    
    // Update local patient data
    patient.value.tooth_details = toothDetails
    
    console.log('Tooth details saved successfully')
  } catch (err) {
    console.error('Error saving tooth details:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  }
}

const handleCaseAdded = async ({ toothNumber, category }) => {
  // Create and immediately save the case to backend
  try {
    savingCase.value = true
    const payload = {
      patient_id: patient.value?.id,
      case_categores_id: category?.id || null,
      tooth_num: toothNumber ? String(toothNumber) : null,
      notes: '',
      price: category?.default_cost || 0,
      is_paid: 0
    }

    const response = await api.post('/cases', payload)
    showSnackbar(t('messages.caseCreated') || 'Case created successfully', 'success')
    
    // Refresh cases list to show the new case
    await fetchPatientCases()
  } catch (err) {
    console.error('Error creating case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCase.value = false
  }
}

const handleCaseRemoved = async (caseId) => {
  try {
    await api.delete(`/cases/${caseId}`)
    showSnackbar(t('messages.caseDeleted') || 'Case removed', 'success')
    await fetchPatientCases()
  } catch (err) {
    console.error('Error removing case:', err)
    showSnackbar(err.response?.data?.message || t('errors.deleteFailed'), 'error')
  }
}

const openGeneralExamination = async () => {
  // Create and immediately save a general examination case to backend
  try {
    savingCase.value = true
    const payload = {
      patient_id: patient.value?.id,
      case_categores_id: null,
      tooth_num: null,
      notes: 'General Examination',
      price: 0,
      is_paid: 0
    }

    const response = await api.post('/cases', payload)
    showSnackbar(t('messages.caseCreated') || 'Case created successfully', 'success')
    
    // Refresh cases list to show the new case
    await fetchPatientCases()
  } catch (err) {
    console.error('Error creating case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCase.value = false
  }
}

// Handle beauty category click - create case with default price
const handleBeautyCategoryClick = async (category) => {
  try {
    savingCase.value = true
    const payload = {
      patient_id: patient.value?.id,
      case_categores_id: category.id,
      tooth_num: null, // Beauty categories don't require tooth number
      notes: category.name || '',
      price: category.item_cost || 0,
      is_paid: 0
    }

    const response = await api.post('/cases', payload)
    showSnackbar(t('messages.caseCreated') || 'Case created successfully', 'success')
    
    // Refresh cases list to show the new case
    await fetchPatientCases()
  } catch (err) {
    console.error('Error creating beauty case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCase.value = false
  }
}

// Case CRUD
const addNewCase = async () => {
  // Create and immediately save the case to backend
  try {
    savingCase.value = true
    const payload = {
      patient_id: patient.value?.id,
      case_categores_id: null,
      tooth_num: null,
      notes: '',
      price: 0,
      is_paid: 0
    }

    const response = await api.post('/cases', payload)
    showSnackbar(t('messages.caseCreated') || 'Case created successfully', 'success')
    
    // Refresh cases list to show the new case
    await fetchPatientCases()
  } catch (err) {
    console.error('Error creating case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCase.value = false
  }
}

const editCase = (caseItem) => {
  console.log('🔧 Editing case:', caseItem)
  editingCase.value = caseItem
  showAddCaseModal.value = true
}

const deleteCase = (caseItem) => {
  caseToDelete.value = caseItem
  deleteDialog.value = true
}

const confirmDeleteCase = async () => {
  try {
    deletingCase.value = true
    await api.delete(`/cases/${caseToDelete.value.id}`)
    showSnackbar(t('messages.caseDeleted'), 'success')
    deleteDialog.value = false
    await fetchPatientCases()
  } catch (err) {
    console.error('Error deleting case:', err)
    showSnackbar(err.response?.data?.message || t('errors.deleteFailed'), 'error')
  } finally {
    deletingCase.value = false
  }
}

// Inline case saving (update existing cases)
const saveCaseInline = async (item) => {
  // Skip if it's a temp item that hasn't been saved yet
  if (String(item.id).startsWith('tmp-')) {
    return
  }
  
  try {
    savingCase.value = true
    // Get category ID from nested object or direct property
    const categoryId = item.category?.id || item.case_categores_id || item.category_id
    
    // Determine status_id based on status value
    // 2 = pending, 3 = completed/done
    let statusId = getStatusId(item)
    
    const payload = {
      patient_id: item.patient?.id || patient.value.id,
      case_categores_id: categoryId,
      tooth_num: item.tooth_num || null,
      notes: item.notes || item.description || '',
      price: item.price || 0,
      is_paid: item.is_paid ? 1 : 0,
      status_id: statusId,
      case_date: item.case_date || item.created_at
    }

    await api.put(`/cases/${item.id}`, payload)
    showSnackbar(t('messages.caseUpdated') || 'Case updated', 'success')
  } catch (err) {
    console.error('Error saving inline case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
    // Refresh to revert any local changes
    await fetchPatientCases()
  } finally {
    savingCase.value = false
  }
}

// Price inline edit state
const editingPriceId = ref(null)
const priceInputRef = ref(null)
const startEditPrice = (item) => {
  editingPriceId.value = item.id
  nextTick(() => {
    if (priceInputRef.value) {
      priceInputRef.value.value = item.price || ''
      priceInputRef.value.focus()
      priceInputRef.value.select()
    }
  })
}
const commitPrice = (item) => {
  const raw = priceInputRef.value?.value ?? ''
  item.price = parseInt(raw.replace(/[^0-9]/g, '')) || 0
  editingPriceId.value = null
  saveCaseBackground(item)
}

// Debounced background save — no loading state, fire-and-forget, UI stays instant
const _saveTimers = {}
const saveCaseBackground = (item) => {
  if (String(item.id).startsWith('tmp-')) return
  clearTimeout(_saveTimers[item.id])
  _saveTimers[item.id] = setTimeout(async () => {
    try {
      const categoryId = item.category?.id || item.case_categores_id || item.category_id
      const payload = {
        patient_id: item.patient?.id || patient.value.id,
        case_categores_id: categoryId,
        tooth_num: item.tooth_num || null,
        notes: item.notes || item.description || '',
        price: item.price || 0,
        is_paid: item.is_paid ? 1 : 0,
        status_id: getStatusId(item),
        case_date: item.case_date || item.created_at
      }
      await api.put(`/cases/${item.id}`, payload)
    } catch (err) {
      console.error('Background save failed:', err)
      showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
      await fetchPatientCases()
    }
  }, 600)
}



// Helper function to get status_id from various status formats
const getStatusId = (item) => {
  // If status is an object with id property
  if (item.status && typeof item.status === 'object' && item.status.id) {
    return item.status.id
  }
  // If status is a number or string number
  if (typeof item.status === 'number') {
    return item.status
  }
  if (typeof item.status === 'string' && !isNaN(item.status)) {
    return parseInt(item.status)
  }
  // Legacy string values
  if (item.status === 'completed') {
    return 3
  }
  if (item.status === 'pending') {
    return 2
  }
  // Default to pending
  return 2
}

// Update case status when switch is toggled
const updateCaseStatus = async (item, newStatusId) => {
  // Update the status - handle both object and direct value formats
  if (item.status && typeof item.status === 'object') {
    item.status.id = parseInt(newStatusId)
  } else {
    item.status = parseInt(newStatusId)
  }
  
  // Save the case
  await saveCaseInline(item)
}

const toggleCasePaid = async (item) => {
  item.is_paid = !item.is_paid
  await saveCaseInline(item)
}

// Bills
const totalBills = computed(() => {
  return patientCases.value.reduce((sum, c) => sum + (c.price || 0), 0)
})

const totalPaid = computed(() => {
  return patientBills.value.reduce((sum, b) => sum + (b.price || 0), 0)
})

const totalUnpaid = computed(() => {
  return totalBills.value - totalPaid.value
})

const getCaseBillingTitle = (item) => {
  const categoryName = item.category?.name || getCategoryName(item.case_categores_id || item.category_id)
  const toothInfo = item.tooth_num ? ` - ${t('patients.tooth')} ${item.tooth_num}` : ''
  const dateInfo = item.created_at ? ` - ${formatDate(item.created_at)}` : ''
  
  // Calculate remaining amount
  const bills = item.bills || []
  const totalPaid = bills
    .reduce((sum, b) => sum + (b.price || 0), 0)
  const remainingAmount = (item.price || 0) - totalPaid
  
  const priceInfo = ` - ${formatNumberWithCommas(item.price)} IQD`
  const remainingInfo = remainingAmount > 0 ? ` (${t('patients.remaining')}: ${formatNumberWithCommas(remainingAmount)} IQD)` : ''
  
  return `${categoryName}${toothInfo}${dateInfo}${priceInfo}${remainingInfo}`
}

const getBillableCategoryName = (bill) => {
  const category = bill.billable?.category
  if (!category) return '-'
  if (locale.value === 'ar') return category.name_ar || category.name
  if (locale.value === 'ku') return category.name_ku || category.name_en || category.name
  return category.name_en || category.name
}

// Get remaining amount for a case
const getRemainingAmount = (caseItem) => {
  const bills = caseItem.bills || []
  const totalPaid = bills
    .reduce((sum, b) => sum + (b.price || 0), 0)
  return (caseItem.price || 0) - totalPaid
}

// Computed property for selected case remaining amount
const selectedCaseRemainingAmount = computed(() => {
  if (!newBill.value.case_id) return 0
  // Look in all cases (not just unpaidCases) so a quick-bill on a case the
  // is_paid flag misclassifies still validates against its real balance.
  const selectedCase =
    unpaidCases.value.find(c => c.id === newBill.value.case_id) ||
    patientCases.value.find(c => c.id === newBill.value.case_id)
  if (!selectedCase) return 0
  return getRemainingAmount(selectedCase)
})

const fetchPatientBills = async () => {
  if (!route.params.id) return
  try {
    const response = await billService.getByPatient(route.params.id, { include: 'billable', sort: '-created_at' })
    patientBills.value = response.data || response
  } catch (err) {
    console.error('Error loading bills:', err)
  }
}

const createBill = async () => {
  if (!newBill.value.case_id || !newBill.value.price) {
    showSnackbar(t('validation.required'), 'error')
    return
  }

  // Validate that bill price doesn't exceed remaining amount
  const remainingAmount = selectedCaseRemainingAmount.value
  if (newBill.value.price > remainingAmount) {
    showSnackbar(t('validation.billPriceExceedsRemaining'), 'error')
    return
  }

  try {
    addingBill.value = true
    const response = await billService.createForCase({
      patient_id: patient.value.id,
      case_id: newBill.value.case_id,
      price: newBill.value.price,
      is_paid: true // Set as paid by default
    })
    
    console.log('Bill created:', response)
    
    // Update the case is_paid status to true
    try {
      await api.put(`/cases/${newBill.value.case_id}`, {
        is_paid: 1
      })
      console.log('Case marked as paid')
    } catch (updateErr) {
      console.error('Error updating case paid status:', updateErr)
    }
    
    // Play cash register sound
    playCashRegisterSound()
    
    // Reset form
    const selectedCaseId = newBill.value.case_id
    newBill.value = { case_id: null, price: 0 }
    
    // Refresh both bills and cases to update the lists
    await Promise.all([
      fetchPatientBills(),
      fetchPatientCases()
    ])
    
    console.log('After refresh - checking if case still appears in unpaid list')
    
    showSnackbar(t('caseManagement.billCreated'), 'success')
  } catch (err) {
    console.error('Error creating bill:', err)
    showSnackbar(t('errors.saveFailed'), 'error')
  } finally {
    addingBill.value = false
  }
}

// Play cash register sound effect
const playCashRegisterSound = () => {
  try {
    // Create audio context if it doesn't exist
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Create oscillator for cash register "cha-ching" sound
    const oscillator1 = audioContext.createOscillator()
    const oscillator2 = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // First tone (higher)
    oscillator1.type = 'sine'
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime)
    
    // Second tone (lower)
    oscillator2.type = 'sine'
    oscillator2.frequency.setValueAtTime(600, audioContext.currentTime)
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator1.start(audioContext.currentTime)
    oscillator2.start(audioContext.currentTime + 0.1)
    
    oscillator1.stop(audioContext.currentTime + 0.5)
    oscillator2.stop(audioContext.currentTime + 0.6)
  } catch (err) {
    console.log('Could not play sound:', err)
  }
}


const billDateDialog = ref(false)
const billDateBill = ref(null)
const billDateValue = ref('')
const billEditPrice = ref('')
const savingBillDate = ref(false)

// Bill inline edit state
const editingBillId = ref(null)
const editingBillField = ref(null)
const billPriceInputRef = ref(null)
const billDateInputRef = ref(null)

const startEditBill = (item, field) => {
  editingBillId.value = item.id
  editingBillField.value = field
  nextTick(() => {
    if (field === 'price' && billPriceInputRef.value) {
      billPriceInputRef.value.value = item.price ? formatNumberWithCommas(item.price) : ''
      billPriceInputRef.value.focus()
      billPriceInputRef.value.select()
    } else if (field === 'date' && billDateInputRef.value) {
      const d = item.bill_date || item.created_at || ''
      billDateInputRef.value.value = d ? new Date(d).toISOString().split('T')[0] : ''
      billDateInputRef.value.focus()
    }
  })
}

const commitBillField = async (item, field) => {
  editingBillId.value = null
  editingBillField.value = null
  try {
    if (field === 'price') {
      const raw = billPriceInputRef.value?.value ?? ''
      const price = parseInt(raw.replace(/[^0-9]/g, '')) || 0
      item.price = price
      await billService.update(item.id, { price })
    } else if (field === 'date') {
      const date = billDateInputRef.value?.value ?? ''
      if (date) {
        item.bill_date = date
        await billService.update(item.id, { bill_date: date })
      }
    }
    await fetchPatientBills()
  } catch (err) {
    console.error('Bill update failed:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
    await fetchPatientBills()
  }
}

const openBillDateDialog = (bill) => {
  billDateBill.value = bill
  const existingDate = bill.bill_date || bill.created_at || bill.payment_date || bill.paid_at || ''
  billDateValue.value = existingDate ? new Date(existingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  billEditPrice.value = bill.price ? formatNumberWithCommas(bill.price) : ''
  billDateDialog.value = true
}

const saveBillDate = async () => {
  if (!billDateBill.value) return
  try {
    savingBillDate.value = true
    const price = parseInt(billEditPrice.value.replace(/[^0-9]/g, '')) || 0
    await billService.update(billDateBill.value.id, {
      bill_date: billDateValue.value,
      price
    })
    showSnackbar(t('messages.billUpdated') || 'Bill updated', 'success')
    await fetchPatientBills()
    billDateDialog.value = false
  } catch (err) {
    console.error('Error updating bill:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingBillDate.value = false
  }
}

const deleteBill = async (bill) => {
  try {
    await billService.delete(bill.id)
    await fetchPatientBills()
  } catch (err) {
    console.error('Error deleting bill:', err)
  }
}

// Notes
const fetchCaseNotes = async (caseId) => {
  try {
    const response = await api.get(`/notes/case/${caseId}`, {
      params: { include: 'creator' }
    })
    caseNotes.value[caseId] = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching case notes:', err)
    caseNotes.value[caseId] = []
  }
}

const getCaseNotes = (caseId) => {
  return caseNotes.value[caseId] || []
}

const getCaseNotesCount = (caseId) => {
  return caseNotes.value[caseId]?.length || 0
}

// The API's polymorphic /images endpoint has no "Note" imageable type
// (only Patient/Case/User/Reservation/Recipe), so note images are actually
// uploaded against the Case, and each note tracks which of the case's
// images are "its own" via a hidden [images:id,id] tag in its content —
// see utils/noteImageTag.js.
const caseImages = reactive({}) // { [caseId]: [image, ...] }

const fetchCaseImages = async (caseId) => {
  try {
    const res = await api.get('/images/by-imageable', {
      params: { imageable_type: 'Case', imageable_id: caseId }
    })
    caseImages[caseId] = res?.data?.data || res?.data || []
  } catch (err) {
    console.error('Error fetching case images:', err)
    caseImages[caseId] = []
  }
}

const getNoteImages = (note, caseId) => {
  const { imageIds } = parseImageTag(note?.content)
  if (!imageIds.length) return []
  const pool = caseImages[caseId] || []
  return pool.filter((img) => imageIds.includes(img.id))
}

const getImageSrc = (image) => getCasePhotoUrl(image)

// Resolved-URL view of a note's images, ready to hand to <CaseNoteCard>/<ImageLightbox>.
const getResolvedNoteImages = (note, caseId) =>
  getNoteImages(note, caseId).map((img) => ({ ...img, url: getImageSrc(img) }))

const uploadNoteImage = async (caseId, pendingImg) => {
  try {
    pendingImg.status = 'uploading'
    const formData = new FormData()
    formData.append('image', pendingImg.file)
    formData.append('imageable_type', 'Case')
    formData.append('imageable_id', caseId)
    formData.append('type', pendingImg.type || 'other')
    const res = await api.post('/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total) pendingImg.progress = Math.round((evt.loaded / evt.total) * 100)
      },
    })
    pendingImg.status = 'done'
    return res?.data?.data || res?.data || res
  } catch (err) {
    console.error('Error uploading note image:', err)
    pendingImg.status = 'error'
    return null
  }
}

const addNoteToCase = async (caseId, content, images = []) => {
  if (!content?.trim() && !images.length) return null

  try {
    savingNote.value = true

    const uploaded = images.length
      ? await Promise.all(images.map((img) => uploadNoteImage(caseId, img)))
      : []
    const ok = uploaded.filter(Boolean)
    if (ok.length < images.length) {
      showSnackbar('تم حفظ الملاحظة، لكن فشل رفع بعض الصور', 'warning')
    }
    const finalContent = setImageTag(content?.trim() || '', ok.map((img) => img.id))

    const res = await api.post('/notes', {
      noteable_id: caseId,
      noteable_type: 'App\\Models\\CaseModel',
      content: finalContent,
    })
    const created = res?.data?.data || res?.data || res

    if (ok.length) await fetchCaseImages(caseId)
    await fetchCaseNotes(caseId)
    showSnackbar(t('messages.noteAdded') || 'Note added successfully', 'success')
    return created?.id || true
  } catch (err) {
    console.error('Error saving note:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
    return null
  } finally {
    savingNote.value = false
  }
}

const updatingNoteId = ref(null)
const updateNote = async (note, caseId, content) => {
  updatingNoteId.value = note.id
  try {
    await api.put(`/notes/${note.id}`, {
      content,
      noteable_id: caseId,
      noteable_type: 'App\\Models\\CaseModel',
    })
    await fetchCaseNotes(caseId)
    showSnackbar(t('messages.noteUpdated') || 'تم تحديث الملاحظة بنجاح', 'success')
  } catch (err) {
    console.error('Error updating note:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    updatingNoteId.value = null
  }
}

// Silent variant used by the image add/remove flows below — doesn't touch
// `updatingNoteId` (that drives the text-edit form's loading/close behavior,
// which an image action shouldn't trigger) and skips the "note updated" toast
// since the caller shows a more accurate one.
const patchNoteContent = async (note, caseId, content) => {
  await api.put(`/notes/${note.id}`, {
    content,
    noteable_id: caseId,
    noteable_type: 'App\\Models\\CaseModel',
  })
  await fetchCaseNotes(caseId)
}

const addImagesToExistingNote = async (note, caseId, { files, type }) => {
  const valid = files.filter(isSupportedImage)
  if (!valid.length) {
    showSnackbar('صيغ الصور المدعومة: JPG, PNG, WEBP فقط', 'warning')
    return
  }
  const uploaded = await Promise.all(
    valid.map((file) => uploadNoteImage(caseId, { file, progress: 0, status: 'pending', type }))
  )
  const ok = uploaded.filter(Boolean)
  if (!ok.length) {
    showSnackbar('فشل رفع الصور', 'error')
    return
  }
  if (ok.length < valid.length) {
    showSnackbar('فشل رفع بعض الصور', 'warning')
  }

  try {
    const { imageIds: existingIds } = parseImageTag(note.content)
    const newContent = setImageTag(note.content, [...existingIds, ...ok.map((img) => img.id)])
    await fetchCaseImages(caseId)
    await patchNoteContent(note, caseId, newContent)
    showSnackbar('تم إضافة الصور', 'success')
  } catch (err) {
    console.error('Error attaching images to note:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  }
}

const deleteNoteImage = async (image, note, caseId) => {
  try {
    await api.delete(`/images/${image.id}`)
    const { imageIds } = parseImageTag(note.content)
    const newContent = setImageTag(note.content, imageIds.filter((id) => id !== image.id))
    await fetchCaseImages(caseId)
    await patchNoteContent(note, caseId, newContent)
    showSnackbar(t('messages.deleteSuccess') || 'تم حذف الصورة', 'success')
  } catch (err) {
    console.error('Error deleting note image:', err)
    showSnackbar(err.response?.data?.message || t('errors.deleteFailed'), 'error')
  }
}

const deleteNote = async (noteId, caseId) => {
  try {
    await api.delete(`/notes/${noteId}`)
    showSnackbar(t('messages.noteDeleted') || 'Note deleted successfully', 'success')

    // Refresh notes for this case
    await fetchCaseNotes(caseId)
  } catch (err) {
    console.error('Error deleting note:', err)
    showSnackbar(err.response?.data?.message || t('errors.deleteFailed'), 'error')
  }
}

// Images
const viewImage = (image) => {
  selectedImage.value = image
  imageViewerDialog.value = true
}

const uploadImage = () => {
  // Placeholder - will be implemented later
  showSnackbar(t('messages.featureComingSoon'), 'info')
}

// Case Photos
const fetchCasePhotos = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/images/by-imageable`, {
      params: {
        imageable_type: 'Patient',
        imageable_id: id
      }
    })
    casePhotos.value = response.data.data || response.data || []
    console.log('Fetched case photos:', casePhotos.value)
  } catch (err) {
    console.error('Error fetching case photos:', err)
    console.error('Error response:', err.response)
  }
}

const triggerCasePhotoInput = () => {
  casePhotoInput.value?.click()
}

const handleCasePhotoSelect = async (event) => {
  const files = event.target.files
  if (files?.length) {
    await uploadCasePhotos(files)
  }
  // Reset input
  if (casePhotoInput.value) {
    casePhotoInput.value.value = ''
  }
}

const handleCasePhotoDrop = async (event) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) {
    // Filter only image files
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length) {
      await uploadCasePhotos(imageFiles)
    }
  }
}

const uploadCasePhotos = async (files) => {
  try {
    uploadingCasePhoto.value = true
    const id = route.params.id
    
    // Check if multiple files - use images[] array
    if (files.length > 1) {
      const formData = new FormData()
      for (const file of files) {
        formData.append('images[]', file)
      }
      formData.append('imageable_type', 'Patient')
      formData.append('imageable_id', id)
      formData.append('type', 'document')
      
      await api.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else {
      // Single file upload
      const formData = new FormData()
      formData.append('image', files[0])
      formData.append('imageable_type', 'Patient')
      formData.append('imageable_id', id)
      formData.append('type', 'document')
      
      await api.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
    
    showSnackbar(t('messages.uploadSuccess') || 'Photos uploaded successfully', 'success')
    await fetchCasePhotos()
  } catch (err) {
    console.error('Error uploading case photos:', err)
    showSnackbar(err.response?.data?.message || t('errors.uploadFailed') || 'Upload failed', 'error')
  } finally {
    uploadingCasePhoto.value = false
  }
}

const getCasePhotoUrl = (photo) => {
  if (!photo) return ''
  
  // Debug: log the photo object
  console.log('Photo object:', photo)
  
  // Use url directly from API response
  if (photo.url) {
    console.log('Using photo.url:', photo.url)
    return photo.url
  }
  
  // Fallback to path
  const imagePath = photo.path
  if (!imagePath) {
    console.warn('No path found in photo:', photo)
    return ''
  }
  
  if (imagePath.startsWith('http')) {
    console.log('Path is full URL:', imagePath)
    return imagePath
  }
  
  const fullUrl = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'}/storage/${imagePath}`
  console.log('Constructed URL:', fullUrl)
  return fullUrl
}

const viewCasePhoto = (photo) => {
  selectedCasePhoto.value = photo
  casePhotoViewerDialog.value = true
}

const deleteCasePhoto = async (photo) => {
  try {
    await api.delete(`/images/${photo.id}`)
    showSnackbar(t('messages.deleteSuccess') || 'Photo deleted successfully', 'success')
    await fetchCasePhotos()
  } catch (err) {
    console.error('Error deleting case photo:', err)
    showSnackbar(err.response?.data?.message || t('errors.deleteFailed'), 'error')
  }
}

// Snackbar
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Watch route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchPatient()
    fetchPatientCases()
    fetchPatientImages()
    fetchPatientBills()
    fetchCasePhotos()
    fetchPatientRecipes()
  }
})

// Lifecycle
onMounted(() => {
  fetchPatient()
  fetchPatientCases()
  fetchPatientImages()
  fetchCategories()
  fetchPatientBills()
  fetchCasePhotos()
  loadDoctors()
  fetchPatientRecipes()
  fetchClinicSettings()
  
  // Set default tab based on user permissions
  setDefaultTab()
})

// Set default tab based on user permissions
const setDefaultTab = () => {
  if (canViewCases.value) {
    activeTab.value = 'teeth'
  } else if (canViewBills.value && !canViewCases.value) {
    activeTab.value = 'bills'
  } else if (canViewRecipes.value) {
    activeTab.value = 'recipes'
  } else if (canViewNotes.value) {
    activeTab.value = 'notes'
  } else {
    activeTab.value = 'images'
  }
}
</script>

<style scoped>
.patient-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* Quick add-payment popover */
.quick-bill-card {
  overflow: hidden;
}
.quick-bill-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.12), rgba(76, 175, 80, 0.04));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.quick-bill-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.quick-bill-remaining {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #f8fafc;
  border-radius: 8px;
}
.quick-bill-remaining-value {
  font-size: 14px;
  font-weight: 700;
  color: rgb(var(--v-theme-warning));
}

/* Price inline display */
.case-price-display {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  display: inline-block;
}
.case-price-display:hover {
  background: rgba(0,0,0,0.06);
}

/* Price native input — zero Vue overhead.
   Kept narrow on purpose: this column was the single widest contributor to the
   table's minimum width (see the padding note below). */
.case-price-input {
  width: 70px;
  border: none;
  border-bottom: 1.5px solid rgba(0,0,0,0.3);
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  padding: 2px 4px;
  color: inherit;
}
.case-price-input:focus {
  border-bottom-color: rgb(var(--v-theme-primary));
}

/* Small static indicator shown for orthodontics rows (full panel is below) */
.ortho-row-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Inline "notes / ortho" expandable panel (replaces the old cramped textarea) */
.case-notes-panel-row {
  background: rgba(var(--v-theme-primary), 0.03);
}
.case-notes-panel {
  padding: 20px 22px 22px;
  margin: 10px 14px 16px;
  background: #f6f7f9;
  border: 1px solid rgba(16, 24, 40, 0.05);
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.04);
  animation: notes-panel-in 0.15s ease-out;
}
@keyframes notes-panel-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.case-notes-section-title {
  display: flex;
  align-items: center;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}
.case-notes-textarea {
  max-width: 100%;
}

.draft-status {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
}
.draft-status--saving {
  color: #94a3b8;
}
.draft-status--saved {
  color: #16a34a;
}

.case-notes-dropzone {
  border-radius: 12px;
  transition: box-shadow 0.15s;
}
.case-notes-dropzone--drag {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary)) inset;
  border-radius: 12px;
}

.existing-notes-wrap {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.existing-notes-title {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 8px;
}
.existing-notes-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-inline-start: 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
}
.existing-notes-timeline {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
  padding-inline-end: 4px;
}
.existing-notes-empty {
  font-size: 12.5px;
  color: #94a3b8;
  padding: 2px;
}

/* AI "analyze case" button — gradient accent */
.ai-case-btn {
  color: #6366f1 !important;
}
.ai-case-btn:hover {
  background: rgba(99, 102, 241, 0.1) !important;
}

/* Inline status switch */
:deep(.case-status-switch .v-switch__track) { opacity: 1; }
:deep(.case-status-switch .v-input__control) { min-height: unset !important; }
:deep(.case-status-switch) { display: inline-flex !important; }

/* Inline price field */
:deep(.case-price-field input) {
  font-weight: 600;
  padding: 2px 4px !important;
  min-height: unset !important;
}
:deep(.case-price-field .v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 28px !important;
}
:deep(.case-price-field .v-field__suffix) {
  font-size: 11px;
  color: rgba(0,0,0,0.45);
  padding-inline-start: 2px;
}

/* Patient Header - Desktop: Original Layout */
.patient-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.patient-avatar {
  border: 3px solid #e0e0e0;
  flex-shrink: 0;
}

.patient-info {
  min-width: 200px;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #616161;
  font-size: 14px;
}

.patient-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-inline-start: auto;
}

/* Prominent "General Report" button */
.report-btn {
  color: #fff !important;
  background: linear-gradient(135deg, #5e35b1, #7e57c2) !important;
  box-shadow: 0 4px 12px rgba(94, 53, 177, 0.35) !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.report-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(94, 53, 177, 0.45) !important;
}

/* Stat Cards */
.stat-card-mini {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border-radius: 12px !important;
}

.stat-card-mini:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

/* Cases table compact */
.cases-table-compact :deep(.v-data-table-footer) {
  display: none !important;
}

.cases-table-compact :deep(.v-data-table-header__content) {
  font-size: 12px !important;
}

/* Image & Recipe cards */
.image-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-card:hover {
  transform: scale(1.02);
}

.recipe-card {
  transition: all 0.2s ease;
}

.recipe-card:hover {
  border-color: rgb(var(--v-theme-warning));
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* Data Table Alignment for Arabic */
:deep(.v-data-table th) {
  text-align: right !important;
  font-size: 12px !important;
}

/* Cases table header — solid teal bar for strong contrast against the body */
.cases-data-table :deep(.v-data-table__th) {
  background: #407f9d !important;
  border-bottom: none !important;
}
.cases-data-table :deep(.v-data-table-header__content span) {
  font-size: 12.5px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  letter-spacing: 0.4px;
}
.cases-data-table :deep(.v-data-table-header__sort-icon) {
  color: #ffffff !important;
  opacity: 0.85;
}
/* Ten columns don't fit a laptop at Vuetify's default 16px inline cell padding —
   that padding alone was 320px of the table's 979px minimum width, which is what
   forced the horizontal scrollbar. Halving it buys back 160px and lets the table
   sit inside its container. */
.cases-data-table :deep(.v-data-table__td),
.cases-data-table :deep(.v-data-table__th) {
  padding-inline: 8px !important;
}
/* …but the expanded notes panel spans all ten columns and supplies its own. */
.cases-data-table :deep(.case-notes-panel-row .v-data-table__td) {
  padding-inline: 0 !important;
}

.cases-data-table :deep(.v-data-table__th:first-child) {
  border-start-start-radius: 12px;
}
.cases-data-table :deep(.v-data-table__th:last-child) {
  border-start-end-radius: 12px;
}

/* Vuetify 3 Mobile Card View (screens ≤ 600px) */
:deep(.v-data-table__tr--mobile) {
  border: 1px solid rgba(0,0,0,0.08) !important;
  border-radius: 8px !important;
  margin-bottom: 8px !important;
  display: block !important;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
  overflow: hidden;
}

:deep(.v-data-table__tr--mobile .v-data-table__td) {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 6px 12px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
  font-size: 13px;
}

:deep(.v-data-table__tr--mobile .v-data-table__td:last-child) {
  border-bottom: none !important;
}

:deep(.v-data-table__tr--mobile .v-data-table-column-title) {
  font-weight: 600;
  color: #616161;
  font-size: 12px;
  min-width: 90px;
}

/* Mobile Header - Keep Original Behavior */
@media (max-width: 768px) {
  .patient-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .patient-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-grid {
    justify-content: center;
  }

  .patient-actions {
    justify-content: center;
    margin-inline-start: 0;
    width: 100%;
  }
  
  .patient-actions .v-btn {
    flex: 1 1 auto;
  }
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.drop-zone:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}

.drop-zone-active {
  border-color: #1976d2;
  background: #e3f2fd;
  transform: scale(1.01);
}

/* Case Photo Card */
.case-photo-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.case-photo-card .photo-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.case-photo-card:hover .photo-overlay {
  opacity: 1;
}

@media (max-width: 600px) {
  .drop-zone {
    padding: 16px;
  }
  
  .case-photo-card .photo-overlay {
    opacity: 1;
  }
}

/* Compact Case Select */
.case-select-compact :deep(.v-field__input) {
  font-size: 13px !important;
  min-height: 40px !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.case-select-compact :deep(.v-select__selection) {
  font-size: 13px !important;
}

.case-item-compact {
  width: 100%;
}

/* Compact Price Input */
.price-input-compact :deep(.v-field__input) {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.price-input-compact :deep(.v-field__append-inner) {
  font-size: 12px !important;
}

/* List item hover */
:deep(.v-list-item:hover) {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}

:deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
}
</style>
