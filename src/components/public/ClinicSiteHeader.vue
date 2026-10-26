<template>
  <header class="public-sticky-header">
    <div class="public-site-shell public-header-row">
      <a class="public-brand" href="#top" @click="closeMenu">
        <img v-if="logo" class="public-logo" :src="logo" :alt="name" width="38" height="38">
        <span v-else class="public-logo-fallback" aria-hidden="true"><v-icon size="20">mdi-hospital-building-outline</v-icon></span>
        <span class="public-brand-name">{{ name }}</span>
      </a>
      <nav class="clinic-nav" :class="{ 'is-open': menuOpen }" :aria-label="labels.navigation">
        <a v-for="item in links" :key="item.href" :href="item.href" @click="closeMenu">{{ item.label }}</a>
      </nav>
      <div class="public-header-actions">
        <button class="public-icon-button clinic-menu-button" type="button" :aria-label="labels.menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><v-icon>{{ menuOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon></button>
        <a class="public-button public-button--primary" href="#booking" @click="closeMenu"><span>{{ labels.book }}</span><v-icon size="18">mdi-arrow-down</v-icon></a>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ name: { type: String, required: true }, logo: { type: String, default: '' }, labels: { type: Object, required: true } })
const menuOpen = ref(false)
const links = computed(() => [
  { href: '#top', label: props.labels.home }, { href: '#services', label: props.labels.services },
  { href: '#about', label: props.labels.about }, { href: '#contact', label: props.labels.contact },
])
const closeMenu = () => { menuOpen.value = false }
</script>
