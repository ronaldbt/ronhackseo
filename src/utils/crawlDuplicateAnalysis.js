/** Índices alineados con SCANNER_COLUMNS (0-based). */
export const SCAN_COL = {
  URL: 0,
  TITLE: 6,
  META_DESC: 9,
  H1: 14,
}

function norm(s) {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function rowHttpStatus(r) {
  const s = Number(r.status ?? r.scannerValues?.[2] ?? 0)
  return Number.isFinite(s) ? s : 0
}

const HTTP_STATUS_LABELS = {
  400: 'HTTP 400 (Bad Request)',
  401: 'HTTP 401 (Unauthorized)',
  403: 'HTTP 403 (Forbidden)',
  404: 'HTTP 404 (Not Found)',
  410: 'HTTP 410 (Gone)',
  429: 'HTTP 429 (Too Many Requests)',
  500: 'HTTP 500 (Internal Server Error)',
  502: 'HTTP 502 (Bad Gateway)',
  503: 'HTTP 503 (Service Unavailable)',
  504: 'HTTP 504 (Gateway Timeout)',
}

function httpIssuePriority(code) {
  if (code >= 500) return 'Alta'
  if (code === 404 || code === 410) return 'Alta'
  return 'Media'
}

/**
 * @param {Array<{ url: string, status: number, scannerValues?: string[], h1Count?: number }>} results
 * @returns {{ issues: Array<{ nombre: string, tipo: string, prioridad: string, urls: number, pct: string }>, summary: object }}
 */
export function analyzeCrawlResults(results) {
  const issues = []
  const pages = (results || []).filter((r) => {
    if (r.status !== 200 || !Array.isArray(r.scannerValues)) return false
    if (r.crawlRowKind === 'other') return false
    if (r.crawlRowKind === 'html') return true
    // Resultados guardados antes de crawlRowKind: se asume fila de análisis HTML.
    return r.crawlRowKind == null
  })
  const total = pages.length || 1
  const totalCrawled = (results || []).length || 1

  const pct = (n) => `${((n / total) * 100).toFixed(2).replace('.', ',')}`
  const pctCrawled = (n) => `${((n / totalCrawled) * 100).toFixed(2).replace('.', ',')}`

  const byTitle = new Map()
  const byH1 = new Map()
  const byMeta = new Map()

  for (const r of pages) {
    const v = r.scannerValues
    const title = norm(v[SCAN_COL.TITLE])
    const h1 = norm(v[SCAN_COL.H1])
    const meta = norm(v[SCAN_COL.META_DESC])

    if (title.length >= 5) {
      if (!byTitle.has(title)) byTitle.set(title, [])
      byTitle.get(title).push(r.url)
    }
    if (h1.length >= 3) {
      if (!byH1.has(h1)) byH1.set(h1, [])
      byH1.get(h1).push(r.url)
    }
    if (meta.length >= 25) {
      if (!byMeta.has(meta)) byMeta.set(meta, [])
      byMeta.get(meta).push(r.url)
    }
  }

  for (const [t, urls] of byTitle) {
    if (urls.length > 1) {
      issues.push({
        issueId: 'dup_title',
        nombre: `Títulos duplicados (${urls.length} URLs): «${t.slice(0, 70)}${t.length > 70 ? '…' : ''}»`,
        tipo: 'Aviso',
        prioridad: 'Media',
        urls: urls.length,
        pct: pct(urls.length),
        urlList: urls,
        detalle: urls.slice(0, 8).join(' | '),
      })
    }
  }

  for (const [h, urls] of byH1) {
    if (urls.length > 1) {
      issues.push({
        issueId: 'dup_h1',
        nombre: `H1 duplicado (${urls.length} URLs): «${h.slice(0, 70)}${h.length > 70 ? '…' : ''}»`,
        tipo: 'Aviso',
        prioridad: 'Alta',
        urls: urls.length,
        pct: pct(urls.length),
        urlList: urls,
        detalle: urls.slice(0, 8).join(' | '),
      })
    }
  }

  for (const [m, urls] of byMeta) {
    if (urls.length > 1) {
      issues.push({
        issueId: 'dup_meta',
        nombre: `Meta description duplicada (${urls.length} URLs)`,
        tipo: 'Oportunidad',
        prioridad: 'Baja',
        urls: urls.length,
        pct: pct(urls.length),
        urlList: urls,
        detalle: urls.slice(0, 6).join(' | '),
      })
    }
  }

  const multiH1Pages = pages.filter((r) => r.h1Count != null && r.h1Count > 1)
  if (multiH1Pages.length > 0) {
    issues.push({
      issueId: 'multi_h1',
      nombre: `URLs con más de un H1: ${multiH1Pages.length}`,
      tipo: 'Problema',
      prioridad: 'Alta',
      urls: multiH1Pages.length,
      pct: pct(multiH1Pages.length),
      urlList: multiH1Pages.map((r) => r.url),
      detalle: multiH1Pages
        .slice(0, 6)
        .map((r) => r.url)
        .join(' | '),
    })
  }

  const emptyTitlePages = pages.filter((r) => !norm(r.scannerValues[SCAN_COL.TITLE]))
  const emptyTitle = emptyTitlePages.length
  if (emptyTitle > 0) {
    issues.push({
      issueId: 'empty_title',
      nombre: `Páginas sin título (HTML): ${emptyTitle}`,
      tipo: 'Aviso',
      prioridad: 'Media',
      urls: emptyTitle,
      pct: pct(emptyTitle),
      urlList: emptyTitlePages.map((r) => r.url),
    })
  }

  const byErrorCode = new Map()
  for (const r of results || []) {
    const code = rowHttpStatus(r)
    if (code >= 400) {
      if (!byErrorCode.has(code)) byErrorCode.set(code, [])
      byErrorCode.get(code).push(r)
    }
  }

  for (const [code, codePages] of [...byErrorCode.entries()].sort((a, b) => a[0] - b[0])) {
    const label = HTTP_STATUS_LABELS[code] || `HTTP ${code}`
    issues.push({
      issueId: `status_${code}`,
      nombre: `${label}: ${codePages.length}`,
      tipo: 'Problema',
      prioridad: httpIssuePriority(code),
      urls: codePages.length,
      pct: pctCrawled(codePages.length),
      urlList: codePages.map((r) => r.url),
      detalle: codePages
        .slice(0, 6)
        .map((r) => r.url)
        .join(' | '),
    })
  }

  issues.sort((a, b) => {
    const pr = { Alta: 0, Media: 1, Baja: 2 }
    return (pr[a.prioridad] ?? 2) - (pr[b.prioridad] ?? 2)
  })

  const summary = {
    totalUrls: (results || []).length,
    htmlOk: pages.length,
    duplicateTitleGroups: [...byTitle.values()].filter((u) => u.length > 1).length,
    duplicateH1Groups: [...byH1.values()].filter((u) => u.length > 1).length,
    duplicateMetaGroups: [...byMeta.values()].filter((u) => u.length > 1).length,
    multiH1Pages: multiH1Pages.length,
    issuesCount: issues.length,
  }

  return { issues, summary }
}
