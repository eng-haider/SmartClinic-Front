<template>
  <div class="warehouse-page">
    <!-- ============ Page Header ============ -->
    <div class="page-header mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3">
        <div>
          <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0">
            <v-icon class="me-2">mdi-warehouse</v-icon>
            {{ $t('warehouse.title') }}
          </h1>
          <p class="text-caption text-medium-emphasis ma-0 mt-1">{{ $t('warehouse.subtitle') }}</p>
        </div>

        <div class="d-flex ga-2">
          <!-- Hidden per request; kit management still reachable via code if re-enabled. -->
          <v-btn
            v-if="false"
            color="secondary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-clipboard-list-outline"
            @click="openKitDialog()"
          >
            {{ $t('warehouse.manageKit') }}
          </v-btn>
          <v-btn
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            @click="openItemDialog()"
          >
            {{ $t('warehouse.addItem') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ============ Statistics Cards ============ -->
    <div class="stats-row mb-4">
      <v-card class="stat-card" color="primary" variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="primary" size="48"><v-icon color="white">mdi-package-variant-closed</v-icon></v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('warehouse.totalItems') }}</div>
            <div class="text-h5 font-weight-bold">{{ stats.totalItems }}</div>
            <div class="text-caption">{{ $t('warehouse.items') }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" color="warning" variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="warning" size="48"><v-icon color="white">mdi-alert-circle</v-icon></v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('warehouse.lowStockItems') }}</div>
            <div class="text-h5 font-weight-bold text-warning">{{ stats.lowStock }}</div>
            <div class="text-caption">{{ $t('warehouse.items') }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" color="error" variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="error" size="48"><v-icon color="white">mdi-package-variant-remove</v-icon></v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('warehouse.outOfStockItems') }}</div>
            <div class="text-h5 font-weight-bold text-error">{{ stats.outOfStock }}</div>
            <div class="text-caption">{{ $t('warehouse.items') }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" color="success" variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center ga-3">
          <v-avatar color="success" size="48"><v-icon color="white">mdi-cash</v-icon></v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('warehouse.stockValue') }}</div>
            <div class="text-h5 font-weight-bold text-success">{{ formatCurrency(stats.stockValue) }}</div>
            <div class="text-caption">{{ $t('warehouse.currentStock') }}</div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- ============ Items Card ============ -->
    <v-card elevation="2" rounded="xl">
      <v-card-title class="d-flex flex-wrap align-center justify-space-between pa-4 ga-2">
        <span class="text-h6">
          <v-icon class="me-2">mdi-format-list-bulleted</v-icon>
          {{ $t('warehouse.title') }}
          <v-chip size="small" color="primary" variant="flat" class="ms-1">{{ pagination.total || 0 }}</v-chip>
        </span>
        <v-btn icon="mdi-refresh" variant="text" size="small" :loading="loadingItems" @click="loadItems" />
      </v-card-title>

      <v-divider />

      <!-- Filters -->
      <v-card-text class="pa-4 pb-0">
        <v-row dense>
          <v-col cols="12" sm="7">
            <v-text-field
              v-model="search"
              :label="$t('warehouse.searchItems')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="debouncedLoad"
            />
          </v-col>
          <v-col cols="12" sm="5">
            <v-btn-toggle
              v-model="stockFilter"
              color="primary"
              density="comfortable"
              variant="outlined"
              divided
              mandatory
              class="w-100"
              @update:model-value="onStockFilterChange"
            >
              <v-btn value="all" class="flex-grow-1">{{ $t('warehouse.all') }}</v-btn>
              <v-btn value="low" class="flex-grow-1">
                <v-icon start size="small" color="warning">mdi-alert</v-icon>
                {{ $t('warehouse.lowStock') }}
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text class="pa-4">
        <v-progress-linear v-if="loadingItems" indeterminate color="primary" class="mb-4" />

        <!-- Empty state -->
        <div v-if="!loadingItems && items.length === 0" class="text-center py-10">
          <v-icon size="72" color="grey-lighten-1">mdi-package-variant</v-icon>
          <p class="text-grey mt-2">{{ $t('warehouse.noItems') }}</p>
          <v-btn color="primary" variant="tonal" class="mt-2" prepend-icon="mdi-plus" @click="openItemDialog()">
            {{ $t('warehouse.addFirstItem') }}
          </v-btn>
        </div>

        <!-- Items grid -->
        <div v-else class="items-grid">
          <v-card
            v-for="item in items"
            :key="item.id"
            class="item-card"
            :class="stockClass(item)"
            variant="outlined"
            rounded="lg"
          >
            <v-card-text class="pa-4">
              <!-- Top row: name + menu -->
              <div class="d-flex align-start justify-space-between mb-3">
                <h3 class="text-h6 font-weight-bold text-truncate ma-0 me-2 flex-grow-1" style="min-width:0">
                  {{ item.name }}
                </h3>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="openAssignKitDialog(item)">
                      <template #prepend><v-icon size="small">mdi-clipboard-plus-outline</v-icon></template>
                      <v-list-item-title>{{ $t('warehouse.assignToCaseType') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openTransactionsDialog(item)">
                      <template #prepend><v-icon size="small">mdi-history</v-icon></template>
                      <v-list-item-title>{{ $t('warehouse.transactionsHistory') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openAdjustDialog(item)">
                      <template #prepend><v-icon size="small">mdi-tune-variant</v-icon></template>
                      <v-list-item-title>{{ $t('warehouse.adjust') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openItemDialog(item)">
                      <template #prepend><v-icon size="small">mdi-pencil</v-icon></template>
                      <v-list-item-title>{{ $t('common.edit') }}</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click="confirmDeleteItem(item)">
                      <template #prepend><v-icon size="small" color="error">mdi-delete</v-icon></template>
                      <v-list-item-title class="text-error">{{ $t('common.delete') }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- Big, clear status -->
              <v-chip :color="stockColor(item)" size="large" variant="flat" class="mb-3 font-weight-bold">
                <v-icon start>{{ stockIcon(item) }}</v-icon>
                {{ stockLabel(item) }}
              </v-chip>

              <!-- Quantity hero -->
              <div class="d-flex align-baseline ga-2 mb-4">
                <span class="text-h3 font-weight-bold" :class="`text-${stockColor(item)}`">{{ item.quantity }}</span>
                <span class="text-subtitle-1 text-medium-emphasis">{{ item.unit || $t('warehouse.unit') }}</span>
              </div>

              <!-- Case types this item is used in -->
              <div v-if="item.case_categories?.length" class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">
                  <v-icon size="14" class="me-1">mdi-tooth-outline</v-icon>{{ $t('warehouse.usedInCaseTypes') }}
                </div>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="cc in item.case_categories"
                    :key="cc.id"
                    size="small"
                    color="primary"
                    variant="tonal"
                    closable
                    :close-label="$t('warehouse.removeFromCaseType')"
                    @click:close="confirmUnlinkCaseType(item, cc)"
                  >
                    {{ cc.name }} <span class="font-weight-bold ms-1">×{{ cc.quantity }}</span>
                  </v-chip>
                </div>
              </div>

              <!-- Primary action: add stock -->
              <v-btn
                color="success"
                variant="flat"
                size="large"
                block
                prepend-icon="mdi-truck-plus"
                @click="openRestockDialog(item)"
              >
                {{ $t('warehouse.restock') }}
              </v-btn>
            </v-card-text>
          </v-card>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="d-flex justify-center mt-4">
          <v-pagination
            v-model="pagination.current_page"
            :length="pagination.last_page"
            :total-visible="6"
            density="comfortable"
            @update:model-value="onPageChange"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- ============ Item Dialog (create / edit) ============ -->
    <v-dialog v-model="itemDialog" max-width="620" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white text-h6">
            <v-icon class="me-2" color="white">{{ editingItem ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            {{ editingItem ? $t('warehouse.editItem') : $t('warehouse.addItem') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeItemDialog" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="itemFormRef" v-model="itemFormValid">
            <v-text-field
              v-model="itemData.name"
              :label="$t('warehouse.itemName')"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-package-variant"
              class="mb-4"
            />

            <!-- Extra details only when editing; the add form stays simple (name + notes). -->
            <template v-if="editingItem">
              <v-row dense class="mb-1">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="itemData.unit"
                    :label="$t('warehouse.unit')"
                    :hint="$t('warehouse.unitHint')"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-ruler"
                    class="mb-3"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="itemData.cost_price"
                    :label="$t('warehouse.costPrice')"
                    type="number"
                    min="0"
                    step="0.01"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-currency-usd"
                    class="mb-3"
                  />
                </v-col>
              </v-row>

              <v-row dense class="mb-1">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="itemData.quantity"
                    :label="$t('warehouse.openingQuantity')"
                    :disabled="true"
                    :hint="$t('warehouse.restock') + ' / ' + $t('warehouse.adjust')"
                    persistent-hint
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-counter"
                    class="mb-3"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="itemData.min_quantity"
                    :label="$t('warehouse.minQuantity')"
                    :hint="$t('warehouse.minQuantityHint')"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-bell-alert-outline"
                    class="mb-3"
                  />
                </v-col>
              </v-row>

              <v-select
                v-model="itemData.clinic_expense_category_id"
                :items="expenseCategories"
                :label="$t('warehouse.expenseCategory')"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-tag-outline"
                clearable
                class="mb-4"
              />
            </template>

            <v-textarea
              v-model="itemData.notes"
              :label="$t('warehouse.notes')"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
              rows="2"
              auto-grow
            />
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeItemDialog">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="elevated" :loading="savingItem" :disabled="!itemFormValid" @click="saveItem">
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Restock Dialog ============ -->
    <v-dialog v-model="restockDialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-success">
          <span class="text-white text-h6">
            <v-icon class="me-2" color="white">mdi-truck-plus</v-icon>
            {{ $t('warehouse.restockItem') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="restockDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-alert v-if="activeItem" type="info" variant="tonal" density="compact" class="mb-4">
            <div class="font-weight-medium">{{ activeItem.name }}</div>
            <div class="text-caption mt-1">
              {{ $t('warehouse.currentStock') }}: <strong>{{ activeItem.quantity }} {{ activeItem.unit }}</strong>
            </div>
          </v-alert>

          <v-form ref="restockFormRef" v-model="restockFormValid">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="restockData.quantity"
                  :label="$t('warehouse.restockQuantity')"
                  :rules="[rules.required, rules.minOne]"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-plus-box"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="restockData.unit_cost"
                  :label="$t('warehouse.unitCost')"
                  :hint="$t('warehouse.unitCostHint')"
                  persistent-hint
                  type="number"
                  min="0"
                  step="0.01"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-currency-usd"
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model="restockData.date"
              :label="$t('warehouse.date')"
              type="date"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-calendar"
              class="mt-4 mb-3"
            />

            <!-- Expense category the purchase bill is recorded under -->
            <v-select
              v-model="restockData.clinic_expense_category_id"
              :items="expenseCategories"
              :label="$t('warehouse.expenseCategory')"
              :hint="$t('warehouse.restockExpenseCategoryHint')"
              persistent-hint
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-tag-outline"
              clearable
              class="mb-3"
            />

            <!-- Total preview -->
            <v-alert color="success" variant="tonal" density="compact" class="mb-2">
              <div class="d-flex justify-space-between align-center">
                <span>{{ $t('warehouse.purchaseTotal') }}:</span>
                <span class="text-h6 font-weight-bold">{{ formatCurrency(restockTotal) }}</span>
              </div>
            </v-alert>

            <v-switch
              v-model="restockData.is_paid"
              :label="$t('warehouse.markPaid')"
              color="success"
              hide-details
              inset
            />
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="restockDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="success"
            variant="elevated"
            :loading="savingRestock"
            :disabled="!restockFormValid"
            prepend-icon="mdi-check"
            @click="submitRestock"
          >
            {{ $t('warehouse.restock') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Assign To Case-Type Kit Dialog ============ -->
    <v-dialog v-model="assignKitDialog" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-secondary">
          <span class="text-white text-h6">
            <v-icon class="me-2" color="white">mdi-clipboard-plus-outline</v-icon>
            {{ $t('warehouse.assignToCaseType') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="assignKitDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-alert v-if="activeItem" type="info" variant="tonal" density="compact" class="mb-4">
            <div class="font-weight-medium">{{ activeItem.name }}</div>
            <div class="text-caption mt-1">{{ $t('warehouse.assignToCaseTypeHint') }}</div>
          </v-alert>

          <v-form ref="assignKitFormRef" v-model="assignKitFormValid">
            <v-select
              v-model="assignKitData.case_category_id"
              :items="caseCategories"
              :label="$t('warehouse.caseType')"
              :rules="[rules.required]"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-shape-outline"
              :loading="loadingAssignKit"
              class="mb-4"
              @update:model-value="onAssignCaseTypeChange"
            />

            <!-- Show when this item is already part of the selected kit -->
            <v-alert
              v-if="assignKitExisting"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-4"
              icon="mdi-link-variant"
            >
              {{ $t('warehouse.assignAlreadyLinked') }}
            </v-alert>

            <!-- Current materials already linked to the selected case type -->
            <div v-if="assignKitData.case_category_id && !loadingAssignKit" class="mb-4">
              <div class="text-caption text-medium-emphasis mb-2">
                <v-icon size="14" class="me-1">mdi-format-list-bulleted</v-icon>
                {{ $t('warehouse.currentlyLinkedItems') }} ({{ assignKitCurrentKit.length }})
              </div>

              <div v-if="assignKitCurrentKit.length" class="linked-list rounded-lg pa-1">
                <v-list density="compact" class="py-0 bg-transparent">
                  <v-list-item
                    v-for="row in assignKitCurrentKit"
                    :key="row.warehouse_item_id"
                    class="px-2"
                    :class="{ 'bg-secondary-lighten-5 rounded': row.warehouse_item_id === activeItem?.id }"
                  >
                    <template #prepend>
                      <v-icon
                        size="small"
                        :color="row.warehouse_item_id === activeItem?.id ? 'secondary' : 'grey'"
                      >
                        {{ row.warehouse_item_id === activeItem?.id ? 'mdi-arrow-right-bold' : 'mdi-package-variant-closed' }}
                      </v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ itemName(row.warehouse_item_id) }}
                      <span
                        v-if="row.warehouse_item_id === activeItem?.id"
                        class="text-caption text-secondary"
                      >({{ $t('warehouse.thisItem') }})</span>
                    </v-list-item-title>
                    <template #append>
                      <v-chip size="x-small" variant="tonal" color="primary">×{{ row.quantity }}</v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </div>

              <v-alert
                v-else
                type="info"
                variant="tonal"
                density="compact"
                icon="mdi-information-outline"
              >
                {{ $t('warehouse.noLinkedItems') }}
              </v-alert>
            </div>

            <v-text-field
              v-model.number="assignKitData.quantity"
              :label="$t('warehouse.quantityPerCase')"
              :hint="$t('warehouse.quantityPerCaseHint')"
              persistent-hint
              :rules="[rules.required, rules.minOne]"
              type="number"
              min="1"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-counter"
              :disabled="loadingAssignKit || !assignKitData.case_category_id"
            />
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="assignKitDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="secondary"
            variant="elevated"
            :loading="savingAssignKit"
            :disabled="!assignKitFormValid"
            prepend-icon="mdi-check"
            @click="submitAssignKit"
          >
            {{ assignKitExisting ? $t('warehouse.assignUpdate') : $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Adjust Dialog ============ -->
    <v-dialog v-model="adjustDialog" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4" style="background:#546E7A">
          <span class="text-white text-h6">
            <v-icon class="me-2" color="white">mdi-tune-variant</v-icon>
            {{ $t('warehouse.adjustStock') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="adjustDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-alert v-if="activeItem" type="info" variant="tonal" density="compact" class="mb-4">
            <div class="font-weight-medium">{{ activeItem.name }}</div>
            <div class="text-caption mt-1">
              {{ $t('warehouse.currentStock') }}: <strong>{{ activeItem.quantity }} {{ activeItem.unit }}</strong>
              <span v-if="adjustData.delta"> → <strong :class="adjustResultColor">{{ adjustResult }}</strong></span>
            </div>
          </v-alert>

          <v-form ref="adjustFormRef" v-model="adjustFormValid">
            <v-text-field
              v-model.number="adjustData.delta"
              :label="$t('warehouse.delta')"
              :hint="$t('warehouse.deltaHint')"
              persistent-hint
              :rules="[rules.notZero]"
              type="number"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-plus-minus-variant"
              class="mb-4"
            />
            <v-text-field
              v-model="adjustData.reason"
              :label="$t('warehouse.reason')"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-comment-text-outline"
            />
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="adjustDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="savingAdjust"
            :disabled="!adjustFormValid"
            @click="submitAdjust"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Transactions Dialog ============ -->
    <v-dialog v-model="transactionsDialog" max-width="720" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-info">
          <span class="text-white text-h6">
            <v-icon class="me-2" color="white">mdi-history</v-icon>
            {{ $t('warehouse.transactionsHistory') }} — {{ activeItem?.name }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="transactionsDialog = false" />
        </v-card-title>

        <v-card-text class="pa-0" style="max-height:60vh">
          <v-progress-linear v-if="loadingTransactions" indeterminate color="info" />

          <v-list v-if="transactions.length" lines="two">
            <template v-for="(tx, i) in transactions" :key="tx.id">
              <v-list-item>
                <template #prepend>
                  <v-avatar :color="txColor(tx)" size="40" variant="tonal">
                    <v-icon :color="txColor(tx)">{{ txIcon(tx) }}</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-medium">{{ txTypeLabel(tx) }}</span>
                    <span class="font-weight-bold" :class="tx.quantity_change >= 0 ? 'text-success' : 'text-error'">
                      {{ tx.quantity_change >= 0 ? '+' : '' }}{{ tx.quantity_change }}
                    </span>
                  </div>
                </template>
                <template #subtitle>
                  <span>{{ formatDateTime(tx.created_at) }}</span>
                  <span v-if="tx.notes"> · {{ tx.notes }}</span>
                  <span v-if="tx.doctor"> · {{ tx.doctor.name }}</span>
                </template>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ formatCurrency(tx.unit_cost) }}</span>
                </template>
              </v-list-item>
              <v-divider v-if="i < transactions.length - 1" inset />
            </template>
          </v-list>

          <div v-else-if="!loadingTransactions" class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
            <p class="text-grey mt-2">{{ $t('warehouse.noTransactions') }}</p>
          </div>
        </v-card-text>

        <v-divider v-if="txPagination.last_page > 1" />
        <v-card-actions v-if="txPagination.last_page > 1" class="justify-center pa-2">
          <v-pagination
            v-model="txPagination.current_page"
            :length="txPagination.last_page"
            :total-visible="5"
            density="comfortable"
            @update:model-value="onTxPageChange"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Category Kit Dialog ============ -->
    <v-dialog v-model="kitDialog" max-width="680" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-secondary">
          <span class="text-white text-h6">
            <v-icon class="me-2" color="white">mdi-clipboard-list-outline</v-icon>
            {{ $t('warehouse.categoryKit') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="kitDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <p class="text-caption text-medium-emphasis mb-4">{{ $t('warehouse.kitSubtitle') }}</p>

          <v-select
            v-model="kitCategoryId"
            :items="caseCategories"
            :label="$t('warehouse.selectCategory')"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-folder-outline"
            :loading="loadingKit"
            class="mb-4"
            @update:model-value="loadKit"
          />

          <template v-if="kitCategoryId">
            <v-divider class="mb-4" />

            <!-- Add row -->
            <v-row dense class="mb-2">
              <v-col cols="7">
                <v-autocomplete
                  v-model="kitNewItemId"
                  :items="availableKitItems"
                  :label="$t('warehouse.addToKit')"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-package-variant"
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  :model-value="kitNewItemQty"
                  @update:model-value="val => kitNewItemQty = sanitizeQty(val)"
                  :label="$t('warehouse.quantity')"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="2" class="d-flex">
                <v-btn
                  color="primary"
                  variant="tonal"
                  block
                  height="40"
                  :disabled="!kitNewItemId || kitNewItemQty < 1"
                  @click="addKitItem"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <!-- Kit list -->
            <v-list v-if="kitItems.length" class="rounded-lg" style="background:rgba(0,0,0,0.03)" density="compact">
              <v-list-item v-for="row in kitItems" :key="row.warehouse_item_id">
                <template #prepend>
                  <v-avatar color="secondary" size="34" variant="tonal">
                    <v-icon size="18">mdi-package-variant-closed</v-icon>
                  </v-avatar>
                </template>
                <template #title>
                  <span class="font-weight-medium">{{ itemName(row.warehouse_item_id) }}</span>
                </template>
                <template #append>
                  <div class="d-flex align-center ga-2">
                    <v-text-field
                      :model-value="row.quantity"
                      @update:model-value="val => row.quantity = sanitizeQty(val)"
                      type="number"
                      min="1"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="width:110px"
                      :dir="'ltr'"
                    />
                    <span class="text-caption text-grey" style="white-space:nowrap">{{ $t('warehouse.perCase') }}</span>
                    <v-btn icon="mdi-delete" color="error" size="x-small" variant="text" @click="removeKitItem(row)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center py-6 text-grey">
              <v-icon size="48" color="grey-lighten-1">mdi-clipboard-text-off-outline</v-icon>
              <p class="mt-2">{{ $t('warehouse.kitEmpty') }}</p>
            </div>
          </template>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="kitDialog = false">{{ $t('common.close') }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="savingKit"
            :disabled="!kitCategoryId"
            prepend-icon="mdi-content-save"
            @click="saveKit"
          >
            {{ $t('warehouse.saveKit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Delete Confirmation ============ -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">{{ $t('common.confirmDelete') }}</v-card-title>
        <v-card-text>{{ $t('warehouse.deleteItemConfirm') }}</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="elevated" :loading="deletingItem" @click="deleteItem">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Unlink Case-Type Confirmation ============ -->
    <v-dialog v-model="unlinkDialog" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">{{ $t('warehouse.removeFromCaseType') }}</v-card-title>
        <v-card-text>
          {{ $t('warehouse.removeFromCaseTypeConfirm', {
            item: unlinkTarget?.item?.name,
            caseType: unlinkTarget?.caseCategory?.name
          }) }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="unlinkDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="elevated" :loading="unlinkingCaseType" @click="unlinkCaseType">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============ Snackbar ============ -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">{{ $t('common.close') }}</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import warehouseService from '@/services/warehouse.service'
import expenseService from '@/services/expense.service'
import { getCaseCategories } from '@/services/caseCategory.service'

const { t } = useI18n()

// ==================== State ====================
const items = ref([])
const expenseCategories = ref([])
const caseCategories = ref([])
const loadingItems = ref(false)
const search = ref('')
const stockFilter = ref('all')

const PER_PAGE = 12
const pagination = ref({ total: 0, per_page: PER_PAGE, current_page: 1, last_page: 1 })

const stats = ref({ totalItems: 0, lowStock: 0, outOfStock: 0, stockValue: 0 })

// Dialog state
const itemDialog = ref(false)
const restockDialog = ref(false)
const adjustDialog = ref(false)
const transactionsDialog = ref(false)
const kitDialog = ref(false)
const assignKitDialog = ref(false)
const deleteDialog = ref(false)
const unlinkDialog = ref(false)

const editingItem = ref(null)
const activeItem = ref(null)
const itemToDelete = ref(null)
const unlinkTarget = ref(null)
const unlinkingCaseType = ref(false)

const savingItem = ref(false)
const savingRestock = ref(false)
const savingAdjust = ref(false)
const savingAssignKit = ref(false)
const deletingItem = ref(false)

const itemFormRef = ref(null)
const restockFormRef = ref(null)
const adjustFormRef = ref(null)
const assignKitFormRef = ref(null)
const itemFormValid = ref(false)
const restockFormValid = ref(false)
const adjustFormValid = ref(false)
const assignKitFormValid = ref(false)

const itemData = ref(blankItem())
const restockData = ref({ quantity: 1, unit_cost: null, date: todayISO(), is_paid: false })
const adjustData = ref({ delta: null, reason: '' })
const assignKitData = ref({ case_category_id: null, quantity: 1 })
const loadingAssignKit = ref(false)
const assignKitExisting = ref(false)
const assignKitCurrentKit = ref([])

// Transactions
const transactions = ref([])
const loadingTransactions = ref(false)
const txPagination = ref({ total: 0, per_page: 20, current_page: 1, last_page: 1 })

// Kit
const kitCategoryId = ref(null)
const kitItems = ref([])
const loadingKit = ref(false)
const savingKit = ref(false)
const kitNewItemId = ref(null)
const kitNewItemQty = ref(1)
const allItemsForKit = ref([])

const snackbar = ref({ show: false, message: '', color: 'success' })

// ==================== Rules ====================
const rules = {
  required: v => (v !== null && v !== undefined && v !== '') || t('validation.required'),
  minOne: v => v >= 1 || t('validation.minOne'),
  notZero: v => (v !== 0 && v !== null && v !== '' && v !== undefined) || t('validation.required')
}

// ==================== Computed ====================
const restockTotal = computed(() => {
  const qty = Number(restockData.value.quantity) || 0
  const cost = restockData.value.unit_cost != null && restockData.value.unit_cost !== ''
    ? Number(restockData.value.unit_cost)
    : Number(activeItem.value?.cost_price || 0)
  return qty * cost
})

const adjustResult = computed(() => {
  const current = Number(activeItem.value?.quantity || 0)
  return current + (Number(adjustData.value.delta) || 0)
})
const adjustResultColor = computed(() => (adjustResult.value < 0 ? 'text-error' : 'text-success'))

const availableKitItems = computed(() => {
  const used = new Set(kitItems.value.map(r => r.warehouse_item_id))
  return allItemsForKit.value.filter(i => !used.has(i.id))
})

// ==================== Helpers ====================
function blankItem() {
  return {
    name: '', unit: '', quantity: 0, min_quantity: 0,
    cost_price: 0, clinic_expense_category_id: null, notes: ''
  }
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'IQD',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(Number(amount) || 0)
}

function formatDateTime(str) {
  if (!str) return ''
  const d = new Date(str.replace(' ', 'T'))
  if (isNaN(d)) return str
  return d.toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// ---- Stock visual helpers ----
function isOut(item) { return Number(item.quantity) <= 0 }
function isLow(item) { return !isOut(item) && (item.is_low || Number(item.quantity) <= Number(item.min_quantity)) }
function stockColor(item) { return isOut(item) ? 'error' : isLow(item) ? 'warning' : 'success' }
function stockIcon(item) { return isOut(item) ? 'mdi-package-variant-remove' : isLow(item) ? 'mdi-alert' : 'mdi-check-circle' }
function stockLabel(item) { return isOut(item) ? t('warehouse.outOfStock') : isLow(item) ? t('warehouse.lowStock') : t('warehouse.inStock') }
function stockClass(item) { return isOut(item) ? 'is-out' : isLow(item) ? 'is-low' : '' }
function stockPercent(item) {
  const min = Number(item.min_quantity) || 0
  const qty = Number(item.quantity) || 0
  if (min <= 0) return qty > 0 ? 100 : 0
  return Math.min(100, (qty / (min * 2)) * 100)
}

// ---- Transaction helpers ----
function txColor(tx) {
  if (tx.notes === 'reversal') return 'info'
  return tx.type === 'purchase' ? 'success' : tx.type === 'consumption' ? 'error' : 'warning'
}
function txIcon(tx) {
  return tx.type === 'purchase' ? 'mdi-truck-plus' : tx.type === 'consumption' ? 'mdi-tooth-outline' : 'mdi-tune-variant'
}
function txTypeLabel(tx) {
  if (tx.notes === 'reversal') return t('warehouse.reversal')
  if (tx.type === 'purchase') return t('warehouse.purchase')
  if (tx.type === 'consumption') return t('warehouse.consumption')
  return t('warehouse.adjustment')
}

// ==================== Items ====================
async function loadItems() {
  loadingItems.value = true
  try {
    let response
    if (stockFilter.value === 'low') {
      // Dedicated low-stock endpoint (returns a plain list, no server paging).
      // Keep per_page fixed so switching back to "all" paginates correctly.
      const data = await warehouseService.getLowStock()
      items.value = applySearch(data || [])
      pagination.value = { total: items.value.length, per_page: PER_PAGE, current_page: 1, last_page: 1 }
    } else {
      const params = {
        per_page: PER_PAGE,
        page: pagination.value.current_page,
        include: 'category,caseCategories',
        sort: 'name'
      }
      if (search.value) params['filter[name]'] = search.value
      response = await warehouseService.getItems(params)
      items.value = response.data || []
      if (response.pagination) pagination.value = response.pagination
    }
    await loadStats()
  } catch (error) {
    console.error('Failed to load items:', error)
    showSnackbar(error.response?.data?.message || t('errors.fetchFailed'), 'error')
  } finally {
    loadingItems.value = false
  }
}

function applySearch(list) {
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(i => (i.name || '').toLowerCase().includes(q))
}

async function loadStats() {
  // Pull the full (unpaginated-ish) list to compute totals client-side.
  try {
    const response = await warehouseService.getItems({ per_page: 1000, include: 'category' })
    const all = response.data || []
    let low = 0, out = 0, value = 0
    for (const i of all) {
      const qty = Number(i.quantity) || 0
      if (qty <= 0) out++
      else if (i.is_low || qty <= Number(i.min_quantity)) low++
      value += qty * (Number(i.cost_price) || 0)
    }
    stats.value = { totalItems: all.length, lowStock: low, outOfStock: out, stockValue: value }
    allItemsForKit.value = all
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

let searchTimeout = null
function debouncedLoad() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.current_page = 1
    loadItems()
  }, 350)
}

function onStockFilterChange() {
  pagination.value.current_page = 1
  loadItems()
}

function onPageChange(page) {
  pagination.value.current_page = page
  loadItems()
}

function openItemDialog(item = null) {
  editingItem.value = item
  itemData.value = item
    ? {
        name: item.name,
        unit: item.unit || '',
        quantity: item.quantity,
        min_quantity: item.min_quantity || 0,
        cost_price: Number(item.cost_price) || 0,
        clinic_expense_category_id: item.clinic_expense_category_id || item.category?.id || null,
        notes: item.notes || ''
      }
    : blankItem()
  itemDialog.value = true
}

function closeItemDialog() {
  itemDialog.value = false
  editingItem.value = null
}

async function saveItem() {
  if (!itemFormValid.value) return
  savingItem.value = true
  try {
    const payload = { ...itemData.value }
    if (editingItem.value) {
      delete payload.quantity // stock only changes via restock/adjust
      await warehouseService.updateItem(editingItem.value.id, payload)
      showSnackbar(t('warehouse.itemUpdated'))
    } else {
      await warehouseService.createItem(payload)
      showSnackbar(t('warehouse.itemCreated'))
    }
    closeItemDialog()
    loadItems()
  } catch (error) {
    console.error('Failed to save item:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingItem.value = false
  }
}

function confirmDeleteItem(item) {
  itemToDelete.value = item
  deleteDialog.value = true
}

async function deleteItem() {
  if (!itemToDelete.value) return
  deletingItem.value = true
  try {
    await warehouseService.deleteItem(itemToDelete.value.id)
    showSnackbar(t('warehouse.itemDeleted'))
    deleteDialog.value = false
    itemToDelete.value = null
    loadItems()
  } catch (error) {
    console.error('Failed to delete item:', error)
    showSnackbar(error.response?.data?.message || t('errors.deleteFailed'), 'error')
  } finally {
    deletingItem.value = false
  }
}

// ==================== Restock ====================
function openRestockDialog(item) {
  activeItem.value = item
  restockData.value = {
    quantity: 1,
    unit_cost: item.cost_price != null ? Number(item.cost_price) : null,
    date: todayISO(),
    is_paid: false,
    // Default the bill to the item's own expense category; user can change it.
    clinic_expense_category_id: item.clinic_expense_category_id || item.category?.id || null
  }
  restockDialog.value = true
}

async function submitRestock() {
  if (!restockFormValid.value || !activeItem.value) return
  savingRestock.value = true
  try {
    const payload = {
      quantity: Number(restockData.value.quantity),
      is_paid: restockData.value.is_paid,
      date: restockData.value.date
    }
    if (restockData.value.unit_cost != null && restockData.value.unit_cost !== '') {
      payload.unit_cost = Number(restockData.value.unit_cost)
    }
    if (restockData.value.clinic_expense_category_id) {
      payload.clinic_expense_category_id = restockData.value.clinic_expense_category_id
    }
    await warehouseService.restock(activeItem.value.id, payload)
    showSnackbar(t('warehouse.restockSuccess'))
    restockDialog.value = false
    loadItems()
  } catch (error) {
    console.error('Failed to restock:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingRestock.value = false
  }
}

// ==================== Adjust ====================
function openAdjustDialog(item) {
  activeItem.value = item
  adjustData.value = { delta: null, reason: '' }
  adjustDialog.value = true
}

async function submitAdjust() {
  if (!adjustFormValid.value || !activeItem.value) return
  savingAdjust.value = true
  try {
    await warehouseService.adjust(activeItem.value.id, Number(adjustData.value.delta), adjustData.value.reason || null)
    showSnackbar(t('warehouse.adjustSuccess'))
    adjustDialog.value = false
    loadItems()
  } catch (error) {
    console.error('Failed to adjust:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingAdjust.value = false
  }
}

// ==================== Assign to case-type kit ====================
// Quick shortcut (from a single item card) to add this item to a case
// category's default kit. Uses the same sync endpoint as the full kit editor,
// but merges into the existing kit so other materials are never wiped out.
function openAssignKitDialog(item) {
  activeItem.value = item
  assignKitData.value = { case_category_id: null, quantity: 1 }
  assignKitExisting.value = false
  assignKitCurrentKit.value = []
  assignKitFormRef.value?.resetValidation?.()
  assignKitDialog.value = true
}

// Read the existing kit rows from any of the shapes the API may return.
function normalizeKitRows(payload) {
  const rows = Array.isArray(payload) ? payload : (payload?.data ?? [])
  return rows.map(row => ({
    warehouse_item_id: row.item?.id ?? row.warehouse_item_id ?? row.id,
    quantity: Number(row.quantity ?? row.pivot?.quantity) || 1
  }))
}

// When the case type changes, load its current kit and pre-fill the quantity
// if this item is already linked to that case type.
async function onAssignCaseTypeChange(categoryId) {
  assignKitExisting.value = false
  assignKitCurrentKit.value = []
  if (!categoryId) return
  loadingAssignKit.value = true
  try {
    // Make sure item names are available so the kit list shows real names.
    if (!allItemsForKit.value.length) await loadAllItemsForKit()
    const kit = await warehouseService.getCategoryKit(categoryId)
    assignKitCurrentKit.value = normalizeKitRows(kit)
    const found = assignKitCurrentKit.value.find(r => r.warehouse_item_id === activeItem.value?.id)
    if (found) {
      assignKitData.value.quantity = found.quantity
      assignKitExisting.value = true
    } else {
      assignKitData.value.quantity = 1
    }
  } catch (error) {
    console.error('Failed to load case-type kit:', error)
    showSnackbar(error.response?.data?.message || t('errors.fetchFailed'), 'error')
  } finally {
    loadingAssignKit.value = false
  }
}

async function submitAssignKit() {
  if (!assignKitFormValid.value || !activeItem.value || !assignKitData.value.case_category_id) return
  savingAssignKit.value = true
  try {
    const categoryId = assignKitData.value.case_category_id
    const qty = Math.max(1, Number(assignKitData.value.quantity) || 1)

    // Re-fetch the current kit at save time so we extend it rather than
    // replace it (avoids wiping other materials, and stays correct even if
    // the kit changed since the dialog opened).
    const existing = await warehouseService.getCategoryKit(categoryId)
    const merged = normalizeKitRows(existing)

    // Update this item if already in the kit, otherwise append it.
    const found = merged.find(r => r.warehouse_item_id === activeItem.value.id)
    if (found) {
      found.quantity = qty
    } else {
      merged.push({ warehouse_item_id: activeItem.value.id, quantity: qty })
    }

    await warehouseService.syncCategoryKit(categoryId, merged)
    showSnackbar(t('warehouse.assignToCaseTypeSuccess'))
    assignKitDialog.value = false
    // Refresh so the new case-type chip shows on the card without a page reload.
    loadItems()
  } catch (error) {
    console.error('Failed to assign item to case type:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingAssignKit.value = false
  }
}

// Remove this item from a case type's default kit (from the card chip ×).
function confirmUnlinkCaseType(item, caseCategory) {
  unlinkTarget.value = { item, caseCategory }
  unlinkDialog.value = true
}

async function unlinkCaseType() {
  const target = unlinkTarget.value
  if (!target) return
  unlinkingCaseType.value = true
  try {
    const categoryId = target.caseCategory.id

    // Re-fetch the kit and sync it back without this item, so the other
    // materials in the kit are preserved.
    const existing = await warehouseService.getCategoryKit(categoryId)
    const remaining = normalizeKitRows(existing)
      .filter(r => r.warehouse_item_id !== target.item.id)

    await warehouseService.syncCategoryKit(categoryId, remaining)
    showSnackbar(t('warehouse.removeFromCaseTypeSuccess'))
    unlinkDialog.value = false
    unlinkTarget.value = null
    loadItems()
  } catch (error) {
    console.error('Failed to remove item from case type:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    unlinkingCaseType.value = false
  }
}

// ==================== Transactions ====================
async function openTransactionsDialog(item) {
  activeItem.value = item
  txPagination.value.current_page = 1
  transactionsDialog.value = true
  await loadTransactions()
}

async function loadTransactions() {
  if (!activeItem.value) return
  loadingTransactions.value = true
  try {
    const response = await warehouseService.getTransactions(activeItem.value.id, {
      per_page: txPagination.value.per_page,
      page: txPagination.value.current_page
    })
    transactions.value = response.data || []
    if (response.pagination) txPagination.value = response.pagination
  } catch (error) {
    console.error('Failed to load transactions:', error)
    showSnackbar(error.response?.data?.message || t('errors.fetchFailed'), 'error')
  } finally {
    loadingTransactions.value = false
  }
}

function onTxPageChange(page) {
  txPagination.value.current_page = page
  loadTransactions()
}

// ==================== Category Kit ====================
async function openKitDialog() {
  kitCategoryId.value = null
  kitItems.value = []
  kitNewItemId.value = null
  kitNewItemQty.value = 1
  kitDialog.value = true
  // Make sure the item catalogue is available so kit rows resolve real names
  // (and the "add to kit" dropdown is populated) even before the table loads.
  if (!allItemsForKit.value.length) {
    await loadAllItemsForKit()
  }
}

// Fetch the full item catalogue used by the kit editor (names + dropdown).
async function loadAllItemsForKit() {
  try {
    const res = await warehouseService.getItems({ per_page: 1000, include: 'category' })
    allItemsForKit.value = res?.data ?? []
  } catch (e) {
    console.error('Failed to load items for kit:', e)
  }
}

async function loadKit() {
  if (!kitCategoryId.value) return
  loadingKit.value = true
  try {
    const data = await warehouseService.getCategoryKit(kitCategoryId.value)
    // Tolerate both a plain array and an envelope { data: [...] }.
    const rows = Array.isArray(data) ? data : (data?.data ?? [])
    kitItems.value = rows.map(row => ({
      warehouse_item_id: row.item?.id ?? row.warehouse_item_id ?? row.id,
      quantity: Number(row.quantity ?? row.pivot?.quantity) || 1
    }))
  } catch (error) {
    console.error('Failed to load kit:', error)
    showSnackbar(error.response?.data?.message || t('errors.fetchFailed'), 'error')
  } finally {
    loadingKit.value = false
  }
}

function itemName(id) {
  return allItemsForKit.value.find(i => i.id === id)?.name || `#${id}`
}

// Keep the quantity field editable while typing: allow an empty string so the
// user can clear and retype, otherwise coerce to a positive integer.
function sanitizeQty(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10)
  return Number.isNaN(n) ? '' : n
}

function addKitItem() {
  if (!kitNewItemId.value || kitNewItemQty.value < 1) return
  kitItems.value.push({ warehouse_item_id: kitNewItemId.value, quantity: Number(kitNewItemQty.value) })
  kitNewItemId.value = null
  kitNewItemQty.value = 1
}

function removeKitItem(row) {
  kitItems.value = kitItems.value.filter(r => r.warehouse_item_id !== row.warehouse_item_id)
}

async function saveKit() {
  if (!kitCategoryId.value) return
  savingKit.value = true
  try {
    const items = kitItems.value
      .filter(r => r.warehouse_item_id)
      // A blank quantity defaults to 1 rather than silently dropping the row.
      .map(r => ({ warehouse_item_id: r.warehouse_item_id, quantity: Math.max(1, Number(r.quantity) || 1) }))
    await warehouseService.syncCategoryKit(kitCategoryId.value, items)
    showSnackbar(t('warehouse.kitSaved'))
    kitDialog.value = false
  } catch (error) {
    console.error('Failed to save kit:', error)
    showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingKit.value = false
  }
}

// ==================== Lookups ====================
async function loadExpenseCategories() {
  try {
    const data = await expenseService.getActiveCategories()
    expenseCategories.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (e) {
    console.error('Failed to load expense categories:', e)
  }
}

async function loadCaseCategories() {
  try {
    const response = await getCaseCategories({ per_page: 200 })
    caseCategories.value = response?.data || []
  } catch (e) {
    console.error('Failed to load case categories:', e)
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadItems()
  loadExpenseCategories()
  loadCaseCategories()
})
</script>

<style scoped>
.warehouse-page {
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

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}

.item-card {
  transition: all 0.2s ease;
  border-inline-start: 4px solid rgb(var(--v-theme-success));
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.item-card.is-low {
  border-inline-start-color: rgb(var(--v-theme-warning));
}

.item-card.is-out {
  border-inline-start-color: rgb(var(--v-theme-error));
}

@media (max-width: 960px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .warehouse-page {
    padding: 8px;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }
}

/* Linked-items list inside the assign-to-case-type dialog */
.linked-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  max-height: 200px;
  overflow-y: auto;
}
</style>
