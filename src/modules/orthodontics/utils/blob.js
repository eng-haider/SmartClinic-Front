import { orthoApi } from '../api.js'

// Object URLs for authenticated file downloads, revoked when no longer needed.
const cache = new Map()

export async function fileObjectUrl (caseId, fileId, onProgress) {
  const key = `${caseId}:${fileId}`
  if (cache.has(key)) return cache.get(key)
  const blob = await orthoApi.fileContent(caseId, fileId, onProgress)
  const url = URL.createObjectURL(blob)
  cache.set(key, url)
  return url
}

export function releaseObjectUrls (caseId) {
  for (const [key, url] of cache) {
    if (!caseId || key.startsWith(`${caseId}:`)) {
      URL.revokeObjectURL(url)
      cache.delete(key)
    }
  }
}

export function loadImage (url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image could not be loaded'))
    img.src = url
  })
}
