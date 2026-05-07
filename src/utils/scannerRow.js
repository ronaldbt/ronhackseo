import { SCANNER_COLUMNS } from '../constants/scannerColumns.js'

function roughSyllableCount(text) {
  const t = text.toLowerCase().replace(/[^a-záéíóúüñ]+/gi, ' ')
  const words = t.split(/\s+/).filter(Boolean)
  let syl = 0
  for (const w of words) {
    const groups = w.match(/[aeiouáéíóúü]+/gi)
    syl += groups ? Math.max(1, groups.length) : 1
  }
  return syl
}

/** Flesch aproximado para español (lectura orientativa). */
export function fleschSpanishApprox(text) {
  const clean = (text || '').trim()
  if (!clean) return { score: 0, label: '—' }
  const words = clean.split(/\s+/).filter(Boolean).length
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1
  const syllables = roughSyllableCount(clean)
  if (words < 2) return { score: 0, label: '—' }
  const score = 206.835 - 1.015 * (words / sentences) - 62 * (syllables / words)
  const rounded = Math.round(Math.max(0, Math.min(100, score)) * 10) / 10
  let label = 'Muy difícil'
  if (rounded >= 80) label = 'Fácil'
  else if (rounded >= 60) label = 'Normal'
  else if (rounded >= 40) label = 'Difícil'
  return { score: rounded, label }
}

function urlFolderDepth(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    return parts.length
  } catch {
    return 0
  }
}

function metaRefreshContent() {
  const m = document.querySelector('meta[http-equiv="refresh" i]')
  return m ? m.getAttribute('content') || '' : ''
}

function linkRelHref(rel) {
  const el = document.querySelector(`link[rel="${rel}"]`)
  return el ? el.getAttribute('href') || '' : ''
}

function amphtmlHref() {
  const el = document.querySelector('link[rel="amphtml"]')
  return el ? el.getAttribute('href') || '' : ''
}

function mobileAlternateHref() {
  const el = document.querySelector('link[rel="alternate"][media*="max-width"]')
  return el ? el.getAttribute('href') || '' : ''
}

/** Cuenta enlaces desde lista { href } y URL base (solo en contexto de página / datos ya recolectados). */
export function computeLinkStats(links, baseUrl) {
  let host = ''
  try {
    host = new URL(baseUrl).hostname
  } catch {
    return {
      internal: 0,
      internalUnique: 0,
      outbound: 0,
      outboundUnique: 0,
      external: 0,
      externalUnique: 0,
      jsInternal: 0,
      jsOutbound: 0,
      jsExternal: 0,
      pctInternalOfTotal: '',
    }
  }
  const internal = new Set()
  const outbound = new Set()
  const external = new Set()
  let internalCount = 0
  let outboundCount = 0
  let externalCount = 0
  let jsInternal = 0
  let jsOutbound = 0
  let jsExternal = 0

  for (const row of links || []) {
    const href = row.href || ''
    if (!href) continue
    if (href.toLowerCase().startsWith('javascript:')) {
      try {
        const u = new URL(baseUrl)
        jsOutbound += 1
        if (href.includes(u.hostname)) jsInternal += 1
        else jsExternal += 1
      } catch {
        jsOutbound += 1
      }
      continue
    }
    try {
      const u = new URL(href, baseUrl)
      const isHttp = u.protocol === 'http:' || u.protocol === 'https:'
      if (!isHttp) {
        if (href.startsWith('#') || href.startsWith('?')) internalCount += 1
        continue
      }
      if (u.hostname === host) {
        internalCount += 1
        internal.add(u.href.split('#')[0])
      } else {
        externalCount += 1
        external.add(u.href.split('#')[0])
        outboundCount += 1
        outbound.add(u.href.split('#')[0])
      }
    } catch {
      if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
        internalCount += 1
        try {
          internal.add(new URL(href, baseUrl).href.split('#')[0])
        } catch {
          /* ignore */
        }
      }
    }
  }

  const totalUnique = internal.size + external.size || 1
  const pct = ((internal.size / totalUnique) * 100).toFixed(3).replace('.', ',')

  return {
    internal: internalCount,
    internalUnique: internal.size,
    outbound: outboundCount,
    outboundUnique: outbound.size,
    external: externalCount,
    externalUnique: external.size,
    jsInternal,
    jsOutbound,
    jsExternal,
    pctInternalOfTotal: pct,
  }
}

function simpleHash(str) {
  let h = 5381
  const slice = str.slice(0, 800000)
  for (let i = 0; i < slice.length; i += 1) {
    h = (h << 5) + h + slice.charCodeAt(i)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * Construye fila de valores en el mismo orden que SCANNER_COLUMNS.
 * Pensado para ejecutarse en el content script (usa document cuando hace falta).
 */
export function buildScannerValues(data, httpMeta = {}) {
  const url = data.url || ''
  const title = data.title || ''
  const desc = data.metaTags?.description || ''
  const kw = data.metaTags?.keywords || ''
  const titleLen = title.length
  const titlePx = data.titleWidth?.width != null ? String(Math.round(data.titleWidth.width)) : ''
  const descLen = desc.length
  const descPx = String(Math.round(descLen * 6.2))
  const h1 = data.headers?.headers?.find((h) => h.level === 1)?.fullText || ''
  const h2list = (data.headers?.headers || []).filter((h) => h.level === 2)
  const h21 = h2list[0]?.fullText || ''
  const h22 = h2list[1]?.fullText || ''
  const metaRobots = data.metaRobots?.content || ''
  const noindex = data.metaRobots?.noindex
  const indexable = noindex ? 'No indexable' : 'Indexable'
  const indexReason = noindex ? 'noindex' : data.canonical && !data.canonical.matches ? 'Canonicalizada' : ''

  const html = document.documentElement?.outerHTML || ''
  const sizeBytes = new Blob([html]).size
  const transferred = httpMeta.contentLength != null ? String(httpMeta.contentLength) : String(sizeBytes)

  const text = data.text || ''
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1
  const avgWords = words ? (words / sentences).toFixed(3).replace('.', ',') : ''
  const flesch = fleschSpanishApprox(text)

  const ratio = data.textHTMLRatio?.ratio != null ? String(data.textHTMLRatio.ratio) : ''
  const depth = data.domDepth?.maxDepth != null ? String(data.domDepth.maxDepth) : ''
  const folderDepth = String(urlFolderDepth(url))

  const stats = data.linkStats || computeLinkStats(data.links, url)
  const linkScore = String(Math.min(100, stats.internalUnique * 3 + stats.externalUnique))

  const perfMs = data.performance?.load != null ? (data.performance.load / 1000).toFixed(3).replace('.', ',') : ''

  const cookies = typeof document !== 'undefined' && document.cookie && document.cookie.length > 0 ? 'Sí' : 'No'
  const lang = document.documentElement?.getAttribute('lang') || data.langTag?.htmlLang || ''

  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  const co2 = transferred ? ((Number(transferred) / 1e6) * 0.38).toFixed(3).replace('.', ',') : ''

  const values = [
    url,
    httpMeta.contentType || (typeof document !== 'undefined' ? document.contentType : '') || '',
    httpMeta.status != null && httpMeta.status !== '' ? String(httpMeta.status) : '',
    httpMeta.statusText || '',
    indexable,
    indexReason,
    title,
    String(titleLen),
    titlePx,
    desc,
    String(descLen),
    descPx,
    kw,
    String(kw.length),
    h1,
    String(h1.length),
    h21,
    String(h21.length),
    h22,
    String(h22.length),
    metaRobots,
    httpMeta.xRobotsTag || '',
    typeof document !== 'undefined' ? metaRefreshContent() : '',
    data.canonical?.url || '',
    linkRelHref('next'),
    linkRelHref('prev'),
    '',
    '',
    typeof document !== 'undefined' ? amphtmlHref() : '',
    String(sizeBytes),
    transferred,
    transferred,
    co2,
    co2 ? 'B' : '',
    String(words),
    String(sentences),
    avgWords,
    String(flesch.score),
    flesch.label,
    ratio,
    depth,
    folderDepth,
    linkScore,
    String(stats.internal),
    String(stats.internalUnique),
    String(stats.jsInternal),
    stats.pctInternalOfTotal,
    String(stats.outbound),
    String(stats.outboundUnique),
    String(stats.jsOutbound),
    String(stats.external),
    String(stats.externalUnique),
    String(stats.jsExternal),
    '',
    '',
    '',
    '',
    simpleHash(html),
    perfMs,
    httpMeta.lastModified || '',
    '',
    '',
    cookies,
    lang,
    httpMeta.httpVersion || '',
    typeof document !== 'undefined' ? mobileAlternateHref() : '',
    '',
    '',
    '',
    '',
    encodeURI(url),
    stamp,
  ]

  if (values.length !== SCANNER_COLUMNS.length) {
    console.warn('[scannerRow] column count mismatch', values.length, SCANNER_COLUMNS.length)
  }

  return values
}

function metaTagsFromDoc(doc) {
  const metaTags = {}
  doc.querySelectorAll('meta').forEach((tag) => {
    const name = tag.getAttribute('name') || tag.getAttribute('property') || tag.getAttribute('http-equiv')
    const content = tag.getAttribute('content')
    if (name && content) metaTags[name] = content
  })
  return metaTags
}

function linkRelFromDoc(doc, rel) {
  const el = doc.querySelector(`link[rel="${rel}"]`)
  return el ? el.getAttribute('href') || '' : ''
}

function metaRefreshFromDoc(doc) {
  const m = doc.querySelector('meta[http-equiv="refresh" i], meta[http-equiv="Refresh"]')
  return m ? m.getAttribute('content') || '' : ''
}

function ampFromDoc(doc) {
  const el = doc.querySelector('link[rel="amphtml"]')
  return el ? el.getAttribute('href') || '' : ''
}

function mobileAltFromDoc(doc) {
  const el = doc.querySelector('link[rel="alternate"][media*="max-width"]')
  return el ? el.getAttribute('href') || '' : ''
}

function headersFromDoc(doc) {
  const allHeaders = []
  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((header, index) => {
    const level = parseInt(header.tagName.charAt(1), 10)
    const text = header.textContent.trim()
    allHeaders.push({ level, fullText: text, index })
  })
  const count = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, total: allHeaders.length }
  allHeaders.forEach((h) => {
    const k = `h${h.level}`
    count[k] = (count[k] || 0) + 1
  })
  return { headers: allHeaders, count }
}

function metaRobotsFromDoc(doc) {
  const mr = doc.querySelector('meta[name="robots"]')
  const content = mr ? mr.getAttribute('content') || '' : ''
  const directives = content.toLowerCase().split(',').map((d) => d.trim())
  return {
    exists: !!mr,
    content,
    noindex: directives.includes('noindex'),
    nofollow: directives.includes('nofollow'),
  }
}

function canonicalFromDoc(doc, pageUrl) {
  const canonical = doc.querySelector('link[rel="canonical"]')
  try {
    const cur = new URL(pageUrl)
    const curBase = cur.href.split('?')[0]
    if (!canonical) {
      return { exists: false, url: null, matches: false }
    }
    const href = canonical.getAttribute('href')
    const abs = new URL(href, pageUrl).href
    const matches = abs === cur.href || abs === curBase
    return { exists: true, url: abs, matches, currentURL: curBase }
  } catch {
    return { exists: false, url: null, matches: false }
  }
}

/** Asegura exactamente SCANNER_COLUMNS.length celdas (CSV / almacenamiento). */
export function normalizeScannerRowLength(row) {
  const n = SCANNER_COLUMNS.length
  if (!Array.isArray(row)) return Array(n).fill('')
  if (row.length === n) return row
  if (row.length < n) return [...row, ...Array(n - row.length).fill('')]
  return row.slice(0, n)
}

function regexStripTags(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function regexFirstTagContent(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? regexStripTags(m[1]) : ''
}

function regexMetaByName(html, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let m = html.match(new RegExp(`<meta[^>]+name=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i'))
  if (m) return m[1].trim()
  m = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${esc}["']`, 'i'))
  return m ? m[1].trim() : ''
}

function regexMetaByProperty(html, prop) {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let m = html.match(new RegExp(`<meta[^>]+property=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i'))
  if (m) return m[1].trim()
  m = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${esc}["']`, 'i'))
  return m ? m[1].trim() : ''
}

function regexLinkRelHref(html, rel) {
  const esc = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let m = html.match(new RegExp(`<link[^>]+rel=["']${esc}["'][^>]*href=["']([^"']+)["']`, 'i'))
  if (m) return m[1].trim()
  m = html.match(new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${esc}["']`, 'i'))
  return m ? m[1].trim() : ''
}

function regexBodyPlainText(html) {
  let chunk = html
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (body) chunk = body[1]
  return chunk
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function regexCollectLinks(html, pageUrl) {
  const links = []
  const add = (href) => {
    if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return
    try {
      links.push({ href: new URL(href, pageUrl).href })
    } catch {
      /* ignore */
    }
  }
  const reQuoted = /\bhref\s*=\s*(["'])([^"']*?)\1/gi
  let m
  while ((m = reQuoted.exec(html)) !== null) add(m[2])
  const reUnquoted = /\bhref\s*=\s*([^\s"'=<>`]+)/gi
  while ((m = reUnquoted.exec(html)) !== null) add(m[1])
  return links
}

/**
 * Misma forma que buildScannerValuesFromHtml pero sin DOMParser (si el SW falla al parsear).
 */
function buildScannerValuesFromHtmlRegexFallback(html, pageUrl, httpMeta = {}) {
  const title = regexFirstTagContent(html, 'title')
  const desc = regexMetaByName(html, 'description') || regexMetaByProperty(html, 'og:description')
  const kw = regexMetaByName(html, 'keywords')
  const titleLen = title.length
  const titlePx = String(Math.round(titleLen * 9))
  const descLen = desc.length
  const descPx = String(Math.round(descLen * 6.2))
  const h1 = regexFirstTagContent(html, 'h1')
  const h2matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
  const h21 = h2matches[0] ? regexStripTags(h2matches[0][1]) : ''
  const h22 = h2matches[1] ? regexStripTags(h2matches[1][1]) : ''
  const metaRobotsContent = regexMetaByName(html, 'robots')
  const directives = (metaRobotsContent || '').toLowerCase().split(',').map((d) => d.trim())
  const noindex = directives.includes('noindex')
  const indexable = noindex ? 'No indexable' : 'Indexable'
  let indexReason = noindex ? 'noindex' : ''
  let canonicalUrl = ''
  try {
    canonicalUrl = regexLinkRelHref(html, 'canonical')
    if (canonicalUrl) {
      const abs = new URL(canonicalUrl, pageUrl).href
      canonicalUrl = abs
      const cur = new URL(pageUrl)
      const curBase = cur.href.split('?')[0]
      if (abs !== cur.href && abs !== curBase) indexReason = indexReason || 'Canonicalizada'
    }
  } catch {
    canonicalUrl = ''
  }
  const metaRefresh = (() => {
    const mm = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["']([^"']+)["']/i)
    if (mm) return mm[1].trim()
    const mm2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+http-equiv=["']refresh["']/i)
    return mm2 ? mm2[1].trim() : ''
  })()
  const plain = regexBodyPlainText(html)
  const words = plain.trim().split(/\s+/).filter(Boolean).length
  const sentences = plain.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1
  const avgWords = words ? (words / sentences).toFixed(3).replace('.', ',') : ''
  const flesch = fleschSpanishApprox(plain)
  const htmlSize = html.length
  const transferred =
    httpMeta.contentLength != null && httpMeta.contentLength !== ''
      ? String(httpMeta.contentLength)
      : String(htmlSize)
  const ratio = htmlSize > 0 ? String(Math.round((plain.length / htmlSize) * 100)) : ''
  const folderDepth = String(urlFolderDepth(pageUrl))
  const links = regexCollectLinks(html, pageUrl)
  const stats = computeLinkStats(links, pageUrl)
  const linkScore = String(Math.min(100, stats.internalUnique * 3 + stats.externalUnique))
  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i)
  const lang = langMatch ? langMatch[1].trim() : 'No definido'
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  const co2 = transferred ? ((Number(transferred) / 1e6) * 0.38).toFixed(3).replace('.', ',') : ''

  const values = [
    pageUrl,
    httpMeta.contentType || '',
    httpMeta.status != null && httpMeta.status !== '' ? String(httpMeta.status) : '',
    httpMeta.statusText || '',
    indexable,
    indexReason,
    title,
    String(titleLen),
    titlePx,
    desc,
    String(descLen),
    descPx,
    kw,
    String(kw.length),
    h1,
    String(h1.length),
    h21,
    String(h21.length),
    h22,
    String(h22.length),
    metaRobotsContent,
    httpMeta.xRobotsTag || '',
    metaRefresh,
    canonicalUrl,
    regexLinkRelHref(html, 'next'),
    regexLinkRelHref(html, 'prev'),
    '',
    '',
    regexLinkRelHref(html, 'amphtml'),
    String(htmlSize),
    transferred,
    transferred,
    co2,
    co2 ? 'B' : '',
    String(words),
    String(sentences),
    avgWords,
    String(flesch.score),
    flesch.label,
    ratio,
    '',
    folderDepth,
    linkScore,
    String(stats.internal),
    String(stats.internalUnique),
    String(stats.jsInternal),
    stats.pctInternalOfTotal,
    String(stats.outbound),
    String(stats.outboundUnique),
    String(stats.jsOutbound),
    String(stats.external),
    String(stats.externalUnique),
    String(stats.jsExternal),
    '',
    '',
    '',
    '',
    simpleHash(html),
    '',
    httpMeta.lastModified || '',
    '',
    '',
    '',
    lang,
    httpMeta.httpVersion || '',
    '',
    '',
    '',
    '',
    '',
    encodeURI(pageUrl),
    stamp,
  ]

  return normalizeScannerRowLength(values)
}

/**
 * Fila escáner desde HTML descargado (service worker / sin `document`).
 * @returns {string[] | null}
 */
export function buildScannerValuesFromHtml(html, pageUrl, httpMeta = {}) {
  let doc
  try {
    doc = new DOMParser().parseFromString(html, 'text/html')
  } catch {
    return buildScannerValuesFromHtmlRegexFallback(html, pageUrl, httpMeta)
  }
  try {
    return buildScannerValuesFromHtmlFromDoc(doc, html, pageUrl, httpMeta)
  } catch (e) {
    console.warn('[scannerRow] fromHtml DOM', pageUrl, e)
    return buildScannerValuesFromHtmlRegexFallback(html, pageUrl, httpMeta)
  }
}

/**
 * @param {Document} doc
 */
function buildScannerValuesFromHtmlFromDoc(doc, html, pageUrl, httpMeta = {}) {
  const metaTags = metaTagsFromDoc(doc)
  const title = doc.querySelector('title')?.textContent?.trim() || ''
  const desc = metaTags.description || metaTags['og:description'] || ''
  const kw = metaTags.keywords || ''
  const titleLen = title.length
  const titlePx = String(Math.round(titleLen * 9))
  const descLen = desc.length
  const descPx = String(Math.round(descLen * 6.2))
  const hdr = headersFromDoc(doc)
  const h1 = hdr.headers.find((h) => h.level === 1)?.fullText || ''
  const h2list = hdr.headers.filter((h) => h.level === 2)
  const h21 = h2list[0]?.fullText || ''
  const h22 = h2list[1]?.fullText || ''
  const metaRobots = metaRobotsFromDoc(doc)
  const canonical = canonicalFromDoc(doc, pageUrl)
  const noindex = metaRobots.noindex
  const indexable = noindex ? 'No indexable' : 'Indexable'
  const indexReason = noindex ? 'noindex' : canonical && !canonical.matches ? 'Canonicalizada' : ''

  const htmlSize = html.length
  const transferred =
    httpMeta.contentLength != null && httpMeta.contentLength !== ''
      ? String(httpMeta.contentLength)
      : String(htmlSize)

  const text = doc.body?.innerText || doc.body?.textContent || ''
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1
  const avgWords = words ? (words / sentences).toFixed(3).replace('.', ',') : ''
  const flesch = fleschSpanishApprox(text)
  const ratio = htmlSize > 0 ? String(Math.round((text.length / htmlSize) * 100)) : ''
  const folderDepth = String(urlFolderDepth(pageUrl))

  const links = []
  doc.querySelectorAll('a[href]').forEach((a) => {
    try {
      const href = a.getAttribute('href')
      if (!href) return
      links.push({ href: new URL(href, pageUrl).href })
    } catch {
      /* ignore */
    }
  })
  const stats = computeLinkStats(links, pageUrl)
  const linkScore = String(Math.min(100, stats.internalUnique * 3 + stats.externalUnique))

  const lang = doc.documentElement?.getAttribute('lang') || 'No definido'
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  const co2 = transferred ? ((Number(transferred) / 1e6) * 0.38).toFixed(3).replace('.', ',') : ''

  const values = [
    pageUrl,
    httpMeta.contentType || '',
    httpMeta.status != null && httpMeta.status !== '' ? String(httpMeta.status) : '',
    httpMeta.statusText || '',
    indexable,
    indexReason,
    title,
    String(titleLen),
    titlePx,
    desc,
    String(descLen),
    descPx,
    kw,
    String(kw.length),
    h1,
    String(h1.length),
    h21,
    String(h21.length),
    h22,
    String(h22.length),
    metaRobots.content || '',
    httpMeta.xRobotsTag || '',
    metaRefreshFromDoc(doc),
    canonical.url || '',
    linkRelFromDoc(doc, 'next'),
    linkRelFromDoc(doc, 'prev'),
    '',
    '',
    ampFromDoc(doc),
    String(htmlSize),
    transferred,
    transferred,
    co2,
    co2 ? 'B' : '',
    String(words),
    String(sentences),
    avgWords,
    String(flesch.score),
    flesch.label,
    ratio,
    '',
    folderDepth,
    linkScore,
    String(stats.internal),
    String(stats.internalUnique),
    String(stats.jsInternal),
    stats.pctInternalOfTotal,
    String(stats.outbound),
    String(stats.outboundUnique),
    String(stats.jsOutbound),
    String(stats.external),
    String(stats.externalUnique),
    String(stats.jsExternal),
    '',
    '',
    '',
    '',
    simpleHash(html),
    '',
    httpMeta.lastModified || '',
    '',
    '',
    '',
    lang,
    httpMeta.httpVersion || '',
    mobileAltFromDoc(doc),
    '',
    '',
    '',
    '',
    encodeURI(pageUrl),
    stamp,
  ]

  if (values.length !== SCANNER_COLUMNS.length) {
    console.warn('[scannerRow] fromHtml column count mismatch', values.length, SCANNER_COLUMNS.length)
  }

  return normalizeScannerRowLength(values)
}

function isLikelyHtmlContentType(contentType) {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  return ct === 'text/html' || ct.startsWith('text/html') || ct === 'application/xhtml+xml'
}

/**
 * Fila alineada a SCANNER_COLUMNS para URLs que no son documento HTML 200 analizado
 * (assets, errores, redirecciones, etc.) — evita desalinear la tabla del rastreo.
 * @param {string} pageUrl
 * @param {{ status?: number, contentType?: string, statusText?: string, title?: string, error?: string, note?: string }} meta
 * @returns {string[]}
 */
export function buildPlaceholderScannerRow(pageUrl, meta = {}) {
  const {
    status = 0,
    contentType = '',
    statusText = '',
    title = '',
    error = '',
    note = '',
  } = meta
  const row = Array(SCANNER_COLUMNS.length).fill('')
  row[0] = pageUrl
  row[1] = contentType
  row[2] = status ? String(status) : ''
  row[3] = statusText || ''
  row[4] = '—'
  let estado = note
  if (!estado && error) estado = `Error: ${error.slice(0, 200)}`
  if (!estado && status && status !== 200) estado = `Respuesta HTTP ${status}`
  if (!estado && !isLikelyHtmlContentType(contentType)) estado = 'Recurso no HTML (sin análisis de contenido)'
  if (!estado) estado = 'Sin análisis extendido'
  row[5] = estado
  row[6] = title || ''
  row[7] = title ? String(title.length) : ''
  return row
}

/** Número de H1 en el documento parseado. */
export function countH1InHtml(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.querySelectorAll('h1').length
  } catch {
    return 0
  }
}
