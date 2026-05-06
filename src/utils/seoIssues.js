/**
 * Genera filas estilo Screaming Frog “Problemas” para la URL analizada (1 página).
 * urls = 1 y % del total = 100 cuando aplica al documento actual.
 */

function row(name, tipo, prioridad) {
  return {
    nombre: name,
    tipo,
    prioridad,
    urls: 1,
    pct: '100,00',
  }
}

export function buildIssuesFromPageData(data) {
  if (!data) return []
  const issues = []

  if (data.metaRobots?.noindex) {
    issues.push(row('Directivas: Noindex', 'Problema', 'Alta'))
  }
  if (data.metaRobots?.nofollow) {
    issues.push(row('Directivas: Nofollow en meta robots', 'Aviso', 'Media'))
  }

  const title = data.title || ''
  if (!title) issues.push(row('Títulos de página: Falta título', 'Problema', 'Alta'))
  else if (title.length > 60) issues.push(row('Títulos de página: Más de 60 caracteres', 'Aviso', 'Media'))
  else if (title.length < 30) issues.push(row('Títulos de página: Menos de 30 caracteres', 'Oportunidad', 'Baja'))

  const desc = data.metaTags?.description || ''
  if (!desc) issues.push(row('Meta description: Falta', 'Problema', 'Alta'))
  else if (desc.length > 160) issues.push(row('Meta description: Más de 160 caracteres', 'Aviso', 'Media'))
  else if (desc.length < 120) issues.push(row('Meta description: Menos de 120 caracteres', 'Oportunidad', 'Baja'))

  const h = data.headers
  if (h) {
    if (h.count?.h1 === 0) issues.push(row('H1: Falta', 'Problema', 'Alta'))
    else if (h.count?.h1 > 1) issues.push(row('H1: Múltiples H1', 'Problema', 'Alta'))
    if (h.count?.h2 === 0 && (h.count?.total || 0) > 1) {
      issues.push(row('H2: No se encontraron', 'Oportunidad', 'Baja'))
    }
    if (!h.structure?.properHierarchy) {
      issues.push(row('Encabezados: Jerarquía incorrecta (saltos H2→H4, etc.)', 'Aviso', 'Media'))
    }
  }

  if (data.canonical && !data.canonical.exists) {
    issues.push(row('Canónica: No definida', 'Aviso', 'Media'))
  } else if (data.canonical && !data.canonical.matches) {
    issues.push(row('Canónica: No coincide con la URL actual', 'Aviso', 'Media'))
  }

  if (!data.schemas || data.schemas.length === 0) {
    issues.push(row('Datos estructurados: Sin JSON-LD detectado', 'Oportunidad', 'Baja'))
  } else if (data.schemas.some((s) => !s.isValid)) {
    issues.push(row('Datos estructurados: JSON-LD con errores', 'Aviso', 'Media'))
  }

  if (data.textHTMLRatio?.ratio != null && data.textHTMLRatio.ratio < 10) {
    issues.push(row('Contenido: Ratio texto/HTML bajo (contenido fino)', 'Aviso', 'Media'))
  }

  if (data.text && data.text.length < 300) {
    issues.push(row('Contenido: Texto visible muy corto', 'Aviso', 'Media'))
  }

  if (data.performance?.load > 3000) {
    issues.push(row('Rendimiento: Tiempo de carga alto (>3s)', 'Problema', 'Alta'))
  } else if (data.performance?.load > 2000) {
    issues.push(row('Rendimiento: Tiempo de carga elevado (>2s)', 'Aviso', 'Media'))
  }

  if (data.security && !data.security.isHTTPS) {
    issues.push(row('Seguridad: Sin HTTPS', 'Problema', 'Alta'))
  }

  if (data.langTag?.htmlLang === 'No definido' || !data.langTag?.htmlLang) {
    issues.push(row('Internacional: Falta atributo lang en <html>', 'Oportunidad', 'Baja'))
  }

  if (data.nofollowInternal?.nofollowCount > 0) {
    issues.push(row('Enlaces: Nofollow en enlaces internos', 'Aviso', 'Media'))
  }

  if (data.hiddenContent?.count > 5) {
    issues.push(row('Contenido: Mucho texto en elementos ocultos', 'Aviso', 'Media'))
  }

  return issues
}

export function summarizeIssues(issues) {
  let problemas = 0
  let avisos = 0
  let oportunidades = 0
  for (const i of issues) {
    if (i.tipo === 'Problema') problemas += 1
    else if (i.tipo === 'Aviso') avisos += 1
    else if (i.tipo === 'Oportunidad') oportunidades += 1
  }
  return {
    problemas,
    avisos,
    oportunidades,
    total: issues.length,
  }
}
