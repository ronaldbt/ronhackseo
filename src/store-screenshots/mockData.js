export const NAV_TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'geo', label: 'SERP Local' },
  { id: 'schema', label: 'Datos estruct.' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'spider', label: 'Spider' },
]

export const mockScores = {
  overall: 68,
  seo: 82,
  performance: 74,
  content: 71,
  explanations: {
    seo: {
      reasons: ['Título y meta description dentro de rangos recomendados', 'Canonical y hreflang configurados'],
      issues: ['Falta encabezado HSTS en la respuesta'],
    },
    performance: {
      reasons: ['LCP dentro de umbral aceptable', 'Sin recursos bloqueantes críticos'],
      issues: ['CLS puede mejorarse en imágenes above-the-fold'],
    },
    content: {
      reasons: ['Buena longitud de texto y estructura H1–H3', 'Legibilidad adecuada'],
      issues: ['Algunas frases largas dificultan la lectura'],
    },
  },
}

export const mockPageData = {
  url: 'https://ejemplo.com/servicios/seo',
  title: 'Auditoría SEO profesional | RonHack SEO',
  metaTags: {
    description:
      'Analiza tu sitio con RonHack SEO: rastreo estilo Screaming Frog, Core Web Vitals, keywords, SERP local y problemas técnicos en un solo panel.',
    keywords: 'seo, auditoría, screaming frog, chrome extension',
    robots: 'index, follow',
    author: 'RonHack',
  },
  canonical: { exists: true, matches: true, url: 'https://ejemplo.com/servicios/seo' },
  langTag: { htmlLang: 'es', matches: true },
  metaRobots: { content: 'index, follow', noindex: false },
  headers: { h1: 1, h2: 4, h3: 8, h4: 2, h5: 0, h6: 0 },
  images: { total: 12, withoutAlt: 1 },
  links: { internal: 34, external: 8 },
  detectedSchemaTypes: ['Organization', 'WebSite', 'BreadcrumbList'],
  webVitals: {
    lcp: { value: 2.1, rating: 'good', unit: 's' },
    cls: { value: 0.08, rating: 'good', unit: '' },
    inp: { value: 180, rating: 'good', unit: 'ms' },
    ttfb: { value: 420, rating: 'good', unit: 'ms' },
  },
  scores: mockScores,
}

export const mockProblems = [
  {
    nombre: 'HTTP 404 (Not Found): 3',
    tipo: 'Problema',
    prioridad: 'Alta',
    urls: 3,
    pct: '4,29',
    detalle: 'https://ejemplo.com/vieja | https://ejemplo.com/blog/2020',
  },
  {
    nombre: 'HTTP 500 (Internal Server Error): 1',
    tipo: 'Problema',
    prioridad: 'Alta',
    urls: 1,
    pct: '1,43',
    detalle: 'https://ejemplo.com/api/legacy',
  },
  {
    nombre: 'Títulos duplicados (2 URLs): «Contacto — RonHack SEO»',
    tipo: 'Aviso',
    prioridad: 'Media',
    urls: 2,
    pct: '2,86',
  },
  {
    nombre: 'Falta encabezado Content-Security-Policy',
    tipo: 'Aviso',
    prioridad: 'Media',
    urls: 58,
    pct: '82,86',
  },
  {
    nombre: 'URLs con más de un H1: 4',
    tipo: 'Problema',
    prioridad: 'Alta',
    urls: 4,
    pct: '5,71',
  },
]

export const mockKeywords = [
  { term: 'auditoría seo', volume: 'Alta', match: 'Título' },
  { term: 'screaming frog alternativa', volume: 'Media', match: 'Contenido' },
  { term: 'core web vitals chrome', volume: 'Media', match: '—' },
  { term: 'rastreo seo sitio', volume: 'Alta', match: 'Meta' },
  { term: 'extension seo chrome', volume: 'Alta', match: 'Contenido' },
]

export const mockSpiderOverview = {
  security: [
    { label: 'Todo', count: 70, pct: '100%' },
    { label: 'URL HTTPS', count: 70, pct: '100%' },
    { label: 'Falta encabezado HSTS', count: 58, pct: '82,86%' },
    { label: 'Falta encabezado CSP', count: 58, pct: '82,86%' },
  ],
  response: [
    { label: 'Todo', count: 70, pct: '100%' },
    { label: 'Completado (2xx)', count: 52, pct: '74,29%' },
    { label: 'Redirección (3xx)', count: 12, pct: '17,14%' },
    { label: 'HTTP 404', count: 3, pct: '4,29%' },
    { label: 'HTTP 500', count: 1, pct: '1,43%' },
  ],
}
