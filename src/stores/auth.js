/**
 * Auth Store - Pinia (Vue 3)
 * متجر المصادقة
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { defineStore } from 'pinia'
import apiClient from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('tokinn') || null,
    tctateToken: localStorage.getItem('tctate_token') || null,
    permissions: [],
    clinicInfo: null,
    doctorInfo: null,
    lang: localStorage.getItem('lang') || 'ar',
    drawer: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    
    userRole: (state) => state.user?.role || '',
    
    isSecretary: (state) => state.user?.role === 'secretary',
    
    isDoctor: (state) => state.user?.role === 'doctor',
    
    isAdmin: (state) => state.user?.role === 'admin',
    
    userName: (state) => state.user?.name || '',
    
    userPermissions: (state) => state.permissions,
    
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission)
    },
    
    useCreditSystem: (state) => state.clinicInfo?.use_credit === 1
  },

  actions: {
    /**
     * تسجيل الدخول
     */
    async login(credentials) {
      try {
        const response = await apiClient.post('/users/login', credentials)
        
        if (response.token) {
          this.setAuthData(response)
          return { success: true }
        }
        
        return { success: false, error: 'بيانات الدخول غير صحيحة' }
      } catch (error) {
        console.error('Login error:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || 'حدث خطأ في تسجيل الدخول' 
        }
      }
    },

    /**
     * تسجيل الخروج
     */
    async logout() {
      try {
        await apiClient.post('/auth/logout')
      } catch (error) {
        console.warn('Logout API error:', error)
      } finally {
        this.clearAuth()
      }
    },

    /**
     * تعيين بيانات المصادقة
     */
    setAuthData(data) {
      this.token = data.token
      this.tctateToken = data.tctate_token || null
      this.user = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        photo: data.photo,
        role: data.role?.name || data.role,
        doctor_id: data.doctor_id
      }
      this.permissions = data.Permissions || []
      this.clinicInfo = data.clinic_info || null
      this.doctorInfo = data.doctor_info || null

      // Save to localStorage
      localStorage.setItem('tokinn', data.token)
      if (data.tctate_token) {
        localStorage.setItem('tctate_token', data.tctate_token)
      }
    },

    /**
     * مسح بيانات المصادقة
     */
    clearAuth() {
      this.user = null
      this.token = null
      this.tctateToken = null
      this.permissions = []
      this.clinicInfo = null
      this.doctorInfo = null

      localStorage.removeItem('tokinn')
      localStorage.removeItem('tctate_token')
    },

    /**
     * تهيئة من localStorage
     */
    initFromStorage() {
      const token = localStorage.getItem('tokinn')
      
      if (token) {
        this.token = token
        this.tctateToken = localStorage.getItem('tctate_token')
        
        // Try to restore user data
        try {
          const vuexData = localStorage.getItem('vuex')
          if (vuexData) {
            const parsed = JSON.parse(vuexData)
            if (parsed.AdminInfo) {
              this.user = {
                id: parsed.AdminInfo.id,
                user_id: parsed.AdminInfo.user_id,
                name: parsed.AdminInfo.name,
                email: parsed.AdminInfo.email,
                phone: parsed.AdminInfo.phone,
                photo: parsed.AdminInfo.photo,
                role: parsed.AdminInfo.role,
                doctor_id: parsed.AdminInfo.doctor_id
              }
              this.permissions = parsed.AdminInfo.Permissions || []
              this.clinicInfo = parsed.AdminInfo.clinics_info
              this.doctorInfo = parsed.AdminInfo.doctor_info
            }
          }
        } catch (e) {
          console.warn('Failed to restore state:', e)
        }
      }
    },

    /**
     * تغيير اللغة
     */
    setLanguage(lang) {
      this.lang = lang
      localStorage.setItem('lang', lang)
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    },

    /**
     * التحكم بالـ Drawer
     */
    toggleDrawer() {
      this.drawer = !this.drawer
    }
  },

  persist: {
    key: 'auth',
    paths: ['user', 'token', 'tctateToken', 'permissions', 'clinicInfo', 'lang']
  }
})
