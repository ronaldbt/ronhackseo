/**
 * Snapshot de Core Web Vitals desde Performance API (pestaña ya cargada).
 * Ejecutable en content script / executeScript.
 */
export function collectWebVitalsSnapshot() {
  const vitals = {
    lcp: null,
    cls: null,
    inp: null,
    fcp: null,
    ttfb: null,
    fid: null,
  }

  try {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav) {
      vitals.ttfb = Math.round(nav.responseStart - nav.requestStart)
    }

    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
    if (fcpEntry) {
      vitals.fcp = Math.round(fcpEntry.startTime)
    }

    const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
    if (lcpEntries.length > 0) {
      vitals.lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime)
    }

    let clsValue = 0
    for (const entry of performance.getEntriesByType('layout-shift')) {
      if (!entry.hadRecentInput) clsValue += entry.value
    }
    if (clsValue > 0) {
      vitals.cls = Math.round(clsValue * 1000) / 1000
    }

    const fi = performance.getEntriesByType('first-input')[0]
    if (fi) {
      vitals.fid = Math.round(fi.processingStart - fi.startTime)
    }

    let maxInteraction = 0
    for (const entry of performance.getEntriesByType('event')) {
      if (entry.interactionId && entry.duration > maxInteraction) {
        maxInteraction = entry.duration
      }
    }
    if (maxInteraction > 0) {
      vitals.inp = Math.round(maxInteraction)
    } else if (vitals.fid != null) {
      vitals.inp = vitals.fid
    }
  } catch {
    /* ignore */
  }

  return vitals
}

export function collectWebVitalsInPage() {
  return collectWebVitalsSnapshot()
}

export function rateWebVital(name, value) {
  if (value == null || Number.isNaN(value)) return 'unknown'
  const thresholds = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    ttfb: [800, 1800],
    cls: [0.1, 0.25],
    inp: [200, 500],
    fid: [100, 300],
  }
  const t = thresholds[name]
  if (!t) return 'unknown'
  if (name === 'cls') {
    if (value <= t[0]) return 'good'
    if (value <= t[1]) return 'needs-improvement'
    return 'poor'
  }
  if (value <= t[0]) return 'good'
  if (value <= t[1]) return 'needs-improvement'
  return 'poor'
}
