/**
 * Análisis de contenido inspirado en Yoast SEO (español).
 */

import { analyzeKeywordOnPage } from './keywordAnalysis.js'

const TRANSITION_WORDS_ES = [
  'además', 'por lo tanto', 'sin embargo', 'en conclusión', 'en resumen', 'por ejemplo',
  'primero', 'segundo', 'tercero', 'finalmente', 'asimismo', 'no obstante', 'por otro lado',
  'en primer lugar', 'en segundo lugar', 'debido a', 'gracias a', 'a continuación',
  'por consiguiente', 'en cambio', 'igualmente', 'también', 'luego', 'después', 'antes',
  'mientras', 'aunque', 'porque', 'pues', 'entonces', 'así que', 'del mismo modo',
]

const PASSIVE_PATTERNS_ES = [
  /\b(fue|fueron|era|eran|será|serán|es|son|ha sido|han sido|había sido|habían sido|está siendo|están siendo)\s+[\wáéíóúñ]+(?:ado|ada|ados|adas|ido|ida|idos|idas)\b/gi,
  /\b(se\s+(?:ha|han|había|habían|será|serán|puede|pueden|debe|deben)\s+[\wáéíóúñ]+(?:ado|ada|idos|idas|ido|ida))\b/gi,
]

const ACTIVE_PATTERNS_ES = [
  /\b\w+(?:é|í|ó|á|é|í|ó|ú|amos|emos|imos|aron|ieron|aba|ía)\b/i,
]

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
}

function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)
}

function wordCount(text) {
  const m = text.match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)
  return m ? m.length : 0
}

function firstWord(sentence) {
  const m = sentence.match(/[\p{L}\p{N}]+/u)
  return m ? m[0].toLowerCase() : ''
}

function countPassiveSentences(sentences) {
  let passive = 0
  for (const s of sentences) {
    if (PASSIVE_PATTERNS_ES.some((re) => {
      re.lastIndex = 0
      return re.test(s)
    })) passive++
  }
  return passive
}

function countActiveSentences(sentences) {
  let active = 0
  for (const s of sentences) {
    if (PASSIVE_PATTERNS_ES.some((re) => {
      re.lastIndex = 0
      return re.test(s)
    })) continue
    if (ACTIVE_PATTERNS_ES.some((re) => {
      re.lastIndex = 0
      return re.test(s)
    })) active++
  }
  return active
}

function countTransitionSentences(sentences) {
  let n = 0
  const lower = sentences.map((s) => s.toLowerCase())
  for (const s of lower) {
    if (TRANSITION_WORDS_ES.some((w) => s.includes(w))) n++
  }
  return n
}

function countConsecutiveSameStarts(sentences) {
  let pairs = 0
  for (let i = 1; i < sentences.length; i++) {
    const w1 = firstWord(sentences[i - 1])
    const w2 = firstWord(sentences[i])
    if (w1 && w2 && w1 === w2 && w1.length > 2) pairs++
  }
  return pairs
}

function fleschSzigrisztSpanish(words, sentences, syllables) {
  if (!words || !sentences) return 0
  const wps = words / sentences
  const spw = syllables / words
  return Math.max(0, Math.min(100, Math.round(206.835 - 62.3 * spw - 1.015 * wps)))
}

function estimateSyllablesEs(text) {
  const words = text.toLowerCase().match(/[\p{L}]+/gu) || []
  let total = 0
  for (const w of words) {
    const v = w.match(/[aeiouáéíóúü]+/gi)
    total += Math.max(1, v ? v.length : 1)
  }
  return total
}

function statusFromPercent(pct, goodMax, okMax, invert = false) {
  if (invert) {
    if (pct >= goodMax) return 'good'
    if (pct >= okMax) return 'ok'
    return 'bad'
  }
  if (pct <= goodMax) return 'good'
  if (pct <= okMax) return 'ok'
  return 'bad'
}

function makeCheck(id, label, status, detail, priority = 2) {
  return { id, label, status, detail, priority }
}

function keywordInH2(headers, term) {
  const t = term.toLowerCase()
  return (headers || [])
    .filter((h) => h.level === 2)
    .some((h) => (h.fullText || h.text || '').toLowerCase().includes(t))
}

function buildSuggestions(checks) {
  const order = { bad: 0, ok: 1, good: 2 }
  return [...checks]
    .filter((c) => c.status !== 'good')
    .sort((a, b) => order[a.status] - order[b.status] || a.priority - b.priority)
    .map((c) => ({
      id: c.id,
      status: c.status,
      text: `${c.label}: ${c.detail}`,
    }))
}

function isPassiveSentence(s) {
  return PASSIVE_PATTERNS_ES.some((re) => {
    re.lastIndex = 0
    return re.test(s)
  })
}

/** Frases a marcar en la página (estilo Yoast). */
export function getContentHighlightIssues(pageData, focusKeyword = '') {
  const text = (pageData?.text || '').trim()
  if (!text) return []

  const sentences = splitSentences(text)
  const issues = []
  const seen = new Set()
  const kw = focusKeyword.trim().toLowerCase()

  const push = (sentence, type, reason) => {
    const key = `${type}:${sentence.slice(0, 100)}`
    if (seen.has(key) || sentence.length < 12) return
    seen.add(key)
    issues.push({ text: sentence, type, reason })
  }

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i]
    if (wordCount(s) > 20) push(s, 'long', 'Oración larga (>20 palabras)')
    if (isPassiveSentence(s)) push(s, 'passive', 'Voz pasiva detectada')
    if (i > 0) {
      const w1 = firstWord(sentences[i - 1])
      const w2 = firstWord(s)
      if (w1 && w2 && w1 === w2 && w1.length > 2) {
        push(s, 'consecutive', `Empieza igual que la frase anterior («${w1}»)`)
      }
    }
    if (kw && s.toLowerCase().includes(kw)) {
      push(s, 'keyword', `Contiene la keyword «${focusKeyword.trim()}»`)
    }
  }

  return issues.slice(0, 45)
}

export function analyzeContentReadability(pageData, focusKeyword = '') {
  const text = (pageData?.text || '').trim()
  const sentences = splitSentences(text)
  const paragraphs = splitParagraphs(text)
  const words = wordCount(text)
  const syllables = estimateSyllablesEs(text)

  const longSentences = sentences.filter((s) => wordCount(s) > 20)
  const longParagraphs = paragraphs.filter((p) => wordCount(p) > 150)
  const passiveCount = countPassiveSentences(sentences)
  const activeCount = countActiveSentences(sentences)
  const transitionCount = countTransitionSentences(sentences)
  const consecutiveSame = countConsecutiveSameStarts(sentences)

  const longSentPct = sentences.length ? Math.round((longSentences.length / sentences.length) * 100) : 0
  const passivePct = sentences.length ? Math.round((passiveCount / sentences.length) * 100) : 0
  const activePct = sentences.length ? Math.round((activeCount / sentences.length) * 100) : 0
  const transitionPct = sentences.length ? Math.round((transitionCount / sentences.length) * 100) : 0

  const flesch = fleschSzigrisztSpanish(words, Math.max(1, sentences.length), syllables)
  const readingMinutes = Math.max(1, Math.ceil(words / 200))

  const headers = pageData?.headers?.headers || []
  const h2h3 = headers.filter((h) => h.level >= 2 && h.level <= 3)
  const textBetweenHeadings = words / Math.max(1, h2h3.length + 1)

  const links = pageData?.links || []
  let internal = 0
  let external = 0
  try {
    const origin = new URL(pageData.url).origin
    for (const l of links) {
      try {
        const u = new URL(l.href)
        if (u.origin === origin) internal++
        else external++
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  const outbound = pageData?.outboundLinks || { outbound: external, nofollow: 0, dofollow: external }
  const images = pageData?.imageAltStats || {
    total: pageData?.imageCount || 0,
    missing: 0,
    empty: 0,
    withAlt: pageData?.imageCount || 0,
  }

  const paragraphScores = paragraphs.slice(0, 8).map((p, i) => {
    const pw = wordCount(p)
    const ps = splitSentences(p)
    const score = fleschSzigrisztSpanish(pw, Math.max(1, ps.length), estimateSyllablesEs(p))
    return { index: i + 1, words: pw, score }
  })

  const intro = paragraphs[0] || text.slice(0, 400)
  const kw = focusKeyword.trim()
  const keywordMatch = kw ? analyzeKeywordOnPage(kw, pageData) : null
  const inIntro = kw ? intro.toLowerCase().includes(kw.toLowerCase()) : false
  const inH2 = kw ? keywordInH2(headers, kw) : false

  const checks = [
    makeCheck(
      'length',
      'Longitud del texto',
      words >= 300 ? 'good' : words >= 150 ? 'ok' : 'bad',
      `${words} palabras (ideal ≥300)`,
      1,
    ),
    makeCheck(
      'readingTime',
      'Tiempo de lectura',
      words >= 200 ? 'good' : 'ok',
      `~${readingMinutes} min (${words} palabras)`,
      3,
    ),
    makeCheck(
      'sentences',
      'Oraciones largas',
      statusFromPercent(longSentPct, 15, 25),
      `${longSentPct}% superan 20 palabras`,
      2,
    ),
    makeCheck(
      'passive',
      'Voz pasiva',
      statusFromPercent(passivePct, 10, 15),
      `${passivePct}% pasiva · ${100 - passivePct}% resto`,
      1,
    ),
    makeCheck(
      'active',
      'Voz activa explícita',
      statusFromPercent(activePct, 40, 25, true),
      `${activePct}% con verbos en forma activa`,
      2,
    ),
    makeCheck(
      'consecutive',
      'Inicios repetidos',
      consecutiveSame === 0 ? 'good' : consecutiveSame <= 2 ? 'ok' : 'bad',
      `${consecutiveSame} par(es) de frases empiezan igual`,
      2,
    ),
    makeCheck(
      'transition',
      'Palabras de transición',
      transitionPct >= 30 ? 'good' : transitionPct >= 20 ? 'ok' : 'bad',
      `${transitionPct}% de frases`,
      2,
    ),
    makeCheck(
      'paragraphs',
      'Párrafos largos',
      longParagraphs.length === 0 ? 'good' : longParagraphs.length <= 2 ? 'ok' : 'bad',
      `${longParagraphs.length} >150 palabras`,
      2,
    ),
    makeCheck(
      'subheadings',
      'Subtítulos H2/H3',
      textBetweenHeadings <= 350 ? 'good' : textBetweenHeadings <= 500 ? 'ok' : 'bad',
      h2h3.length ? `~${Math.round(textBetweenHeadings)} pal/bloque` : 'Sin H2/H3',
      2,
    ),
    makeCheck(
      'internalLinks',
      'Enlaces internos',
      internal >= 2 ? 'good' : internal >= 1 ? 'ok' : 'bad',
      `${internal} internos · ${external} externos`,
      1,
    ),
    makeCheck(
      'outboundNofollow',
      'Salientes nofollow',
      outbound.nofollow === 0 ? 'good' : outbound.nofollow <= 2 ? 'ok' : 'bad',
      `${outbound.nofollow}/${outbound.outbound || external} externos con nofollow`,
      2,
    ),
    makeCheck(
      'flesch',
      'Legibilidad global',
      flesch >= 60 ? 'good' : flesch >= 45 ? 'ok' : 'bad',
      `Flesch-Szigriszt ${flesch}/100`,
      1,
    ),
  ]

  if (images.total > 0) {
    const missingAlt = images.missing + images.empty
    checks.push(
      makeCheck(
        'altText',
        'Alt en imágenes',
        missingAlt === 0 ? 'good' : missingAlt <= 2 ? 'ok' : 'bad',
        `${images.withAlt}/${images.total} con alt · ${images.missing} sin atributo · ${images.empty} vacíos`,
        1,
      ),
    )
  }

  if (kw && keywordMatch) {
    const densityOk = keywordMatch.density >= 0.5 && keywordMatch.density <= 2.5
    checks.unshift(
      makeCheck(
        'kwTitle',
        'Keyword en title',
        keywordMatch.inTitle ? 'good' : 'bad',
        keywordMatch.inTitle ? `"${kw}" presente` : 'No aparece en el title',
        0,
      ),
      makeCheck(
        'kwMeta',
        'Keyword en meta',
        keywordMatch.inMeta ? 'good' : 'ok',
        keywordMatch.inMeta ? 'Presente en description' : 'Ausente en meta description',
        1,
      ),
      makeCheck(
        'kwIntro',
        'Keyword en intro',
        inIntro ? 'good' : 'bad',
        inIntro ? 'En primer párrafo' : 'No está al inicio del contenido',
        0,
      ),
      makeCheck(
        'kwH1',
        'Keyword en H1',
        keywordMatch.inH1 ? 'good' : 'ok',
        keywordMatch.inH1 ? 'Presente en H1' : 'No en H1',
        1,
      ),
      makeCheck(
        'kwH2',
        'Keyword en H2',
        inH2 ? 'good' : 'ok',
        inH2 ? 'Aparece en algún H2' : 'No en subtítulos H2',
        2,
      ),
      makeCheck(
        'kwDensity',
        'Densidad keyword',
        densityOk ? 'good' : keywordMatch.density > 0 ? 'ok' : 'bad',
        `${keywordMatch.density}% (${keywordMatch.count} veces) · ideal 0.5–2.5%`,
        1,
      ),
    )
  }

  const good = checks.filter((c) => c.status === 'good').length
  const ok = checks.filter((c) => c.status === 'ok').length
  const bad = checks.filter((c) => c.status === 'bad').length
  const score = Math.round((good * 100 + ok * 55 + bad * 10) / Math.max(1, checks.length))
  const suggestions = buildSuggestions(checks)

  return {
    score,
    flesch,
    words,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    readingMinutes,
    longSentencesPercent: longSentPct,
    passiveVoicePercent: passivePct,
    activeVoicePercent: activePct,
    transitionWordsPercent: transitionPct,
    consecutiveSameStarts: consecutiveSame,
    internalLinks: internal,
    externalLinks: external,
    outboundLinks: outbound,
    imageAltStats: images,
    paragraphScores,
    focusKeyword: kw,
    keyword: keywordMatch,
    keywordInIntro: inIntro,
    keywordInH2: inH2,
    highlightIssues: getContentHighlightIssues(pageData, focusKeyword),
    checks,
    suggestions,
    summary: { good, ok, bad },
  }
}
