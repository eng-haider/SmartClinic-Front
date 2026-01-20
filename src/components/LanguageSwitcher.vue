<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        :prepend-icon="currentLangIcon"
        class="language-switcher"
      >
        {{ currentLangName }}
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="lang in languages"
        :key="lang.code"
        :active="currentLocale === lang.code"
        @click="changeLanguage(lang.code)"
      >
        <template v-slot:prepend>
          <v-icon>{{ lang.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ lang.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useLanguage } from '@/composables/useLanguage'

const { locale, languages, currentLanguage, changeLanguage } = useLanguage()

const currentLangIcon = computed(() => currentLanguage.value.icon)
const currentLangName = computed(() => currentLanguage.value.name)
const currentLocale = computed(() => locale.value)
</script>

<style scoped>
.language-switcher {
  text-transform: none;
}
</style>
