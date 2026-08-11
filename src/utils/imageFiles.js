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
