<template>
  <v-container fluid class="pa-4">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">لوحة التحكم</h1>
        <p class="text-subtitle-1 text-grey">مرحباً بك في منصة العياده الذكيه</p>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row>
      <!-- Patients Count -->
      <v-col cols="12" sm="6" md="3">
        <v-card 
          color="primary" 
          variant="elevated"
          class="pa-4"
          :loading="loading"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h4 font-weight-bold text-white">
                {{ stats.patientsCount }}
              </div>
              <div class="text-subtitle-1 text-white">المراجعين</div>
            </div>
            <v-icon size="48" color="white" opacity="0.7">mdi-account-group</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- Today Appointments -->
      <v-col cols="12" sm="6" md="3">
        <v-card 
          color="success" 
          variant="elevated"
          class="pa-4"
          :loading="loading"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h4 font-weight-bold text-white">
                {{ stats.todayBookings }}
              </div>
              <div class="text-subtitle-1 text-white">مواعيد اليوم</div>
            </div>
            <v-icon size="48" color="white" opacity="0.7">mdi-calendar-check</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- Cases Count -->
      <v-col cols="12" sm="6" md="3">
        <v-card 
          color="warning" 
          variant="elevated"
          class="pa-4"
          :loading="loading"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h4 font-weight-bold text-white">
                {{ stats.casesCount }}
              </div>
              <div class="text-subtitle-1 text-white">الحالات</div>
            </div>
            <v-icon size="48" color="white" opacity="0.7">mdi-file-document-multiple</v-icon>
          </div>
        </v-card>
      </v-col>

      <!-- Bills Total -->
      <v-col cols="12" sm="6" md="3">
        <v-card 
          color="info" 
          variant="elevated"
          class="pa-4"
          :loading="loading"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h4 font-weight-bold text-white">
                {{ formatCurrency(stats.billsTotal) }}
              </div>
              <div class="text-subtitle-1 text-white">إجمالي الفواتير</div>
            </div>
            <v-icon size="48" color="white" opacity="0.7">mdi-cash-multiple</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h6">إجراءات سريعة</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" sm="3">
                <v-btn 
                  block 
                  color="primary" 
                  variant="outlined"
                  size="large"
                  prepend-icon="mdi-account-plus"
                  @click="goToAddPatient"
                >
                  إضافة مريض
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn 
                  block 
                  color="success" 
                  variant="outlined"
                  size="large"
                  prepend-icon="mdi-calendar-plus"
                  @click="goToAddAppointment"
                >
                  إضافة موعد
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn 
                  block 
                  color="warning" 
                  variant="outlined"
                  size="large"
                  prepend-icon="mdi-file-plus"
                  @click="goToAddCase"
                >
                  إضافة حالة
                </v-btn>
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn 
                  block 
                  color="info" 
                  variant="outlined"
                  size="large"
                  prepend-icon="mdi-receipt"
                  @click="goToAddBill"
                >
                  إضافة فاتورة
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Today's Appointments Table -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">مواعيد اليوم</span>
            <v-btn 
              variant="text" 
              color="primary"
              size="small"
            >
              عرض الكل
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-data-table
              :headers="appointmentHeaders"
              :items="todayAppointments"
              :loading="loading"
              density="comfortable"
              class="elevation-0"
            >
              <template v-slot:item.status="{ item }">
                <v-chip 
                  :color="getStatusColor(item.status)" 
                  size="small"
                >
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn 
                  icon="mdi-eye" 
                  variant="text" 
                  size="small"
                  @click="viewAppointment(item)"
                ></v-btn>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-4">
                  <v-icon size="48" color="grey">mdi-calendar-blank</v-icon>
                  <p class="text-grey mt-2">لا توجد مواعيد لليوم</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Patients -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="text-h6">آخر المراجعين</v-card-title>
          <v-divider></v-divider>
          <v-list>
            <v-list-item
              v-for="patient in recentPatients"
              :key="patient.id"
              :title="patient.name"
              :subtitle="patient.phone"
              @click="viewPatient(patient)"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="40">
                  <span class="text-white">{{ getInitials(patient.name) }}</span>
                </v-avatar>
              </template>
              <template v-slot:append>
                <v-icon>mdi-chevron-left</v-icon>
              </template>
            </v-list-item>

            <v-list-item v-if="recentPatients.length === 0">
              <div class="text-center py-4 w-100">
                <v-icon size="48" color="grey">mdi-account-off</v-icon>
                <p class="text-grey mt-2">لا يوجد مراجعين</p>
              </div>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Info Card -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h6">معلومات الحساب</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4">
                <div class="text-subtitle-2 text-grey">اسم المستخدم</div>
                <div class="text-body-1 font-weight-medium">{{ user?.name || 'غير محدد' }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-subtitle-2 text-grey">اسم العيادة</div>
                <div class="text-body-1 font-weight-medium">{{ user?.clinic_info?.name || 'غير محدد' }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-subtitle-2 text-grey">رقم الهاتف</div>
                <div class="text-body-1 font-weight-medium">{{ user?.phone || 'غير محدد' }}</div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="error" 
              variant="outlined"
              @click="handleLogout"
            >
              تسجيل الخروج
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const loading = ref(false)
const stats = ref({
  patientsCount: 0,
  todayBookings: 0,
  casesCount: 0,
  billsTotal: 0
})

const todayAppointments = ref([])
const recentPatients = ref([])

// Computed
const user = computed(() => authStore.user)

// Table headers
const appointmentHeaders = [
  { title: 'المريض', key: 'patient_name', sortable: true },
  { title: 'الوقت', key: 'time', sortable: true },
  { title: 'الحالة', key: 'status', sortable: true },
  { title: 'إجراءات', key: 'actions', sortable: false }
]

// Methods
const formatCurrency = (value) => {
  if (!value) return '0'
  return new Intl.NumberFormat('ar-IQ', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(value) + ' د.ع'
}

const getStatusColor = (status) => {
  const colors = {
    'pending': 'warning',
    'confirmed': 'success',
    'cancelled': 'error',
    'completed': 'info'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'cancelled': 'ملغي',
    'completed': 'مكتمل'
  }
  return texts[status] || status
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

// Navigation methods
const goToAddPatient = () => {
  router.push('/patients/add')
}

const goToAddAppointment = () => {
  router.push('/appointments/add')
}

const goToAddCase = () => {
  router.push('/cases/add')
}

const goToAddBill = () => {
  router.push('/bills/add')
}

const viewAppointment = (appointment) => {
  router.push(`/appointments/${appointment.id}`)
}

const viewPatient = (patient) => {
  router.push(`/patients/${patient.id}`)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// Fetch dashboard data
const fetchDashboardData = async () => {
  loading.value = true
  
  try {
    // Fetch counts
    const countsResponse = await api.get('/Counts')
    if (countsResponse.data) {
      stats.value = {
        patientsCount: countsResponse.data.patients_count || 0,
        todayBookings: countsResponse.data.today_bookings || 0,
        casesCount: countsResponse.data.cases_count || 0,
        billsTotal: countsResponse.data.bills_total || 0
      }
    }
  } catch (error) {
    console.error('Error fetching counts:', error)
  }

  try {
    // Fetch today's bookings
    const bookingsResponse = await api.get('/todaybooking')
    if (bookingsResponse.data && Array.isArray(bookingsResponse.data.data)) {
      todayAppointments.value = bookingsResponse.data.data.slice(0, 5)
    }
  } catch (error) {
    console.error('Error fetching bookings:', error)
  }

  try {
    // Fetch recent patients
    const patientsResponse = await api.get('/patients', {
      params: { page: 1, per_page: 5 }
    })
    if (patientsResponse.data && Array.isArray(patientsResponse.data.data)) {
      recentPatients.value = patientsResponse.data.data
    }
  } catch (error) {
    console.error('Error fetching patients:', error)
  }

  loading.value = false
}

// Lifecycle
onMounted(() => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  fetchDashboardData()
})
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>
