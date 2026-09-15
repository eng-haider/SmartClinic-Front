<template>
  <div class="quick-bill-form" @click.stop>
    <!-- Remaining summary — tap the chip to pay the whole balance -->
    <div class="quick-bill-remaining">
      <span class="text-caption text-grey">{{ $t('patients.remainingToPay') || $t('patients.remaining') }}</span>
      <v-chip
        size="small"
        color="warning"
        variant="tonal"
        class="quick-bill-remaining-chip"
        :disabled="loading"
        @click="$emit('update:modelValue', remaining)"
      >
        <v-icon start size="14">mdi-cash-fast</v-icon>
        {{ formatNumberWithCommas(remaining) }} IQD
      </v-chip>
    </div>
    <div class="text-caption text-grey-darken-1 mb-2">{{ $t('patients.payFullRemaining') }}</div>

    <v-text-field
      :model-value="modelValue ? formatNumberWithCommas(modelValue) : ''"
      @update:model-value="$emit('update:modelValue', parseFormattedNumber($event))"
      @keyup.enter="canSubmit && $emit('submit')"
      :label="$t('patients.paymentAmount') || 'المبلغ المدفوع'"
      :placeholder="$t('patients.enterAmount') || 'أدخل المبلغ'"
      type="text"
      inputmode="numeric"
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="mdi-cash"
      suffix="IQD"
      :error="exceeds"
      :error-messages="exceeds ? ($t('patients.exceedsRemaining') || 'المبلغ أكبر من المتبقي') : []"
      :autofocus="autofocus"
      class="mb-2"
    />

    <div class="d-flex ga-2">
      <v-btn
        variant="text"
        :size="large ? 'large' : 'small'"
        class="flex-grow-1"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        {{ $t('common.cancel') }}
      </v-btn>
      <v-btn
        color="success"
        :size="large ? 'large' : 'small'"
        class="flex-grow-1"
        :loading="loading"
        :disabled="!canSubmit"
        @click="$emit('submit')"
      >
        <v-icon start size="18">mdi-check</v-icon>
        {{ $t('patients.confirmPayment') || 'تأكيد' }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Amount typed so far (integer IQD). */
  modelValue: { type: Number, default: 0 },
  /** Outstanding balance of the case. */
  remaining: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  /** Bigger controls for touch screens. */
  large: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: true },
})

defineEmits(['update:modelValue', 'submit', 'cancel'])

const exceeds = computed(() => props.modelValue > props.remaining)
const canSubmit = computed(() => props.modelValue > 0 && !exceeds.value && !props.loading)

const formatNumberWithCommas = (value) => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const parseFormattedNumber = (value) => {
  if (!value) return 0
  return parseInt(value.toString().replace(/,/g, ''), 10) || 0
}
</script>

<style scoped>
.quick-bill-remaining {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f8fafc;
  border-radius: 8px;
}

.quick-bill-remaining-chip {
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
