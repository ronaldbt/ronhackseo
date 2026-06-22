/**
 * Estadísticas de imágenes y enlaces salientes (content script / executeScript).
 */

export function analyzeImageAltInDocument(doc = document) {
  const imgs = doc.querySelectorAll('img')
  let total = 0
  let missing = 0
  let empty = 0
  let decorative = 0

  imgs.forEach((img) => {
    total++
    const alt = img.getAttribute('alt')
    if (alt === null) missing++
    else if (!alt.trim()) empty++
    else if (alt.trim().length <= 2) decorative++
  })

  return {
    total,
    missing,
    empty,
    withAlt: total - missing - empty,
    decorative,
  }
}

export function analyzeOutboundLinksInDocument(doc = document, pageUrl = location.href) {
  let outbound = 0
  let nofollow = 0
  let dofollow = 0

  try {
    const origin = new URL(pageUrl).origin
    doc.querySelectorAll('a[href]').forEach((a) => {
      try {
        const u = new URL(a.href)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return
        if (u.origin === origin) return
        outbound++
        const rel = (a.getAttribute('rel') || '').toLowerCase()
        if (rel.includes('nofollow') || rel.includes('ugc') || rel.includes('sponsored')) nofollow++
        else dofollow++
      } catch {
        /* ignore */
      }
    })
  } catch {
    /* ignore */
  }

  return { outbound, nofollow, dofollow }
}

export function analyzeImageAltInPage() {
  return analyzeImageAltInDocument(document)
}

export function analyzeOutboundLinksInPage() {
  return analyzeOutboundLinksInDocument(document, location.href)
}
