<template>
  <div class="messaging-settings">
    <v-tabs v-model="section" color="primary" show-arrows class="messaging-settings__tabs">
      <v-tab v-for="item in sections" :key="item.value" :value="item.value" class="text-none">
        <v-icon start :color="item.color">{{ item.icon }}</v-icon>
        {{ item.title }}
      </v-tab>
    </v-tabs>
    <v-divider />

    <v-window v-model="section">
      <v-window-item v-for="item in sections" :key="item.value" :value="item.value">
        <!-- Own layout scope: the conversations list is a v-navigation-drawer, which
             would otherwise register with the app layout and shift the whole page -->
        <v-layout class="d-block">
          <component :is="item.component" />
        </v-layout>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps({
  // Section to open first, e.g. from `?section=templates`
  initialSection: { type: String, default: null }
})

const { t } = useI18n()
const { hasAnyPermissionFor } = usePermissions()

// Keywords match the guards on the standalone /messaging/* routes
const ALL_SECTIONS = [
  {
    value: 'conversations',
    titleKey: 'settings.messagingConversations',
    icon: 'mdi-message-processing',
    color: '#25D366',
    keywords: ['message', 'conversation', 'whatsapp'],
    component: defineAsyncComponent(() => import('@/pages/messaging/ConversationsPage.vue'))
  },
  {
    value: 'templates',
    titleKey: 'settings.whatsappTemplates',
    icon: 'mdi-file-document-outline',
    color: '#1E88E5',
    keywords: ['message', 'template', 'automation'],
    component: defineAsyncComponent(() => import('@/pages/messaging/TemplatesPage.vue'))
  },
  {
    value: 'rules',
    titleKey: 'settings.messagingRules',
    icon: 'mdi-robot',
    color: '#8E24AA',
    keywords: ['message', 'automation', 'rule'],
    component: defineAsyncComponent(() => import('@/pages/messaging/AutomationRulesPage.vue'))
  },
  {
    value: 'targets',
    titleKey: 'settings.messagingTargets',
    icon: 'mdi-bullseye-arrow',
    color: '#F4511E',
    keywords: ['message', 'automation', 'target'],
    component: defineAsyncComponent(() => import('@/pages/messaging/TargetsPage.vue'))
  },
  {
    value: 'settings',
    titleKey: 'settings.messagingSettings',
    icon: 'mdi-cog-outline',
    color: '#607D8B',
    keywords: ['message', 'whatsapp', 'automation'],
    component: defineAsyncComponent(() => import('@/pages/messaging/SettingsPage.vue'))
  }
]

const sections = computed(() =>
  ALL_SECTIONS
    .filter(item => hasAnyPermissionFor(item.keywords))
    .map(item => ({ ...item, title: t(item.titleKey) }))
)

const section = ref(
  sections.value.some(item => item.value === props.initialSection)
    ? props.initialSection
    : sections.value[0]?.value
)
</script>

<style scoped>
.messaging-settings__tabs {
  padding-inline: 8px;
}

/* The embedded pages are full routed pages: drop their page gutters and card shadow */
.messaging-settings :deep(.v-container.app-page) {
  max-width: none;
  padding: 16px;
}

.messaging-settings :deep(.app-page > .v-card) {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: none;
}

@media (max-width: 599px) {
  .messaging-settings :deep(.v-container.app-page) {
    padding: 12px 0;
  }
}
</style>
