<template>
  <div class="booking-requests-page pa-4">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <div class="mobile-page-heading">
          <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0">
            {{ t('bookingRequests.title') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ t('bookingRequests.subtitle') }}
          </p>
        </div>

        <div class="d-flex align-center gap-2 booking-requests-page__actions">
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-share-variant"
            class="flex-grow-1 flex-sm-grow-0"
            @click="openShare"
          >
            {{ t('bookingRequests.share') }}
          </v-btn>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            :loading="loading"
            @click="loadRequests"
          />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-tabs
        v-model="activeTab"
        color="primary"
        align-tabs="start"
        show-arrows
        @update:model-value="onTabChange"
      >
        <v-tab value="pending">
          {{ t('bookingRequests.tabs.pending') }}
          <v-badge
            v-if="pendingCount > 0"
            :content="pendingCount"
            color="error"
            inline
            max="99"
            class="ms-2"
          />
        </v-tab>
        <v-tab value="approved">{{ t('bookingRequests.tabs.approved') }}</v-tab>
        <v-tab value="rejected">{{ t('bookingRequests.tabs.rejected') }}</v-tab>
        <v-tab value="all">{{ t('bookingRequests.tabs.all') }}</v-tab>
      </v-tabs>

      <v-divider />

      <!-- Date filters -->
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="fromDate"
              :label="t('bookingRequests.fromDate')"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="onFilterChange"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="toDate"
              :label="t('bookingRequests.toDate')"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="onFilterChange"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center justify-md-end">
            <v-chip color="primary" variant="tonal" size="small">
              <v-icon start size="small">mdi-inbox</v-icon>
              {{ pagination.total }} {{ t('bookingRequests.requests') }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card elevation="2" rounded="xl">
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-card-text class="pa-0">
        <v-data-table
          v-if="!isMobile"
          :headers="headers"
          :items="requests"
          :loading="loading"
          hide-default-footer
          :items-per-page="-1"
          hover
          class="booking-requests-table"
        >
          <!-- Requester -->
          <template #item.name="{ item }">
            <div class="d-flex align-center gap-2">
              <v-avatar size="32" color="primary">
                <span class="text-white text-caption font-weight-bold">{{ initials(item.name) }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  <v-icon size="12">mdi-phone</v-icon> {{ item.phone }}
                </div>
              </div>
            </div>
          </template>

          <!-- Preferred date/time -->
          <template #item.preferred="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="primary">mdi-calendar</v-icon>
              <span>{{ item.preferred_date }}</span>
              <template v-if="item.preferred_time">
                <v-icon size="small" color="primary" class="ms-1">mdi-clock-outline</v-icon>
                <span>{{ formatTime(item.preferred_time) }}</span>
              </template>
            </div>
          </template>

          <!-- Note -->
          <template #item.note="{ item }">
            <v-tooltip v-if="item.note" location="top">
              <template #activator="{ props }">
                <span v-bind="props" class="text-truncate d-inline-block" style="max-width: 220px;">
                  {{ item.note }}
                </span>
              </template>
              <span>{{ item.note }}</span>
            </v-tooltip>
            <span v-else class="text-medium-emphasis text-caption">—</span>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <v-chip :color="statusColor(item.status)" size="small" variant="flat">
              <v-icon start size="14">{{ statusIcon(item.status) }}</v-icon>
              {{ t('bookingRequests.status.' + item.status) }}
            </v-chip>
          </template>

          <!-- Created -->
          <template #item.created_at="{ item }">
            <span class="text-caption">{{ formatDateTime(item.created_at) }}</span>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex align-center justify-center">
              <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="openDetails(item)">
                <v-icon>mdi-eye</v-icon>
                <v-tooltip activator="parent" location="top">{{ t('bookingRequests.view') }}</v-tooltip>
              </v-btn>
              <v-btn icon size="small" variant="text" color="green" :disabled="!item.phone" @click="openWhatsAppChat(item)">
                <v-icon>mdi-whatsapp</v-icon>
                <v-tooltip activator="parent" location="top">{{ t('bookingRequests.whatsapp') }}</v-tooltip>
              </v-btn>
              <template v-if="item.status === 'pending'">
                <v-btn icon="mdi-check" size="small" variant="text" color="success" @click="openApprove(item)">
                  <v-icon>mdi-check</v-icon>
                  <v-tooltip activator="parent" location="top">{{ t('bookingRequests.approve') }}</v-tooltip>
                </v-btn>
                <v-btn icon="mdi-close" size="small" variant="text" color="error" @click="openReject(item)">
                  <v-icon>mdi-close</v-icon>
                  <v-tooltip activator="parent" location="top">{{ t('bookingRequests.reject') }}</v-tooltip>
                </v-btn>
              </template>
              <v-btn icon="mdi-delete" size="small" variant="text" color="grey" @click="openDelete(item)">
                <v-icon>mdi-delete</v-icon>
                <v-tooltip activator="parent" location="top">{{ t('common.delete') }}</v-tooltip>
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-inbox-outline</v-icon>
              <p class="text-body-1 text-medium-emphasis mt-4">{{ t('bookingRequests.empty') }}</p>
            </div>
          </template>
        </v-data-table>

        <!-- Mobile cards -->
        <div v-else class="pa-3">
          <div v-if="!requests.length && !loading" class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1">mdi-inbox-outline</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-4">{{ t('bookingRequests.empty') }}</p>
          </div>

          <v-card
            v-for="item in requests"
            :key="item.id"
            class="mb-3 booking-request-card"
            variant="outlined"
            rounded="lg"
            @click="openDetails(item)"
          >
            <v-card-text class="pa-3">
              <!-- Requester + status -->
              <div class="d-flex align-center gap-2 mb-3">
                <v-avatar size="40" color="primary">
                  <span class="text-white text-caption font-weight-bold">{{ initials(item.name) }}</span>
                </v-avatar>
                <div class="booking-request-card__info">
                  <div class="font-weight-medium text-truncate">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis text-truncate" dir="ltr">{{ item.phone }}</div>
                </div>
                <v-chip :color="statusColor(item.status)" size="small" variant="flat">
                  <v-icon start size="14">{{ statusIcon(item.status) }}</v-icon>
                  {{ t('bookingRequests.status.' + item.status) }}
                </v-chip>
              </div>

              <!-- Preferred slot + submission time -->
              <div class="d-flex flex-wrap gap-2">
                <v-chip size="small" color="primary" variant="tonal">
                  <v-icon start size="14">mdi-calendar</v-icon>
                  {{ item.preferred_date }}
                </v-chip>
                <v-chip v-if="item.preferred_time" size="small" color="primary" variant="tonal">
                  <v-icon start size="14">mdi-clock-outline</v-icon>
                  {{ formatTime(item.preferred_time) }}
                </v-chip>
                <v-chip size="small" variant="outlined">
                  <v-icon start size="14">mdi-send-clock-outline</v-icon>
                  {{ formatDateTime(item.created_at) }}
                </v-chip>
              </div>

              <!-- Note -->
              <div v-if="item.note" class="text-caption text-medium-emphasis mt-2 booking-request-card__note">
                {{ item.note }}
              </div>

              <v-divider class="my-3" />

              <!-- Actions -->
              <div class="d-flex align-center gap-2">
                <v-btn
                  icon="mdi-whatsapp"
                  size="small"
                  variant="tonal"
                  color="green"
                  :disabled="!item.phone"
                  @click.stop="openWhatsAppChat(item)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="tonal"
                  color="grey"
                  @click.stop="openDelete(item)"
                />
                <v-spacer />
                <template v-if="item.status === 'pending'">
                  <v-btn
                    color="success"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-check"
                    @click.stop="openApprove(item)"
                  >
                    {{ t('bookingRequests.approve') }}
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="tonal"
                    size="small"
                    prepend-icon="mdi-close"
                    @click.stop="openReject(item)"
                  >
                    {{ t('bookingRequests.reject') }}
                  </v-btn>
                </template>
                <v-btn
                  v-else
                  color="primary"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-eye"
                  @click.stop="openDetails(item)"
                >
                  {{ t('bookingRequests.view') }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <!-- Pagination -->
      <v-divider v-if="pagination.last_page > 1" />
      <div v-if="pagination.last_page > 1" class="d-flex align-center justify-center pa-3">
        <v-pagination
          v-model="page"
          :length="pagination.last_page"
          :total-visible="6"
          density="comfortable"
          @update:model-value="loadRequests"
        />
      </div>
    </v-card>

    <!-- ==================== Approve Dialog ==================== -->
    <v-dialog v-model="approveDialog.show" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-2 pt-4">
          <v-icon color="success">mdi-check-circle</v-icon>
          {{ t('bookingRequests.approveTitle') }}
        </v-card-title>
        <v-card-subtitle>{{ approveDialog.item?.name }} — {{ approveDialog.item?.phone }}</v-card-subtitle>
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-4">{{ t('bookingRequests.approveHint') }}</p>

          <v-select
            v-model="approveForm.doctor_id"
            :items="doctors"
            item-title="name"
            item-value="id"
            :label="t('bookingRequests.doctor')"
            :loading="doctorsLoading"
            prepend-inner-icon="mdi-doctor"
            variant="outlined"
            density="comfortable"
            clearable
            class="mb-1"
          />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="approveForm.reservation_date"
                :label="t('bookingRequests.date')"
                type="date"
                variant="outlined"
                density="comfortable"
                required
                :rules="[v => !!v || t('validation.required')]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="approveForm.reservation_time"
                :label="t('bookingRequests.time')"
                type="time"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="approveForm.notes"
            :label="t('bookingRequests.notes')"
            variant="outlined"
            rows="2"
            auto-grow
            hide-details
          />
          <v-switch
            v-model="approveSendWhatsApp"
            :label="t('bookingRequests.sendWhatsApp')"
            :disabled="approveDialog.loading"
            color="success"
            hide-details
            class="mt-3"
          />
          <v-alert v-if="approveSendWhatsApp && !approveWhatsAppPhone" type="warning" variant="tonal" density="compact" class="mt-3">
            {{ t('bookingRequests.invalidWhatsAppPhone') }}
          </v-alert>
          <v-alert v-if="approveSendWhatsApp && approveWhatsAppPhone" type="success" variant="tonal" density="compact" class="mt-3">
            <div class="text-caption">{{ t('reservations.message_preview') }}:</div>
            <div class="mt-1" style="white-space: pre-line;">{{ approveWhatsAppMessage }}</div>
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="approveDialog.loading" @click="approveDialog.show = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="success" variant="flat" :loading="approveDialog.loading" :disabled="approveDialog.loading || (approveSendWhatsApp && !approveWhatsAppPhone)" @click="confirmApprove">
            {{ t('bookingRequests.approveConfirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== Reject Dialog ==================== -->
    <v-dialog v-model="rejectDialog.show" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-2 pt-4">
          <v-icon color="error">mdi-close-circle</v-icon>
          {{ t('bookingRequests.rejectTitle') }}
        </v-card-title>
        <v-card-subtitle>{{ rejectDialog.item?.name }} — {{ rejectDialog.item?.phone }}</v-card-subtitle>
        <v-card-text>
          <v-textarea
            v-model="rejectReason"
            :label="t('bookingRequests.rejectReason')"
            :hint="t('publicBooking.optional')"
            variant="outlined"
            rows="3"
            auto-grow
            counter="1000"
            :rules="[v => !v || v.length <= 1000 || t('publicBooking.tooLong')]"
          />
          <v-switch
            v-model="rejectSendWhatsApp"
            :label="t('bookingRequests.sendWhatsApp')"
            :disabled="rejectDialog.loading"
            color="success"
            hide-details
          />
          <v-alert v-if="rejectSendWhatsApp && !rejectWhatsAppPhone" type="warning" variant="tonal" density="compact" class="mt-3">
            {{ t('bookingRequests.invalidWhatsAppPhone') }}
          </v-alert>
          <v-alert v-if="rejectSendWhatsApp && rejectWhatsAppPhone" type="success" variant="tonal" density="compact" class="mt-3">
            <div class="text-caption">{{ t('reservations.message_preview') }}:</div>
            <div class="mt-1" style="white-space: pre-line;">{{ rejectWhatsAppMessage }}</div>
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="rejectDialog.loading" @click="rejectDialog.show = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" :loading="rejectDialog.loading" :disabled="rejectDialog.loading || (rejectSendWhatsApp && !rejectWhatsAppPhone)" @click="confirmReject">
            {{ t('bookingRequests.rejectConfirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== Delete Dialog ==================== -->
    <v-dialog v-model="deleteDialog.show" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-2 pt-4">
          <v-icon color="error">mdi-delete</v-icon>
          {{ t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text>{{ t('bookingRequests.deleteConfirm') }}</v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deleteDialog.loading" @click="deleteDialog.show = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" :loading="deleteDialog.loading" @click="confirmDelete">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== Details Dialog ==================== -->
    <v-dialog v-model="detailsDialog.show" max-width="560">
      <v-card v-if="detailsDialog.item" rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pt-4">
          <span class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-calendar-text</v-icon>
            {{ t('bookingRequests.detailsTitle') }}
          </span>
          <v-chip :color="statusColor(detailsDialog.item.status)" size="small" variant="flat">
            {{ t('bookingRequests.status.' + detailsDialog.item.status) }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-list density="compact" class="py-0">
            <v-list-item prepend-icon="mdi-account" :title="detailsDialog.item.name" :subtitle="t('publicBooking.name')" />
            <v-list-item prepend-icon="mdi-phone" :title="detailsDialog.item.phone" :subtitle="t('publicBooking.phone')" />
            <v-list-item
              prepend-icon="mdi-calendar"
              :title="detailsDialog.item.preferred_date + (detailsDialog.item.preferred_time ? ' — ' + formatTime(detailsDialog.item.preferred_time) : '')"
              :subtitle="t('bookingRequests.preferred')"
            />
            <v-list-item v-if="detailsDialog.item.note" prepend-icon="mdi-note-text-outline" :title="detailsDialog.item.note" :subtitle="t('publicBooking.note')" />
            <v-list-item
              v-if="detailsDialog.item.rejection_reason"
              prepend-icon="mdi-comment-alert-outline"
              :title="detailsDialog.item.rejection_reason"
              :subtitle="t('bookingRequests.rejectReason')"
            />
            <v-divider v-if="detailsDialog.item.patient || detailsDialog.item.reservation || detailsDialog.item.reviewer" class="my-2" />
            <v-list-item
              v-if="detailsDialog.item.patient"
              prepend-icon="mdi-account-heart"
              :title="detailsDialog.item.patient.name"
              :subtitle="t('bookingRequests.linkedPatient')"
              @click="goToPatient(detailsDialog.item.patient)"
              :class="{ 'cursor-pointer': !!detailsDialog.item.patient?.id }"
            >
              <template v-if="detailsDialog.item.patient?.id" #append>
                <v-icon size="18">mdi-open-in-new</v-icon>
              </template>
            </v-list-item>
            <v-list-item
              v-if="detailsDialog.item.reviewer"
              prepend-icon="mdi-account-check"
              :title="detailsDialog.item.reviewer.name"
              :subtitle="t('bookingRequests.reviewedBy')"
            />
            <v-list-item
              prepend-icon="mdi-clock-outline"
              :title="formatDateTime(detailsDialog.item.created_at)"
              :subtitle="t('bookingRequests.submittedAt')"
            />
          </v-list>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-btn
            v-if="detailsDialog.item.status === 'pending'"
            color="success"
            variant="tonal"
            prepend-icon="mdi-check"
            @click="() => { detailsDialog.show = false; openApprove(detailsDialog.item) }"
          >
            {{ t('bookingRequests.approve') }}
          </v-btn>
          <v-btn
            v-if="detailsDialog.item.status === 'pending'"
            color="error"
            variant="tonal"
            prepend-icon="mdi-close"
            @click="() => { detailsDialog.show = false; openReject(detailsDialog.item) }"
          >
            {{ t('bookingRequests.reject') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="detailsDialog.show = false">{{ t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ==================== Share Dialog ==================== -->
    <v-dialog v-model="shareDialog.show" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center gap-2 pt-4">
          <v-icon color="primary">mdi-share-variant</v-icon>
          {{ t('bookingRequests.shareTitle') }}
        </v-card-title>
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-4">{{ t('bookingRequests.shareHint') }}</p>

          <div v-if="shareDialog.loading" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <template v-else-if="!clinicId">
            <v-alert type="warning" variant="tonal" :text="t('bookingRequests.noClinicId')" />
          </template>

          <template v-else>
            <!-- QR code -->
            <div class="text-center mb-4">
              <img
                v-if="shareDialog.qr"
                :src="shareDialog.qr"
                alt="Booking QR"
                width="200"
                height="200"
                class="booking-qr"
              />
            </div>

            <!-- URL + copy -->
            <v-text-field
              :model-value="shareDialog.url"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3 booking-url-field"
              @focus="(e) => e.target.select()"
            >
              <template #append-inner>
                <v-btn
                  :icon="shareDialog.copied ? 'mdi-check' : 'mdi-content-copy'"
                  :color="shareDialog.copied ? 'success' : 'primary'"
                  variant="text"
                  size="small"
                  @click="copyLink"
                />
              </template>
            </v-text-field>

            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                variant="flat"
                block
                :prepend-icon="shareDialog.copied ? 'mdi-check' : 'mdi-content-copy'"
                @click="copyLink"
              >
                {{ shareDialog.copied ? t('bookingRequests.linkCopied') : t('bookingRequests.copyLink') }}
              </v-btn>
            </div>
            <div class="d-flex gap-2 mt-2">
              <v-btn color="primary" variant="tonal" block prepend-icon="mdi-download" @click="downloadQr">
                {{ t('bookingRequests.downloadQr') }}
              </v-btn>
              <v-btn color="primary" variant="tonal" block prepend-icon="mdi-open-in-new" @click="openPage">
                {{ t('bookingRequests.openPage') }}
              </v-btn>
            </div>
          </template>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="shareDialog.show = false">{{ t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3500" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import QRCode from 'qrcode'
import bookingRequestService from '@/services/bookingRequest.service'
import DoctorService from '@/services/doctor.service'
import { getClinicSettings } from '@/services/clinicSettings.service'
import { useBookingRequests } from '@/composables/useBookingRequests'
import { useWhatsAppSender } from '@/composables/useWhatsAppSender'
import { resolveLogoUrl } from '@/composables/useClinicSettings'
import { formatWhatsAppPhone, prepareWhatsAppMessage } from '@/utils/whatsapp'

const { t, locale } = useI18n()
const router = useRouter()
// Below md the table is swapped for a card list (same breakpoint the patients table uses).
const { smAndDown: isMobile } = useDisplay()
const { pendingCount, refreshPendingCount } = useBookingRequests()
const { formatPhoneNumber, openWhatsApp } = useWhatsAppSender()

// ==================== State ====================
const loading = ref(false)
const requests = ref([])
const activeTab = ref('pending')
const fromDate = ref(null)
const toDate = ref(null)
const page = ref(1)
const perPage = ref(15)
const pagination = reactive({ total: 0, per_page: 15, current_page: 1, last_page: 1, from: 0, to: 0 })

const doctors = ref([])
const doctorsLoading = ref(false)

const snackbar = reactive({ show: false, text: '', color: 'success' })

const headers = computed(() => [
  { title: t('bookingRequests.requester'), key: 'name', sortable: false },
  { title: t('bookingRequests.preferred'), key: 'preferred', sortable: false },
  { title: t('publicBooking.note'), key: 'note', sortable: false },
  { title: t('bookingRequests.statusLabel'), key: 'status', sortable: false },
  { title: t('bookingRequests.submittedAt'), key: 'created_at', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center' },
])

// ==================== Data loading ====================
async function loadRequests() {
  loading.value = true
  try {
    const params = { status: activeTab.value, page: page.value, per_page: perPage.value }
    if (fromDate.value) params.from_date = fromDate.value
    if (toDate.value) params.to_date = toDate.value

    const res = await bookingRequestService.list(params)
    requests.value = res?.data || []
    Object.assign(pagination, res?.pagination || { total: requests.value.length, last_page: 1, current_page: 1 })
  } catch (err) {
    console.error('Failed to load booking requests', err)
    requests.value = []
    notify(err?.response?.data?.message || t('bookingRequests.loadError'), 'error')
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  page.value = 1
  loadRequests()
}

function onFilterChange() {
  page.value = 1
  loadRequests()
}

async function loadDoctors() {
  if (doctors.value.length) return
  doctorsLoading.value = true
  try {
    const res = await DoctorService.getActive()
    doctors.value = res?.data?.data || res?.data || []
  } catch (err) {
    console.warn('Failed to load doctors', err)
    doctors.value = []
  } finally {
    doctorsLoading.value = false
  }
}

// ==================== Approve ====================
const approveDialog = reactive({ show: false, loading: false, item: null })
const approveForm = reactive({
  doctor_id: null,
  reservation_date: '',
  reservation_time: '',
  notes: '',
})
const approveSendWhatsApp = ref(false)
const approveWhatsAppPhone = computed(() => formatWhatsAppPhone(approveDialog.item?.phone))
const approveWhatsAppMessage = computed(() => {
  const lines = [
    t('bookingRequests.approvedWhatsAppMessage', { name: approveDialog.item?.name || '' }),
    `${t('bookingRequests.date')}: ${approveForm.reservation_date}`,
  ]
  lines.push(approveForm.reservation_time
    ? `${t('bookingRequests.time')}: ${formatTime(approveForm.reservation_time)}`
    : t('bookingRequests.whatsAppWaitingList'))
  const doctor = doctors.value.find(item => item.id === approveForm.doctor_id)
  if (doctor) lines.push(`${t('bookingRequests.doctor')}: ${doctor.name}`)
  return lines.join('\n')
})

function openApprove(item) {
  approveDialog.item = item
  approveForm.doctor_id = null
  approveForm.reservation_date = item.preferred_date || ''
  approveForm.reservation_time = toInputTime(item.preferred_time)
  approveForm.notes = item.note || ''
  approveSendWhatsApp.value = false
  approveDialog.show = true
  loadDoctors()
}

async function confirmApprove() {
  if (!approveDialog.item || approveDialog.loading) return
  if (approveSendWhatsApp.value && !approveWhatsAppPhone.value) return
  if (!approveForm.reservation_date) {
    notify(t('validation.required'), 'error')
    return
  }
  approveDialog.loading = true
  const whatsApp = approveSendWhatsApp.value
    ? prepareWhatsAppMessage(approveWhatsAppPhone.value, approveWhatsAppMessage.value)
    : null
  try {
    // No is_waiting flag: the backend auto-decides — an empty time books the
    // patient into the waiting list on the chosen date, a set time makes a
    // normal timed reservation.
    const overrides = {}
    if (approveForm.doctor_id) overrides.doctor_id = approveForm.doctor_id
    if (approveForm.reservation_date) overrides.reservation_date = approveForm.reservation_date
    if (approveForm.reservation_time) overrides.reservation_time = approveForm.reservation_time
    if (approveForm.notes) overrides.notes = approveForm.notes

    await bookingRequestService.approve(approveDialog.item.id, overrides)
    notify(t('bookingRequests.approveSuccess'), 'success')
    approveDialog.show = false
    whatsApp?.open()
    await Promise.all([loadRequests(), refreshPendingCount()])
  } catch (err) {
    whatsApp?.cancel()
    notify(err?.response?.data?.message || t('bookingRequests.actionError'), 'error')
  } finally {
    approveDialog.loading = false
  }
}

// ==================== Reject ====================
const rejectDialog = reactive({ show: false, loading: false, item: null })
const rejectReason = ref('')
const rejectSendWhatsApp = ref(false)
const rejectWhatsAppPhone = computed(() => formatWhatsAppPhone(rejectDialog.item?.phone))
const rejectWhatsAppMessage = computed(() => {
  const lines = [t('bookingRequests.rejectedWhatsAppMessage', { name: rejectDialog.item?.name || '' })]
  if (rejectReason.value.trim()) {
    lines.push(`${t('bookingRequests.rejectReason')}: ${rejectReason.value.trim()}`)
  }
  return lines.join('\n')
})

function openReject(item) {
  rejectDialog.item = item
  rejectReason.value = ''
  rejectSendWhatsApp.value = false
  rejectDialog.show = true
}

async function confirmReject() {
  if (!rejectDialog.item || rejectDialog.loading) return
  if (rejectSendWhatsApp.value && !rejectWhatsAppPhone.value) return
  if (rejectReason.value.length > 1000) {
    notify(t('publicBooking.tooLong'), 'error')
    return
  }
  rejectDialog.loading = true
  const whatsApp = rejectSendWhatsApp.value
    ? prepareWhatsAppMessage(rejectWhatsAppPhone.value, rejectWhatsAppMessage.value)
    : null
  try {
    await bookingRequestService.reject(rejectDialog.item.id, rejectReason.value)
    notify(t('bookingRequests.rejectSuccess'), 'success')
    rejectDialog.show = false
    whatsApp?.open()
    await Promise.all([loadRequests(), refreshPendingCount()])
  } catch (err) {
    whatsApp?.cancel()
    notify(err?.response?.data?.message || t('bookingRequests.actionError'), 'error')
  } finally {
    rejectDialog.loading = false
  }
}

// ==================== Delete ====================
const deleteDialog = reactive({ show: false, loading: false, item: null })

function openDelete(item) {
  deleteDialog.item = item
  deleteDialog.show = true
}

async function confirmDelete() {
  if (!deleteDialog.item) return
  deleteDialog.loading = true
  try {
    await bookingRequestService.remove(deleteDialog.item.id)
    notify(t('bookingRequests.deleteSuccess'), 'success')
    deleteDialog.show = false
    await Promise.all([loadRequests(), refreshPendingCount()])
  } catch (err) {
    notify(err?.response?.data?.message || t('bookingRequests.actionError'), 'error')
  } finally {
    deleteDialog.loading = false
  }
}

// ==================== Details ====================
const detailsDialog = reactive({ show: false, item: null })

function openDetails(item) {
  detailsDialog.item = item
  detailsDialog.show = true
}

// Open a WhatsApp chat with the requester (Iraq number formatting handled by the composable).
function openWhatsAppChat(item) {
  const phone = formatPhoneNumber(item?.phone)
  if (!phone) {
    notify(t('bookingRequests.noPhone'), 'error')
    return
  }
  openWhatsApp(phone)
}

function goToPatient(patient) {
  if (patient?.id) router.push({ name: 'PatientDetail', params: { id: patient.id } })
}

// ==================== Share booking page ====================
// The public form is served as a static page at /booking.html and identifies
// the clinic via ?clinic=<tenant id> (same value used for X-Tenant-ID).
const clinicId = computed(() => localStorage.getItem('tenant_id') || localStorage.getItem('clinic_id') || '')

const shareDialog = reactive({ show: false, loading: false, url: '', qr: '', copied: false })

async function openShare() {
  shareDialog.show = true
  shareDialog.copied = false
  if (!clinicId.value) return
  // Rebuild each open so a freshly saved clinic profile is reflected.
  shareDialog.loading = true
  try {
    const clinic = await fetchClinicInfo()
    shareDialog.url = buildBookingUrl(clinic)
    shareDialog.qr = await QRCode.toDataURL(shareDialog.url, {
      width: 400,
      margin: 1,
      color: { dark: '#17638D', light: '#ffffff' },
    })
  } catch (err) {
    console.warn('Failed to prepare share link', err)
    // Fall back to the minimal link (clinic id only) so sharing still works.
    shareDialog.url = buildBookingUrl(null)
    try {
      shareDialog.qr = await QRCode.toDataURL(shareDialog.url, { width: 400, margin: 1 })
    } catch (_) { /* ignore */ }
  } finally {
    shareDialog.loading = false
  }
}

// Read clinic display info (name/address/phone/email/logo) from clinic settings.
async function fetchClinicInfo() {
  try {
    const res = await getClinicSettings()
    if (!res?.success || !res?.data) return null
    const flat = {}
    Object.values(res.data).forEach((cat) => {
      (cat?.settings || []).forEach((s) => { flat[s.setting_key] = s.setting_value })
    })
    return {
      name: flat.clinic_name || '',
      address: flat.address || flat.clinic_address || '',
      phone: flat.phone || '',
      email: flat.email || '',
      logo: resolveLogoUrl(flat.logo),
    }
  } catch (err) {
    console.warn('Failed to load clinic info for share link', err)
    return null
  }
}

function buildBookingUrl(clinic) {
  const url = new URL('/booking.html', window.location.origin)
  url.searchParams.set('clinic', clinicId.value)
  if (clinic) {
    if (clinic.name) url.searchParams.set('name', clinic.name)
    if (clinic.address) url.searchParams.set('address', clinic.address)
    if (clinic.phone) url.searchParams.set('phone', clinic.phone)
    if (clinic.email) url.searchParams.set('email', clinic.email)
    if (clinic.logo) url.searchParams.set('logo', clinic.logo)
  }
  return url.toString()
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareDialog.url)
    shareDialog.copied = true
    notify(t('bookingRequests.linkCopied'), 'success')
    setTimeout(() => { shareDialog.copied = false }, 2500)
  } catch (err) {
    // Clipboard API can be blocked on insecure origins — fall back to select.
    notify(t('bookingRequests.copyFailed'), 'error')
  }
}

function downloadQr() {
  if (!shareDialog.qr) return
  const a = document.createElement('a')
  a.href = shareDialog.qr
  a.download = `booking-qr-clinic-${clinicId.value}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function openPage() {
  if (shareDialog.url) window.open(shareDialog.url, '_blank', 'noopener')
}

// ==================== Helpers ====================
function notify(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function statusColor(status) {
  return { pending: 'orange', approved: 'success', rejected: 'error' }[status] || 'grey'
}

function statusIcon(status) {
  return { pending: 'mdi-clock-outline', approved: 'mdi-check', rejected: 'mdi-close' }[status] || 'mdi-help'
}

// Normalize "14:30:00" / "14:30" to the "HH:MM" a native time input expects.
function toInputTime(time) {
  if (!time) return ''
  const parts = time.split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : ''
}

function formatTime(time) {
  const hm = toInputTime(time)
  if (!hm) return '—'
  const [h, m] = hm.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') : value)
  if (Number.isNaN(date.getTime())) return value
  const intlLocale = { ar: 'ar-IQ', ku: 'ar-IQ', en: 'en-US', pl: 'pl-PL' }[locale.value] || 'en-US'
  return date.toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(() => {
  loadRequests()
  refreshPendingCount()
})
</script>

<style scoped>
.booking-requests-page {
  max-width: 1400px;
  margin: 0 auto;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.cursor-pointer { cursor: pointer; }

.booking-requests-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

.booking-requests-table :deep(.v-data-table-header th) {
  font-weight: 600 !important;
}

/* Mobile cards */
.booking-request-card {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.booking-request-card:active {
  transform: scale(0.995);
}

/* Let the name/phone column shrink so long values truncate instead of pushing the chip out. */
.booking-request-card__info {
  flex: 1 1 auto;
  min-width: 0;
}

.booking-request-card__note {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 600px) {
  .booking-requests-page {
    padding: 12px !important;
  }

  /* Give the share/refresh row its own line so the title keeps full width. */
  .booking-requests-page__actions {
    width: 100%;
  }
}
</style>
