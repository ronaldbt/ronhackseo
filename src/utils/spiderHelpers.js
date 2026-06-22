import { SCANNER_COLUMNS } from '../constants/scannerColumns.js'
import { analyzeCrawlResults } from './crawlDuplicateAnalysis.js'

/** Índices de columnas clave (alineados con scannerColumns.js). */
export const COL = {
  URL: 0,
  CONTENT_TYPE: 1,
  STATUS: 2,
  RESPONSE: 3,
  INDEXABILITY: 4,
  INDEX_STATE: 5,
  TITLE: 6,
  H1: 14,
  META_DESC: 9,
  CANONICAL: 23,
}

export const SPIDER_FILTERS = [
  { id: 'internal', label: 'Internal' },
  { id: 'external', label: 'External' },
  { id: 'html', label: 'HTML' },
  { id: 'errors', label: 'Errores' },
  { id: 'noindex', label: 'No index' },
  { id: 'current', label: 'Página actual' },
]

export function scannerCells(row) {
  const v = row?.scannerValues
  if (Array.isArray(v) && v.length === SCANNER_COLUMNS.length) return v
  if (row?.url) {
    const cells = Array(SCANNER_COLUMNS.length).fill('—')
    cells[COL.URL] = row.url
    if (row.status) cells[COL.STATUS] = String(row.status)
    if (row.contentType) cells[COL.CONTENT_TYPE] = row.contentType
    return cells
  }
  return Array(SCANNER_COLUMNS.length).fill('—')
}

export function cellsFromScannerValues(values) {
  if (!Array.isArray(values) || values.length !== SCANNER_COLUMNS.length) {
    return Array(SCANNER_COLUMNS.length).fill('—')
  }
  return values
}

export function buildCurrentPageRow(url, scannerValues) {
  return {
    url: url || scannerValues?.[COL.URL] || '',
    status: Number(scannerValues?.[COL.STATUS]) || 200,
    contentType: scannerValues?.[COL.CONTENT_TYPE] || 'text/html',
    title: scannerValues?.[COL.TITLE] || '',
    crawlRowKind: 'html',
    scannerValues: cellsFromScannerValues(scannerValues),
    isCurrentPage: true,
    outlinksInternal: [],
    outlinksExternal: [],
  }
}

function isExternalRow(row, seedHost) {
  if (row._external) return true
  try {
    const u = new URL(row.url)
    const h = seedHost?.toLowerCase().replace(/^www\./, '')
    const rh = u.hostname.toLowerCase().replace(/^www\./, '')
    return h && rh !== h
  } catch {
    return false
  }
}

function isErrorRow(row) {
  const s = row.status || Number(row.scannerValues?.[COL.STATUS])
  return s >= 400 || s === 0
}

function isNoindexRow(row) {
  const idx = String(row.scannerValues?.[COL.INDEXABILITY] || '').toLowerCase()
  const state = String(row.scannerValues?.[COL.INDEX_STATE] || '').toLowerCase()
  return idx.includes('no index') || state.includes('noindex') || state.includes('no index')
}

function isHtmlRow(row) {
  const ct = String(row.contentType || row.scannerValues?.[COL.CONTENT_TYPE] || '').toLowerCase()
  return row.crawlRowKind === 'html' || ct.includes('text/html')
}

export function expandWithExternalLinks(crawlResults, seedHost) {
  const internal = [...(crawlResults || [])]
  const seen = new Set(internal.map((r) => r.url))
  const externalRows = []

  for (const row of internal) {
    for (const ext of row.outlinksExternal || []) {
      if (!ext || seen.has(ext)) continue
      seen.add(ext)
      externalRows.push({
        url: ext,
        status: 0,
        contentType: '',
        title: '',
        crawlRowKind: 'external',
        _external: true,
        scannerValues: null,
        outlinksInternal: [],
        outlinksExternal: [],
      })
    }
  }

  return { internal, external: externalRows, all: [...internal, ...externalRows] }
}

export function filterSpiderRows(rows, filterId, seedHost) {
  if (!rows?.length) return []
  switch (filterId) {
    case 'internal':
      return rows.filter((r) => !isExternalRow(r, seedHost))
    case 'external':
      return rows.filter((r) => isExternalRow(r, seedHost))
    case 'html':
      return rows.filter((r) => isHtmlRow(r) && !isExternalRow(r, seedHost))
    case 'errors':
      return rows.filter((r) => isErrorRow(r))
    case 'noindex':
      return rows.filter((r) => isNoindexRow(r))
    default:
      return rows
  }
}

export function searchRows(rows, query) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const cells = scannerCells(row)
    if (row.url?.toLowerCase().includes(q)) return true
    if (String(row.title || '').toLowerCase().includes(q)) return true
    return cells.some((c) => String(c ?? '').toLowerCase().includes(q))
  })
}

export function buildLinkGraph(results) {
  const inlinks = new Map()
  const outlinks = new Map()

  for (const row of results || []) {
    const url = row.url
    if (!url) continue
    const outs = [...(row.outlinksInternal || []), ...(row.outlinksExternal || [])]
    outlinks.set(url, outs)
    for (const target of row.outlinksInternal || []) {
      if (!inlinks.has(target)) inlinks.set(target, [])
      inlinks.get(target).push({ from: url, external: false })
    }
    for (const target of row.outlinksExternal || []) {
      if (!inlinks.has(target)) inlinks.set(target, [])
      inlinks.get(target).push({ from: url, external: true })
    }
  }

  return { inlinks, outlinks }
}

export function getRowDetail(row) {
  const cells = scannerCells(row)
  return {
    url: row.url || cells[COL.URL],
    status: row.status || cells[COL.STATUS],
    contentType: row.contentType || cells[COL.CONTENT_TYPE],
    title: row.title || cells[COL.TITLE] || '',
    h1: cells[COL.H1] || '',
    metaDescription: cells[COL.META_DESC] || '',
    canonical: cells[COL.CANONICAL] || '',
    indexability: cells[COL.INDEXABILITY] || '',
    indexState: cells[COL.INDEX_STATE] || '',
  }
}

export function deriveSummary(crawlResults, storedSummary, progress) {
  if (storedSummary) return storedSummary
  if (!crawlResults?.length) return null
  try {
    const { summary } = analyzeCrawlResults(crawlResults)
    if (progress?.finishReason) summary.finishReason = progress.finishReason
    return summary
  } catch {
    return null
  }
}

export function deriveIssues(crawlResults, storedIssues, storedSummary, progress) {
  if (storedIssues?.length) return storedIssues
  if (!crawlResults?.length) return []
  try {
    const { issues } = analyzeCrawlResults(crawlResults)
    return issues
  } catch {
    return []
  }
}

export function crawlSpeedUrlsPerSec(fetched, startedAt) {
  if (!startedAt || !fetched) return null
  const sec = (Date.now() - startedAt) / 1000
  if (sec < 0.5) return null
  return Math.round((fetched / sec) * 100) / 100
}

export { SCANNER_COLUMNS }
