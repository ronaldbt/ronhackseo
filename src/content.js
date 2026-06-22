// Content script para obtener datos de la página actual
// Se ejecuta en el contexto de la página web

import { computeLinkStats, buildScannerValues } from './utils/scannerRow.js'
import { applyHeaderVisualAudit } from './utils/headerVisualAudit.js'
import { calculateScores } from './utils/calculateScores.js'
import { analyzeHeaders } from './utils/headerAnalysis.js'
import { collectWebVitalsSnapshot } from './utils/webVitalsCollect.js'
import { extractPaaInPage } from './utils/keywordAnalysis.js'
import {
  detectSchemasInDocument,
  extractDetectedTypes,
  checkSchemaRecommendations,
  compactSchemasForTransport,
} from './utils/schemaDetect.js'
import { detectTechStack } from './utils/techStackDetect.js'
import { analyzeContentReadability } from './utils/contentReadability.js'
import { analyzeImageAltInDocument, analyzeOutboundLinksInDocument } from './utils/pageMediaLinks.js'
import {
  applyContentHighlights,
  removeContentHighlights,
} from './utils/contentTextHighlight.js'

async function fetchHttpMeta(url) {
  const out = {
    status: '',
    statusText: '',
    contentType: '',
    xRobotsTag: '',
    lastModified: '',
    httpVersion: '',
    contentLength: '',
  }
  try {
    const fetchHead = fetch(url, {
      method: 'HEAD',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'follow',
    })
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('HEAD timeout')), 2500),
    )
    const r = await Promise.race([fetchHead, timeout])
    out.status = r.status
    out.statusText = r.statusText || ''
    out.contentType = r.headers.get('content-type') || ''
    out.xRobotsTag = r.headers.get('x-robots-tag') || ''
    out.lastModified = r.headers.get('last-modified') || ''
    out.contentLength = r.headers.get('content-length') || ''
  } catch {
    /* HEAD puede fallar (CORS, método no permitido) */
  }
  return out
}

function detectSchemas() {
  return detectSchemasInDocument(document)
}

function checkSchemaRecommendationsLocal(schemas) {
  return checkSchemaRecommendations(schemas)
}

function checkAccessibility() {
  const issues = []
  const allElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, li, td, th')
  let smallFontCount = 0
  let lowContrastCount = 0
  
  // Función para obtener tamaño de fuente calculado
  function getFontSize(element) {
    const style = window.getComputedStyle(element)
    const fontSize = parseFloat(style.fontSize)
    return fontSize
  }
  
  // Función para calcular contraste
  function getContrastRatio(fgColor, bgColor) {
    function luminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(val => {
        val = val / 255
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }
    
    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }
    
    try {
      const fg = hexToRgb(fgColor) || {r: 0, g: 0, b: 0}
      const bg = hexToRgb(bgColor) || {r: 255, g: 255, b: 255}
      
      const l1 = luminance(fg.r, fg.g, fg.b)
      const l2 = luminance(bg.r, bg.g, bg.b)
      
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      
      return (lighter + 0.05) / (darker + 0.05)
    } catch {
      return 4.5 // Default, asume que está bien
    }
  }
  
  allElements.forEach(el => {
    const style = window.getComputedStyle(el)
    const fontSize = getFontSize(el)
    
    // Verificar tamaño de fuente mínimo (12px para móviles)
    if (fontSize < 12 && el.textContent.trim().length > 0) {
      smallFontCount++
    }
    
    // Verificar contraste
    const color = style.color
    const bgColor = style.backgroundColor
    
    // Convertir rgb/rgba a hex si es necesario
    function rgbToHex(rgb) {
      const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
      if (match) {
        return '#' + [1, 2, 3].map(i => {
          const hex = parseInt(match[i]).toString(16)
          return hex.length === 1 ? '0' + hex : hex
        }).join('')
      }
      return rgb.startsWith('#') ? rgb : '#000000'
    }
    
    if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
      const fgHex = rgbToHex(color)
      const bgHex = rgbToHex(bgColor)
      const contrast = getContrastRatio(fgHex, bgHex)
      
      if (contrast < 4.5 && el.textContent.trim().length > 10) {
        lowContrastCount++
      }
    }
  })
  
  if (smallFontCount > 0) {
    issues.push({
      type: 'font-size',
      count: smallFontCount,
      message: `Se encontraron ${smallFontCount} elementos con fuente menor a 12px. Google penaliza sitios con texto demasiado pequeño para móviles.`
    })
  }
  
  if (lowContrastCount > 0) {
    issues.push({
      type: 'contrast',
      count: lowContrastCount,
      message: `Se encontraron ${lowContrastCount} elementos con bajo contraste. El ratio mínimo recomendado es 4.5:1.`
    })
  }
  
  // Verificar touch targets (espaciado entre botones)
  const buttons = document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"]')
  let smallTouchTargets = 0
  
  buttons.forEach(btn => {
    const rect = btn.getBoundingClientRect()
    const minSize = 44 // 44x44px mínimo recomendado
    if (rect.width < minSize || rect.height < minSize) {
      smallTouchTargets++
    }
  })
  
  if (smallTouchTargets > 0) {
    issues.push({
      type: 'touch-target',
      count: smallTouchTargets,
      message: `Se encontraron ${smallTouchTargets} botones/enlaces menores a 44x44px. Los touch targets pequeños afectan la usabilidad móvil y Core Web Vitals.`
    })
  }
  
  return {
    issues,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 25))
  }
}

function detectHiddenContent() {
  const hiddenElements = []
  const allElements = document.querySelectorAll('*')
  
  allElements.forEach(el => {
    const style = window.getComputedStyle(el)
    const textContent = el.textContent || ''
    
    // Verificar si está oculto
    const isHidden = style.display === 'none' || 
                     style.visibility === 'hidden' ||
                     style.opacity === '0' ||
                     el.offsetParent === null
    
    // Si está oculto y tiene mucho texto, puede ser sospechoso
    if (isHidden && textContent.trim().length > 100) {
      hiddenElements.push({
        element: el.tagName,
        textLength: textContent.trim().length,
        textPreview: textContent.trim().substring(0, 100) + '...',
        reason: style.display === 'none' ? 'display: none' : 
                style.visibility === 'hidden' ? 'visibility: hidden' : 
                style.opacity === '0' ? 'opacity: 0' : 'otros métodos'
      })
    }
  })
  
  return {
    count: hiddenElements.length,
    elements: hiddenElements.slice(0, 10), // Limitar a los primeros 10
    warning: hiddenElements.length > 5 ? 'Se detectó mucho contenido oculto. Podría ser considerado Black Hat SEO y resultar en penalización de Google.' : null
  }
}

function analyzeDOMDepth() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, article, main')
  let maxDepth = 0
  let averageDepth = 0
  let depthSum = 0
  let elementCount = 0
  
  headings.forEach(el => {
    let depth = 0
    let parent = el.parentElement
    
    while (parent && parent !== document.body) {
      depth++
      parent = parent.parentElement
    }
    
    maxDepth = Math.max(maxDepth, depth)
    depthSum += depth
    elementCount++
  })
  
  averageDepth = elementCount > 0 ? Math.round(depthSum / elementCount) : 0
  
  return {
    maxDepth,
    averageDepth,
    warning: averageDepth > 15 ? 'El contenido está muy profundo en el DOM. Muchas capas de <div> pueden ralentizar el renderizado y afectar el SEO.' : null,
    score: averageDepth > 15 ? 50 : averageDepth > 10 ? 75 : 100
  }
}

function detectKeywordCannibalization() {
  const navs = document.querySelectorAll('nav')
  const anchorTexts = new Map()
  const duplicates = []
  
  navs.forEach(nav => {
    const links = nav.querySelectorAll('a[href]')
    links.forEach(link => {
      const text = link.textContent.trim().toLowerCase()
      if (text.length > 0) {
        if (anchorTexts.has(text)) {
          anchorTexts.set(text, anchorTexts.get(text) + 1)
        } else {
          anchorTexts.set(text, 1)
        }
      }
    })
  })
  
  anchorTexts.forEach((count, text) => {
    if (count > 1) {
      duplicates.push({
        text,
        count,
        message: `El texto "${text}" aparece ${count} veces en el menú de navegación. Esto puede confundir a Google sobre qué página es más importante.`
      })
    }
  })
  
  return {
    duplicates,
    count: duplicates.length,
    warning: duplicates.length > 0 ? 'Se detectó canibalización de keywords en el menú. Considera usar textos distintos para cada enlace.' : null
  }
}

function analyzeLazyLoading() {
  const images = document.querySelectorAll('img')
  let lazyImages = 0
  let nonLazyImages = 0
  const belowFoldImages = []
  
  const viewportHeight = window.innerHeight
  
  images.forEach(img => {
    const rect = img.getBoundingClientRect()
    const isBelowFold = rect.top > viewportHeight
    
    if (isBelowFold) {
      if (img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy') {
        lazyImages++
      } else {
        nonLazyImages++
        belowFoldImages.push({
          src: img.src || img.getAttribute('srcset') || 'N/A',
          alt: img.alt || 'Sin alt'
        })
      }
    }
  })
  
  return {
    lazyImages,
    nonLazyImages,
    belowFoldImages: belowFoldImages.slice(0, 10),
    score: nonLazyImages === 0 ? 100 : Math.max(0, 100 - (nonLazyImages / images.length) * 100),
    warning: nonLazyImages > 0 ? `${nonLazyImages} imágenes fuera de la pantalla no tienen loading="lazy". Esto afecta la velocidad de carga.` : null
  }
}

function verifyLangTag() {
  const htmlLang = document.documentElement.getAttribute('lang')
  const htmlLangAttribute = htmlLang || 'No definido'
  
  // Detectar idioma del contenido (simplificado)
  const bodyText = document.body.innerText || document.body.textContent || ''
  const commonWords = {
    es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no'],
    en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'],
    fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
    pt: ['o', 'de', 'e', 'do', 'da', 'em', 'um', 'uma', 'para', 'com']
  }
  
  let detectedLang = 'unknown'
  let maxMatches = 0
  
  Object.keys(commonWords).forEach(lang => {
    const matches = commonWords[lang].filter(word => 
      bodyText.toLowerCase().includes(' ' + word + ' ')
    ).length
    if (matches > maxMatches) {
      maxMatches = matches
      detectedLang = lang
    }
  })
  
  const matches = htmlLang && detectedLang !== 'unknown' ? htmlLang.startsWith(detectedLang) : false
  
  return {
    htmlLang: htmlLangAttribute,
    detectedLang: detectedLang !== 'unknown' ? detectedLang : 'No detectado',
    matches,
    warning: htmlLang ? (matches ? null : `El atributo lang="${htmlLang}" no coincide con el idioma detectado (${detectedLang}). Esto afecta el SEO internacional.`) : 'Falta el atributo lang en <html>. Es clave para el SEO internacional.'
  }
}

function extractCanonicalURL() {
  const canonical = document.querySelector('link[rel="canonical"]')
  const currentURL = window.location.href.split('?')[0] // Sin query params
  
  if (!canonical) {
    return {
      exists: false,
      url: null,
      matches: false,
      warning: 'No se encontró una URL canónica. Esto puede causar problemas de contenido duplicado.'
    }
  }
  
  const canonicalURL = canonical.getAttribute('href')
  const matches = canonicalURL === currentURL || canonicalURL === window.location.href
  
  return {
    exists: true,
    url: canonicalURL,
    matches,
    currentURL,
    warning: matches ? null : `La URL canónica (${canonicalURL}) no coincide con la URL actual (${currentURL}). Posible contenido duplicado.`
  }
}

function detectFaviconsAndIcons() {
  const icons = {
    favicon: null,
    appleTouchIcon: null,
    androidIcon: null,
    manifest: null
  }
  
  // Favicon
  const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')
  icons.favicon = favicon ? favicon.getAttribute('href') : null
  
  // Apple Touch Icon
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]')
  icons.appleTouchIcon = appleIcon ? appleIcon.getAttribute('href') : null
  
  // Android Icon (manifest)
  const manifest = document.querySelector('link[rel="manifest"]')
  icons.manifest = manifest ? manifest.getAttribute('href') : null
  
  // Android Chrome Icons
  const androidIcon = document.querySelector('link[rel="icon"][sizes*="192"], link[rel="icon"][sizes*="512"]')
  icons.androidIcon = androidIcon ? androidIcon.getAttribute('href') : null
  
  const missing = []
  if (!icons.favicon) missing.push('Favicon básico')
  if (!icons.appleTouchIcon) missing.push('Apple Touch Icon')
  if (!icons.androidIcon && !icons.manifest) missing.push('Android/Chrome Icon')
  
  return {
    icons,
    missing,
    score: missing.length === 0 ? 100 : Math.max(0, 100 - (missing.length * 33)),
    warning: missing.length > 0 ? `Faltan iconos: ${missing.join(', ')}. Google valora la experiencia de marca en resultados móviles.` : null
  }
}

function analyzeBasicSecurity() {
  const isHTTPS = window.location.protocol === 'https:'
  const forms = document.querySelectorAll('form')
  const insecureForms = []
  
  forms.forEach(form => {
    const action = form.getAttribute('action') || ''
    const method = (form.getAttribute('method') || 'get').toLowerCase()
    
    // Verificar si el formulario envía a HTTP
    if (action.startsWith('http://') && !action.startsWith('https://')) {
      insecureForms.push({
        action,
        method,
        warning: 'Formulario envía datos a HTTP (no seguro)'
      })
    }
    
    // Verificar si no tiene protección CSRF (simplificado)
    const hasCSRF = form.querySelector('input[name*="csrf"], input[name*="token"], input[type="hidden"][name*="authenticity"]')
    if (method === 'post' && !hasCSRF) {
      // Solo aviso, no crítico
    }
  })
  
  return {
    isHTTPS,
    insecureForms: insecureForms.length,
    formsCount: forms.length,
    score: isHTTPS && insecureForms.length === 0 ? 100 : isHTTPS ? 75 : 50,
    warning: !isHTTPS ? 'El sitio no usa HTTPS. Esto asusta a los usuarios y Google lo penaliza.' : 
             insecureForms.length > 0 ? `${insecureForms.length} formulario(s) envían datos a HTTP no seguro.` : null
  }
}

function analyzeStopWordsInURL() {
  const url = window.location.pathname
  const stopWords = ['de', 'la', 'el', 'para', 'con', 'por', 'que', 'un', 'una', 'y', 'o', 'a', 'en', 'del', 'los', 'las']
  
  const urlParts = url.split('/').filter(part => part.length > 0)
  const wordsInURL = urlParts.join(' ').toLowerCase().split(/[-_\s]+/)
  
  const foundStopWords = wordsInURL.filter(word => stopWords.includes(word))
  const urlLength = url.length
  const isTooLong = urlLength > 75
  
  return {
    url,
    stopWords: foundStopWords,
    stopWordsCount: foundStopWords.length,
    urlLength,
    isTooLong,
    score: isTooLong ? 50 : foundStopWords.length > 0 ? 75 : 100,
    warning: isTooLong ? `La URL es muy larga (${urlLength} caracteres). Idealmente menos de 75 caracteres.` :
             foundStopWords.length > 0 ? `La URL contiene palabras innecesarias: ${foundStopWords.join(', ')}. Considera simplificarla.` : null
  }
}

function verifyMetaRobots() {
  const metaRobots = document.querySelector('meta[name="robots"]')
  let content = null
  let noindex = false
  let nofollow = false
  
  if (metaRobots) {
    content = metaRobots.getAttribute('content') || ''
    const directives = content.toLowerCase().split(',').map(d => d.trim())
    noindex = directives.includes('noindex')
    nofollow = directives.includes('nofollow')
  }
  
  return {
    exists: !!metaRobots,
    content,
    noindex,
    nofollow,
    warning: noindex ? '¡ALERTA CRÍTICA: Esta página tiene noindex! Google no puede indexar esta página. Elimina esta etiqueta si quieres que aparezca en los resultados.' : null
  }
}

function detectIFrames() {
  const iframes = document.querySelectorAll('iframe')
  const iframeInfo = Array.from(iframes).map(iframe => ({
    src: iframe.src || iframe.getAttribute('src') || 'Sin src',
    width: iframe.width || iframe.offsetWidth,
    height: iframe.height || iframe.offsetHeight
  }))
  
  return {
    count: iframes.length,
    iframes: iframeInfo,
    warning: iframes.length > 3 ? 'Esta página usa muchos iframes (' + iframes.length + '). El contenido dentro de ellos podría no estar siendo indexado correctamente por Google.' : null,
    score: iframes.length > 5 ? 50 : iframes.length > 3 ? 75 : 100
  }
}

function analyzeTextVsHTMLRatio() {
  const htmlSize = new Blob([document.documentElement.outerHTML]).size
  const textSize = new Blob([document.body.innerText || document.body.textContent || '']).size
  const ratio = htmlSize > 0 ? (textSize / htmlSize) * 100 : 0
  
  return {
    htmlSize: Math.round(htmlSize / 1024), // KB
    textSize: Math.round(textSize / 1024), // KB
    ratio: Math.round(ratio),
    score: ratio > 25 ? 100 : ratio > 15 ? 75 : ratio > 10 ? 50 : 25,
    warning: ratio < 15 ? `El ratio texto/HTML es muy bajo (${Math.round(ratio)}%). Idealmente debería ser >15%. Hay demasiado código HTML comparado con el contenido real.` : null
  }
}

function detectNofollowInInternalLinks() {
  const currentDomain = window.location.hostname
  const allLinks = document.querySelectorAll('a[href]')
  const internalLinks = Array.from(allLinks).filter(link => {
    try {
      const url = new URL(link.href, window.location.href)
      return url.hostname === currentDomain || !url.hostname
    } catch {
      return link.href.startsWith('/') || link.href.startsWith('#')
    }
  })
  
  const nofollowInternal = internalLinks.filter(link => {
    const rel = (link.getAttribute('rel') || '').toLowerCase()
    return rel.includes('nofollow')
  })
  
  return {
    totalInternal: internalLinks.length,
    nofollowCount: nofollowInternal.length,
    nofollowLinks: nofollowInternal.slice(0, 10).map(link => ({
      href: link.href,
      text: link.textContent.trim().substring(0, 50) || 'Sin texto'
    })),
    warning: nofollowInternal.length > 0 ? `¡Cuidado! Tienes ${nofollowInternal.length} enlaces internos con nofollow. Esto bloquea el paso de autoridad (link juice) a tus propias páginas.` : null,
    score: nofollowInternal.length === 0 ? 100 : Math.max(0, 100 - (nofollowInternal.length * 10))
  }
}

function extractHreflang() {
  const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang], link[rel="alternate"][hreflang="x-default"]')
  const hreflangs = Array.from(hreflangLinks).map(link => ({
    lang: link.getAttribute('hreflang'),
    href: link.getAttribute('href'),
    current: link.getAttribute('href') === window.location.href
  }))
  
  return {
    exists: hreflangLinks.length > 0,
    count: hreflangLinks.length,
    hreflangs,
    languages: hreflangs.map(h => h.lang).filter(Boolean),
    warning: hreflangLinks.length === 0 ? null : hreflangLinks.length < 2 ? 'Hreflang encontrado pero con pocas variantes. Para sitios multi-idioma, asegúrate de tener todas las versiones.' : null
  }
}

function detectInternalAnchors() {
  const anchors = document.querySelectorAll('a[href^="#"]')
  const anchorLinks = Array.from(anchors).map(anchor => ({
    href: anchor.getAttribute('href'),
    text: anchor.textContent.trim(),
    target: anchor.getAttribute('href').substring(1)
  }))
  
  // Verificar si los targets existen
  const validAnchors = anchorLinks.filter(anchor => {
    const target = document.getElementById(anchor.target) || document.querySelector(`[name="${anchor.target}"]`)
    return !!target
  })
  
  return {
    count: anchors.length,
    validCount: validAnchors.length,
    anchors: anchorLinks.slice(0, 10),
    score: validAnchors.length === anchors.length ? 100 : Math.max(0, 100 - ((anchors.length - validAnchors.length) * 10)),
    warning: validAnchors.length < anchors.length ? `Algunos enlaces internos (#) no apuntan a elementos existentes. Google usa estos para crear "Jump links" en las búsquedas.` : null
  }
}

function analyzeCompleteSocialTags() {
  const tags = {
    ogTitle: document.querySelector('meta[property="og:title"]'),
    ogDescription: document.querySelector('meta[property="og:description"]'),
    ogImage: document.querySelector('meta[property="og:image"]'),
    ogUrl: document.querySelector('meta[property="og:url"]'),
    twitterCard: document.querySelector('meta[name="twitter:card"]'),
    twitterTitle: document.querySelector('meta[name="twitter:title"]'),
    twitterDescription: document.querySelector('meta[name="twitter:description"]'),
    twitterImage: document.querySelector('meta[name="twitter:image"]'),
    fbAppId: document.querySelector('meta[property="fb:app_id"]'),
    twitterCreator: document.querySelector('meta[name="twitter:creator"]'),
    twitterSite: document.querySelector('meta[name="twitter:site"]')
  }
  
  const found = {}
  const missing = []
  
  Object.keys(tags).forEach(key => {
    if (tags[key]) {
      found[key] = tags[key].getAttribute('content') || tags[key].getAttribute('property')
    } else {
      missing.push(key)
    }
  })
  
  return {
    found,
    missing,
    count: Object.keys(found).length,
    score: Object.keys(found).length >= 8 ? 100 : Object.keys(found).length >= 5 ? 75 : 50,
    warning: missing.length > 5 ? `Faltan muchas etiquetas de redes sociales. Considera añadir: ${missing.slice(0, 5).join(', ')}` : null
  }
}

function measureTitleWidth() {
  const title = document.title
  // Crear un elemento temporal para medir
  const temp = document.createElement('span')
  temp.style.position = 'absolute'
  temp.style.visibility = 'hidden'
  temp.style.fontSize = '20px' // Tamaño aproximado de título en Google
  temp.style.fontFamily = 'arial, sans-serif'
  temp.style.fontWeight = '400'
  temp.textContent = title
  document.body.appendChild(temp)
  
  const width = temp.offsetWidth
  document.body.removeChild(temp)
  
  const maxWidth = 600 // Google corta aproximadamente a 600px
  const isTooLong = width > maxWidth
  const truncated = isTooLong ? title.substring(0, Math.floor((maxWidth / width) * title.length)) + '...' : null
  
  return {
    title,
    width,
    maxWidth,
    isTooLong,
    truncated,
    warning: isTooLong ? `El título es demasiado ancho (${Math.round(width)}px). Google lo cortará aproximadamente a 600px. Considera: "${truncated}"` : null,
    score: isTooLong ? 50 : 100
  }
}

function collectPageData() {
  const data = {
    url: window.location.href,
    title: document.title,
    metaTags: {},
    performance: null,
    links: [],
    text: '',
    schemas: [],
    accessibility: null,
    hiddenContent: null,
    domDepth: null,
    keywordCannibalization: null,
    scores: null
  }

  // Obtener meta tags
  const metaTags = document.querySelectorAll('meta')
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property') || tag.getAttribute('http-equiv')
    const content = tag.getAttribute('content')
    if (name && content) {
      data.metaTags[name] = content
    }
  })

  // Obtener datos de rendimiento
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing
    data.performance = {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
      load: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
    }
  } else if (window.performance && window.performance.getEntriesByType) {
    const navigation = window.performance.getEntriesByType('navigation')[0]
    if (navigation) {
      data.performance = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domComplete - navigation.domLoading,
        load: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
      }
    }
  }

  // Obtener todos los enlaces
  const links = document.querySelectorAll('a[href]')
  data.links = Array.from(links).map(link => ({
    href: link.href,
    text: link.textContent.trim()
  }))

  data.imageCount = document.images.length
  data.imageAltStats = analyzeImageAltInDocument(document)
  data.outboundLinks = analyzeOutboundLinksInDocument(document, data.url)

  // Obtener texto visible de la página
  const bodyText = document.body.innerText || document.body.textContent || ''
  data.text = bodyText

  // Nuevas funcionalidades
  data.schemas = detectSchemas()
  data.schemaRecommendations = checkSchemaRecommendationsLocal(data.schemas)
  data.techStack = detectTechStack(document)
  data.accessibility = checkAccessibility()
  data.hiddenContent = detectHiddenContent()
  data.domDepth = analyzeDOMDepth()
  data.keywordCannibalization = detectKeywordCannibalization()
  
  // Funcionalidades adicionales
  data.lazyLoading = analyzeLazyLoading()
  data.langTag = verifyLangTag()
  data.canonical = extractCanonicalURL()
  data.favicons = detectFaviconsAndIcons()
  data.security = analyzeBasicSecurity()
  data.stopWordsURL = analyzeStopWordsInURL()
  data.metaRobots = verifyMetaRobots()
  data.iframes = detectIFrames()
  data.textHTMLRatio = analyzeTextVsHTMLRatio()
  data.nofollowInternal = detectNofollowInInternalLinks()
  data.hreflang = extractHreflang()
  data.internalAnchors = detectInternalAnchors()
  data.socialTags = analyzeCompleteSocialTags()
  data.titleWidth = measureTitleWidth()
  data.headers = analyzeHeaders()
  data.webVitals = collectWebVitalsSnapshot()
  data.contentAnalysis = analyzeContentReadability(data, '')
  data.analysisMode = 'full'

  data.scores = calculateScores(data)

  return data
}

/** Reduce payload para chrome.runtime.sendMessage (evita respuestas vacías). */
function preparePageDataForMessage(data) {
  const out = { ...data }
  if (typeof out.text === 'string' && out.text.length > 100000) {
    out.text = out.text.slice(0, 100000)
    out.textTruncated = true
  }
  if (Array.isArray(out.links) && out.links.length > 400) {
    out.links = out.links.slice(0, 400)
    out.linksTruncated = true
  }
  if (Array.isArray(out.schemas)) {
    out.schemas = compactSchemasForTransport(out.schemas)
  }
  return out
}

async function getPageDataAsync(options = {}) {
  const data = collectPageData()
  data.linkStats = computeLinkStats(data.links, data.url)
  try {
    data.httpMeta = await fetchHttpMeta(data.url)
  } catch {
    data.httpMeta = {}
  }
  data.scannerValues = buildScannerValues(data, data.httpMeta || {})
  data.detectedSchemaTypes = extractDetectedTypes(data.schemas)
  if (options.highlightHeaders) {
    try {
      applyHeaderVisualAudit()
    } catch (e) {
      console.warn('[RonHack SEO] resaltado de encabezados', e)
    }
  }
  return data
}

// Escuchar mensajes del popup — versión activa evita listeners huérfanos tras recargar extensión
globalThis.__ronhackSeoListenerGen = (globalThis.__ronhackSeoListenerGen || 0) + 1
const __ronhackListenerGen = globalThis.__ronhackSeoListenerGen

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (globalThis.__ronhackSeoListenerGen !== __ronhackListenerGen) return false

  if (request.action === 'getPageData') {
    ;(async () => {
      try {
        const data = await getPageDataAsync({
          highlightHeaders: request.highlightHeaders === true,
        })
        sendResponse(preparePageDataForMessage(data))
      } catch (e) {
        console.error(e)
        sendResponse({ error: String(e && e.message ? e.message : e) })
      }
    })()
    return true
  }

  if (request.action === 'extractPaa') {
    try {
      sendResponse({ questions: extractPaaInPage() })
    } catch (e) {
      sendResponse({ questions: [], error: String(e?.message || e) })
    }
    return false
  }

  if (request.action === 'highlightContent') {
    try {
      const result = applyContentHighlights(request.issues || [])
      sendResponse(result)
    } catch (e) {
      sendResponse({ applied: 0, error: String(e?.message || e) })
    }
    return false
  }

  if (request.action === 'clearContentHighlight') {
    try {
      removeContentHighlights()
      sendResponse({ ok: true })
    } catch (e) {
      sendResponse({ ok: false })
    }
    return false
  }

  if (request.action === 'ping') {
    sendResponse({ ok: true, gen: __ronhackListenerGen })
    return false
  }

  return false
})
