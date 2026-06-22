/**
 * Cálculo de puntuaciones SEO compartido entre content script y popup.
 */
export function prepareDataForScoring(data) {
  if (!data) return data

  data.metaTags = data.metaTags ?? {}
  data.schemas = data.schemas ?? []

  if (data.metaRobots?.content && data.metaRobots.noindex === undefined) {
    const robots = data.metaRobots.content.toLowerCase()
    data.metaRobots.noindex = robots.includes('noindex')
    data.metaRobots.nofollow = robots.includes('nofollow')
  }

  if (data.canonical?.url && data.url && data.canonical.matches === undefined) {
    try {
      const canonicalHref = new URL(data.canonical.url).href.replace(/\/$/, '')
      const pageHref = new URL(data.url).href.replace(/\/$/, '')
      data.canonical.matches = canonicalHref === pageHref
    } catch {
      data.canonical.matches = false
    }
  }

  if (data.headers?.count) {
    const c = data.headers.count
    const h1 = c.h1 ?? 0
    const h2 = c.h2 ?? 0
    const h3 = c.h3 ?? 0
    const h4 = c.h4 ?? 0
    const h5 = c.h5 ?? 0
    const h6 = c.h6 ?? 0
    const total = c.total ?? h1 + h2 + h3 + h4 + h5 + h6

    data.headers.count = { h1, h2, h3, h4, h5, h6, total }

    if (!data.headers.structure) {
      data.headers.structure = {
        hasH1: h1 > 0,
        hasMultipleH1: h1 > 1,
        hasH2: h2 > 0,
        properHierarchy: true,
      }
    }
    data.headers.issues = data.headers.issues ?? []
    data.headers.warnings = data.headers.warnings ?? []
  }

  return data
}

export function calculateScores(data) {
  prepareDataForScoring(data)

  let seoScore = 100
  let performanceScore = 100
  let contentScore = 100
  const seoIssues = []
  const performanceIssues = []
  const contentIssues = []

  if (!data.title || data.title.length === 0) {
    seoScore -= 20
    seoIssues.push('Falta el título de la página (etiqueta <title>)')
  } else if (data.title.length < 30) {
    seoScore -= 10
    seoIssues.push('El título es muy corto (menos de 30 caracteres). Idealmente 30-60 caracteres.')
  } else if (data.title.length > 60) {
    seoScore -= 10
    seoIssues.push('El título es muy largo (más de 60 caracteres). Google lo truncará.')
  }

  if (!data.metaTags['description']) {
    seoScore -= 15
    seoIssues.push('Falta la meta description. Es fundamental para el CTR en los resultados de búsqueda.')
  } else if (data.metaTags['description'].length < 120 || data.metaTags['description'].length > 160) {
    seoScore -= 5
    seoIssues.push('La meta description debe tener entre 120-160 caracteres para una visualización óptima.')
  }

  if (!data.metaTags['og:title']) {
    seoScore -= 5
    seoIssues.push('Falta og:title para compartido en redes sociales.')
  }

  if (data.schemas.length === 0) {
    seoScore -= 10
    seoIssues.push('No se detectó Schema Markup (JSON-LD). Añádelo para mejorar la visibilidad en resultados enriquecidos.')
  } else if (data.schemas.some((s) => !s.isValid)) {
    seoScore -= 5
    seoIssues.push('Algunos Schema tienen errores. Revísalos y corrige los campos requeridos.')
  }

  if (data.keywordCannibalization && data.keywordCannibalization.count > 0) {
    seoScore -= 10
    seoIssues.push(
      `Canibalización de keywords: ${data.keywordCannibalization.count} texto(s) duplicado(s) en el menú. Usa textos distintos para cada enlace.`,
    )
  }

  if (data.metaRobots && data.metaRobots.noindex) {
    seoScore = 0
    seoIssues.push('¡CRÍTICO: Esta página tiene noindex! Google NO puede indexar esta página. Elimina esta etiqueta.')
  }

  if (data.canonical && !data.canonical.exists) {
    seoScore -= 10
    seoIssues.push('Falta URL canónica. Puede causar problemas de contenido duplicado.')
  } else if (data.canonical && data.canonical.matches === false) {
    seoScore -= 5
    seoIssues.push('La URL canónica no coincide con la URL actual. Verifica que sea correcta.')
  }

  if (data.titleWidth && data.titleWidth.isTooLong) {
    seoScore -= 5
    seoIssues.push(`El título es demasiado ancho (${Math.round(data.titleWidth.width)}px). Google lo truncará.`)
  }

  if (data.nofollowInternal && data.nofollowInternal.nofollowCount > 0) {
    seoScore -= 5
    seoIssues.push(
      `${data.nofollowInternal.nofollowCount} enlace(s) interno(s) tienen nofollow. Esto bloquea el paso de autoridad a tus páginas.`,
    )
  }

  if (data.langTag && (!data.langTag.htmlLang || data.langTag.htmlLang === 'No definido')) {
    seoScore -= 5
    seoIssues.push('Falta el atributo lang en <html>. Es importante para el SEO internacional.')
  } else if (data.langTag && !data.langTag.matches && data.langTag.detectedLang !== 'No detectado') {
    seoScore -= 5
    seoIssues.push(`El atributo lang="${data.langTag.htmlLang}" no coincide con el idioma detectado.`)
  }

  if (data.favicons && data.favicons.missing && data.favicons.missing.length > 0) {
    seoScore -= 3
    seoIssues.push(`Faltan iconos: ${data.favicons.missing.join(', ')}. Mejora la experiencia de marca.`)
  }

  if (data.socialTags && data.socialTags.count < 8) {
    seoScore -= 3
    seoIssues.push(`Faltan etiquetas sociales (tienes ${data.socialTags.count}/12). Añade más para mejor compartido.`)
  }

  if (data.stopWordsURL && (data.stopWordsURL.isTooLong || data.stopWordsURL.stopWordsCount > 0)) {
    seoScore -= 3
    if (data.stopWordsURL.isTooLong) {
      seoIssues.push(`La URL es muy larga (${data.stopWordsURL.urlLength} caracteres). Idealmente menos de 75.`)
    }
    if (data.stopWordsURL.stopWordsCount > 0) {
      seoIssues.push(`La URL contiene palabras innecesarias: ${data.stopWordsURL.stopWords.join(', ')}.`)
    }
  }

  if (data.performance) {
    if (data.performance.load > 3000) {
      performanceScore -= 30
      performanceIssues.push(
        `Tiempo de carga muy lento (${Math.round(data.performance.load)}ms). Idealmente menos de 3 segundos.`,
      )
    } else if (data.performance.load > 2000) {
      performanceScore -= 20
      performanceIssues.push(
        `Tiempo de carga lento (${Math.round(data.performance.load)}ms). Optimiza imágenes y reduce código.`,
      )
    } else if (data.performance.load > 1000) {
      performanceScore -= 10
      performanceIssues.push(`Tiempo de carga moderado (${Math.round(data.performance.load)}ms). Puede mejorarse.`)
    }

    if (data.performance.dom > 1000) {
      performanceScore -= 15
      performanceIssues.push(`Procesamiento DOM lento (${Math.round(data.performance.dom)}ms). Reduce la complejidad del HTML.`)
    }

    if (data.performance.response > 500) {
      performanceScore -= 10
      performanceIssues.push(`Respuesta del servidor lenta (${Math.round(data.performance.response)}ms).`)
    }
  }

  if (data.domDepth && data.domDepth.averageDepth > 15) {
    performanceScore -= 15
    performanceIssues.push(
      `El contenido está muy profundo en el DOM (${data.domDepth.averageDepth} niveles). Muchas capas de <div> ralentizan el renderizado.`,
    )
  } else if (data.domDepth && data.domDepth.averageDepth > 10) {
    performanceScore -= 5
    performanceIssues.push(`Profundidad DOM alta (${data.domDepth.averageDepth} niveles). Considera simplificar la estructura.`)
  }

  if (data.lazyLoading && data.lazyLoading.nonLazyImages > 0) {
    performanceScore -= 15
    performanceIssues.push(
      `${data.lazyLoading.nonLazyImages} imagen(es) fuera de la pantalla no tienen loading="lazy". Esto afecta la velocidad inicial.`,
    )
  }

  if (data.textHTMLRatio && data.textHTMLRatio.ratio < 15) {
    performanceScore -= 10
    performanceIssues.push(
      `Ratio texto/HTML muy bajo (${data.textHTMLRatio.ratio}%). Hay demasiado código HTML comparado con contenido. Idealmente >15%.`,
    )
  } else if (data.textHTMLRatio && data.textHTMLRatio.ratio < 25) {
    performanceScore -= 5
    performanceIssues.push(`Ratio texto/HTML puede mejorarse (${data.textHTMLRatio.ratio}%). Idealmente >25%.`)
  }

  if (data.iframes && data.iframes.count > 5) {
    performanceScore -= 10
    performanceIssues.push(
      `Muchos iframes (${data.iframes.count}). Pueden ralentizar la carga y el contenido podría no indexarse correctamente.`,
    )
  } else if (data.iframes && data.iframes.count > 3) {
    performanceScore -= 5
    performanceIssues.push(`${data.iframes.count} iframes detectados. Verifica que sean necesarios.`)
  }

  if (!data.text || data.text.length < 300) {
    contentScore -= 30
    contentIssues.push('Muy poco contenido visible en la página (menos de 300 caracteres). Google valora el contenido de calidad.')
  } else if (data.text.length < 500) {
    contentScore -= 15
    contentIssues.push(`Poco contenido (${data.text.length} caracteres). Idealmente más de 500 caracteres.`)
  }

  if (data.headers?.structure) {
    if (data.headers.structure.hasMultipleH1) {
      contentScore -= 30
      contentIssues.push(
        `CRÍTICO: Hay ${data.headers.count.h1} etiquetas H1. Debe haber SOLO UNA. Múltiples H1 confunden a Google.`,
      )
    } else if (!data.headers.structure.hasH1) {
      contentScore -= 25
      contentIssues.push('CRÍTICO: Falta la etiqueta H1. Es fundamental para el SEO. Cada página debe tener exactamente UN H1.')
    }

    if (!data.headers.structure.properHierarchy) {
      contentScore -= 15
      contentIssues.push('Los headers no siguen una jerarquía correcta (ej: H2 seguido de H4). Usa el orden H1 → H2 → H3.')
    }

    if (!data.headers.structure.hasH2 && data.headers.count.total > 1) {
      contentScore -= 10
      contentIssues.push('No se encontraron H2. Los H2 ayudan a estructurar el contenido en secciones principales.')
    }

    if (data.headers.issues.length > 0) {
      data.headers.issues.forEach((issue) => {
        contentIssues.push(issue.message)
      })
    }

    if (data.headers.warnings.length > 0) {
      data.headers.warnings.slice(0, 3).forEach((warning) => {
        if (warning.type === 'warning') {
          contentIssues.push(warning.message)
        }
      })
    }
  } else if (data.headers?.count) {
    const h1Count = data.headers.count.h1 ?? 0
    const h2Count = data.headers.count.h2 ?? 0
    if (h1Count === 0) {
      contentScore -= 25
      contentIssues.push('Falta la etiqueta H1. Es fundamental para el SEO. Cada página debe tener un H1 único.')
    } else if (h1Count > 1) {
      contentScore -= 30
      contentIssues.push(`Hay ${h1Count} etiquetas H1. Debe haber solo UNA por página.`)
    }
    if (h2Count === 0 && data.text && data.text.length > 500) {
      contentScore -= 5
      contentIssues.push('No se encontraron etiquetas H2. Usa H2 para estructurar el contenido.')
    }
  }

  if (data.accessibility && data.accessibility.issues.length > 0) {
    const accessibilityPenalty = Math.min(30, data.accessibility.issues.length * 8)
    contentScore -= accessibilityPenalty
    data.accessibility.issues.forEach((issue) => {
      if (issue.type === 'font-size') {
        contentIssues.push(
          `${issue.count} elemento(s) tienen fuente menor a 12px. Google penaliza texto pequeño en móviles.`,
        )
      } else if (issue.type === 'contrast') {
        contentIssues.push(`${issue.count} elemento(s) tienen bajo contraste de color. Mínimo recomendado: 4.5:1.`)
      } else if (issue.type === 'touch-target') {
        contentIssues.push(
          `${issue.count} botón(es) son muy pequeños (<44x44px). Afecta la usabilidad móvil y Core Web Vitals.`,
        )
      }
    })
  }

  if (data.links && data.links.length < 5) {
    contentScore -= 5
    contentIssues.push('Muy pocos enlaces en la página. Los enlaces internos ayudan a la navegación y SEO.')
  }

  if (data.internalAnchors && data.internalAnchors.count > 0 && data.internalAnchors.validCount < data.internalAnchors.count) {
    contentScore -= 5
    const invalid = data.internalAnchors.count - data.internalAnchors.validCount
    contentIssues.push(
      `${invalid} enlace(s) interno(s) (#) apuntan a elementos que no existen. Google los usa para "Jump links".`,
    )
  }

  const finalSeoScore = Math.max(0, Math.min(100, seoScore))
  const finalPerformanceScore = Math.max(0, Math.min(100, performanceScore))
  const finalContentScore = Math.max(0, Math.min(100, contentScore))
  const overall = Math.round((finalSeoScore + finalPerformanceScore + finalContentScore) / 3)

  const seoReasons = []
  const performanceReasons = []
  const contentReasons = []

  if (finalSeoScore >= 80) {
    seoReasons.push('Excelente optimización técnica SEO')
  } else if (finalSeoScore >= 60) {
    seoReasons.push('Buena base SEO con algunos aspectos a mejorar')
  } else {
    seoReasons.push('SEO necesita mejoras significativas')
  }

  if (finalPerformanceScore >= 80) {
    performanceReasons.push('Velocidad de carga excelente')
  } else if (finalPerformanceScore >= 60) {
    performanceReasons.push('Rendimiento aceptable pero mejorable')
  } else {
    performanceReasons.push('Rendimiento necesita optimización urgente')
  }

  if (finalContentScore >= 80) {
    contentReasons.push('Contenido de calidad y bien estructurado')
  } else if (finalContentScore >= 60) {
    contentReasons.push('Contenido adecuado con espacio para mejoras')
  } else {
    contentReasons.push('El contenido necesita más desarrollo')
  }

  return {
    seo: finalSeoScore,
    performance: finalPerformanceScore,
    content: finalContentScore,
    overall,
    explanations: {
      seo: {
        reasons: seoReasons,
        issues: seoIssues.length > 0 ? seoIssues : ['¡Excelente! No se encontraron problemas en SEO On-Page.'],
      },
      performance: {
        reasons: performanceReasons,
        issues: performanceIssues.length > 0 ? performanceIssues : ['¡Excelente! El rendimiento es óptimo.'],
      },
      content: {
        reasons: contentReasons,
        issues: contentIssues.length > 0 ? contentIssues : ['¡Excelente! El contenido está bien optimizado.'],
      },
    },
  }
}
