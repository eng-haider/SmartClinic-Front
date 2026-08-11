// The backend's polymorphic /images endpoint only accepts Patient, Case,
// User, Reservation or Recipe as imageable_type — there's no way to attach
// an image directly to a Note. So note images are uploaded against the
// Case instead, and the note "remembers" which of the case's images are its
// own via a hidden tag line appended to its content, e.g.:
//   ...free text...
//   [images:12,13]
// This file builds/reads that tag; utils/orthoNote.js handles the separate
// [تقويم] quick-fields tag that may also be present on the same note.

const IMAGE_TAG_PREFIX = '[images:'
const IMAGE_TAG_SUFFIX = ']'

export const buildImageTag = (imageIds = []) => {
  if (!imageIds.length) return ''
  return `${IMAGE_TAG_PREFIX}${imageIds.join(',')}${IMAGE_TAG_SUFFIX}`
}

// Strips the tag line (wherever it is) out of `content` and returns the ids.
export const parseImageTag = (content) => {
  if (!content) return { text: '', imageIds: [] }

  const lines = content.split('\n')
  const tagIdx = lines.findIndex((l) => l.trim().startsWith(IMAGE_TAG_PREFIX))
  if (tagIdx === -1) return { text: content, imageIds: [] }

  const tagLine = lines[tagIdx].trim()
  const inner = tagLine.slice(
    IMAGE_TAG_PREFIX.length,
    tagLine.endsWith(IMAGE_TAG_SUFFIX) ? -IMAGE_TAG_SUFFIX.length : undefined
  )
  const imageIds = inner
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))

  const text = lines.filter((_, i) => i !== tagIdx).join('\n').trim()
  return { text, imageIds }
}

// Rebuilds `content` with a fresh tag line reflecting `imageIds` (any
// previous tag line is dropped first).
export const setImageTag = (content, imageIds) => {
  const { text } = parseImageTag(content)
  const tag = buildImageTag(imageIds)
  return [text, tag].filter(Boolean).join('\n')
}
