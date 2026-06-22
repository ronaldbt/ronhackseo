/**
 * Autocompletado de keywords desde varias fuentes (service worker).
 */

export async function fetchGoogleSuggest(q) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google suggest HTTP ${res.status}`)
  const text = await res.text()
  const jsonStart = text.indexOf('[')
  if (jsonStart < 0) return []
  const data = JSON.parse(text.slice(jsonStart))
  return (data[1] || [])
    .map((item) => (Array.isArray(item) ? item[0] : item))
    .filter(Boolean)
}

export async function fetchBingSuggest(q) {
  const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Bing suggest HTTP ${res.status}`)
  const data = await res.json()
  return Array.isArray(data[1]) ? data[1].filter(Boolean) : []
}

export async function fetchDuckDuckGoSuggest(q) {
  const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DuckDuckGo suggest HTTP ${res.status}`)
  const data = await res.json()
  const list = Array.isArray(data[1]) ? data[1] : []
  return list.filter(Boolean)
}

export function expandSeedVariations(seed) {
  const q = seed.trim()
  if (!q) return []
  const suffixes = ['', ' chile', ' online', ' precio', ' barato', ' mujer', ' hombre', ' 2025']
  const out = new Set()
  for (const s of suffixes) {
    const v = (q + s).trim()
    if (v.length > 2) out.add(v)
  }
  return [...out]
}

export function ideasFromPage(pageData, seed) {
  const out = new Set()
  if (seed?.trim()) out.add(seed.trim())
  if (pageData?.title) out.add(pageData.title.trim())
  for (const h of pageData?.headers?.headers || []) {
    if (h.level <= 2 && h.fullText?.length > 3) {
      out.add(h.fullText.trim().slice(0, 80))
    }
  }
  const desc = pageData?.metaTags?.description
  if (desc?.length > 10) out.add(desc.trim().slice(0, 80))
  return [...out].slice(0, 12)
}

export async function fetchAllKeywordSuggestions(query, pageData = null) {
  const q = String(query || '').trim()
  if (!q) return { google: [], bing: [], ddg: [], local: [], sources: [] }

  const google = await fetchGoogleSuggest(q).catch(() => [])
  const bing = await fetchBingSuggest(q).catch(() => [])
  const ddg = await fetchDuckDuckGoSuggest(q).catch(() => [])

  const local = ideasFromPage(pageData, q)
  const sources = []
  if (google.length) sources.push('google')
  if (bing.length) sources.push('bing')
  if (ddg.length) sources.push('duckduckgo')
  if (local.length) sources.push('página')

  const merged = mergeUnique([...google, ...bing, ...ddg, ...local, ...expandSeedVariations(q)])

  return {
    google: google.length ? google : ddg,
    bing,
    ddg,
    local,
    all: merged,
    sources: sources.length ? sources : merged.length ? ['variaciones'] : [],
  }
}

function mergeUnique(list) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    const key = String(item).trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(String(item).trim())
  }
  return out
}
