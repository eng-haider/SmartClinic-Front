<template>
  <v-card elevation="2" rounded="lg" class="mb-4">
    <v-card-text class="pa-3 pa-sm-4">
      <!-- Teeth Chart - Mobile version for small screens -->
      <TeethChartMobile
        v-if="isMobile"
        :categories="categories"
        :patient-cases="patientCases"
        :patient-data="patientData"
        @tooth-selected="$emit('tooth-selected', $event)"
        @case-added="$emit('case-added', $event)"
        @case-removed="$emit('case-removed', $event)"
        @color-changed="$emit('color-changed', $event)"
      />

      <!-- Teeth Chart - Desktop version for larger screens -->
      <TeethChart
        v-else
        :categories="categories"
        :patient-cases="patientCases"
        :patient-data="patientData"
        @tooth-selected="$emit('tooth-selected', $event)"
        @tooth-right-click="$emit('tooth-right-click', $event)"
        @case-added="$emit('case-added', $event)"
        @case-removed="$emit('case-removed', $event)"
        @general-examination="$emit('general-examination')"
        @color-changed="$emit('color-changed', $event)"
      />

      <!-- Beauty Categories Section -->
      <div v-if="beautyCategories && beautyCategories.length > 0" class="beauty-categories-section mt-6">
        <v-divider class="mb-4" />
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon color="purple" size="20">mdi-face-woman-shimmer</v-icon>
          <span class="text-subtitle-1 font-weight-bold">{{ $t('caseCategories.beauty') || 'Beauty Procedures' }}</span>
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="category in beautyCategories"
            :key="category.id"
            color="purple"
            variant="tonal"
            size="default"
            class="beauty-category-chip"
            @click="$emit('beauty-category-click', category)"
          >
            <v-icon start size="18">mdi-plus-circle</v-icon>
            {{ getCategoryName(category.id) }}
            <span v-if="category.item_cost > 0" class="ms-2 text-caption">
              ({{ formatCurrency(category.item_cost) }})
            </span>
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import TeethChart from '@/components/teeth/TeethChart.vue'
import TeethChartMobile from '@/components/teeth/TeethChartMobile.vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'

const { mobile: isMobile } = useDisplay()
const { t, locale } = useI18n()

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  patientCases: {
    type: Array,
    default: () => []
  },
  patientData: Object,
  beautyCategories: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'tooth-selected',
  'tooth-right-click',
  'case-added',
  'case-removed',
  'general-examination',
  'color-changed',
  'beauty-category-click'
])

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(amount)
}

const getCategoryName = (categoryId) => {
  const category = props.categories?.find(c => c.id === categoryId)
  if (!category) return '-'
  if (locale.value === 'ar') return category.name_ar || category.name
  return category.name_en || category.name
}
</script>
