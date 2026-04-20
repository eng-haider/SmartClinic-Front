<template>
  <div>
    <v-select
      v-model="localForm.eye_side"
      :items="[{title: $t('cases.left_eye') || 'Left', value: 'left'}, {title: $t('cases.right_eye') || 'Right', value: 'right'}, {title: $t('cases.both_eyes') || 'Both', value: 'both'}]"
      :label="$t('cases.eye_side') || 'Eye Side'"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      clearable
    />
    <v-row>
      <v-col cols="6">
        <v-text-field v-model="localForm.visual_acuity_left" :label="$t('cases.visual_acuity_left') || 'VA Left'" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="localForm.visual_acuity_right" :label="$t('cases.visual_acuity_right') || 'VA Right'" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model.number="localForm.iop_left" :label="$t('cases.iop_left') || 'IOP Left'" type="number" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model.number="localForm.iop_right" :label="$t('cases.iop_right') || 'IOP Right'" type="number" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="localForm.refraction_left" :label="$t('cases.refraction_left') || 'Ref. Left'" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="localForm.refraction_right" :label="$t('cases.refraction_right') || 'Ref. Right'" variant="outlined" density="comfortable" />
      </v-col>
    </v-row>
    <v-textarea v-model="localForm.anterior_segment" :label="$t('cases.anterior_segment') || 'Anterior Segment'" variant="outlined" density="comfortable" rows="2" class="mb-3" />
    <v-textarea v-model="localForm.posterior_segment" :label="$t('cases.posterior_segment') || 'Posterior Segment'" variant="outlined" density="comfortable" rows="2" class="mb-3" />
    <v-textarea v-model="localForm.diagnosis" :label="$t('cases.diagnosis') || 'Diagnosis'" variant="outlined" density="comfortable" rows="2" class="mb-3" />
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const localForm = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (newVal) => {
    Object.assign(localForm, newVal)
  },
  { deep: true, immediate: true }
)

watch(localForm, () => {
  emit('update:modelValue', { ...localForm })
}, { deep: true })
</script>
