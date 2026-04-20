<template>
  <div class="rx-header" :class="`rx-header--${template}`">
    <!-- Minimal Template -->
    <template v-if="template === 'minimal'">
      <div class="rx-header__minimal">
        <div class="rx-header__logo-wrap" v-if="logo">
          <img :src="logo" :alt="clinicName" class="rx-header__logo" />
        </div>
        <div class="rx-header__center">
          <h1 class="rx-header__clinic-name">{{ clinicName }}</h1>
          <p v-if="doctorName" class="rx-header__doctor">{{ doctorName }}
            <span v-if="specialty" class="rx-header__specialty">— {{ specialty }}</span>
          </p>
        </div>
      </div>
      <v-divider class="my-2" />
    </template>

    <!-- Classic Template -->
    <template v-else-if="template === 'classic'">
      <div class="rx-header__classic">
        <div class="rx-header__classic-top">
          <div class="rx-header__logo-wrap" v-if="logo">
            <img :src="logo" :alt="clinicName" class="rx-header__logo rx-header__logo--lg" />
          </div>
          <div class="rx-header__classic-info">
            <h1 class="rx-header__clinic-name rx-header__clinic-name--lg">{{ clinicName }}</h1>
            <p v-if="doctorName" class="rx-header__doctor">
              {{ doctorName }}
              <span v-if="specialty" class="rx-header__specialty">| {{ specialty }}</span>
            </p>
            <div class="rx-header__contact">
              <span v-if="phone" class="rx-header__contact-item">
                <v-icon size="14" class="me-1">mdi-phone</v-icon>
                <span dir="ltr">{{ phone }}</span>
              </span>
              <span v-if="address" class="rx-header__contact-item">
                <v-icon size="14" class="me-1">mdi-map-marker</v-icon>
                {{ address }}
              </span>
            </div>
          </div>
        </div>
        <div class="rx-header__rx-bar">
          <span class="rx-header__rx-symbol">℞</span>
          <span class="rx-header__rx-text">{{ $t('rx.prescription') }}</span>
        </div>
      </div>
    </template>

    <!-- Modern Template (default) -->
    <template v-else>
      <div class="rx-header__modern">
        <div class="rx-header__modern-row">
          <div class="rx-header__modern-left">
            <div class="rx-header__logo-wrap" v-if="logo">
              <img :src="logo" :alt="clinicName" class="rx-header__logo rx-header__logo--round" />
            </div>
            <div>
              <h1 class="rx-header__clinic-name">{{ clinicName }}</h1>
              <p v-if="doctorName" class="rx-header__doctor">
                {{ doctorName }}
              </p>
            </div>
          </div>
          <div class="rx-header__modern-right">
            <div v-if="specialty" class="rx-header__meta-item">
              <v-icon size="15" color="primary">mdi-stethoscope</v-icon>
              <span>{{ specialty }}</span>
            </div>
            <div v-if="phone" class="rx-header__meta-item">
              <v-icon size="15" color="primary">mdi-phone</v-icon>
              <span dir="ltr">{{ phone }}</span>
            </div>
            <div v-if="address" class="rx-header__meta-item">
              <v-icon size="15" color="primary">mdi-map-marker</v-icon>
              <span>{{ address }}</span>
            </div>
          </div>
        </div>
        <div class="rx-header__rx-bar rx-header__rx-bar--modern">
          <div class="rx-header__rx-bar-inner">
            <span class="rx-header__rx-symbol">℞</span>
            <span class="rx-header__rx-text">{{ $t('rx.prescription') }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  template: {
    type: String,
    default: 'modern',
    validator: (v) => ['minimal', 'classic', 'modern'].includes(v)
  },
  logo: { type: String, default: '' },
  clinicName: { type: String, default: 'Smart Clinic' },
  doctorName: { type: String, default: '' },
  specialty: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' }
})
</script>

<style scoped>
.rx-header {
  margin-bottom: 16px;
}

/* ===== Logo ===== */
.rx-header__logo-wrap {
  flex-shrink: 0;
}
.rx-header__logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 10px;
}
.rx-header__logo--lg {
  width: 68px;
  height: 68px;
}
.rx-header__logo--round {
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-primary), 0.15);
}

/* ===== Typography ===== */
.rx-header__clinic-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
  margin: 0;
}
.rx-header__clinic-name--lg {
  font-size: 1.6rem;
}
.rx-header__doctor {
  font-size: 0.85rem;
  color: #555;
  margin: 2px 0 0;
}
.rx-header__specialty {
  color: #888;
  font-weight: 400;
}

/* ===== Contact ===== */
.rx-header__contact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 4px;
}
.rx-header__contact-item {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  color: #666;
}

/* ===== Rx Bar ===== */
.rx-header__rx-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  padding: 6px 0;
  border-radius: 6px;
  margin-top: 10px;
}
.rx-header__rx-symbol {
  font-size: 1.5rem;
  font-weight: 700;
  font-style: italic;
}
.rx-header__rx-text {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.rx-header__rx-bar--modern {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.8));
  border-radius: 8px;
  padding: 8px 0;
}
.rx-header__rx-bar-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== Minimal ===== */
.rx-header__minimal {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
}
.rx-header__minimal .rx-header__center {
  flex: 1;
}

/* ===== Classic ===== */
.rx-header__classic-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 8px;
}
.rx-header__classic-info {
  flex: 1;
}

/* ===== Modern ===== */
.rx-header__modern-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.rx-header__modern-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.rx-header__modern-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}
.rx-header__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: #555;
}

/* ===== Print ===== */
@media print {
  .rx-header__rx-bar,
  .rx-header__rx-bar--modern {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
