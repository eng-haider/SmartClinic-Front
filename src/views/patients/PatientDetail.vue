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
              <v-btn
                v-if="canEditPatient"
                color="primary"
                variant="tonal"
                @click="editPatient"
                prepend-icon="mdi-pencil"
              >
                {{ $t('common.edit') }}
              </v-btn>
              <v-btn
                v-if="canCreateReservation"
                color="success"
                variant="tonal"
                @click="openBooking"
                prepend-icon="mdi-calendar-plus"
              >
                {{ $t('patients.booking') }}
              </v-btn>
              <v-btn
                v-if="canViewBills"
                color="amber-darken-2"
                variant="tonal"
                @click="openBillDialog"
                prepend-icon="mdi-receipt-text"
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
                @click="openRecipes"
                prepend-icon="mdi-pill"
              >
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
              <v-icon size="24" color="primary">mdi-tooth</v-icon>
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

      <!-- Teeth Chart Section (No Tabs) -->
      <v-card v-if="canViewCases" elevation="2" rounded="lg" class="mb-4">
        <v-card-text class="pa-3 pa-sm-4">
              <!-- Teeth Chart - Mobile version for small screens -->
              <TeethChartMobile
                v-if="isMobile"
                :categories="categories"
                :patient-cases="patientCases"
                :patient-data="patient"
                @tooth-selected="handleToothSelected"
                @case-added="handleCaseAdded"
                @color-changed="handleToothColorChanged"
              />

              <!-- Teeth Chart - Desktop version for larger screens -->
              <TeethChart
                v-else
                :categories="categories"
                :patient-cases="patientCases"
                :patient-data="patient"
                @tooth-selected="handleToothSelected"
                @tooth-right-click="handleToothRightClick"
                @case-added="handleCaseAdded"
                @general-examination="openGeneralExamination"
                @color-changed="handleToothColorChanged"
              />
        </v-card-text>
      </v-card>

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
              </div>

              <v-data-table
                :headers="caseHeaders"
                :items="filteredCases"
                :search="caseSearch"
                :items-per-page="-1"
                class="elevation-0 rounded-lg cases-table-compact"
                density="compact"
                mobile-breakpoint="md"
                :hide-default-footer="true"
                :sort-by="[]"
              >
                <template #item.tooth_num="{ item }">
                  <v-chip
                    v-if="item.tooth_num"
                    size="small"
                    color="primary"
                    variant="outlined"
                  >
                    <v-icon start size="14">mdi-tooth</v-icon>
                    {{ item.tooth_num }}
                  </v-chip>
                  <span v-else class="text-grey">{{ $t('patients.general') }}</span>
                </template>

                <template #item.category="{ item }">
                  <v-chip 
                    size="small" 
                    :color="item.category?.color || getCategoryColor(item.category?.id || item.category_id || item.case_categores_id)"
                  >
                    {{ item.category?.name || getCategoryName(item.category_id || item.case_categores_id) }}
                  </v-chip>
                </template>

                <template #item.price="{ item }">
                  <v-text-field
                    :model-value="formatNumberWithCommas(item.price)"
                    @update:model-value="item.price = parseFormattedNumber($event)"
                    density="compact"
                    hide-details
                    variant="outlined"
                    type="text"
                    @blur="saveCaseInline(item)"
                    style="min-width:110px;"
                    suffix="IQ"
                  />
                </template>

                <template #item.bills="{ item }">
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="bill in (item.bills || [])"
                      :key="bill.id"
                      :color="bill.is_paid ? 'success' : 'warning'"
                      size="small"
                      variant="flat"
                    >
                      <v-icon start size="12">{{ bill.is_paid ? 'mdi-check-circle' : 'mdi-clock' }}</v-icon>
                      {{ formatNumberWithCommas(bill.price) }} IQ
                    </v-chip>
                    <span v-if="!item.bills || item.bills.length === 0" class="text-grey text-caption">
                      {{ $t('common.no_data') || 'لا توجد فواتير' }}
                    </span>
                  </div>
                </template>

                <template #item.doctor="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="24" color="primary" class="mr-2">
                      <v-icon size="14" color="white">mdi-doctor</v-icon>
                    </v-avatar>
                    <span class="text-body-2">{{ item.doctor?.name || $t('common.not_assigned') }}</span>
                  </div>
                </template>

                <template #item.notes="{ item }">
                  <div class="notes-column" style="max-width: 400px;">
                    <!-- Add Note Field -->
                    <v-textarea
                      v-if="canCreateNote"
                      v-model="newNoteContent[item.id]"
                      :placeholder="$t('patients.add_note')"
                      variant="outlined"
                      density="compact"
                      rows="1"
                      auto-grow
                      hide-details
                      class="mb-2"
                    >
                      <template #append-inner>
                        <v-btn
                          size="x-small"
                          icon
                          color="primary"
                          @click="addNoteToCase(item.id)"
                          :disabled="!newNoteContent[item.id]"
                          :loading="savingNote"
                        >
                          <v-icon size="18">mdi-chevron-left</v-icon>
                        </v-btn>
                      </template>
                    </v-textarea>

                    <!-- Notes List -->
                    <div v-if="getCaseNotes(item.id).length" class="notes-list">
                      <v-chip
                        v-for="note in getCaseNotes(item.id)"
                        :key="note.id"
                        size="small"
                        class="ma-1"
                        :closable="canDeleteNote"
                        @click:close="deleteNote(note.id, item.id)"
                      >
                        <v-tooltip activator="parent" location="top">
                          <div>
                            <div><strong>{{ note.creator?.name }}</strong></div>
                            <div class="text-caption">{{ formatDate(note.created_at) }}</div>
                          </div>
                        </v-tooltip>
                        {{ note.content }}
                      </v-chip>
                    </div>
                  </div>
                </template>

                <template #item.status="{ item }">
                  <div class="d-flex align-center ga-2">
                    <v-icon :color="getStatusId(item) === 3 ? 'success' : 'warning'" size="20">
                      {{ getStatusId(item) === 3 ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                    </v-icon>
                    <v-switch
                      :model-value="getStatusId(item)"
                      :true-value="3"
                      :false-value="2"
                      @update:model-value="updateCaseStatus(item, $event)"
                      hide-details
                      density="compact"
                      color="success"
                    ></v-switch>
                  </div>
                </template>

                <template #item.created_at="{ item }">
                  {{ formatDate(item.created_at) }}
                </template>

                <template #item.actions="{ item }">
                  <v-btn
                    v-if="canEditCase"
                    icon
                    variant="text"
                    size="small"
                    color="primary"
                    @click="editCase(item)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="canDeleteCase"
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="deleteCase(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
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
                  <v-chip color="success" size="x-small" variant="flat">
                    {{ formatCurrency(totalPaid) }}
                  </v-chip>
                  <v-chip color="warning" size="x-small" variant="flat">
                    {{ formatCurrency(totalUnpaid) }}
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
                              <v-chip v-else size="x-small" color="success" variant="outlined">
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
                      density="compact"
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
                mobile-breakpoint="md"
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
                  <span class="font-weight-bold text-body-2">{{ formatCurrency(item.price) }}</span>
                </template>
                <template #item.is_paid="{ item }">
                  <v-chip 
                    :color="item.is_paid ? 'success' : 'warning'" 
                    size="small"
                    class="cursor-pointer"
                    @click="canMarkBillPaid ? toggleBillPayment(item) : null"
                  >
                    <v-icon start size="12">{{ item.is_paid ? 'mdi-check-circle' : 'mdi-clock' }}</v-icon>
                    {{ item.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
                  </v-chip>
                </template>
                <template #item.created_at="{ item }">
                  <span class="text-body-2">{{ formatDate(item.created_at) }}</span>
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex ga-0">
                    <v-btn v-if="canMarkBillPaid" icon variant="text" size="small" :color="item.is_paid ? 'warning' : 'success'" @click="toggleBillPayment(item)">
                      <v-icon size="16">{{ item.is_paid ? 'mdi-cash-remove' : 'mdi-cash-plus' }}</v-icon>
                    </v-btn>
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

    <!-- Case Management Dialog (New) -->
    <CaseManagementDialog
      v-model="caseManagementDialog"
      :patient-id="patient?.id"
      :patient-data="patient"
      :categories="categories"
      :editing-case="editingCase"
      :tooth-num="selectedToothNum"
      :preselected-category="preselectedCategory"
      @case-created="onCaseCreated"
      @bill-created="onBillCreated"
      @saved="onCaseCreated"
    />

    <!-- Legacy Case Dialog (kept for compatibility) -->
    <v-dialog v-model="caseDialog" max-width="500" scrollable>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ editingCase ? $t('patients.editCase') : $t('patients.addCase') }}</span>
          <v-btn icon variant="text" @click="caseDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="caseFormRef" v-model="caseFormValid">
            <v-select
              v-model="caseForm.category_id"
              :items="categories"
              :item-title="getCategoryItemTitle"
              item-value="id"
              :label="$t('patients.category')"
              :rules="[v => !!v || $t('validation.required')]"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="caseForm.tooth_num"
              :label="$t('patients.toothNumber')"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-textarea
              v-model="caseForm.description"
              :label="$t('patients.description')"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-3"
            />
            <v-select
              v-model="caseForm.status"
              :items="statusOptions"
              :label="$t('patients.status')"
              variant="outlined"
              density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="caseDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingCase"
            :disabled="!caseFormValid"
            @click="saveCase"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import api from '@/services/api'
import TeethChart from '@/components/teeth/TeethChart.vue'
import TeethChartMobile from '@/components/teeth/TeethChartMobile.vue'
import PatientEditDialog from '@/components/PatientEditDialog.vue'
import BookingDialog from '@/components/BookingDialog.vue'
import RecipeDialog from '@/components/RecipeDialog.vue'
import RecipePrint from '@/components/RecipePrint.vue'
import BillPreviewDialog from '@/components/BillPreviewDialog.vue'
import RecipeService from '@/services/recipe.service'
import billService from '@/services/bill.service'
import reservationService from '@/services/reservation.service'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { PERMISSIONS } from '@/constants/permissions'

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
const caseDialog = ref(false)
const deleteDialog = ref(false)
const imageViewerDialog = ref(false)
const billDialog = ref(false)

// Bill
const billReservation = ref(null)

// Case Form
const caseFormRef = ref(null)
const caseFormValid = ref(false)
const editingCase = ref(null)
const caseForm = ref({
  category_id: null,
  tooth_num: '',
  description: '',
  status: 'pending',
  price: 0,
  is_paid: false
})
const savingCase = ref(false)
const deletingCase = ref(false)
const caseToDelete = ref(null)

// Inline additions & bills
const selectedToothNum = ref(null)
const preselectedCategory = ref(null)
const patientBills = ref([])
const newBill = ref({ case_id: null, price: 0 })
const addingBill = ref(false)

// Notes
const caseNotes = ref({}) // { caseId: [notes] }
const newNoteContent = ref({}) // { caseId: content }
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

// Case Table Headers
const caseHeaders = computed(() => [
  { title: t('patients.toothNumber'), key: 'tooth_num', sortable: true },
  { title: t('patients.category'), key: 'category', sortable: true },
  { title: t('common.doctor'), key: 'doctor', sortable: true },
  { title: t('cases.price'), key: 'price', sortable: true },
  { title: t('patients.bills') || 'الفواتير', key: 'bills', sortable: false },
  { title: t('patients.status'), key: 'status', sortable: true },
  { title: t('common.date'), key: 'created_at', sortable: true },
 
  { title: t('patients.notes'), key: 'notes', sortable: false },
   { title: t('common.actions'), key: 'actions', sortable: false, align: 'center' },
])

const billHeaders = computed(() => [
  { title: t('datatable.bill_number') || 'ID', key: 'id' },
  { title: t('patients.category'), key: 'category' },
  { title: t('patients.toothNumber'), key: 'tooth_num' },
  { title: t('common.doctor'), key: 'doctor' },
  { title: t('cases.price'), key: 'price' },
  { title: t('cases.payment_status'), key: 'is_paid' },
  { title: t('common.date'), key: 'created_at' },
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
        'include': 'category,status,doctor,bills',
        'sort': '-created_at'
      }
    })
    patientCases.value = response.data.data || response.data || []
    
    // Fetch notes for each case
    for (const caseItem of patientCases.value) {
      if (caseItem.id) {
        await fetchCaseNotes(caseItem.id)
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
const selectedToothNum = ref(null)
const preselectedCategory = ref(null)
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

const printRecipe = (recipe) => {
  recipeToPrint.value = recipe
  setTimeout(() => {
    if (recipePrintRef.value) {
      recipePrintRef.value.print()
    }
  }, 100)
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
  editingCase.value = caseItem
  caseForm.value = {
    category_id: caseItem.category_id,
    tooth_num: caseItem.tooth_num || '',
    description: caseItem.description || '',
    status: caseItem.status || 'pending'
  }
  caseDialog.value = true
}

const saveCase = async () => {
  if (!caseFormRef.value?.validate()) return

  try {
    savingCase.value = true
    const payload = {
      patient_id: patient.value.id,
      case_categores_id: caseForm.value.category_id, // Backend expects case_categores_id
      tooth_num: caseForm.value.tooth_num || null,
      description: caseForm.value.description,
      status_id: 1, // Assuming status is a status_id
      notes: caseForm.value.description, // Add notes field
      price: caseForm.value.price || null // Add price if available
    }

    if (editingCase.value) {
      await api.put(`/cases/${editingCase.value.id}`, payload)
      showSnackbar(t('messages.caseUpdated'), 'success')
    } else {
      await api.post('/cases', payload)
      showSnackbar(t('messages.caseCreated'), 'success')
    }

    caseDialog.value = false
    await fetchPatientCases()
  } catch (err) {
    console.error('Error saving case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCase.value = false
  }
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
      status_id: statusId
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
  return patientBills.value.filter(b => b.is_paid).reduce((sum, b) => sum + (b.price || 0), 0)
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
    .filter(b => b.is_paid)
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
    .filter(b => b.is_paid)
    .reduce((sum, b) => sum + (b.price || 0), 0)
  return (caseItem.price || 0) - totalPaid
}

// Computed property for selected case remaining amount
const selectedCaseRemainingAmount = computed(() => {
  if (!newBill.value.case_id) return 0
  const selectedCase = unpaidCases.value.find(c => c.id === newBill.value.case_id)
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

const toggleBillPayment = async (bill) => {
  try {
    if (bill.is_paid) {
      await billService.markAsUnpaid(bill.id)
    } else {
      await billService.markAsPaid(bill.id)
    }
    await fetchPatientBills()
  } catch (err) {
    console.error('Error toggling bill payment:', err)
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

const addNoteToCase = async (caseId) => {
  if (!newNoteContent.value[caseId]) return
  
  try {
    savingNote.value = true
    await api.post('/notes', {
      noteable_id: caseId,
      noteable_type: 'App\\Models\\CaseModel',
      content: newNoteContent.value[caseId]
    })
    
    newNoteContent.value[caseId] = ''
    await fetchCaseNotes(caseId)
    showSnackbar(t('messages.noteAdded') || 'Note added successfully', 'success')
  } catch (err) {
    console.error('Error saving note:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingNote.value = false
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

@media (max-width: 600px) {
  :deep(.v-data-table td) {
    text-align: left !important;
  }

  :deep(.v-data-table td > *) {
    justify-content: flex-start !important;
  }
}

:deep(.v-data-table__mobile-row__header) {
  text-align: right !important;
  font-weight: 600 !important;
  color: #424242 !important;
  min-width: 100px !important;
  font-size: 12px !important;
}

:deep(.v-data-table__mobile-row__cell) {
  text-align: left !important;
}

:deep(.v-data-table__mobile-row__cell > *) {
  justify-content: flex-start !important;
}

/* Mobile Card View */
:deep(.v-data-table__mobile-table-row) {
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  margin-bottom: 8px !important;
  background: #fff !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
}

:deep(.v-data-table__mobile-row) {
  padding: 6px 12px !important;
  border-bottom: 1px solid #f5f5f5 !important;
}

:deep(.v-data-table__mobile-row:last-child) {
  border-bottom: none !important;
}

:deep(.v-data-table__mobile-row__wrapper) {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

/* Mobile spacing */
@media (max-width: 960px) {
  :deep(.v-data-table__wrapper) {
    padding: 4px !important;
  }
  
  :deep(.v-data-table__mobile-table-row) {
    padding: 8px !important;
  }
  
  :deep(.v-data-table__mobile-row__header) {
    font-size: 12px !important;
  }
  
  :deep(.v-data-table__mobile-row__cell) {
    font-size: 13px !important;
  }
  
  :deep(.notes-column) {
    max-width: 100% !important;
    width: 100% !important;
  }
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
