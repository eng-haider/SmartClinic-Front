/**
 * Lightweight Markdown parser for AI responses.
 * Supports: **bold**, *italic*, `code`, - lists, 1. numbered lists,
 * #/##/### headings, and \n line breaks. HTML is escaped first.
 *
 * Shared by the floating chat widget and the per-case AI insight drawer.
 */
export function parseMarkdown(text) {
  if (!text) return ''

  let html = String(text)
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings (### h3, ## h2, # h1)
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:1.05em;display:block;margin:8px 0 4px;">$1</strong>')
  html = html.replace(/^## (.+)$/gm, '<strong style="font-size:1.1em;display:block;margin:8px 0 4px;">$1</strong>')
  html = html.replace(/^# (.+)$/gm, '<strong style="font-size:1.15em;display:block;margin:10px 0 4px;">$1</strong>')

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:0.9em;">$1</code>')

  // Unordered lists (- item)
  html = html.replace(/^- (.+)$/gm, '<li style="margin:2px 0;margin-inline-start:16px;list-style:disc;">$1</li>')

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;margin-inline-start:16px;list-style:decimal;">$1</li>')

  // Wrap consecutive <li> items
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul style="padding:0;margin:4px 0;">$1</ul>')

  // Line breaks
  html = html.replace(/\n/g, '<br>')

  // Clean up double <br> after </ul>
  html = html.replace(/<\/ul><br>/g, '</ul>')

  return html
}

export default parseMarkdown
