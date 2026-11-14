// Prints an HTML document through a hidden iframe. The browser lays out the
// RTL page and shapes Arabic itself, and "Save as PDF" gives a real text PDF.
export function printHtml (html, title = 'report') {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()
  doc.title = title
  const cleanup = () => setTimeout(() => iframe.remove(), 1000)
  const go = () => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } finally {
      cleanup()
    }
  }
  // Wait for images (tracing snapshots, photos) before printing.
  const imgs = Array.from(doc.images || [])
  Promise.all(imgs.map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r }))).then(() => setTimeout(go, 150))
}

export const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
