// Shared helpers for note/case image attachments (drag & drop, paste, file picker).

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const isSupportedImage = (file) => !!file && SUPPORTED_IMAGE_TYPES.includes(file.type)

// Works for both drag/drop (DataTransfer) and clipboard paste (DataTransfer-like
// clipboardData) — pasted images usually only populate `items`, not `files`.
export const extractImageFiles = (transfer) => {
  if (!transfer) return []

  const fromFiles = transfer.files ? Array.from(transfer.files) : []
  if (fromFiles.length) return fromFiles.filter(isSupportedImage)

  const items = transfer.items ? Array.from(transfer.items) : []
  return items
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter(isSupportedImage)
}

export const makeImageKey = () => `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Shrinks a photo to fit maxSize px as a JPEG before upload - phone camera photos
// easily pass the API's 5 MB limit. Falls back to the original if it can't be decoded.
export const downscaleImage = (file, maxSize = 800, quality = 0.85) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff' // transparent PNG areas would turn black in a JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })

// Subset of the backend's /images `type` enum that's relevant to a clinical
// case note (profile/prescription are used elsewhere in the app, not here).
export const noteImageTypeOptions = [
  { value: 'before', label: 'قبل', icon: 'mdi-image-outline' },
  { value: 'after', label: 'بعد', icon: 'mdi-image-check-outline' },
  { value: 'xray', label: 'أشعة', icon: 'mdi-radiology-box-outline' },
  { value: 'treatment', label: 'علاج', icon: 'mdi-medical-bag' },
  { value: 'document', label: 'مستند', icon: 'mdi-file-document-outline' },
  { value: 'other', label: 'أخرى', icon: 'mdi-image-multiple-outline' },
]

export const noteImageTypeMeta = (type) =>
  noteImageTypeOptions.find((opt) => opt.value === type) || null
