/**
 * Resaltado en página de frases problemáticas (estilo Yoast).
 */

const MARK_ATTR = 'data-rh-content-audit'
const STYLE_ID = 'rh-content-audit-styles'

const TYPE_STYLES = {
  passive: { bg: '#fef3c7', border: '#d97706', label: 'Voz pasiva' },
  long: { bg: '#fee2e2', border: '#dc2626', label: 'Oración larga' },
  consecutive: { bg: '#dbeafe', border: '#2563eb', label: 'Inicio repetido' },
  keyword: { bg: '#ede9fe', border: '#7c3aed', label: 'Keyword' },
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    mark[${MARK_ATTR}] {
      border-radius: 2px;
      padding: 0 2px;
      border-bottom: 2px solid;
      cursor: help;
    }
    mark[${MARK_ATTR}][data-rh-type="passive"] { background: #fef3c7 !important; border-color: #d97706 !important; color: #78350f !important; }
    mark[${MARK_ATTR}][data-rh-type="long"] { background: #fee2e2 !important; border-color: #dc2626 !important; color: #7f1d1d !important; }
    mark[${MARK_ATTR}][data-rh-type="consecutive"] { background: #dbeafe !important; border-color: #2563eb !important; color: #1e3a8a !important; }
    mark[${MARK_ATTR}][data-rh-type="keyword"] { background: #ede9fe !important; border-color: #7c3aed !important; color: #4c1d95 !important; }
  `
  document.documentElement.appendChild(style)
}

export function removeContentHighlights() {
  document.querySelectorAll(`mark[${MARK_ATTR}]`).forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(mark.textContent), mark)
    parent.normalize()
  })
  document.getElementById(STYLE_ID)?.remove()
}

function getHighlightRoot() {
  return (
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.body
  )
}

function wrapTextNode(textNode, start, length, type, reason) {
  const text = textNode.textContent
  const before = text.slice(0, start)
  const match = text.slice(start, start + length)
  const after = text.slice(start + length)
  const parent = textNode.parentNode
  if (!parent || !match) return false

  const mark = document.createElement('mark')
  mark.setAttribute(MARK_ATTR, '1')
  mark.setAttribute('data-rh-type', type)
  mark.title = reason

  const frag = document.createDocumentFragment()
  if (before) frag.appendChild(document.createTextNode(before))
  mark.textContent = match
  frag.appendChild(mark)
  if (after) frag.appendChild(document.createTextNode(after))
  parent.replaceChild(frag, textNode)
  return true
}

function highlightOnce(root, searchText, type, reason) {
  if (!searchText || searchText.length < 10) return false
  const snippet = searchText.length > 180 ? searchText.slice(0, 180) : searchText

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement?.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT
      if (node.parentElement?.closest(`mark[${MARK_ATTR}]`)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let node
  while ((node = walker.nextNode())) {
    const idx = node.textContent.indexOf(snippet)
    if (idx === -1) continue
    return wrapTextNode(node, idx, snippet.length, type, reason)
  }
  return false
}

export function applyContentHighlights(issues = []) {
  removeContentHighlights()
  if (!issues.length) return { applied: 0 }

  injectStyles()
  const root = getHighlightRoot()
  let applied = 0
  const seen = new Set()

  for (const issue of issues.slice(0, 40)) {
    const key = `${issue.type}:${issue.text?.slice(0, 80)}`
    if (seen.has(key)) continue
    seen.add(key)
    const style = TYPE_STYLES[issue.type] || TYPE_STYLES.long
    const ok = highlightOnce(root, issue.text, issue.type, issue.reason || style.label)
    if (ok) applied++
  }

  return { applied }
}

export function applyContentHighlightsInPage(issues) {
  return applyContentHighlights(issues || [])
}

export function clearContentHighlightsInPage() {
  removeContentHighlights()
  return { ok: true }
}
