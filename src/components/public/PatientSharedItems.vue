<template>
  <section id="more" class="public-card public-card-pad" aria-labelledby="shared-items-title">
    <div class="public-card-heading"><div><p class="public-section-kicker">{{ labels.yourRecords }}</p><h2 id="shared-items-title">{{ labels.prescriptionsDocuments }}</h2></div><v-icon color="var(--clinic-primary)" aria-hidden="true">mdi-file-document-outline</v-icon></div>
    <div class="public-empty"><span class="public-empty-icon"><v-icon>mdi-folder-open-outline</v-icon></span><p>{{ labels.noSharedItems }}</p><small>{{ labels.sharedItemsHint }}</small></div>
  </section>
</template>

<script setup>
defineProps({ labels: { type: Object, required: true } })
</script>
