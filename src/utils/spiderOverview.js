/**
 * Árbol «Descripción general» estilo Screaming Frog + filtros clicables.
 */

import { analyzeCrawlResults, SCAN_COL } from './crawlDuplicateAnalysis.js'

export const COL_REDIRECT_URL = 62
export const COL_REDIRECT_TYPE = 63

function rowStatus(row) {
  const s = Number(row.status ?? row.scannerValues?.[2] ?? 0)
  return Number.isFinite(s) ? s : 0
}

function pct(count, total) {
  if (!total) return '0%'
  return `${((count / total) * 100).toFixed(2).replace('.', ',')}%`
}

function isInternal(row, seedHost) {
  if (row._external) return false
  try {
    const h = new URL(row.url).hostname.toLowerCase().replace(/^www\./, '')
    const s = (seedHost || '').toLowerCase().replace(/^www\./, '')
    return !s || h === s
  } catch {
    return true
  }
}

function hasRedirectMeta(row) {
  const u = row.scannerValues?.[COL_REDIRECT_URL]
  const t = row.scannerValues?.[COL_REDIRECT_TYPE]
  return !!(u && String(u).trim()) || !!(t && String(t).trim())
}

function analyzeRowSecurity(row, html = '') {
  const url = row.url || ''
  const isHttps = url.startsWith('https://')
  const isHttp = url.startsWith('http://')
  const h = row.responseHeaders || {}

  const mixedContent =
    isHttps &&
    (/(?:src|href|action)\s*=\s*["']http:\/\/[^"']+/i.test(html || '') ||
      /url\s*\(\s*['"]?http:\/\//i.test(html || ''))

  const insecureForm =
    isHttps && /<form[^>]+action\s*=\s*["']http:\/\//i.test(html || '')

  const protocolRelative =
    /(?:src|href)\s*=\s*["']\/\/[^"']+/i.test(html || '')

  const crossOriginInsecure =
    isHttps && /href\s*=\s*["']http:\/\//i.test(html || '')

  return {
    isHttps,
    isHttp,
    mixedContent,
    insecureForm,
    protocolRelative,
    crossOriginInsecure,
    missingHsts: isHttps && !h.strictTransportSecurity,
    missingCsp: isHttps && !h.contentSecurityPolicy,
    missingXContentType: isHttps && !h.xContentTypeOptions,
    missingXFrame: isHttps && !h.xFrameOptions,
    missingReferrerPolicy: isHttps && !h.referrerPolicy,
    wrongContentType: false,
  }
}

export function attachSecurityToRow(row, htmlSnippet = '') {
  const sec = analyzeRowSecurity(row, htmlSnippet)
  row.security = sec
  return row
}

function matchRows(rows, predicate) {
  return rows.filter(predicate)
}

function overviewItem(id, label, count, total, predicate) {
  return {
    id,
    label,
    count,
    pct: pct(count, total),
    predicate,
  }
}

export function buildResponseCodeOverview(rows, seedHost) {
  const pool = rows.filter((r) => isInternal(r, seedHost) && !r._external)
  const total = pool.length || 1

  const is2xx = (r) => {
    const s = rowStatus(r)
    return s >= 200 && s < 300 && !hasRedirectMeta(r)
  }
  const is3xx = (r) => {
    const s = rowStatus(r)
    return (s >= 300 && s < 400) || hasRedirectMeta(r) || !!r.redirectLocation
  }
  const is4xx = (r) => {
    const s = rowStatus(r)
    return s >= 400 && s < 500
  }
  const is5xx = (r) => rowStatus(r) >= 500
  const isNoResponse = (r) => rowStatus(r) === 0 || !!r.error
  const isBlocked = (r) => r.blockedByRobots === true

  const items = [
    overviewItem('resp_all', 'Todo', pool.length, pool.length, () => true),
    overviewItem('resp_blocked', 'Bloqueado por Robots.txt', matchRows(pool, isBlocked).length, total, isBlocked),
    overviewItem('resp_noresponse', 'Sin respuesta', matchRows(pool, isNoResponse).length, total, isNoResponse),
    overviewItem('resp_2xx', 'Completado (2xx)', matchRows(pool, is2xx).length, total, is2xx),
    overviewItem('resp_3xx', 'Redirección (3xx)', matchRows(pool, is3xx).length, total, is3xx),
    overviewItem('resp_4xx', 'Error cliente (4xx)', matchRows(pool, is4xx).length, total, is4xx),
    overviewItem('resp_5xx', 'Error servidor (5xx)', matchRows(pool, is5xx).length, total, is5xx),
  ]

  // Desglose por código exacto
  const byCode = new Map()
  for (const r of pool) {
    const s = rowStatus(r) || (r.error ? 0 : 200)
    const key = s === 0 ? '0' : String(s)
    if (!byCode.has(key)) byCode.set(key, [])
    byCode.get(key).push(r)
  }

  const codeItems = [...byCode.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([code, list]) =>
      overviewItem(
        `resp_code_${code}`,
        `HTTP ${code}`,
        list.length,
        total,
        (r) => String(rowStatus(r) || (r.error ? 0 : '')) === code,
      ),
    )

  return {
    id: 'response',
    title: 'Códigos de respuesta',
    subtitle: 'Interna',
    items,
    codeItems,
  }
}

export function buildSecurityOverview(rows, seedHost) {
  const pool = rows.filter((r) => isInternal(r, seedHost) && !r._external && rowStatus(r) > 0)
  const total = pool.length || 1

  const sec = (r) => r.security || analyzeRowSecurity(r)

  const items = [
    overviewItem('sec_all', 'Todo', pool.length, total, () => true),
    overviewItem('sec_http', 'URL HTTP', matchRows(pool, (r) => sec(r).isHttp).length, total, (r) => sec(r).isHttp),
    overviewItem('sec_https', 'URL HTTPS', matchRows(pool, (r) => sec(r).isHttps).length, total, (r) => sec(r).isHttps),
    overviewItem(
      'sec_mixed',
      'Contenido mixto',
      matchRows(pool, (r) => sec(r).mixedContent).length,
      total,
      (r) => sec(r).mixedContent,
    ),
    overviewItem(
      'sec_form_insecure',
      'Formulario en URL HTTP',
      matchRows(pool, (r) => sec(r).insecureForm).length,
      total,
      (r) => sec(r).insecureForm,
    ),
    overviewItem(
      'sec_cross_origin',
      'Enlaces entre orígenes no seguros',
      matchRows(pool, (r) => sec(r).crossOriginInsecure).length,
      total,
      (r) => sec(r).crossOriginInsecure,
    ),
    overviewItem(
      'sec_protocol_relative',
      'Enlaces de recursos relativos al protocolo',
      matchRows(pool, (r) => sec(r).protocolRelative).length,
      total,
      (r) => sec(r).protocolRelative,
    ),
    overviewItem(
      'sec_no_hsts',
      'Falta encabezado HSTS',
      matchRows(pool, (r) => sec(r).missingHsts).length,
      total,
      (r) => sec(r).missingHsts,
    ),
    overviewItem(
      'sec_no_csp',
      'Falta encabezado Content-Security-Policy',
      matchRows(pool, (r) => sec(r).missingCsp).length,
      total,
      (r) => sec(r).missingCsp,
    ),
    overviewItem(
      'sec_no_xcto',
      'Falta encabezado X-Content-Type-Options',
      matchRows(pool, (r) => sec(r).missingXContentType).length,
      total,
      (r) => sec(r).missingXContentType,
    ),
    overviewItem(
      'sec_no_xfo',
      'Falta encabezado X-Frame-Options',
      matchRows(pool, (r) => sec(r).missingXFrame).length,
      total,
      (r) => sec(r).missingXFrame,
    ),
    overviewItem(
      'sec_no_referrer',
      'Falta encabezado Secure Referrer-Policy',
      matchRows(pool, (r) => sec(r).missingReferrerPolicy).length,
      total,
      (r) => sec(r).missingReferrerPolicy,
    ),
  ]

  return { id: 'security', title: 'Seguridad', items }
}

export function buildIssuesOverview(results) {
  const { issues } = analyzeCrawlResults(results || [])
  const total = (results || []).length || 1

  return {
    id: 'issues',
    title: 'Problemas',
    items: issues.map((iss, i) => ({
      id: `issue_${i}`,
      label: iss.nombre,
      count: iss.urls,
      pct: iss.pct || pct(iss.urls, total),
      issueRef: iss,
      predicate: (row) => {
        if (iss.urlList?.length) return iss.urlList.includes(row.url)
        if (iss.issueId?.startsWith('status_')) {
          const code = iss.issueId.slice('status_'.length)
          if (/^\d+$/.test(code)) return String(rowStatus(row)) === code
        }
        if (iss.issueId === 'multi_h1') return (row.h1Count ?? 0) > 1
        if (iss.issueId === 'empty_title') {
          const t = (row.scannerValues?.[SCAN_COL.TITLE] || row.title || '').trim()
          return !t
        }
        return false
      },
    })),
  }
}

export function buildSpiderOverviewSections(rows, seedHost) {
  return [
    buildSecurityOverview(rows, seedHost),
    buildResponseCodeOverview(rows, seedHost),
    buildIssuesOverview(rows),
  ]
}

export function findOverviewPredicate(sections, filterId) {
  if (!filterId) return null
  for (const sec of sections) {
    for (const item of sec.items || []) {
      if (item.id === filterId) return item.predicate
    }
    for (const item of sec.codeItems || []) {
      if (item.id === filterId) return item.predicate
    }
  }
  return null
}

export function applyOverviewFilter(rows, filterId, sections) {
  const pred = findOverviewPredicate(sections, filterId)
  if (!pred) return rows
  return rows.filter(pred)
}
