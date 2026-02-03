/**
 * Card Image Export Composable
 * Handles converting DOM elements to images, downloading, and printing
 * Optimized for ID cards and similar printable content
 * 
 * @author SmartClinic
 * @version 1.0.0
 */

import { ref } from 'vue'

export function useCardImageExport() {
  const isExporting = ref(false)
  const isPrinting = ref(false)
  const error = ref(null)

  /**
   * Wait for all fonts to load
   * @returns {Promise<void>}
   */
  const waitForFonts = async () => {
    await document.fonts.ready
    // Additional delay for font rendering
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  /**
   * Convert DOM element to PNG data URL
   * Uses dom-to-image-more for better Arabic/RTL support
   * @param {HTMLElement} element - DOM element to convert
   * @param {Object} options - Export options
   * @param {number} options.scale - Scale factor for high resolution (default: 3)
   * @param {string} options.bgcolor - Background color (default: #ffffff)
   * @returns {Promise<string>} - Base64 PNG data URL
   */
  const elementToDataUrl = async (element, options = {}) => {
    if (!element) {
      throw new Error('Element is required')
    }

    isExporting.value = true
    error.value = null

    try {
      // Wait for fonts to load
      await waitForFonts()

      // Dynamically import dom-to-image-more
      const domtoimage = await import('dom-to-image-more')

      const { scale = 3, bgcolor = '#ffffff' } = options

      // Get element dimensions
      const rect = element.getBoundingClientRect()

      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor,
        width: rect.width * scale,
        height: rect.height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${rect.width}px`,
          height: `${rect.height}px`
        }
      })

      return dataUrl
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Convert DOM element to Blob
   * @param {HTMLElement} element - DOM element to convert
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - PNG blob
   */
  const elementToBlob = async (element, options = {}) => {
    const dataUrl = await elementToDataUrl(element, options)
    const response = await fetch(dataUrl)
    return response.blob()
  }

  /**
   * Download element as PNG image
   * @param {HTMLElement} element - DOM element to convert
   * @param {string} filename - Download filename
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  const downloadAsImage = async (element, filename = 'image.png', options = {}) => {
    isExporting.value = true
    error.value = null

    try {
      const dataUrl = await elementToDataUrl(element, options)

      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Print element as ID card
   * Opens a new window with print-optimized layout
   * @param {HTMLElement} element - DOM element to print
   * @param {Object} options - Print options
   * @param {string} options.title - Page title
   * @param {boolean} options.isRtl - Right-to-left direction
   * @returns {Promise<void>}
   */
  const printElement = async (element, options = {}) => {
    isPrinting.value = true
    error.value = null

    try {
      const { title = 'Patient ID Card', isRtl = false } = options

      // Convert element to image for consistent printing
      const dataUrl = await elementToDataUrl(element, { scale: 4 })

      const printWindow = window.open('', '_blank', 'width=400,height=300')
      if (!printWindow) {
        throw new Error('POPUP_BLOCKED')
      }

      const direction = isRtl ? 'rtl' : 'ltr'

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${direction}">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: 85.6mm 54mm;
              margin: 0;
            }
            
            body {
              width: 85.6mm;
              height: 54mm;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
            }
            
            .card-image {
              width: 85.6mm;
              height: 54mm;
              object-fit: contain;
            }
            
            @media print {
              body {
                width: 85.6mm;
                height: 54mm;
              }
              
              .card-image {
                width: 100%;
                height: 100%;
              }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" class="card-image" alt="Patient ID Card" />
        </body>
        </html>
      `)

      printWindow.document.close()

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isPrinting.value = false
    }
  }

  /**
   * Generate HTML for ID card printing (without image conversion)
   * For cases where direct HTML printing is preferred
   * @param {Object} cardData - Card content data
   * @param {Object} options - Print options
   * @returns {string} - HTML string
   */
  const generatePrintHtml = (cardData, options = {}) => {
    const { isRtl = false, title = 'Patient ID Card' } = options
    const direction = isRtl ? 'rtl' : 'ltr'
    const fontFamily = isRtl 
      ? "'Cairo', 'Tajawal', 'Arial', sans-serif" 
      : "'Segoe UI', 'Arial', sans-serif"

    return `
      <!DOCTYPE html>
      <html dir="${direction}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          
          body {
            font-family: ${fontFamily};
            direction: ${direction};
            width: 85.6mm;
            height: 54mm;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          
          .id-card {
            width: 85.6mm;
            height: 54mm;
            padding: 4mm;
            border: 0.5mm solid #e0e0e0;
            border-radius: 2mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            background: white;
          }
          
          .clinic-name {
            font-size: 4mm;
            font-weight: 700;
            color: #1976d2;
            text-align: center;
          }
          
          .patient-name {
            font-size: 3.5mm;
            font-weight: 600;
            color: #333;
            text-align: center;
            word-wrap: break-word;
            max-width: 77mm;
          }
          
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .qr-code img {
            width: 25mm;
            height: 25mm;
          }
          
          .qr-text {
            font-size: 2mm;
            color: #666;
            text-align: center;
            margin-top: 1mm;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="id-card">
          <div class="clinic-name">${cardData.clinicName}</div>
          <div class="patient-name">${cardData.patientName}</div>
          <div class="qr-container">
            <div class="qr-code">
              <img src="${cardData.qrDataUrl}" alt="QR Code" />
            </div>
            <div class="qr-text">${cardData.scanText}</div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  return {
    isExporting,
    isPrinting,
    error,
    elementToDataUrl,
    elementToBlob,
    downloadAsImage,
    printElement,
    generatePrintHtml,
    waitForFonts
  }
}
