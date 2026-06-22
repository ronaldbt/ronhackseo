/**
 * Análisis de encabezados H1–H6 (ejecutable en content script o vía executeScript en la página).
 */
export function analyzeHeaders(root = document) {
  const headers = {
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
  }

  const allHeaders = []
  const allElements = root.querySelectorAll('h1, h2, h3, h4, h5, h6')

  allElements.forEach((header, index) => {
    const level = parseInt(header.tagName.charAt(1), 10)
    const text = header.textContent.trim()
    const id = header.id || null

    const headerData = {
      level,
      tag: header.tagName.toLowerCase(),
      text: text.substring(0, 200),
      fullText: text,
      id,
      index,
    }

    headers[`h${level}`].push(headerData)
    allHeaders.push(headerData)
  })

  const issues = []
  const warnings = []
  let score = 100

  if (headers.h1.length === 0) {
    issues.push({
      type: 'critical',
      message: 'Falta H1. Cada página debe tener exactamente UN H1. Es el elemento más importante para SEO.',
    })
    score -= 25
  } else if (headers.h1.length > 1) {
    issues.push({
      type: 'critical',
      message: `Hay ${headers.h1.length} etiquetas H1. Debe haber SOLO UNA. Múltiples H1 confunden a Google sobre el tema principal de la página.`,
    })
    score -= 30
  } else {
    const h1Text = headers.h1[0].fullText
    if (h1Text.length < 20) {
      warnings.push({
        type: 'warning',
        message: `El H1 es muy corto (${h1Text.length} caracteres). Idealmente entre 20-60 caracteres.`,
      })
      score -= 5
    } else if (h1Text.length > 70) {
      warnings.push({
        type: 'warning',
        message: `El H1 es muy largo (${h1Text.length} caracteres). Idealmente entre 20-60 caracteres.`,
      })
      score -= 5
    }

    const pageTitle = root.title?.trim() || ''
    if (pageTitle && h1Text.toLowerCase() === pageTitle.toLowerCase()) {
      warnings.push({
        type: 'info',
        message: 'El H1 es idéntico al título de la página. Considera variar ligeramente para mejor SEO.',
      })
    }
  }

  let previousLevel = 0
  let skippedLevels = 0

  allHeaders.forEach((header, index) => {
    if (index > 0) {
      const levelDiff = header.level - previousLevel
      if (levelDiff > 1) {
        skippedLevels++
        warnings.push({
          type: 'warning',
          message: `Estructura incorrecta: ${allHeaders[index - 1].tag.toUpperCase()} seguido de ${header.tag.toUpperCase()}. Debes seguir el orden jerárquico (H1 → H2 → H3).`,
        })
      }
    }
    previousLevel = header.level
  })

  if (skippedLevels > 0) {
    score -= Math.min(15, skippedLevels * 3)
  }

  const totalHeaders = allHeaders.length
  if (totalHeaders === 0) {
    issues.push({
      type: 'critical',
      message: 'No se encontraron headers (H1-H6). Los headers estructuran el contenido y son esenciales para SEO.',
    })
    score -= 30
  } else if (totalHeaders < 3 && headers.h2.length === 0) {
    warnings.push({
      type: 'warning',
      message: 'Muy pocos headers. Considera usar H2 para estructurar el contenido en secciones.',
    })
    score -= 10
  }

  if (headers.h2.length === 0 && totalHeaders > 1) {
    warnings.push({
      type: 'warning',
      message: 'No se encontraron H2. Los H2 ayudan a estructurar el contenido en secciones principales.',
    })
    score -= 5
  }

  const emptyHeaders = allHeaders.filter((h) => h.fullText.length < 3)
  if (emptyHeaders.length > 0) {
    warnings.push({
      type: 'warning',
      message: `${emptyHeaders.length} header(s) están vacíos o casi vacíos. Elimínalos o añade contenido.`,
    })
    score -= 5
  }

  const longHeaders = allHeaders.filter((h) => h.fullText.length > 120)
  if (longHeaders.length > 0) {
    warnings.push({
      type: 'info',
      message: `${longHeaders.length} header(s) son muy largos (>120 caracteres). Considera acortarlos.`,
    })
    score -= 2
  }

  Object.keys(headers).forEach((tag) => {
    const count = headers[tag].length
    if (tag === 'h3' && count > 20) {
      warnings.push({
        type: 'info',
        message: `Muchos ${tag.toUpperCase()} (${count}). Considera reorganizar el contenido en más H2.`,
      })
    }
  })

  return {
    headers: allHeaders,
    count: {
      h1: headers.h1.length,
      h2: headers.h2.length,
      h3: headers.h3.length,
      h4: headers.h4.length,
      h5: headers.h5.length,
      h6: headers.h6.length,
      total: totalHeaders,
    },
    issues,
    warnings,
    score: Math.max(0, Math.min(100, score)),
    structure: {
      hasH1: headers.h1.length === 1,
      hasMultipleH1: headers.h1.length > 1,
      hasH2: headers.h2.length > 0,
      properHierarchy: skippedLevels === 0,
    },
  }
}

/** Función autocontenida para chrome.scripting.executeScript (sin imports). */
export function analyzeHeadersInPage() {
  const headers = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] }
  const allHeaders = []
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((header, index) => {
    const level = parseInt(header.tagName.charAt(1), 10)
    const text = header.textContent.trim()
    const headerData = {
      level,
      tag: header.tagName.toLowerCase(),
      text: text.substring(0, 200),
      fullText: text,
      id: header.id || null,
      index,
    }
    headers[`h${level}`].push(headerData)
    allHeaders.push(headerData)
  })

  const issues = []
  const warnings = []
  let skippedLevels = 0
  let previousLevel = 0
  allHeaders.forEach((header, index) => {
    if (index > 0) {
      const levelDiff = header.level - previousLevel
      if (levelDiff > 1) {
        skippedLevels++
        warnings.push({
          type: 'warning',
          message: `Estructura incorrecta: ${allHeaders[index - 1].tag.toUpperCase()} seguido de ${header.tag.toUpperCase()}.`,
        })
      }
    }
    previousLevel = header.level
  })

  const totalHeaders = allHeaders.length
  if (headers.h1.length === 0) {
    issues.push({ type: 'critical', message: 'Falta H1 en la página.' })
  } else if (headers.h1.length > 1) {
    issues.push({ type: 'critical', message: `Hay ${headers.h1.length} etiquetas H1. Debe haber solo una.` })
  }
  if (totalHeaders === 0) {
    issues.push({ type: 'critical', message: 'No se encontraron headers (H1-H6).' })
  }

  return {
    headers: allHeaders,
    count: {
      h1: headers.h1.length,
      h2: headers.h2.length,
      h3: headers.h3.length,
      h4: headers.h4.length,
      h5: headers.h5.length,
      h6: headers.h6.length,
      total: totalHeaders,
    },
    issues,
    warnings,
    score: 100,
    structure: {
      hasH1: headers.h1.length === 1,
      hasMultipleH1: headers.h1.length > 1,
      hasH2: headers.h2.length > 0,
      properHierarchy: skippedLevels === 0,
    },
  }
}
