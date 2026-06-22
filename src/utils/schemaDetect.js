/**
 * Detección de datos estructurados: JSON-LD, microdata y RDFa.
 */

export function normalizeSchemaType(typeRaw) {
  if (!typeRaw) return 'Thing'
  const t = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw
  const s = String(t).trim()
  if (!s) return 'Thing'
  if (s.includes('/')) return s.split('/').filter(Boolean).pop() || s
  if (s.includes(':')) return s.split(':').filter(Boolean).pop() || s
  return s
}

function parseJsonLdText(raw) {
  let text = (raw || '').trim()
  if (!text) return null
  text = text.replace(/<!--[\s\S]*?-->/g, '').trim()
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
  }
  return null
}

function flattenJsonLdNodes(json) {
  if (!json || typeof json !== 'object') return []
  const items = Array.isArray(json) ? json : [json]
  const flat = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    if (Array.isArray(item['@graph'])) {
      for (const n of item['@graph']) flat.push(n)
    } else {
      flat.push(item)
    }
  }
  return flat
}

function validateSchemaNode(type, item) {
  const schema = {
    type: normalizeSchemaType(type),
    context: item['@context'] || 'https://schema.org',
    data: item,
    source: item.__rhSource || 'json-ld',
    isValid: true,
    errors: [],
  }

  switch (schema.type) {
    case 'Product':
      if (!item.name) schema.errors.push('Falta campo requerido: name')
      if (!item.description) schema.errors.push('Falta campo recomendado: description')
      break
    case 'Article':
      if (!item.headline && !item.name) schema.errors.push('Falta campo requerido: headline')
      if (!item.datePublished) schema.errors.push('Falta campo recomendado: datePublished')
      break
    case 'LocalBusiness':
      if (!item.name) schema.errors.push('Falta campo requerido: name')
      break
    case 'Organization':
      if (!item.name) schema.errors.push('Falta campo requerido: name')
      break
    default:
      break
  }

  if (schema.errors.length) schema.isValid = false
  return schema
}

function pushSchemaNode(schemas, seen, item, source) {
  if (!item || typeof item !== 'object') return
  item = { ...item, __rhSource: source }
  const typeRaw = item['@type']
  const types = Array.isArray(typeRaw) ? typeRaw : typeRaw ? [typeRaw] : ['Thing']
  for (const t of types) {
    const type = normalizeSchemaType(t)
    const key = `${type}:${JSON.stringify(item).slice(0, 120)}`
    if (seen.has(key)) continue
    seen.add(key)
    schemas.push(validateSchemaNode(type, item))
  }
}

function scanJsonLdScripts(doc, schemas, seen) {
  const selectors = [
    'script[type="application/ld+json"]',
    'script[type="application/json+ld"]',
    'script[type="application/json"]',
  ]
  for (const sel of selectors) {
    doc.querySelectorAll(sel).forEach((script) => {
      const raw = script.textContent || script.innerText || ''
      if (!raw.includes('@context') && !raw.includes('@type') && !raw.includes('@graph')) return
      const json = parseJsonLdText(raw)
      if (!json) {
        if (raw.trim()) {
          schemas.push({
            type: 'Invalid',
            source: 'json-ld',
            error: 'Error al parsear JSON-LD',
            isValid: false,
            errors: ['JSON inválido'],
          })
        }
        return
      }
      for (const node of flattenJsonLdNodes(json)) {
        pushSchemaNode(schemas, seen, node, 'json-ld')
      }
    })
  }

  doc.querySelectorAll('script:not([src])').forEach((script) => {
    const type = (script.getAttribute('type') || '').toLowerCase()
    if (type.includes('ld+json') || type.includes('json+ld')) return
    const raw = script.textContent || ''
    if (!raw.includes('"@context"') && !raw.includes("'@context'")) return
    if (!raw.includes('@type') && !raw.includes('@graph')) return
    const json = parseJsonLdText(raw)
    if (!json) return
    for (const node of flattenJsonLdNodes(json)) {
      pushSchemaNode(schemas, seen, node, 'json-ld-inline')
    }
  })
}

function scanMicrodata(doc, schemas, seen) {
  doc.querySelectorAll('[itemscope][itemtype]').forEach((el) => {
    const itemtype = el.getAttribute('itemtype')
    const type = normalizeSchemaType(itemtype)
    const key = `micro:${type}:${el.outerHTML.slice(0, 80)}`
    if (seen.has(key)) return
    seen.add(key)
    schemas.push({
      type,
      context: itemtype || 'https://schema.org',
      source: 'microdata',
      data: { itemtype, itemprop: el.getAttribute('itemprop') || null },
      isValid: true,
      errors: [],
    })
  })
}

function scanRdfa(doc, schemas, seen) {
  doc.querySelectorAll('[typeof]').forEach((el) => {
    const typeofAttr = el.getAttribute('typeof')
    const type = normalizeSchemaType(typeofAttr)
    const key = `rdfa:${type}:${el.outerHTML.slice(0, 80)}`
    if (seen.has(key)) return
    seen.add(key)
    schemas.push({
      type,
      context: 'https://schema.org',
      source: 'rdfa',
      data: { typeof: typeofAttr },
      isValid: true,
      errors: [],
    })
  })
}

export function detectSchemasInDocument(doc = document) {
  const schemas = []
  const seen = new Set()
  scanJsonLdScripts(doc, schemas, seen)
  scanMicrodata(doc, schemas, seen)
  scanRdfa(doc, schemas, seen)
  return schemas
}

export function extractDetectedTypes(schemas) {
  const set = new Set()
  for (const s of schemas || []) {
    if (s.type === 'Invalid') continue
    if (s.type) set.add(s.type)
    if (s.data?.['@type']) {
      const t = s.data['@type']
      ;(Array.isArray(t) ? t : [t]).forEach((z) => set.add(normalizeSchemaType(z)))
    }
  }
  return [...set].sort()
}

export function checkSchemaRecommendations(schemas) {
  const recommendations = []
  const hasProduct = schemas.some((s) => s.type === 'Product')
  const hasReview = schemas.some(
    (s) => s.type === 'Review' || (s.data && s.data.aggregateRating),
  )
  const hasRating = schemas.some((s) => s.data && (s.data.aggregateRating || s.data.rating))

  if (hasProduct && !hasReview && !hasRating) {
    recommendations.push({
      type: 'warning',
      message:
        'Producto sin Review/AggregateRating: podrías perder estrellas en resultados de Google.',
      priority: 'high',
    })
  }
  return recommendations
}

export function detectSchemasInPage() {
  return detectSchemasInDocument(document)
}

export function compactSchemasForTransport(schemas, maxDataLen = 6000) {
  if (!Array.isArray(schemas)) return []
  return schemas.map((s) => {
    const out = {
      type: s.type,
      source: s.source,
      isValid: s.isValid,
      errors: s.errors,
      error: s.error,
    }
    if (s.data) {
      try {
        const json = JSON.stringify(s.data)
        out.data = json.length <= maxDataLen ? s.data : { _preview: json.slice(0, maxDataLen) + '…' }
      } catch {
        out.data = { _truncated: true }
      }
    }
    return out
  })
}
