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
