import { onBeforeUnmount, watch } from 'vue'

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
  return element
}

export function usePublicPageMeta({ title, description, noindex = false, image, canonical, structuredData }) {
  let schema = null
  let canonicalLink = null
  const apply = () => {
    document.title = title.value || 'Smart Clinic'
    const robots = noindex ? 'noindex, nofollow, noarchive' : 'index, follow'
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })

    if (description?.value) upsertMeta('meta[name="description"]', { name: 'description', content: description.value })
    if (!noindex) {
      upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title.value || 'Smart Clinic' })
      if (description?.value) upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description.value })
      if (image?.value) upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image.value })
      if (image?.value) upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
      if (canonical?.value) {
        canonicalLink = document.head.querySelector('link[rel="canonical"]')
        if (!canonicalLink) {
          canonicalLink = document.createElement('link')
          canonicalLink.rel = 'canonical'
          document.head.appendChild(canonicalLink)
        }
        canonicalLink.href = canonical.value
      }
    }
    if (structuredData?.value) {
      if (!schema) {
        schema = document.createElement('script')
        schema.type = 'application/ld+json'
        schema.dataset.publicPageSchema = 'true'
        document.head.appendChild(schema)
      }
      schema.textContent = JSON.stringify(structuredData.value)
    }
  }

  watch([title, description || { value: '' }, image || { value: '' }, canonical || { value: '' }, structuredData || { value: null }], apply, { immediate: true })
  onBeforeUnmount(() => {
    schema?.remove()
    canonicalLink?.remove()
  })
}
