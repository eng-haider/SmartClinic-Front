<template>
  <div class="ai-results-section">
    <!-- AI Status Banner -->
    <v-alert
      v-if="aiStatus === 'analyzing'"
      type="warning"
      variant="tonal"
      icon="mdi-robot"
      class="mb-4"
    >
      جاري تحليل الصور بالذكاء الاصطناعي… يرجى الانتظار.
      <v-progress-linear indeterminate color="orange" class="mt-2" />
    </v-alert>

    <v-alert
      v-else-if="aiStatus === 'error'"
      type="error"
      variant="tonal"
      icon="mdi-robot-dead-outline"
      class="mb-4"
      density="compact"
    >
      {{ aiNotes || 'فشل التحليل. تحقق من اتصالك وأعد المحاولة.' }}
    </v-alert>

    <v-alert
      v-else-if="aiStatus === 'no_images'"
      type="warning"
      variant="tonal"
      icon="mdi-image-off-outline"
      class="mb-4"
      density="compact"
    >
      لا توجد صور مرفوعة. ارفع صورة أولاً ثم اضغط تحليل.
    </v-alert>

    <v-alert
      v-else-if="aiStatus === 'extracted'"
      type="info"
      variant="tonal"
      icon="mdi-text-box-check-outline"
      class="mb-4"
      density="compact"
    >
      تم استخراج النتائج بنجاح. راجع القيم وعدّل عند الحاجة قبل إرسالها للطبيب.
    </v-alert>

    <div v-if="aiStatus === 'extracted' || aiStatus === 'needs_review'">
      <!-- AI Suggestion -->
      <v-card variant="outlined" rounded="lg" class="mb-4 ai-suggest-card">
        <v-card-title class="d-flex align-center ga-2 text-subtitle-2 py-2 px-3">
          <v-icon size="18" color="orange">mdi-robot</v-icon>
          اقتراح التشخيص (ذكاء اصطناعي)
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4 text-body-1" style="white-space: pre-wrap; line-height: 1.9; font-size: 0.95rem;">
          {{ diagnosisSuggestion || '—' }}
          <p v-if="aiNotes" class="text-caption text-grey mt-3 mb-0">
            <v-icon size="13" class="me-1">mdi-note-outline</v-icon>
            {{ aiNotes }}
          </p>
        </v-card-text>
      </v-card>

      <!-- Extracted Metric Grid (editable) — hidden: use AI suggestion text above instead -->
      <v-row dense v-if="false">
        <!-- Visual Acuity -->
        <v-col cols="12">
          <div class="section-label mb-1">
            <v-icon size="15" color="primary" class="me-1">mdi-eye-outline</v-icon>
            حدة البصر (Visual Acuity)
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            :model-value="modelValue.visual_acuity_left"
            @update:model-value="emit('update', 'visual_acuity_left', $event)"
            label="يسار (VA L)"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-eye"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            :model-value="modelValue.visual_acuity_right"
            @update:model-value="emit('update', 'visual_acuity_right', $event)"
            label="يمين (VA R)"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-eye"
          />
        </v-col>

        <!-- IOP -->
        <v-col cols="12" class="pt-3">
          <div class="section-label mb-1">
            <v-icon size="15" color="warning" class="me-1">mdi-gauge</v-icon>
            ضغط العين (IOP — mmHg)
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            :model-value="modelValue.iop_left"
            @update:model-value="emit('update', 'iop_left', $event)"
            label="يسار (IOP L)"
            type="number"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            :model-value="modelValue.iop_right"
            @update:model-value="emit('update', 'iop_right', $event)"
            label="يمين (IOP R)"
            type="number"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>

        <!-- Refraction -->
        <v-col cols="12" class="pt-3">
          <div class="section-label mb-1">
            <v-icon size="15" color="secondary" class="me-1">mdi-glasses</v-icon>
            الانكسار (Refraction)
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            :model-value="modelValue.refraction_left"
            @update:model-value="emit('update', 'refraction_left', $event)"
            label="يسار (Ref. L)"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            :model-value="modelValue.refraction_right"
            @update:model-value="emit('update', 'refraction_right', $event)"
            label="يمين (Ref. R)"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>

        <!-- Segments -->
        <v-col cols="12" class="pt-3">
          <div class="section-label mb-1">
            <v-icon size="15" color="teal" class="me-1">mdi-eye-settings-outline</v-icon>
            تقييم الجزء الأمامي والخلفي
          </div>
        </v-col>
        <v-col cols="12" sm="6">
          <v-textarea
            :model-value="modelValue.anterior_segment"
            @update:model-value="emit('update', 'anterior_segment', $event)"
            label="الجزء الأمامي (Anterior Segment)"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
            auto-grow
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-textarea
            :model-value="modelValue.posterior_segment"
            @update:model-value="emit('update', 'posterior_segment', $event)"
            label="الجزء الخلفي (Posterior Segment)"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
            auto-grow
          />
        </v-col>
      </v-row>
    </div>

    <!-- Not yet analysed -->
    <div
      v-else-if="!aiStatus"
      class="text-center py-5 text-grey"
    >
      <v-icon size="40" color="grey-lighten-2">mdi-robot-off-outline</v-icon>
      <p class="text-caption mt-2">لم يُجرَ تحليل بعد. ارفع الصور ثم اضغط "تحليل بالذكاء الاصطناعي".</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  aiStatus:           { type: String,  default: null  },
  diagnosisSuggestion:{ type: String,  default: null  },
  aiNotes:            { type: String,  default: null  },
  modelValue: {
    type: Object,
    default: () => ({
      visual_acuity_left: null,  visual_acuity_right: null,
      iop_left: null,             iop_right: null,
      refraction_left: null,      refraction_right: null,
      anterior_segment: null,     posterior_segment: null,
    }),
  },
})

const emit = defineEmits(['update'])
</script>

<style scoped>
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
}
.ai-suggest-card {
  border-color: rgba(255, 152, 0, 0.4) !important;
  background: rgba(255, 152, 0, 0.04);
}
</style>
