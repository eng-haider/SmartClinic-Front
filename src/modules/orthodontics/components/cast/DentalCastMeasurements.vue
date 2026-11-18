<template>
  <div class="dcm">
    <v-alert v-if="!results.calibrated" type="info" variant="tonal" density="compact" class="mb-3">
      {{ t('cast.uncalibrated') }}
    </v-alert>
    <v-alert v-if="results.mixed_units" type="warning" variant="tonal" density="compact" class="mb-3">
      {{ t('cast.mixed') }}
    </v-alert>

    <Section title="Bolton" icon="mdi-scale-balance">
      <Row :label="t('cast.overallRatio')" :value="pct(results.bolton.overall.ratio)" :norm="normText(results.bolton.overall.norm)" :status="results.bolton.overall.comparison?.status" />
      <Row v-if="results.bolton.overall.excess !== null" :label="t('cast.excess')" :value="`${fmt(results.bolton.overall.excess, 2)} ${results.width_unit === 'mm' ? 'mm' : 'u'}`" :sub="t(results.bolton.overall.excess_arch === 'mandibular' ? 'cast.excessMandibular' : 'cast.excessMaxillary')" />
      <Missing :teeth="results.bolton.overall.missing_teeth" />
      <Row :label="t('cast.anteriorRatio')" :value="pct(results.bolton.anterior.ratio)" :norm="normText(results.bolton.anterior.norm)" :status="results.bolton.anterior.comparison?.status" />
      <Row v-if="results.bolton.anterior.excess !== null" :label="t('cast.excess')" :value="`${fmt(results.bolton.anterior.excess, 2)} ${results.width_unit === 'mm' ? 'mm' : 'u'}`" :sub="t(results.bolton.anterior.excess_arch === 'mandibular' ? 'cast.excessMandibular' : 'cast.excessMaxillary')" />
    </Section>

    <Section :title="t('cast.spaceTitle')" icon="mdi-arrow-expand-horizontal">
      <template v-for="a in ['upper', 'lower']" :key="a">
        <div class="text-caption text-medium-emphasis mt-1">{{ a === 'upper' ? t('common.upperJaw') : t('cast.lowerCarey') }}</div>
        <Row :label="t('cast.required')" :value="len(results.space_analysis[a].required, results.width_unit)" />
        <Row :label="t('cast.available')" :value="len(results.space_analysis[a].available, results.length_unit)" />
        <Row :label="t('cast.discrepancy')" :value="len(results.space_analysis[a].discrepancy, results.length_unit, true)" />
      </template>
    </Section>

    <Section :title="t('cast.archTitle')" icon="mdi-vector-curve">
      <template v-for="a in ['upper', 'lower']" :key="a">
        <div class="text-caption text-medium-emphasis mt-1">{{ a === 'upper' ? t('common.upper') : t('common.lower') }}</div>
        <Row :label="t('cast.intercanine')" :value="len(results.arch[a].intercanine_width, results.length_unit)" />
        <Row :label="t('cast.intermolar')" :value="len(results.arch[a].intermolar_width, results.length_unit)" />
        <Row :label="t('cast.archDepth')" :value="len(results.arch[a].arch_depth, results.length_unit)" />
      </template>
    </Section>

    <Section :title="t('cast.pontTitle')" icon="mdi-ruler">
      <Row :label="t('cast.sumIncisors')" :value="len(results.pont.sum_incisors, 'mm')" />
      <Row :label="t('cast.premolarWidth')" :value="`${fmt(results.pont.predicted_premolar_width)} / ${fmt(results.pont.measured_premolar_width)} mm`" :sub="diff(results.pont.premolar_difference)" />
      <Row :label="t('cast.molarWidth')" :value="`${fmt(results.pont.predicted_molar_width)} / ${fmt(results.pont.measured_molar_width)} mm`" :sub="diff(results.pont.molar_difference)" />
      <div class="text-caption text-medium-emphasis">{{ t('cast.pontNote') }}</div>
    </Section>

    <Section :title="t('cast.mixedTitle')" icon="mdi-tooth-outline">
      <Row :label="t('cast.sumLowerIncisors')" :value="len(results.tanaka_johnston.sum_mandibular_incisors, 'mm')" />
      <Row :label="t('cast.tanaka')" :value="`${fmt(results.tanaka_johnston.predicted_upper)} / ${fmt(results.tanaka_johnston.predicted_lower)} mm`" />
      <Row v-for="(s, k) in results.tanaka_johnston.segments" :key="k" :label="t(`cast.segmentRows.${k}`)" :value="`${fmt(s.available)} / ${fmt(s.predicted)} mm`" :sub="diff(s.discrepancy)" />
      <Row label="Moyers" :value="results.moyers.table_configured ? `${fmt(results.moyers.predicted_upper)} / ${fmt(results.moyers.predicted_lower)} mm` : t('cast.moyersNotSet')" :sub="results.moyers.table_configured ? '' : t('cast.moyersHint')" />
    </Section>

    <Section :title="t('cast.speeTitle')" icon="mdi-chart-bell-curve">
      <Row :label="t('cast.speeDepth')" :value="`${fmt(results.curve_of_spee.right, 2)} / ${fmt(results.curve_of_spee.left, 2)} ${results.length_unit === 'mm' ? 'mm' : 'u'}`" />
      <Row :label="t('cast.mean')" :value="len(results.curve_of_spee.mean, results.length_unit)" />
    </Section>

    <Section :title="t('cast.widthsTitle')" icon="mdi-format-list-numbered">
      <div class="d-flex flex-wrap ga-1" dir="ltr">
        <v-chip v-for="(w, t) in results.tooth_widths" :key="t" size="x-small" variant="tonal">{{ t }}: {{ fmt(w, 2) }}</v-chip>
      </div>
    </Section>
  </div>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { fmt, statusColor, statusLabel } from '../../utils/format.js'
import { ot as t } from '../../i18n.js'

defineProps({ results: { type: Object, required: true } })
const pct = v => (v === null ? '—' : `${fmt(v, 2)}%`)
const normText = n => (n ? `${n.mean} ± ${n.sd}% (${n.source})` : '')
const len = (v, unit, signed = false) => (v === null || v === undefined ? '—' : `${signed && v > 0 ? '+' : ''}${fmt(v, 2)} ${unit === 'mm' ? 'mm' : 'u'}`)
const diff = v => (v === null || v === undefined ? '' : t('cast.diff', { v: `${v > 0 ? '+' : ''}${fmt(v, 2)}` }))

const Section = defineComponent({
  props: { title: String, icon: String },
  setup: (p, { slots }) => () => h('div', { class: 'mb-4' }, [
    h('div', { class: 'd-flex align-center ga-1 text-subtitle-2 font-weight-bold mb-1' }, [h('i', { class: `mdi ${p.icon} text-primary` }), p.title]),
    slots.default?.()
  ])
})
const Row = defineComponent({
  props: { label: String, value: String, norm: String, status: String, sub: String },
  setup: p => () => h('div', { class: 'dcm-row' }, [
    h('div', [h('div', { class: 'text-body-2' }, p.label), p.sub ? h('div', { class: 'text-caption text-medium-emphasis' }, p.sub) : null, p.norm ? h('div', { class: 'text-caption text-medium-emphasis', dir: 'ltr' }, p.norm) : null]),
    h('div', { class: 'text-end' }, [
      h('div', { class: 'font-weight-bold', dir: 'ltr' }, p.value),
      p.status ? h('span', { class: `text-caption text-${statusColor(p.status)}` }, statusLabel(p.status)) : null
    ])
  ])
})
const Missing = defineComponent({
  props: { teeth: Array },
  setup: p => () => p.teeth?.length ? h('div', { class: 'text-caption text-medium-emphasis mb-1' }, t('cast.missingTeeth', { list: p.teeth.join(', ') })) : null
})
</script>

<style scoped>
.dcm :deep(.dcm-row) { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 4px 0; border-bottom: 1px dashed rgba(var(--v-border-color), 0.4); }
</style>
