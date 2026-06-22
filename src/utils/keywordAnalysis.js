/**
 * Cruce de keywords con elementos on-page.
 */
export function analyzeKeywordOnPage(keyword, pageData) {
  if (!keyword?.trim() || !pageData) {
    return { inTitle: false, inH1: false, inMeta: false, inBody: false, density: 0, count: 0 }
  }

  const term = keyword.trim().toLowerCase()
  const title = (pageData.title || '').toLowerCase()
  const meta = (pageData.metaTags?.description || '').toLowerCase()
  const h1 =
    pageData.headers?.headers?.find((h) => h.level === 1)?.fullText?.toLowerCase() ||
    pageData.headers?.headers?.find((h) => h.level === 1)?.text?.toLowerCase() ||
    ''
  const body = (pageData.text || '').toLowerCase()

  const countMatches = (text) => {
    if (!text) return 0
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}\\b`, 'gi')
    return (text.match(re) || []).length
  }

  const count = countMatches(body)
  const words = body.split(/\s+/).filter(Boolean).length
  const density = words > 0 ? Math.round((count / words) * 10000) / 100 : 0

  return {
    inTitle: title.includes(term),
    inH1: h1.includes(term),
    inMeta: meta.includes(term),
    inBody: count > 0,
    count,
    density,
  }
}

export function extractPaaFromDocument(doc = document) {
  const questions = new Set()

  doc.querySelectorAll('[data-q]').forEach((el) => {
    const q = el.getAttribute('data-q')?.trim()
    if (q) questions.add(q)
  })

  doc.querySelectorAll('div[jsname] c-wiz div[role="button"] span').forEach((el) => {
    const t = el.textContent?.trim()
    if (t && t.endsWith('?') && t.length > 8 && t.length < 200) questions.add(t)
  })

  doc.querySelectorAll('.related-question-pair span, .LGOjhe, [data-attrid="wa:/description"]').forEach((el) => {
    const t = el.textContent?.trim()
    if (t && t.includes('?') && t.length > 8 && t.length < 220) questions.add(t)
  })

  return [...questions].slice(0, 12)
}

export function extractPaaInPage() {
  if (!/google\.(com|[a-z.]{2,})\/search/i.test(location.href)) return []
  return extractPaaFromDocument(document)
}
