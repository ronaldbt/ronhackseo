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

function normalizePageUrl(u, hostLower) {
  try {
    const url = new URL(u)
    url.hash = ''
    if (url.hostname.toLowerCase() !== hostLower) return null
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
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
 * @param {string} html
 * @param {string} pageUrl URL absoluta de la página (base para relativos)
 * @param {string} hostLower
 * @returns {string[]}
 */
function extractSameHostLinks(html, pageUrl, hostLower) {
  let doc
  try {
    doc = new DOMParser().parseFromString(html, 'text/html')
  } catch {
    return []
  }
  const out = new Set()
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href')
    if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) return
    try {
      const abs = new URL(href, pageUrl).href
      const norm = normalizePageUrl(abs, hostLower)
      if (norm) out.add(norm)
    } catch {
      /* ignore */
    }
  })
  return [...out]
}

async function runCrawl(seedUrl) {
  abortFlag = false

  /** El permiso del host se pide en el popup (gesto de usuario); aquí solo rastreamos. */

  let hostLower = ''
  let seed = ''
  try {
    hostLower = new URL(seedUrl).hostname.toLowerCase()
    seed = normalizePageUrl(seedUrl, hostLower)
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

      const buf = await r.arrayBuffer()
      const slice = buf.byteLength > MAX_HTML_BYTES ? buf.slice(0, MAX_HTML_BYTES) : buf
      const text = new TextDecoder('utf-8', { fatal: false }).decode(slice)

      const isHtml =
        /text\/html|application\/xhtml\+xml/i.test(contentType) ||
        /^[\s\r\n]*</.test(text.slice(0, 500))

      if (isHtml && status >= 200 && status < 400) {
        title = extractTitle(text)
        if (!abortFlag && processed.size < MAX_URLS) {
          const links = extractSameHostLinks(text, url, hostLower)
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
