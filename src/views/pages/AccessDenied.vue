<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12 text-center pa-6">
          <v-icon 
            size="100" 
            color="error"
            class="mb-4"
          >
            mdi-shield-lock
          </v-icon>
          
          <v-card-title class="text-h4 justify-center mb-2">
            {{ t('accessDenied.title') }}
          </v-card-title>
          
          <v-card-text class="text-body-1 text-medium-emphasis">
            {{ t('accessDenied.message') }}
          </v-card-text>
          
          <v-card-actions class="justify-center mt-4">
            <v-btn
              color="primary"
              size="large"
              variant="elevated"
              @click="goToDashboard"
            >
              <v-icon start>mdi-home</v-icon>
              {{ t('accessDenied.backToDashboard') }}
            </v-btn>
          </v-card-actions>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="text-caption text-medium-emphasis">
            {{ t('accessDenied.contactAdmin') }}
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const goToDashboard = () => {
  router.push('/')
}
</script>

<style scoped>
.v-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}
</style>
