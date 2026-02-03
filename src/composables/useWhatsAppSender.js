/**
 * WhatsApp Sender Composable
 * Shared composable for sending images via WhatsApp
 * Reusable for bills, patient ID cards, and other features
 * 
 * @author SmartClinic
 * @version 1.0.0
 */

import { ref } from 'vue'
import api from '@/services/api'

export function useWhatsAppSender() {
  const isSending = ref(false)
  const error = ref(null)

  /**
   * Format phone number for WhatsApp (Iraq format)
   * @param {string} phone - Raw phone number
   * @returns {string} - Formatted phone number with country code
   */
  const formatPhoneNumber = (phone) => {
    if (!phone) return null
    
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '')
    
    // Remove leading zero if present
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1)
    }
    
    // Add Iraq country code if not present
    if (!cleanPhone.startsWith('964')) {
      cleanPhone = '964' + cleanPhone
    }
    
    return cleanPhone
  }

  /**
   * Convert base64 data URL to Blob
   * @param {string} dataUrl - Base64 data URL
   * @returns {Promise<Blob>} - Image blob
   */
  const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl)
    return response.blob()
  }

  /**
   * Upload image to backend and get public URL
   * @param {Blob} blob - Image blob
   * @param {string} filename - Filename for the image
   * @returns {Promise<string>} - Public image URL
   */
  const uploadImage = async (blob, filename = 'image.png') => {
    const formData = new FormData()
    formData.append('image', blob, filename)
    
    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data?.url || response.url
  }

  /**
   * Copy image to clipboard (if supported)
   * @param {Blob} blob - Image blob
   * @returns {Promise<boolean>} - Success status
   */
  const copyImageToClipboard = async (blob) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      return true
    } catch (err) {
      console.log('Clipboard not supported:', err)
      return false
    }
  }

  /**
   * Open WhatsApp with pre-filled message
   * @param {string} phone - Formatted phone number
   * @param {string} message - Message to send (URL encoded)
   */
  const openWhatsApp = (phone, message = '') => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  /**
   * Send image via WhatsApp using clipboard method
   * @param {Object} options - Send options
   * @param {string} options.dataUrl - Base64 image data URL
   * @param {string} options.phone - Patient phone number
   * @param {string} options.message - Optional message text
   * @param {string} options.filename - Filename for downloaded image
   * @returns {Promise<Object>} - Result with success status
   */
  const sendViaClipboard = async ({ dataUrl, phone, message = '', filename = 'image.png' }) => {
    isSending.value = true
    error.value = null

    try {
      if (!phone) {
        throw new Error('NO_PHONE')
      }

      const formattedPhone = formatPhoneNumber(phone)
      const blob = await dataUrlToBlob(dataUrl)

      // Try to copy to clipboard
      const copied = await copyImageToClipboard(blob)

      if (!copied) {
        // Fallback: download the image
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      // Open WhatsApp
      openWhatsApp(formattedPhone, message)

      return {
        success: true,
        method: copied ? 'clipboard' : 'download'
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isSending.value = false
    }
  }

  /**
   * Send image via WhatsApp using upload method
   * Uploads image to server and sends URL in WhatsApp message
   * @param {Object} options - Send options
   * @param {string} options.dataUrl - Base64 image data URL
   * @param {string} options.phone - Patient phone number
   * @param {string} options.messagePrefix - Message prefix before image URL
   * @param {string} options.filename - Filename for upload
   * @returns {Promise<Object>} - Result with success status and image URL
   */
  const sendViaUpload = async ({ dataUrl, phone, messagePrefix = '', filename = 'image.png' }) => {
    isSending.value = true
    error.value = null

    try {
      if (!phone) {
        throw new Error('NO_PHONE')
      }

      const formattedPhone = formatPhoneNumber(phone)
      const blob = await dataUrlToBlob(dataUrl)

      // Upload image to server
      const imageUrl = await uploadImage(blob, filename)

      // Compose message with image URL
      const message = messagePrefix ? `${messagePrefix}\n${imageUrl}` : imageUrl

      // Open WhatsApp with message
      openWhatsApp(formattedPhone, message)

      return {
        success: true,
        method: 'upload',
        imageUrl
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isSending.value = false
    }
  }

  /**
   * Check if phone number is valid
   * @param {string} phone - Phone number to check
   * @returns {boolean}
   */
  const isValidPhone = (phone) => {
    if (!phone) return false
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10
  }

  return {
    isSending,
    error,
    formatPhoneNumber,
    dataUrlToBlob,
    copyImageToClipboard,
    openWhatsApp,
    sendViaClipboard,
    sendViaUpload,
    isValidPhone
  }
}
