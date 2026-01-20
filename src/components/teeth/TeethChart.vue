<template>
  <div class="teeth-chart" :class="{ 'rtl': isRtl }">
    <!-- SVG Teeth Diagram -->
    <div class="svg-container" ref="svgContainer">
      <!-- Upper Teeth Numbers Overlay -->
      <div class="teeth-numbers-overlay upper-overlay">
        <div
          v-for="(tooth, index) in upperTeeth"
          :key="'upper-num-' + tooth.tooth_num"
          class="tooth-number-item upper"
          :style="{ left: getToothPosition(tooth)-3 + '%' }"
        >
          <div
            :data-tooth-index="index"
            :data-tooth-number="tooth.tooth_num"
            class="tooth-number"
            :class="{ 'active': isToothActive(tooth.tooth_num), 'has-case': hasExistingCase(tooth.tooth_num) }"
            @click="handleToothClick(tooth.tooth_num)"
          >
            {{ tooth.tooth_num }}
          </div>
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="tooltip-trigger"></span>
            </template>
            {{ t('teeth.tooth') }} {{ tooth.tooth_num }}
          </v-tooltip>
          <div class="dotted-line"></div>
        </div>
      </div>

      <svg
        viewBox="0 0 1792 539"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        class="teeth-svg"
      >
        <g v-for="tooth in teeth" :key="tooth.id" class="tooth-group">
          <!-- Tooth Number Label at Top -->
        
          <g
            v-for="part in tooth.parts"
            :key="`${tooth.id}-${part.id}`"
            class="tooth-part-group"
            @click.stop="handlePartClick(tooth, part, $event)"
            @contextmenu.prevent="handleContextMenu(tooth, $event)"
            @touchstart="handleTouchStart(tooth, part, $event)"
            @touchend="handleTouchEnd(tooth, $event)"
          >
            <path
              :d="extractPathData(part.svg)"
              :fill="getPartColor(tooth.id, part.id)"
              :stroke="getPartStroke(tooth.id, part.id)"
              stroke-width="1"
              class="tooth-path"
              :class="{ 'clickable': tooth.tooth_num }"
            />
          </g>
        </g>
      </svg>

      <!-- Lower Teeth Numbers Overlay -->
      <div class="teeth-numbers-overlay lower-overlay">
        <div
          v-for="(tooth, index) in lowerTeeth"
          :key="'lower-num-' + tooth.tooth_num"
          class="tooth-number-item lower"
          :style="{ left: getToothPosition(tooth) + '%' }"
        >
          <div class="dotted-line"></div>
          <div
            :data-tooth-index="index"
            :data-tooth-number="tooth.tooth_num"
            class="tooth-number"
            :class="{ 'active': isToothActive(tooth.tooth_num), 'has-case': hasExistingCase(tooth.tooth_num) }"
            @click="handleToothClick(tooth.tooth_num)"
          >
            {{ tooth.tooth_num }}
          </div>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="tooltip-trigger"></span>
            </template>
            {{ t('teeth.tooth') }} {{ tooth.tooth_num }}
          </v-tooltip>
        </div>
      </div>
    </div>

    <!-- Color Picker -->
    <div class="color-picker" v-if="showColorPicker">
      <div class="color-picker-header">
        <v-icon size="18">mdi-palette</v-icon>
        <span>{{ t('teeth.selectColor') }}</span>
      </div>
      <div class="colors-grid">
        <button
          v-for="color in availableColors"
          :key="color.value"
          class="color-btn"
          :class="{ 'selected': selectedColor === color.value }"
          :style="{ backgroundColor: color.value }"
          @click="selectColor(color.value)"
          :title="color.name"
        />
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="menu-backdrop"
        @click="hideContextMenu"
      />
      <div
        v-if="contextMenu.visible"
        class="tooth-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <!-- Header -->
        <div class="menu-header">
          <div class="tooth-info">
            <v-icon color="primary">mdi-tooth</v-icon>
            <span>{{ t('teeth.tooth') }} {{ contextMenu.toothNum }}</span>
          </div>
          <v-btn
            icon
            size="x-small"
            variant="text"
            class="close-btn"
            @click="hideContextMenu"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Search -->
        <div class="search-section">
          <v-text-field
            v-model="categorySearchTerm"
            :placeholder="t('teeth.searchCategory')"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            hide-details
            class="category-search"
            @input="filterCategories"
          />
        </div>

        <!-- Categories Grid -->
        <div class="quick-categories">
          <div class="section-title">
            <v-icon size="16" class="me-1">mdi-tag-multiple</v-icon>
            {{ t('teeth.categories') }}
          </div>
          <div class="categories-grid">
            <v-chip
              v-for="category in filteredCategories"
              :key="category.id"
              class="category-chip"
              size="small"
              variant="outlined"
              @click="selectCategory(category)"
            >
              {{ getCategoryName(category) }}
            </v-chip>
          </div>
        </div>

        <!-- Remove Button -->
        <div class="remove-section" v-if="isToothActive(contextMenu.toothNum)">
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            block
            @click="removeCategory"
          >
            <v-icon start>mdi-delete</v-icon>
            {{ t('teeth.removeCategory') }}
          </v-btn>
        </div>
      </div>
    </Teleport>

    <!-- Toast Notification -->
    <v-snackbar v-model="showToast" :timeout="2000" color="success">
      {{ toastMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRtl } from 'vuetify'
import { teethData } from './teethData'

// Props
const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  patientCases: {
    type: Array,
    default: () => []
  },
  patientData: {
    type: Object,
    default: () => ({})
  },
  showColorPicker: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['case-added', 'case-removed', 'color-changed', 'tooth-selected'])

// Composables
const { t, locale } = useI18n()
const { isRtl } = useRtl()

// State
const svgContainer = ref(null)
const teeth = ref(teethData)
const selectedColor = ref('#FF5252')
const coloredParts = ref([])
const selectedCases = ref([])
const toothCategories = ref(new Map())
const showToast = ref(false)
const toastMessage = ref('')
const categorySearchTerm = ref('')

// Context Menu State
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  toothNum: null,
  toothId: null
})

// Touch handling
const lastTouchTime = ref(0)
const lastTouchedTooth = ref(null)
const touchTimeout = ref(null)

// Teeth Numbers
const topTeethNumbers = [28, 27, 26, 25, 24, 23, 22, 21, 11, 12, 13, 14, 15, 16, 17, 18]
const bottomTeethNumbers = [38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48]

// Available Colors
const availableColors = [
  { name: 'Red', value: '#FF5252' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Purple', value: '#9C27B0' }
]

// Computed - Upper Teeth (11-28)
const upperTeeth = computed(() => {
  return teeth.value.filter(t => t.tooth_num >= 11 && t.tooth_num <= 28)
    .sort((a, b) => {
      // Sort: 28,27,26,25,24,23,22,21 then 11,12,13,14,15,16,17,18
      if (a.tooth_num >= 21 && b.tooth_num >= 21) return b.tooth_num - a.tooth_num
      if (a.tooth_num <= 18 && b.tooth_num <= 18) return a.tooth_num - b.tooth_num
      return b.tooth_num - a.tooth_num
    })
})

// Computed - Lower Teeth (31-48)
const lowerTeeth = computed(() => {
  return teeth.value.filter(t => t.tooth_num >= 31 && t.tooth_num <= 48)
    .sort((a, b) => {
      // Sort: 38,37,36,35,34,33,32,31 then 41,42,43,44,45,46,47,48
      if (a.tooth_num >= 31 && a.tooth_num <= 38 && b.tooth_num >= 31 && b.tooth_num <= 38) {
        return b.tooth_num - a.tooth_num
      }
      if (a.tooth_num >= 41 && b.tooth_num >= 41) return a.tooth_num - b.tooth_num
      return a.tooth_num < 41 ? -1 : 1
    })
})

// Computed
const filteredCategories = computed(() => {
  if (!categorySearchTerm.value) {
    return props.categories
  }
  const search = categorySearchTerm.value.toLowerCase()
  return props.categories.filter(cat => {
    const name = getCategoryName(cat).toLowerCase()
    return name.includes(search)
  })
})

// Methods
function getCategoryName(category) {
  if (typeof category === 'string') return category
  if (locale.value === 'ar') return category.name_ar || category.name || ''
  if (locale.value === 'ku') return category.name_ku || category.name || ''
  return category.name_en || category.name || ''
}

function extractPathData(svgString) {
  const match = svgString.match(/d="([^"]+)"/)
  return match ? match[1] : ''
}

// Calculate tooth position as percentage for overlay positioning
function getToothPosition(tooth) {
  if (!tooth.parts || !tooth.parts.length) return 0
  
  const centerX = getToothCenterX(tooth)
  // SVG viewBox is 0 0 1792 539, so convert to percentage
  return (centerX / 1792) * 100
}

// Calculate center X position of a tooth based on its paths
function getToothCenterX(tooth) {
  if (!tooth.parts || !tooth.parts.length) return 0
  
  let minX = Infinity
  let maxX = -Infinity
  
  tooth.parts.forEach(part => {
    const pathData = extractPathData(part.svg)
    // Extract all X coordinates from path
    const coords = pathData.match(/[\d.]+/g)
    if (coords) {
      for (let i = 0; i < coords.length; i += 2) {
        const x = parseFloat(coords[i])
        if (!isNaN(x)) {
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
        }
      }
    }
  })
  
  return (minX + maxX) / 2
}

// Calculate Y position for tooth label (above or below the tooth)
function getToothLabelY(tooth) {
  if (!tooth.parts || !tooth.parts.length) return 0
  
  const toothNum = tooth.tooth_num
  const isUpperTooth = (toothNum >= 11 && toothNum <= 28)
  
  let minY = Infinity
  let maxY = -Infinity
  
  tooth.parts.forEach(part => {
    const pathData = extractPathData(part.svg)
    // Extract all Y coordinates from path
    const coords = pathData.match(/[\d.]+/g)
    if (coords) {
      for (let i = 1; i < coords.length; i += 2) {
        const y = parseFloat(coords[i])
        if (!isNaN(y)) {
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }
  })
  
  // Upper teeth: label above (minY - offset), Lower teeth: label below (maxY + offset)
  return isUpperTooth ? minY - 10 : maxY + 20
}

function getPartColor(toothId, partId) {
  const coloredPart = coloredParts.value.find(
    p => p.toothId === toothId && p.partId === partId
  )
  return coloredPart ? coloredPart.color : 'transparent'
}

function getPartStroke(toothId, partId) {
  const coloredPart = coloredParts.value.find(
    p => p.toothId === toothId && p.partId === partId
  )
  return coloredPart ? coloredPart.color : '#1e1e1e'
}

function isToothActive(toothNum) {
  const hasManualCategory = toothCategories.value.has(`tooth-${toothNum}`) ||
    selectedCases.value.some(c => String(c.toothNum) === String(toothNum))
  const hasExisting = hasExistingCase(toothNum)
  return hasManualCategory || hasExisting
}

function hasExistingCase(toothNum) {
  if (!props.patientCases || !props.patientCases.length) return false
  return props.patientCases.some(c => {
    if (c.tooth_number && parseInt(c.tooth_number) === toothNum) return true
    if (c.tooth_num) {
      try {
        const nums = JSON.parse(c.tooth_num)
        return Array.isArray(nums) ? nums.includes(toothNum) : nums === toothNum
      } catch {
        return false
      }
    }
    return false
  })
}

function handleToothClick(toothNum) {
  emit('tooth-selected', toothNum)
}

function handlePartClick(tooth, part, event) {
  event.stopPropagation()
  if (!tooth.tooth_num) return

  const existingIndex = coloredParts.value.findIndex(
    p => p.toothId === tooth.id && p.partId === part.id
  )

  if (existingIndex !== -1) {
    coloredParts.value.splice(existingIndex, 1)
  } else {
    coloredParts.value.push({
      toothId: tooth.id,
      toothNum: tooth.tooth_num,
      partId: part.id,
      color: selectedColor.value
    })
  }

  emit('color-changed', coloredParts.value)
}

function handleContextMenu(tooth, event) {
  event.preventDefault()
  event.stopPropagation()

  if (!tooth.tooth_num) return

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    toothNum: tooth.tooth_num,
    toothId: tooth.id
  }
}

function handleTouchStart(tooth, part, event) {
  const currentTime = Date.now()
  const tapLength = currentTime - lastTouchTime.value

  if (tapLength < 500 && tapLength > 0 && lastTouchedTooth.value === tooth.tooth_num) {
    event.preventDefault()
    event.stopPropagation()

    if (touchTimeout.value) {
      clearTimeout(touchTimeout.value)
      touchTimeout.value = null
    }

    const touch = event.touches[0] || event.changedTouches[0]
    contextMenu.value = {
      visible: true,
      x: touch.clientX,
      y: touch.clientY,
      toothNum: tooth.tooth_num,
      toothId: tooth.id
    }

    lastTouchTime.value = 0
    lastTouchedTooth.value = null
  } else {
    lastTouchTime.value = currentTime
    lastTouchedTooth.value = tooth.tooth_num

    touchTimeout.value = setTimeout(() => {
      // Single tap - do nothing here, click handles it
    }, 500)
  }
}

function handleTouchEnd(tooth, event) {
  event.stopPropagation()
}

function hideContextMenu() {
  contextMenu.value.visible = false
  categorySearchTerm.value = ''
}

function selectColor(color) {
  selectedColor.value = color
}

function selectCategory(category) {
  const { toothNum, toothId } = contextMenu.value

  if (!toothNum) return

  // Remove existing category for this tooth
  selectedCases.value = selectedCases.value.filter(
    c => String(c.toothNum) !== String(toothNum)
  )
  toothCategories.value.delete(`tooth-${toothNum}`)

  // Add new case
  const newCase = {
    toothNum: String(toothNum),
    toothId,
    category,
    timestamp: Date.now()
  }

  selectedCases.value.push(newCase)
  toothCategories.value.set(`tooth-${toothNum}`, {
    toothNumber: toothNum,
    category
  })

  emit('case-added', {
    toothNumber: toothNum,
    category,
    categoryName: getCategoryName(category)
  })

  toastMessage.value = `${t('teeth.categoryAdded')} ${getCategoryName(category)} - ${t('teeth.tooth')} ${toothNum}`
  showToast.value = true

  hideContextMenu()
}

function removeCategory() {
  const { toothNum } = contextMenu.value

  if (!toothNum) return

  selectedCases.value = selectedCases.value.filter(
    c => String(c.toothNum) !== String(toothNum)
  )
  toothCategories.value.delete(`tooth-${toothNum}`)

  emit('case-removed', { toothNumber: toothNum })

  toastMessage.value = `${t('teeth.categoryRemoved')} - ${t('teeth.tooth')} ${toothNum}`
  showToast.value = true

  hideContextMenu()
}

function filterCategories() {
  // Computed property handles this
}

function loadColoredParts() {
  if (props.patientData?.tooth_parts) {
    try {
      const parts = JSON.parse(props.patientData.tooth_parts)
      if (Array.isArray(parts)) {
        coloredParts.value = parts.map(p => ({
          toothId: p.tooth_id,
          toothNum: p.tooth_number,
          partId: p.part_id,
          color: p.color
        }))
      }
    } catch (e) {
      console.error('Error loading tooth parts:', e)
    }
  }
}

// Get colored parts for saving
function getColoredParts() {
  return coloredParts.value
}

// Get selected cases
function getSelectedCases() {
  return selectedCases.value
}

// Clear all selections
function clearAll() {
  coloredParts.value = []
  selectedCases.value = []
  toothCategories.value.clear()
}

// Expose methods
defineExpose({
  getColoredParts,
  getSelectedCases,
  clearAll
})

// Watchers
watch(() => props.patientData, (newVal) => {
  if (newVal?.tooth_parts) {
    loadColoredParts()
  }
}, { immediate: true, deep: true })

watch(() => props.patientCases, () => {
  // Force re-render when cases change
}, { deep: true })

// Click outside to close menu
function handleClickOutside(event) {
  if (contextMenu.value.visible) {
    const menu = document.querySelector('.tooth-context-menu')
    if (menu && !menu.contains(event.target)) {
      hideContextMenu()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadColoredParts()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.teeth-chart {
  position: relative;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  overflow: visible;
}

.teeth-chart.rtl {
  direction: rtl;
}

/* SVG Container */
.svg-container {
  position: relative;
  width: 100%;
  overflow: visible;
  padding-top: 50px;  /* Space for upper tooth numbers */
  padding-bottom: 50px; /* Space for lower tooth numbers */
}

.teeth-svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  margin: 0 auto;
  background: white;
}

/* Teeth Numbers Overlay */
.teeth-numbers-overlay {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  pointer-events: none;
  z-index: 10;
}

.upper-overlay {
  top: 0;
  height: 50px;
  align-items: flex-end;
}

.lower-overlay {
  bottom: 0;
  height: 50px;
  align-items: flex-start;
}

/* Tooth Number Item - Positioned above/below each tooth */
.tooth-number-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: pointer;
}

.tooth-number-item.upper {
  flex-direction: column;
  bottom: 0;
}

.tooth-number-item.lower {
  flex-direction: column;
  top: 0;
}

/* Tooth Number Badge */
.tooth-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, #1976d2 0%, #2196F3 100%);
  color: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.4);
  cursor: pointer;
  z-index: 2;
}

.tooth-number:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.5);
}

.tooth-number.active {
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
}

.tooth-number.has-case {
  background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%);
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.4);
}

/* Dotted Line connecting number to tooth */
.dotted-line {
  width: 1px;
  height: 18px;
  border-left: 2px dashed #1976d2;
  opacity: 0.6;
}

.tooth-number-item.upper .dotted-line {
  margin-top: 2px;
}

.tooth-number-item.lower .dotted-line {
  margin-bottom: 2px;
}

.tooth-number.active + .dotted-line,
.dotted-line + .tooth-number.active {
  border-color: #4CAF50;
}

.tooth-number.has-case + .dotted-line,
.dotted-line + .tooth-number.has-case {
  border-color: #2196F3;
}

/* Tooltip trigger */
.tooltip-trigger {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

/* Legacy grid styles - kept for backward compatibility */
.teeth-numbers-grid {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 0;
}

.top-teeth {
  margin-bottom: 8px;
}

.bottom-teeth {
  margin-top: 8px;
}

/* Tooth Path */
.tooth-path {
  transition: all 0.2s ease;
}

.tooth-path.clickable {
  cursor: pointer;
}

.tooth-path.clickable:hover {
  opacity: 0.8;
  filter: brightness(0.95);
}

/* Tooth Number Label in SVG */
.tooth-number-label {
  font-size: 14px;
  font-weight: 700;
  fill: #1976d2;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.tooth-number-label:hover {
  fill: #1565c0;
  font-size: 16px;
}

.tooth-number-label.active {
  fill: #4CAF50;
}

.tooth-number-label.has-case {
  fill: #2196F3;
}

/* Color Picker */
.color-picker {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.color-picker-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #666;
}

.colors-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.selected {
  border-color: #333;
  box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
}

/* Context Menu Backdrop */
.menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Context Menu */
.tooth-context-menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 320px;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  overflow-y: auto;
  font-family: inherit;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 12px 12px 0 0;
}

.tooth-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1976d2;
  font-weight: 600;
  font-size: 15px;
}

.close-btn {
  background: rgba(25, 118, 210, 0.1) !important;
}

.search-section {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.quick-categories {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  max-height: 200px;
  overflow-y: auto;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 10px;
}

.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-chip {
  cursor: pointer !important;
  transition: all 0.2s ease;
}

.category-chip:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%) !important;
  transform: translateY(-2px);
}

.remove-section {
  padding: 12px;
}

/* Mobile Styles */
@media (max-width: 600px) {
  .teeth-chart {
    padding: 8px;
  }

  .tooth-number {
    min-width: 22px;
    height: 22px;
    font-size: 9px;
  }

  .dotted-line {
    height: 12px;
  }

  .teeth-numbers-overlay {
    display: none; /* Hide overlay on mobile, use grid instead */
  }

  .tooth-context-menu {
    position: fixed;
    left: 16px !important;
    right: 16px;
    top: auto !important;
    bottom: 16px;
    width: auto;
    max-height: 60vh;
    border-radius: 16px;
  }

  .menu-backdrop {
    display: block;
  }
}

@media (max-width: 480px) {
  .teeth-numbers-grid {
    gap: 2px;
  }

  .tooth-number {
    min-width: 18px;
    height: 18px;
    font-size: 8px;
  }

  .dotted-line {
    height: 10px;
  }
}

/* RTL Support */
.teeth-chart.rtl .tooth-number-item {
  transform: translateX(50%);
}
</style>
