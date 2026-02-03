<template>
  <div class="expenses-page">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0">
          <v-icon class="me-2">mdi-cash-multiple</v-icon>
          {{ $t('expenses.title') }}
        </h1>
        
        <div class="d-flex ga-2">
          <v-btn
            color="secondary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-folder-plus"
            @click="openCategoryDialog()"
          >
            {{ $t('expenses.addCategory') }}
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            :disabled="!selectedCategory"
            @click="openExpenseDialog()"
          >
            {{ $t('expenses.addExpense') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-row mb-4">
      <v-card class="stat-card" color="primary" variant="tonal">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="primary" size="48">
            <v-icon color="white">mdi-receipt</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('expenses.totalExpenses') }}</div>
            <div class="text-h5 font-weight-bold">{{ formatCurrency(statistics.total_amount || 0) }}</div>
            <div class="text-caption">{{ statistics.total_expenses || 0 }} {{ $t('expenses.items') }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" color="success" variant="tonal">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="success" size="48">
            <v-icon color="white">mdi-check-circle</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('expenses.paidAmount') }}</div>
            <div class="text-h5 font-weight-bold text-success">{{ formatCurrency(statistics.paid_amount || 0) }}</div>
            <div class="text-caption">{{ statistics.paid_count || 0 }} {{ $t('expenses.items') }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" color="error" variant="tonal">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="error" size="48">
            <v-icon color="white">mdi-clock-alert</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('expenses.unpaidAmount') }}</div>
            <div class="text-h5 font-weight-bold text-error">{{ formatCurrency(statistics.unpaid_amount || 0) }}</div>
            <div class="text-caption">{{ statistics.unpaid_count || 0 }} {{ $t('expenses.items') }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" color="info" variant="tonal">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="info" size="48">
            <v-icon color="white">mdi-folder-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('expenses.categories') }}</div>
            <div class="text-h5 font-weight-bold">{{ categories.length }}</div>
            <div class="text-caption">{{ $t('expenses.activeCategories') }}</div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Category Cards -->
    <v-card elevation="2" rounded="xl" class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6">
          <v-icon class="me-2">mdi-folder-multiple</v-icon>
          {{ $t('expenses.expenseCategories') }}
        </span>
        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          :loading="loadingCategories"
          @click="loadCategories"
        />
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-4">
        <v-progress-linear v-if="loadingCategories" indeterminate color="primary" class="mb-4" />
        
        <div v-if="categories.length === 0 && !loadingCategories" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-folder-off</v-icon>
          <p class="text-grey mt-2">{{ $t('expenses.noCategoriesFound') }}</p>
          <v-btn color="primary" variant="tonal" class="mt-2" @click="openCategoryDialog()">
            {{ $t('expenses.addFirstCategory') }}
          </v-btn>
        </div>
        
        <div v-else class="categories-grid">
          <v-card
            v-for="category in categories"
            :key="category.id"
            class="category-card"
            :class="{ 'selected': selectedCategory?.id === category.id }"
            :color="selectedCategory?.id === category.id ? 'primary' : undefined"
            :variant="selectedCategory?.id === category.id ? 'tonal' : 'outlined'"
            rounded="lg"
            @click="selectCategory(category)"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div>
                  <h3 class="text-h6 font-weight-bold mb-1">{{ category.name }}</h3>
                  <p v-if="category.description" class="text-caption text-medium-emphasis ma-0">
                    {{ category.description }}
                  </p>
                </div>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      size="small"
                      variant="text"
                      v-bind="props"
                      @click.stop
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click.stop="openCategoryDialog(category)">
                      <template v-slot:prepend>
                        <v-icon size="small">mdi-pencil</v-icon>
                      </template>
                      <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click.stop="confirmDeleteCategory(category)">
                      <template v-slot:prepend>
                        <v-icon size="small" color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title class="text-error">{{ $t('common.delete') }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <v-divider class="mb-3" />
              
              <!-- Simple Stats -->
              <div class="d-flex justify-space-between align-center">
                <div class="text-center flex-grow-1">
                  <div class="text-h5 font-weight-bold text-primary">{{ category.expenses_count || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">{{ $t('expenses.items') }}</div>
                </div>
                
                <v-divider vertical class="mx-2" style="height: 40px;" />
                
                <div class="text-center flex-grow-1">
                  <div class="text-h5 font-weight-bold">{{ formatCurrency(category.total_expenses_amount || 0) }}</div>
                  <div class="text-caption text-medium-emphasis">{{ $t('expenses.totalAmount') }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>

    <!-- Expenses List -->
    <v-card v-if="selectedCategory" elevation="2" rounded="xl">
      <v-card-title class="d-flex flex-wrap align-center justify-space-between pa-4 ga-2">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-receipt-text</v-icon>
          <span class="text-h6">{{ selectedCategory.name }} - {{ $t('expenses.expensesList') }}</span>
          <v-chip size="small" color="primary" variant="flat">
            {{ expensesPagination.total || 0 }}
          </v-chip>
        </div>
        
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          @click="openExpenseDialog()"
        >
          {{ $t('expenses.addExpense') }}
        </v-btn>
      </v-card-title>
      
      <v-divider />
      
      <!-- Summary Section - Different UI from main statistics -->
      <v-card-text class="pa-4 pb-2 bg-grey-lighten-4">
        <div class="d-flex flex-wrap justify-space-around align-center ga-4">
          <!-- Total Amount -->
          <div class="d-flex align-center ga-2">
            <v-avatar color="primary" size="36" variant="tonal">
              <v-icon size="20">mdi-sigma</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">{{ $t('expenses.totalAmount') }}</div>
              <div class="text-subtitle-1 font-weight-bold text-primary">{{ formatCurrency(expensesSummary.total_expenses_amount) }}</div>
            </div>
          </div>
          
          <v-divider vertical class="d-none d-sm-block" style="height: 40px;" />
          
          <!-- Paid Amount -->
          <div class="d-flex align-center ga-2">
            <v-avatar color="success" size="36" variant="tonal">
              <v-icon size="20">mdi-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">{{ $t('expenses.paidAmount') }} ({{ expensesSummary.paid_expenses_count }})</div>
              <div class="text-subtitle-1 font-weight-bold text-success">{{ formatCurrency(expensesSummary.total_paid_amount) }}</div>
            </div>
          </div>
          
          <v-divider vertical class="d-none d-sm-block" style="height: 40px;" />
          
          <!-- Unpaid Amount -->
          <div class="d-flex align-center ga-2">
            <v-avatar color="error" size="36" variant="tonal">
              <v-icon size="20">mdi-clock-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">{{ $t('expenses.unpaidAmount') }} ({{ expensesSummary.unpaid_expenses_count }})</div>
              <div class="text-subtitle-1 font-weight-bold text-error">{{ formatCurrency(expensesSummary.total_unpaid_amount) }}</div>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <!-- Filters -->
      <v-card-text class="pa-4 pb-0">
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="expenseSearch"
              :label="$t('common.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="debouncedLoadExpenses"
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-select
              v-model="expenseFilters.is_paid"
              :items="paymentStatusOptions"
              :label="$t('expenses.paymentStatus')"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadExpenses"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="expenseFilters.date_from"
              :label="$t('expenses.dateFrom')"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadExpenses"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="expenseFilters.date_to"
              :label="$t('expenses.dateTo')"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadExpenses"
            />
          </v-col>
        </v-row>
      </v-card-text>
      
      <!-- Expenses Table -->
      <v-data-table
        :headers="expenseHeaders"
        :items="expenses"
        :loading="loadingExpenses"
        :items-per-page="expensesPagination.per_page"
        :page="expensesPagination.current_page"
        class="elevation-0"
        @update:page="onExpensePageChange"
        @update:items-per-page="onExpenseItemsPerPageChange"
      >
        <template v-slot:item.name="{ item }">
          <div class="font-weight-medium">{{ item.name }}</div>
        </template>
        
        <template v-slot:item.quantity="{ item }">
          <span>{{ item.quantity }}</span>
        </template>
        
        <template v-slot:item.price="{ item }">
          <span>{{ formatCurrency(item.price) }}</span>
        </template>
        
        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.total || item.quantity * item.price) }}</span>
        </template>
        
        <template v-slot:item.date="{ item }">
          <span>{{ formatDate(item.date) }}</span>
        </template>
        
        <template v-slot:item.is_paid="{ item }">
          <v-chip
            :color="item.is_paid ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            <v-icon start size="small">{{ item.is_paid ? 'mdi-check-circle' : 'mdi-clock-alert' }}</v-icon>
            {{ item.is_paid ? $t('expenses.paid') : $t('expenses.unpaid') }}
          </v-chip>
        </template>
        
        <template v-slot:item.doctor="{ item }">
          <span v-if="item.doctor">{{ item.doctor.name }}</span>
          <span v-else class="text-grey">-</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-tooltip :text="item.is_paid ? $t('expenses.markAsUnpaid') : $t('expenses.markAsPaid')" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="item.is_paid ? 'mdi-close-circle' : 'mdi-check-circle'"
                  :color="item.is_paid ? 'warning' : 'success'"
                  size="x-small"
                  variant="tonal"
                  :loading="item.loading"
                  @click="togglePaymentStatus(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip :text="$t('common.edit')" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  color="primary"
                  size="x-small"
                  variant="tonal"
                  @click="openExpenseDialog(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip :text="$t('common.delete')" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  color="error"
                  size="x-small"
                  variant="tonal"
                  @click="confirmDeleteExpense(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
        
        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-receipt-text-remove</v-icon>
            <p class="text-grey mt-2">{{ $t('expenses.noExpensesFound') }}</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white text-h6">
            {{ editingCategory ? $t('expenses.editCategory') : $t('expenses.addCategory') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeCategoryDialog" />
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form ref="categoryForm" v-model="categoryFormValid">
            <v-text-field
              v-model="categoryData.name"
              :label="$t('expenses.categoryName')"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-folder"
              class="mb-4"
            />
            
            <v-textarea
              v-model="categoryData.description"
              :label="$t('expenses.categoryDescription')"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
              rows="3"
              class="mb-4"
            />
            
            <v-switch
              v-model="categoryData.is_active"
              :label="$t('expenses.activeCategory')"
              color="success"
              hide-details
            />
          </v-form>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeCategoryDialog">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="savingCategory"
            :disabled="!categoryFormValid"
            @click="saveCategory"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Expense Dialog -->
    <v-dialog v-model="expenseDialog" max-width="600" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white text-h6">
            {{ editingExpense ? $t('expenses.editExpense') : $t('expenses.addExpense') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeExpenseDialog" />
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-form ref="expenseForm" v-model="expenseFormValid">
            <v-select
              v-model="expenseData.clinic_expense_category_id"
              :items="categories"
              :label="$t('expenses.category')"
              :rules="[rules.required]"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-folder"
              class="mb-4"
            />
            
            <v-text-field
              v-model="expenseData.name"
              :label="$t('expenses.expenseName')"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
              class="mb-4"
            />
            
            <v-row dense class="mb-4">
              <v-col cols="6">
                <v-text-field
                  v-model.number="expenseData.quantity"
                  :label="$t('expenses.quantity')"
                  :rules="[rules.required, rules.minOne]"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-counter"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="expenseData.price"
                  :label="$t('expenses.pricePerUnit')"
                  :rules="[rules.required, rules.minZero]"
                  type="number"
                  min="0"
                  step="0.01"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-currency-usd"
                />
              </v-col>
            </v-row>
            
            <!-- Total Display -->
            <v-alert
              color="primary"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <div class="d-flex justify-space-between align-center">
                <span>{{ $t('expenses.totalAmount') }}:</span>
                <span class="text-h6 font-weight-bold">
                  {{ formatCurrency((expenseData.quantity || 0) * (expenseData.price || 0)) }}
                </span>
              </div>
            </v-alert>
            
            <v-text-field
              v-model="expenseData.date"
              :label="$t('expenses.date')"
              :rules="[rules.required]"
              type="date"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-calendar"
              class="mb-4"
            />
            
            <v-select
              v-model="expenseData.doctor_id"
              :items="doctors"
              :label="$t('expenses.doctor')"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-doctor"
              clearable
              class="mb-4"
            />
            
            <v-switch
              v-model="expenseData.is_paid"
              :label="$t('expenses.markAsPaid')"
              color="success"
              hide-details
            />
          </v-form>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeExpenseDialog">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="savingExpense"
            :disabled="!expenseFormValid"
            @click="saveExpense"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Category Confirmation -->
    <v-dialog v-model="deleteCategoryDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">{{ $t('common.confirmDelete') }}</v-card-title>
        <v-card-text>{{ $t('expenses.deleteCategoryConfirm') }}</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteCategoryDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="elevated" :loading="deletingCategory" @click="deleteCategory">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Expense Confirmation -->
    <v-dialog v-model="deleteExpenseDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">{{ $t('common.confirmDelete') }}</v-card-title>
        <v-card-text>{{ $t('expenses.deleteExpenseConfirm') }}</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteExpenseDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="elevated" :loading="deletingExpense" @click="deleteExpense">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">{{ $t('common.close') }}</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import expenseService from '@/services/expense.service'
import reservationService from '@/services/reservation.service'

const { t, locale } = useI18n()
const authStore = useAuthStore()

// ==================== State ====================
const loadingCategories = ref(false)
const loadingExpenses = ref(false)
const savingCategory = ref(false)
const savingExpense = ref(false)
const deletingCategory = ref(false)
const deletingExpense = ref(false)

const categories = ref([])
const expenses = ref([])
const doctors = ref([])
const statistics = ref({})
const selectedCategory = ref(null)
const expensesSummary = ref({
  expenses_count: 0,
  paid_expenses_count: 0,
  unpaid_expenses_count: 0,
  total_expenses_amount: 0,
  total_paid_amount: 0,
  total_unpaid_amount: 0
})

// Pagination
const expensesPagination = ref({
  total: 0,
  per_page: 15,
  current_page: 1,
  last_page: 1
})

// Filters
const expenseSearch = ref('')
const expenseFilters = ref({
  is_paid: null,
  date_from: null,
  date_to: null
})

// Dialogs
const categoryDialog = ref(false)
const expenseDialog = ref(false)
const deleteCategoryDialog = ref(false)
const deleteExpenseDialog = ref(false)

// Form data
const categoryFormValid = ref(false)
const expenseFormValid = ref(false)
const categoryForm = ref(null)
const expenseForm = ref(null)

const editingCategory = ref(null)
const editingExpense = ref(null)
const categoryToDelete = ref(null)
const expenseToDelete = ref(null)

const categoryData = ref({
  name: '',
  description: '',
  is_active: true
})

const expenseData = ref({
  name: '',
  quantity: 1,
  price: 0,
  clinic_expense_category_id: null,
  date: formatDateISO(new Date()),
  is_paid: false,
  doctor_id: null
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// ==================== Computed ====================
const expenseHeaders = computed(() => [
  { title: t('expenses.expenseName'), key: 'name', sortable: true },
  { title: t('expenses.quantity'), key: 'quantity', sortable: true, align: 'center' },
  { title: t('expenses.price'), key: 'price', sortable: true, align: 'end' },
  { title: t('expenses.total'), key: 'total', sortable: true, align: 'end' },
  { title: t('expenses.date'), key: 'date', sortable: true },
  { title: t('expenses.status'), key: 'is_paid', sortable: true, align: 'center' },
  { title: t('expenses.doctor'), key: 'doctor', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center', width: 150 }
])

const paymentStatusOptions = computed(() => [
  { title: t('common.all'), value: null },
  { title: t('expenses.paid'), value: 1 },
  { title: t('expenses.unpaid'), value: 0 }
])

// ==================== Rules ====================
const rules = {
  required: v => !!v || t('validation.required'),
  minOne: v => v >= 1 || t('validation.minOne'),
  minZero: v => v >= 0 || t('validation.minZero')
}

// ==================== Methods ====================
function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// ==================== Category Methods ====================
async function loadCategories() {
  loadingCategories.value = true
  try {
    const response = await expenseService.getCategories({
      per_page: 100
    })
    console.log('Categories API Response:', response)
    
    // Handle response - API returns { success, data, pagination }
    if (response.success && response.data) {
      categories.value = response.data
    } else if (Array.isArray(response)) {
      categories.value = response
    } else {
      categories.value = response.data || []
    }
    
    console.log('Categories loaded:', categories.value)
    
    // Calculate statistics from categories
    loadStatistics()
  } catch (error) {
    console.error('Failed to load categories:', error)
    showSnackbar(t('errors.fetchFailed'), 'error')
  } finally {
    loadingCategories.value = false
  }
}

function selectCategory(category) {
  selectedCategory.value = category
  // Reset summary when changing category
  expensesSummary.value = {
    expenses_count: 0,
    paid_expenses_count: 0,
    unpaid_expenses_count: 0,
    total_expenses_amount: 0,
    total_paid_amount: 0,
    total_unpaid_amount: 0
  }
  loadExpenses()
}

function openCategoryDialog(category = null) {
  editingCategory.value = category
  if (category) {
    categoryData.value = {
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    }
  } else {
    categoryData.value = {
      name: '',
      description: '',
      is_active: true
    }
  }
  categoryDialog.value = true
}

function closeCategoryDialog() {
  categoryDialog.value = false
  editingCategory.value = null
  categoryForm.value?.reset()
}

async function saveCategory() {
  if (!categoryFormValid.value) return
  
  savingCategory.value = true
  try {
    const payload = {
      ...categoryData.value,
      clinic_id: authStore.clinicInfo?.id || 1
    }
    
    if (editingCategory.value) {
      await expenseService.updateCategory(editingCategory.value.id, payload)
      showSnackbar(t('expenses.categoryUpdated'))
    } else {
      await expenseService.createCategory(payload)
      showSnackbar(t('expenses.categoryCreated'))
    }
    
    closeCategoryDialog()
    loadCategories()
    loadStatistics()
  } catch (error) {
    console.error('Failed to save category:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCategory.value = false
  }
}

function confirmDeleteCategory(category) {
  categoryToDelete.value = category
  deleteCategoryDialog.value = true
}

async function deleteCategory() {
  if (!categoryToDelete.value) return
  
  deletingCategory.value = true
  try {
    await expenseService.deleteCategory(categoryToDelete.value.id)
    showSnackbar(t('expenses.categoryDeleted'))
    
    if (selectedCategory.value?.id === categoryToDelete.value.id) {
      selectedCategory.value = null
      expenses.value = []
    }
    
    deleteCategoryDialog.value = false
    categoryToDelete.value = null
    loadCategories()
    loadStatistics()
  } catch (error) {
    console.error('Failed to delete category:', error)
    showSnackbar(error.response?.data?.message || t('errors.deleteFailed'), 'error')
  } finally {
    deletingCategory.value = false
  }
}

// ==================== Expense Methods ====================
async function loadExpenses() {
  if (!selectedCategory.value) return
  
  loadingExpenses.value = true
  try {
    const params = {
      'filter[clinic_expense_category_id]': selectedCategory.value.id,
      per_page: expensesPagination.value.per_page,
      page: expensesPagination.value.current_page,
      sort: '-date'
    }
    
    if (expenseSearch.value) {
      params.search = expenseSearch.value
    }
    
    if (expenseFilters.value.is_paid !== null) {
      params['filter[is_paid]'] = expenseFilters.value.is_paid
    }
    
    if (expenseFilters.value.date_from) {
      params['filter[date_from]'] = expenseFilters.value.date_from
    }
    
    if (expenseFilters.value.date_to) {
      params['filter[date_to]'] = expenseFilters.value.date_to
    }
    
    const response = await expenseService.getExpenses(params)
    console.log('=== EXPENSES API DEBUG ===')
    console.log('Full response:', response)
    console.log('response.summary:', response.summary)
    console.log('response.data:', response.data)
    
    // Handle response - API returns { success, data, pagination, summary }
    if (response.data) {
      expenses.value = response.data
    } else if (Array.isArray(response)) {
      expenses.value = response
    }
    
    if (response.pagination) {
      expensesPagination.value = response.pagination
    }
    
    // Save summary for display - directly from response
    if (response.summary) {
      console.log('Found summary in response:', response.summary)
      // Create new object to ensure reactivity
      expensesSummary.value = Object.assign({}, {
        expenses_count: Number(response.summary.expenses_count) || 0,
        paid_expenses_count: Number(response.summary.paid_expenses_count) || 0,
        unpaid_expenses_count: Number(response.summary.unpaid_expenses_count) || 0,
        total_expenses_amount: Number(response.summary.total_expenses_amount) || 0,
        total_paid_amount: Number(response.summary.total_paid_amount) || 0,
        total_unpaid_amount: Number(response.summary.total_unpaid_amount) || 0
      })
      console.log('expensesSummary.value is now:', expensesSummary.value)
    } else {
      console.log('NO SUMMARY FOUND in response')
    }
  } catch (error) {
    console.error('Failed to load expenses:', error)
    showSnackbar(t('errors.fetchFailed'), 'error')
  } finally {
    loadingExpenses.value = false
  }
}

let searchTimeout = null
function debouncedLoadExpenses() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    expensesPagination.value.current_page = 1
    loadExpenses()
  }, 300)
}

function onExpensePageChange(page) {
  expensesPagination.value.current_page = page
  loadExpenses()
}

function onExpenseItemsPerPageChange(itemsPerPage) {
  expensesPagination.value.per_page = itemsPerPage
  expensesPagination.value.current_page = 1
  loadExpenses()
}

function openExpenseDialog(expense = null) {
  editingExpense.value = expense
  if (expense) {
    expenseData.value = {
      name: expense.name,
      quantity: expense.quantity,
      price: expense.price,
      clinic_expense_category_id: expense.category?.id || expense.clinic_expense_category_id,
      date: expense.date,
      is_paid: expense.is_paid,
      doctor_id: expense.doctor?.id || expense.doctor_id
    }
  } else {
    expenseData.value = {
      name: '',
      quantity: 1,
      price: 0,
      clinic_expense_category_id: selectedCategory.value?.id || null,
      date: formatDateISO(new Date()),
      is_paid: false,
      doctor_id: null
    }
  }
  expenseDialog.value = true
}

function closeExpenseDialog() {
  expenseDialog.value = false
  editingExpense.value = null
  expenseForm.value?.reset()
}

async function saveExpense() {
  if (!expenseFormValid.value) return
  
  savingExpense.value = true
  try {
    const payload = {
      ...expenseData.value,
      clinic_id: authStore.clinicInfo?.id || 1
    }
    
    if (editingExpense.value) {
      await expenseService.updateExpense(editingExpense.value.id, payload)
      showSnackbar(t('expenses.expenseUpdated'))
    } else {
      await expenseService.createExpense(payload)
      showSnackbar(t('expenses.expenseCreated'))
    }
    
    closeExpenseDialog()
    loadExpenses()
    loadCategories()
    loadStatistics()
  } catch (error) {
    console.error('Failed to save expense:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingExpense.value = false
  }
}

function confirmDeleteExpense(expense) {
  expenseToDelete.value = expense
  deleteExpenseDialog.value = true
}

async function deleteExpense() {
  if (!expenseToDelete.value) return
  
  deletingExpense.value = true
  try {
    await expenseService.deleteExpense(expenseToDelete.value.id)
    showSnackbar(t('expenses.expenseDeleted'))
    deleteExpenseDialog.value = false
    expenseToDelete.value = null
    loadExpenses()
    loadCategories()
    loadStatistics()
  } catch (error) {
    console.error('Failed to delete expense:', error)
    showSnackbar(error.response?.data?.message || t('errors.deleteFailed'), 'error')
  } finally {
    deletingExpense.value = false
  }
}

async function togglePaymentStatus(expense) {
  expense.loading = true
  try {
    if (expense.is_paid) {
      await expenseService.markAsUnpaid(expense.id)
      expense.is_paid = false
      showSnackbar(t('expenses.markedAsUnpaid'))
    } else {
      await expenseService.markAsPaid(expense.id)
      expense.is_paid = true
      showSnackbar(t('expenses.markedAsPaid'))
    }
    // Reload expenses to update summary
    loadExpenses()
    loadCategories()
    loadStatistics()
  } catch (error) {
    console.error('Failed to toggle payment status:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    expense.loading = false
  }
}

// ==================== Statistics ====================
async function loadStatistics() {
  // Calculate statistics from categories data instead of separate API call
  const stats = {
    total_amount: 0,
    total_expenses: 0,
    paid_amount: 0,
    paid_count: 0,
    unpaid_amount: 0,
    unpaid_count: 0
  }
  
  categories.value.forEach(category => {
    stats.total_amount += Number(category.total_expenses_amount) || 0
    stats.total_expenses += Number(category.expenses_count) || 0
    stats.paid_amount += Number(category.total_paid_amount) || 0
    stats.paid_count += Number(category.paid_expenses_count) || 0
    stats.unpaid_amount += Number(category.total_unpaid_amount) || 0
    stats.unpaid_count += Number(category.unpaid_expenses_count) || 0
  })
  
  statistics.value = stats
  console.log('Calculated statistics:', statistics.value)
}

// ==================== Doctors ====================
async function loadDoctors() {
  try {
    const response = await reservationService.getDoctors()
    if (Array.isArray(response)) {
      doctors.value = response
    } else if (response.data) {
      doctors.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      doctors.value = []
    }
  } catch (error) {
    console.error('Failed to load doctors:', error)
    doctors.value = []
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadCategories() // This will also load statistics
  loadDoctors()
})
</script>

<style scoped>
.expenses-page {
  padding: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  min-width: 0;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.category-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-card.selected {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3);
}

.category-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Mobile Responsive */
@media (max-width: 960px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .expenses-page {
    padding: 8px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

/* Data table mobile styles */
@media (max-width: 600px) {
  :deep(.v-data-table td) {
    text-align: left !important;
  }
}
</style>
