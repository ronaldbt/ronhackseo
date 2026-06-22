/**
 * Generación de parámetros de localización Google (estilo valentin.app).
 * gl = país, hl = idioma UI, uule = ubicación canónica codificada.
 */

export function encodeUule(canonicalName) {
  if (!canonicalName?.trim()) return null
  try {
    const encoded = btoa(unescape(encodeURIComponent(canonicalName.trim())))
    return `w+CAIQICI${encoded}`
  } catch {
    return null
  }
}

export function buildGoogleSearchUrl({ query, gl = 'us', hl = 'en', uule = null, num = 10 }) {
  const params = new URLSearchParams()
  params.set('q', query.trim())
  params.set('gl', gl)
  params.set('hl', hl)
  params.set('num', String(num))
  if (uule) params.set('uule', uule)
  return `https://www.google.com/search?${params.toString()}`
}

export function buildCanonicalLocation({ city, region, country }) {
  return [city, region, country].filter(Boolean).join(',')
}
