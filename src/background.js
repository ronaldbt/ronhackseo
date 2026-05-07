/** Rastreo del dominio (MV3 service worker): cola + fetch + storage. */

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
    siteCrawlProgress: {
      current: seed,
      fetched: 0,
      queued: queue.length,
      host: hostLower,
      seed,
      max: MAX_URLS,
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

    try {
      const r = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        redirect: 'follow',
        cache: 'no-store',
      })
      status = r.status
      contentType = r.headers.get('content-type') || ''

      let text = await r.text()
      if (text.length > MAX_HTML_BYTES) text = text.slice(0, MAX_HTML_BYTES)

      const head = text.slice(0, 100000)
      const isHtml =
        /text\/html|application\/xhtml\+xml/i.test(contentType) ||
        /<\s*html[\s>]|<\s*head[\s>]|<\s*body[\s>]|<a\s+[^>]*\bhref\s*=/i.test(head) ||
        /\bhref\s*=\s*["'][^"']+["']/i.test(head)

      if (isHtml && status >= 200 && status < 400) {
        title = extractTitle(text)
        if (!abortFlag && processed.size < MAX_URLS) {
          const domLinks = extractLinksFromDom(text, url, crawlBase)
          const rxLinks = extractLinksFromRegex(text, url, crawlBase)
          const links = mergeUniqueUrls(domLinks, rxLinks)
          for (const next of links) {
            if (processed.size + queue.length >= MAX_URLS) break
            enqueue(next)
          }
        }
      }
    } catch (e) {
      error = String(e?.message || e)
    }

    results.push({
      url,
      status,
      title,
      contentType,
      error: error || undefined,
    })

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
      },
    })

    await sleep(DELAY_MS)
  }

  await persist({
    siteCrawlRunning: false,
    siteCrawlHost: hostLower,
    siteCrawlResults: results,
    siteCrawlProgress: {
      current: null,
      fetched: results.length,
      queued: queue.length,
      host: hostLower,
      seed,
      max: MAX_URLS,
      done: true,
      aborted: abortFlag,
    },
    siteCrawlError: null,
    siteCrawlFinishedAt: Date.now(),
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
      ])
      .then(sendResponse)
    return true
  }

  return false
})
