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

  const pct = (n) => `${((n / total) * 100).toFixed(2).replace('.', ',')}`

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
        nombre: `Títulos duplicados (${urls.length} URLs): «${t.slice(0, 70)}${t.length > 70 ? '…' : ''}»`,
        tipo: 'Aviso',
        prioridad: 'Media',
        urls: urls.length,
        pct: pct(urls.length),
        detalle: urls.slice(0, 8).join(' | '),
      })
    }
  }

  for (const [h, urls] of byH1) {
    if (urls.length > 1) {
      issues.push({
        nombre: `H1 duplicado (${urls.length} URLs): «${h.slice(0, 70)}${h.length > 70 ? '…' : ''}»`,
        tipo: 'Aviso',
        prioridad: 'Alta',
        urls: urls.length,
        pct: pct(urls.length),
        detalle: urls.slice(0, 8).join(' | '),
      })
    }
  }

  for (const [m, urls] of byMeta) {
    if (urls.length > 1) {
      issues.push({
        nombre: `Meta description duplicada (${urls.length} URLs)`,
        tipo: 'Oportunidad',
        prioridad: 'Baja',
        urls: urls.length,
        pct: pct(urls.length),
        detalle: urls.slice(0, 6).join(' | '),
      })
    }
  }

  const multiH1Pages = pages.filter((r) => r.h1Count != null && r.h1Count > 1)
  if (multiH1Pages.length > 0) {
    issues.push({
      nombre: `URLs con más de un H1: ${multiH1Pages.length}`,
      tipo: 'Problema',
      prioridad: 'Alta',
      urls: multiH1Pages.length,
      pct: pct(multiH1Pages.length),
      detalle: multiH1Pages
        .slice(0, 6)
        .map((r) => r.url)
        .join(' | '),
    })
  }

  const emptyTitle = pages.filter((r) => !norm(r.scannerValues[SCAN_COL.TITLE])).length
  if (emptyTitle > 0) {
    issues.push({
      nombre: `Páginas sin título (HTML): ${emptyTitle}`,
      tipo: 'Aviso',
      prioridad: 'Media',
      urls: emptyTitle,
      pct: pct(emptyTitle),
    })
  }

  const status404 = (results || []).filter((r) => r.status === 404).length
  if (status404 > 0) {
    issues.push({
      nombre: `Respuestas 404 encontradas: ${status404}`,
      tipo: 'Problema',
      prioridad: 'Alta',
      urls: status404,
      pct: pct(status404),
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
