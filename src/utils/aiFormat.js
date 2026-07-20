/**
 * Format the structured X-ray analysis returned by the AI vision API
 * into a readable Markdown string (rendered via parseMarkdown).
 *
 * Shared by the floating chat widget and the patient-page AI insight drawer.
 */
export function formatXrayAnalysis(analysis) {
  if (!analysis) return 'لم يتم الحصول على نتائج التحليل.'

  const parts = []
  parts.push('## 🦷 تحليل صورة الأشعة\n')

  if (analysis.image_quality) {
    const qualityMap = { clear: '✅ واضحة', moderate: '⚠️ متوسطة', poor: '❌ ضعيفة' }
    parts.push(`**جودة الصورة:** ${qualityMap[analysis.image_quality] || analysis.image_quality}`)
  }

  if (analysis.risk_level) {
    const riskMap = { Low: '🟢 منخفض', Medium: '🟡 متوسط', High: '🔴 مرتفع' }
    parts.push(`**مستوى الخطورة:** ${riskMap[analysis.risk_level] || analysis.risk_level}`)
  }

  if (analysis.observations) {
    parts.push('\n**الملاحظات:**')
    if (Array.isArray(analysis.observations)) {
      analysis.observations.forEach(obs => parts.push(`- ${obs}`))
    } else {
      // If the backend returns a single markdown string
      parts.push(analysis.observations)
    }
  }

  if (analysis.advice) {
    parts.push(`\n**النصيحة:** ${analysis.advice}`)
  }

  if (analysis.summary) {
    parts.push(`\n**ملخص للمريض:** ${analysis.summary}`)
  }

  return parts.join('\n')
}

export default formatXrayAnalysis
