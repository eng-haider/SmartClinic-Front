<template>
  <section id="payments" class="public-card public-card-pad" aria-labelledby="payments-title">
    <div class="public-card-heading"><div><p class="public-section-kicker">{{ labels.finance }}</p><h2 id="payments-title">{{ labels.payments }}</h2></div><v-icon color="var(--clinic-primary)" aria-hidden="true">mdi-receipt-text-outline</v-icon></div>
    <div class="finance-amounts">
      <div class="finance-row"><span>{{ labels.treatmentTotal }}</span><strong dir="ltr">{{ money(summary.total) }}</strong></div>
      <div class="finance-row"><span>{{ labels.paid }}</span><strong dir="ltr">{{ money(summary.paid) }}</strong></div>
      <div class="finance-row finance-row--remaining"><span>{{ labels.remaining }}</span><strong dir="ltr">{{ money(summary.remaining) }}</strong></div>
    </div>
    <div v-if="payments?.length" class="payment-list" :aria-label="labels.paymentHistory">
      <div v-for="(payment, index) in payments.slice(0, 4)" :key="`${payment.date}-${index}`" class="payment-item"><span>{{ formatDate(payment.date, locale) }}</span><strong dir="ltr">{{ money(payment.amount) }}</strong></div>
    </div>
    <p v-else class="treatment-subline" style="margin-top:18px">{{ Number(summary.remaining || 0) ? labels.noPayments : labels.noBalance }}</p>
  </section>
</template>

<script setup>
import { formatMoney, formatPublicDate as formatDate } from '@/utils/publicExperience'
const props = defineProps({ summary: { type: Object, default: () => ({}) }, payments: { type: Array, default: () => [] }, locale: { type: String, default: 'en' }, labels: { type: Object, required: true } })
const money = (value) => formatMoney(value, props.summary.currency || 'IQD', props.locale)
</script>
