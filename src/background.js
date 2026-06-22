/** Rastreo del dominio (MV3 service worker): cola + fetch + storage. */

import { SCANNER_COLUMNS } from './constants/scannerColumns.js'
import { buildPlaceholderScannerRow, buildScannerValuesFromHtml, countH1InHtml } from './utils/scannerRow.js'
import { analyzeCrawlResults } from './utils/crawlDuplicateAnalysis.js'
import { fetchAllKeywordSuggestions } from './utils/keywordSuggest.js'

const MAX_URLS = 1000
const DELAY_MS = 150
const MAX_HTML_BYTES = 2 * 1024 * 1024

let abortFlag = false
/** Evita solapar dos CRAWL_START (comprobación + finally en listener). */
let crawlBusy = false

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function persist(partial) {
  await chrome.storage.local.set(partial)
}

/** Solo páginas HTML reales: evita tratar .js/.css como HTML por coincidencias sueltas. */
function isLikelyHtmlDocument(contentType, textHead) {
  const head = (textHead || '').slice(0, 12000)
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  if (ct === 'text/html' || ct === 'application/xhtml+xml' || ct.startsWith('text/html')) return true
  if (
    ct.startsWith('image/') ||
    ct === 'application/javascript' ||
    ct === 'text/javascript' ||
    ct === 'application/json' ||
    ct === 'text/css' ||
    ct.startsWith('font/') ||
    ct.startsWith('audio/') ||
    ct.startsWith('video/') ||
    ct === 'application/octet-stream' ||
    ct === 'application/wasm' ||
    ct === 'application/font-woff' ||
    ct === 'application/font-woff2' ||
    ct === 'application/vnd.ms-fontobject'
  ) {
    return false
  }
  if (ct === 'text/plain' || !ct) {
    if (/^\s*<\?xml\s/i.test(head)) return false
    return /<\s*html[\s/>]/i.test(head) && (/<\s*head[\s/>]/i.test(head) || /<\s*body[\s/>]/i.test(head))
  }
  return false
}

function sameSiteHostname(hostname, seedHostLower) {
  const h = hostname.toLowerCase()
  const s = seedHostLower.toLowerCase()
  if (h === s) return true
  const bare = s.startsWith('www.') ? s.slice(4) : s
  const hBare = h.startsWith('www.') ? h.slice(4) : h
  return bare === hBare
}

/** URL interna canónica: mismo sitio que la semilla (apex/www), sin hash. */
function canonicalInternalUrl(absHref, seedUrl) {
  try {
    const seed = new URL(seedUrl)
    const u = new URL(absHref)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!sameSiteHostname(u.hostname, seed.hostname)) return null
    u.hash = ''
    const out = new URL(u.pathname + u.search, seed.origin)
    return out.href
  } catch {
    return null
  }
}

function extractTitle(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.querySelector('title')?.textContent?.trim() || ''
  } catch {
    return ''
  }
}

/**
 * Enlaces del DOM (a + area).
 * @param {string} html
 * @param {string} pageUrl
 * @param {string} seedUrl
 */
function extractLinksFromDom(html, pageUrl, seedUrl) {
  let doc
  try {
    doc = new DOMParser().parseFromString(html, 'text/html')
  } catch {
    return []
  }
  const out = new Set()
  doc.querySelectorAll('a[href], area[href]').forEach((el) => {
    const href = el.getAttribute('href')
    if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return
    try {
      const abs = new URL(href, pageUrl).href
      const norm = canonicalInternalUrl(abs, seedUrl)
      if (norm) out.add(norm)
    } catch {
      /* ignore */
    }
  })
  return [...out]
}

/**
 * Respaldo: href en HTML crudo (SPA con poco DOM, plantillas, etc.).
 * @param {string} html
 * @param {string} pageUrl
 * @param {string} seedUrl
 */
function extractLinksFromRegex(html, pageUrl, seedUrl) {
  const out = new Set()
  const tryHref = (href) => {
    if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return
    try {
      const abs = new URL(href, pageUrl).href
      const norm = canonicalInternalUrl(abs, seedUrl)
      if (norm) out.add(norm)
    } catch {
      /* ignore */
    }
  }
  const reQuoted = /\bhref\s*=\s*(["'])([^"']*?)\1/gi
  let m
  while ((m = reQuoted.exec(html)) !== null) {
    tryHref(m[2])
  }
  const reUnquoted = /\bhref\s*=\s*([^\s"'=<>`]+)/gi
  while ((m = reUnquoted.exec(html)) !== null) {
    tryHref(m[1])
  }
  return [...out]
}

function mergeUniqueUrls(domList, regexList) {
  const out = new Set()
  for (const u of domList) out.add(u)
  for (const u of regexList) out.add(u)
  return [...out]
}

function addLocsFromXmlToSet(xml, seedUrl, set) {
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((x) => x[1].trim())
  for (const loc of locs) {
    try {
      const norm = canonicalInternalUrl(new URL(loc).href, seedUrl)
      if (norm) set.add(norm)
    } catch {
      /* ignore */
    }
  }
}

/** URLs de página desde sitemap(s): índice o listado directo. */
async function discoverUrlsFromSitemaps(seedUrl) {
  const origin = new URL(seedUrl).origin
  const pageUrls = new Set()
  const paths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml', '/wp-sitemap.xml']

  for (const path of paths) {
    try {
      const r = await fetch(origin + path, { credentials: 'omit', cache: 'no-store' })
      if (!r.ok) continue
      const xml = await r.text()
      if (/<sitemapindex[\s>]/i.test(xml)) {
        const submaps = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
          .map((x) => x[1].trim())
          .slice(0, 50)
        for (const sm of submaps) {
          try {
            const r2 = await fetch(sm, { credentials: 'omit', cache: 'no-store' })
            if (!r2.ok) continue
            addLocsFromXmlToSet(await r2.text(), seedUrl, pageUrls)
          } catch {
            /* ignore */
          }
        }
      } else {
        addLocsFromXmlToSet(xml, seedUrl, pageUrls)
      }
    } catch {
      /* ignore */
    }
  }
  return [...pageUrls]
}

async function runCrawl(seedUrl) {
  abortFlag = false

  /** El permiso del host se pide en el popup (gesto de usuario); aquí solo rastreamos. */

  const crawlBase = seedUrl.trim()
  let hostLower = ''
  let seed = ''
  try {
    const su = new URL(crawlBase)
    hostLower = su.hostname.toLowerCase()
    seed = canonicalInternalUrl(su.href, crawlBase)
  } catch {
    await persist({
      siteCrawlRunning: false,
      siteCrawlProgress: null,
      siteCrawlResults: [],
      siteCrawlHost: '',
      siteCrawlError: 'URL inválida',
      siteCrawlFinishedAt: Date.now(),
    })
    return
  }

  if (!seed) {
    await persist({
      siteCrawlRunning: false,
      siteCrawlProgress: null,
      siteCrawlResults: [],
      siteCrawlHost: hostLower,
      siteCrawlError: 'No se pudo normalizar la URL inicial',
      siteCrawlFinishedAt: Date.now(),
    })
    return
  }

  const queue = []
  const queuedSet = new Set()
  const processed = new Set()
  const results = []

  function enqueue(u) {
    if (processed.has(u) || queuedSet.has(u)) return
    if (processed.size + queue.length >= MAX_URLS) return
    queuedSet.add(u)
    queue.push(u)
  }

  enqueue(seed)

  try {
    const fromSitemap = await discoverUrlsFromSitemaps(crawlBase)
    for (const u of fromSitemap) enqueue(u)
  } catch {
    /* sitemap opcional */
  }

  await persist({
    siteCrawlRunning: true,
    siteCrawlHost: hostLower,
    siteCrawlError: null,
    siteCrawlResults: [],
    siteCrawlIssues: [],
    siteCrawlSummary: null,
    siteCrawlProgress: {
      current: seed,
      fetched: 0,
      queued: queue.length,
      host: hostLower,
      seed,
      max: MAX_URLS,
      queuePct: 0,
      finishReason: null,
    },
    siteCrawlStartedAt: Date.now(),
    siteCrawlFinishedAt: null,
  })

  while (queue.length && processed.size < MAX_URLS && !abortFlag) {
    const url = queue.shift()
    queuedSet.delete(url)
    if (processed.has(url)) continue
    processed.add(url)

    let status = 0
    let title = ''
    let contentType = ''
    let error = ''
    let statusText = ''
    let scannerValues = null
    let h1Count = 0
    let crawlRowKind = 'other'
    let text = ''

    try {
      const r = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        redirect: 'follow',
        cache: 'no-store',
      })
      status = r.status
      contentType = r.headers.get('content-type') || ''
      statusText = r.statusText || ''

      text = await r.text()
      if (text.length > MAX_HTML_BYTES) text = text.slice(0, MAX_HTML_BYTES)

      const head = text.slice(0, 100000)
      const isDoc = isLikelyHtmlDocument(contentType, head)

      if (isDoc && status === 200) {
        title = extractTitle(text)
        h1Count = countH1InHtml(text)
        try {
          const sv = buildScannerValuesFromHtml(text, url, {
            status,
            statusText,
            contentType,
            contentLength: r.headers.get('content-length') || '',
            lastModified: r.headers.get('last-modified') || '',
            httpVersion: '',
            xRobotsTag: r.headers.get('x-robots-tag') || '',
          })
          if (Array.isArray(sv) && sv.length === SCANNER_COLUMNS.length) {
            scannerValues = sv
            crawlRowKind = 'html'
            if (scannerValues[6]) title = scannerValues[6] || title
          }
        } catch (err) {
          console.warn('[crawl] scanner', url, err)
        }
        // Descubrimiento de URLs: no debe depender del escáner de 72 columnas (si el DOM falla, igual hay href en crudo).
        if (!abortFlag && processed.size < MAX_URLS) {
          const domLinks = extractLinksFromDom(text, url, crawlBase)
          const rxLinks = extractLinksFromRegex(text, url, crawlBase)
          const links = mergeUniqueUrls(domLinks, rxLinks)
          for (const next of links) {
            if (processed.size + queue.length >= MAX_URLS) break
            enqueue(next)
          }
        }
      } else if (isDoc && status >= 200 && status < 400) {
        title = extractTitle(text)
        h1Count = countH1InHtml(text)
      }
    } catch (e) {
      error = String(e?.message || e)
    }

    if (!scannerValues || scannerValues.length !== SCANNER_COLUMNS.length) {
      scannerValues = buildPlaceholderScannerRow(url, {
        status,
        contentType,
        statusText,
        title,
        error,
        note:
          status === 200 && /text\/html/i.test(contentType || '')
            ? 'Fila resumida: el análisis detallado del HTML no produjo 72 columnas'
            : '',
      })
      crawlRowKind = 'other'
    }

    results.push({
      url,
      status,
      title,
      contentType,
      error: error || undefined,
      scannerValues,
      h1Count,
      crawlRowKind,
    })

    const denom = Math.max(1, results.length + queue.length)
    const queuePct = Math.min(100, Math.round((results.length / denom) * 100))

    await persist({
      siteCrawlRunning: true,
      siteCrawlHost: hostLower,
      siteCrawlResults: results,
      siteCrawlProgress: {
        current: url,
        fetched: results.length,
        queued: queue.length,
        host: hostLower,
        seed,
        max: MAX_URLS,
        queuePct,
        finishReason: null,
      },
    })

    await sleep(DELAY_MS)
  }

  let finishReason = 'exhausted'
  if (abortFlag) finishReason = 'aborted'
  else if (queue.length > 0) finishReason = 'limit'
  else finishReason = 'exhausted'

  const { issues, summary } = analyzeCrawlResults(results)
  summary.finishReason = finishReason

  // Primero metadatos ligeros: la pestaña Rastreo lee esto aunque el lote de resultados sea grande.
  await persist({
    siteCrawlRunning: false,
    siteCrawlHost: hostLower,
    siteCrawlSummary: summary,
    siteCrawlIssues: issues,
    siteCrawlProgress: {
      current: null,
      fetched: results.length,
      queued: queue.length,
      host: hostLower,
      seed,
      max: MAX_URLS,
      done: true,
      aborted: abortFlag,
      finishReason,
      queuePct: 100,
    },
    siteCrawlError: null,
    siteCrawlFinishedAt: Date.now(),
  })
  await persist({
    siteCrawlResults: results,
  })
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'CRAWL_START') {
    if (crawlBusy) {
      sendResponse({ ok: false, error: 'Ya hay un rastreo en curso' })
      return false
    }
    const seed = msg.seedUrl
    if (!seed || typeof seed !== 'string') {
      sendResponse({ ok: false, error: 'Falta seedUrl' })
      return false
    }
    abortFlag = false
    crawlBusy = true
    runCrawl(seed)
      .catch(async (e) => {
        console.error('[crawl]', e)
        await persist({
          siteCrawlRunning: false,
          siteCrawlError: String(e?.message || e),
          siteCrawlFinishedAt: Date.now(),
        })
      })
      .finally(() => {
        crawlBusy = false
      })
    sendResponse({ ok: true })
    return false
  }

  if (msg?.type === 'CRAWL_STOP') {
    abortFlag = true
    sendResponse({ ok: true })
    return false
  }

  if (msg?.type === 'CRAWL_GET_STATE') {
    chrome.storage.local
      .get([
        'siteCrawlRunning',
        'siteCrawlProgress',
        'siteCrawlResults',
        'siteCrawlHost',
        'siteCrawlError',
        'siteCrawlStartedAt',
        'siteCrawlFinishedAt',
        'siteCrawlIssues',
        'siteCrawlSummary',
      ])
      .then(sendResponse)
    return true
  }

  if (msg?.action === 'keywordSuggestions') {
    ;(async () => {
      try {
        const q = String(msg.query || '').trim()
        if (!q) {
          sendResponse({ google: [], bing: [], ddg: [], all: [], sources: [] })
          return
        }
        const result = await fetchAllKeywordSuggestions(q, msg.pageData || null)
        sendResponse(result)
      } catch (e) {
        sendResponse({ google: [], bing: [], ddg: [], all: [], sources: [], error: String(e?.message || e) })
      }
    })()
    return true
  }

  if (msg?.action === 'geocodeLocation') {
    ;(async () => {
      try {
        const result = await geocodePlace(String(msg.query || '').trim())
        sendResponse(result || { error: 'Ubicación no encontrada' })
      } catch (e) {
        sendResponse({ error: String(e?.message || e) })
      }
    })()
    return true
  }

  return false
})

async function geocodePlace(query) {
  if (!query) return null
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'es',
      'User-Agent': 'RonHackSEO-Extension/1.0.1 (Chrome Extension)',
    },
  })
  const rows = await res.json()
  if (!rows?.[0]) return null
  const row = rows[0]
  const a = row.address || {}
  const city = a.city || a.town || a.village || a.municipality || a.county || ''
  const region = a.state || a.region || a.province || ''
  const country = a.country || ''
  const canonical = [city, region, country].filter(Boolean).join(',')
  return {
    displayName: row.display_name,
    lat: row.lat,
    lon: row.lon,
    city,
    region,
    country,
    canonical: canonical || row.display_name,
  }
}
