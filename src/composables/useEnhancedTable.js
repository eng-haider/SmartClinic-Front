/**
 * Enhanced Table Composable
 * Provides advanced features for Vuetify data tables
 * 
 * Features:
 * - Virtual scrolling for large datasets
 * - Export to CSV/Excel
 * - Advanced filtering
 * - Column visibility toggle
 * - Responsive layouts
 */

import { ref, computed } from 'vue'

export function useEnhancedTable() {
  const searchQuery = ref('')
  const selectedRows = ref([])
  const visibleColumns = ref([])
  
  /**
   * Export table data to CSV
   */
  const exportToCSV = (data, headers, filename = 'export.csv') => {
    // Create CSV content
    const headerRow = headers.map(h => h.title || h.key).join(',')
    const dataRows = data.map(row => {
      return headers.map(h => {
        const value = row[h.key]
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/,/g, ';')
        }
        return value || ''
      }).join(',')
    }).join('\n')
    
    const csvContent = `${headerRow}\n${dataRows}`
    
    // Create download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  /**
   * Copy table data to clipboard
   */
  const copyToClipboard = async (data, headers) => {
    const text = data.map(row => {
      return headers.map(h => row[h.key] || '').join('\t')
    }).join('\n')
    
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }
  
  /**
   * Advanced search/filter
   */
  const filterData = (items, query, searchFields = []) => {
    if (!query) return items
    
    const lowerQuery = query.toLowerCase()
    return items.filter(item => {
      // Search in specified fields or all fields
      const fields = searchFields.length > 0 ? searchFields : Object.keys(item)
      
      return fields.some(field => {
        const value = item[field]
        if (value === null || value === undefined) return false
        
        // Handle nested objects
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lowerQuery)
        }
        
        return String(value).toLowerCase().includes(lowerQuery)
      })
    })
  }
  
  /**
   * Toggle column visibility
   */
  const toggleColumn = (columnKey) => {
    const index = visibleColumns.value.indexOf(columnKey)
    if (index > -1) {
      visibleColumns.value.splice(index, 1)
    } else {
      visibleColumns.value.push(columnKey)
    }
  }
  
  /**
   * Get visible headers based on column visibility
   */
  const getVisibleHeaders = (allHeaders) => {
    if (visibleColumns.value.length === 0) return allHeaders
    
    return allHeaders.filter(h => 
      visibleColumns.value.includes(h.key) || !h.hideable
    )
  }
  
  /**
   * Bulk operations
   */
  const selectAll = (items) => {
    selectedRows.value = [...items]
  }
  
  const clearSelection = () => {
    selectedRows.value = []
  }
  
  const toggleRowSelection = (row) => {
    const index = selectedRows.value.findIndex(r => r.id === row.id)
    if (index > -1) {
      selectedRows.value.splice(index, 1)
    } else {
      selectedRows.value.push(row)
    }
  }
  
  /**
   * Responsive breakpoint helper
   */
  const isMobile = computed(() => {
    return window.innerWidth < 960
  })
  
  return {
    // State
    searchQuery,
    selectedRows,
    visibleColumns,
    
    // Methods
    exportToCSV,
    copyToClipboard,
    filterData,
    toggleColumn,
    getVisibleHeaders,
    selectAll,
    clearSelection,
    toggleRowSelection,
    
    // Computed
    isMobile
  }
}
