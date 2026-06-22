<template>
  <div class="content-analysis">
    <div class="ca-kw-row">
      <label class="ca-kw-label">Keyword focus</label>
      <input
        v-model="focusKeyword"
        type="text"
        class="ca-kw-input"
        placeholder="ej: lentes ópticos chile"
      />
    </div>

    <div class="ca-highlight-row">
      <label class="ca-toggle">
        <input v-model="markOnPage" type="checkbox" />
        Marcar frases en la página
      </label>
      <div v-if="markOnPage" class="ca-legend-inline">
        <span class="leg passive">Pasiva</span>
        <span class="leg long">Larga</span>
        <span class="leg consecutive">Repetida</span>
        <span class="leg keyword">Keyword</span>
      </div>
    </div>

    <div class="ca-header">
      <div class="ca-score" :class="scoreClass">{{ analysis.score }}</div>
      <div class="ca-meta">
        <div class="ca-title">Análisis de contenido</div>
        <div class="ca-sub">
          {{ analysis.words }} palabras · ~{{ analysis.readingMinutes }} min · Legibilidad {{ analysis.flesch }}/100
          <span v-if="highlightStatus" class="ca-hl-status"> · {{ highlightStatus }}</span>
        </div>
      </div>
      <div class="ca-legend">
        <span class="dot good" title="Bien">{{ analysis.summary.good }}</span>
        <span class="dot ok" title="Mejorable">{{ analysis.summary.ok }}</span>
        <span class="dot bad" title="Problema">{{ analysis.summary.bad }}</span>
      </div>
    </div>

    <div v-if="analysis.suggestions?.length" class="ca-suggestions">
      <div class="ca-sug-title">Sugerencias prioritarias</div>
      <ul class="ca-sug-list">
        <li v-for="s in analysis.suggestions.slice(0, 6)" :key="s.id" :class="'sug-' + s.status">
          {{ s.text }}
        </li>
      </ul>
    </div>

    <div v-if="markedSentences.length" class="ca-marked-list">
      <div class="ca-sug-title">Frases marcadas ({{ markedSentences.length }})</div>
      <div class="ca-marked-scroll">
        <div
          v-for="(item, i) in markedSentences.slice(0, 12)"
          :key="i"
          class="ca-marked-item"
          :class="'mark-' + item.type"
        >
          <span class="ca-marked-tag">{{ tagLabel(item.type) }}</span>
          {{ item.text }}
        </div>
      </div>
    </div>

    <div class="ca-checks">
      <div v-for="check in analysis.checks" :key="check.id" class="ca-row" :class="'ca-' + check.status">
        <span class="ca-icon">{{ icon(check.status) }}</span>
        <span class="ca-label">{{ check.label }}</span>
        <span class="ca-detail">{{ check.detail }}</span>
      </div>
    </div>

    <div v-if="analysis.paragraphScores?.length" class="ca-paragraphs">
      <div class="ca-sug-title">Legibilidad por párrafo</div>
      <div class="ca-para-grid">
        <span
          v-for="p in analysis.paragraphScores"
          :key="p.index"
          class="ca-para-chip"
          :class="paraClass(p.score)"
          :title="`${p.words} palabras`"
        >
          P{{ p.index }} · {{ p.score }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { analyzeContentReadability } from '../utils/contentReadability.js'

const props = defineProps({
  pageData: { type: Object, required: true },
})

const focusKeyword = ref('')
const markOnPage = ref(true)
const highlightStatus = ref('')

const TAGS = {
  passive: 'Pasiva',
  long: 'Larga',
  consecutive: 'Repetida',
  keyword: 'Keyword',
}

watch(
  () => props.pageData?.title,
  (title) => {
    if (title && !focusKeyword.value) {
      focusKeyword.value = title.split(/\s+/).slice(0, 3).join(' ')
    }
  },
  { immediate: true },
)

const analysis = computed(() => analyzeContentReadability(props.pageData, focusKeyword.value))
const markedSentences = computed(() => analysis.value.highlightIssues || [])

const scoreClass = computed(() => {
  const s = analysis.value.score
  if (s >= 75) return 'score-good'
  if (s >= 50) return 'score-ok'
  return 'score-bad'
})

function icon(status) {
  if (status === 'good') return '●'
  if (status === 'ok') return '◐'
  return '○'
}

function paraClass(score) {
  if (score >= 60) return 'para-good'
  if (score >= 45) return 'para-ok'
  return 'para-bad'
}

function tagLabel(type) {
  return TAGS[type] || type
}

let highlightTimer = null

async function syncPageHighlights() {
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      if (!markOnPage.value) {
        await chrome.tabs.sendMessage(tab.id, { action: 'clearContentHighlight' })
        highlightStatus.value = ''
        return
      }

      const issues = analysis.value.highlightIssues || []
      const res = await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightContent',
        issues,
      })
      highlightStatus.value = res?.applied
        ? `${res.applied} resaltadas en página`
        : issues.length
          ? 'Abre la pestaña web para ver marcas'
          : 'Sin frases problemáticas'
    } catch {
      highlightStatus.value = 'Recarga la pestaña (F5) para marcar'
    }
  }, 350)
}

watch([analysis, markOnPage], syncPageHighlights, { immediate: true })

onUnmounted(() => {
  if (highlightTimer) clearTimeout(highlightTimer)
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'clearContentHighlight' }).catch(() => {})
    }
  })
})
</script>

<style scoped>
.content-analysis {
  font-size: 11px;
}

.ca-kw-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ca-kw-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6ee7b7;
  white-space: nowrap;
}

.ca-kw-input {
  flex: 1;
  min-width: 0;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.35);
  background: rgba(9, 9, 11, 0.8);
  padding: 5px 8px;
  font-size: 11px;
  color: #f4f4f5;
}

.ca-kw-input:focus {
  outline: none;
  border-color: rgba(52, 211, 153, 0.6);
}

.ca-highlight-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ca-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #a1a1aa;
  cursor: pointer;
}

.ca-legend-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.leg {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid;
}

.leg.passive { background: #fef3c7; color: #78350f; border-color: #d97706; }
.leg.long { background: #fee2e2; color: #7f1d1d; border-color: #dc2626; }
.leg.consecutive { background: #dbeafe; color: #1e3a8a; border-color: #2563eb; }
.leg.keyword { background: #ede9fe; color: #4c1d95; border-color: #7c3aed; }

.ca-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(63, 63, 70, 0.6);
}

.ca-score {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  border: 2px solid;
}

.score-good {
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.5);
  background: rgba(6, 78, 59, 0.35);
}

.score-ok {
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(120, 53, 15, 0.35);
}

.score-bad {
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(127, 29, 29, 0.35);
}

.ca-meta {
  flex: 1;
  min-width: 0;
}

.ca-title {
  font-size: 12px;
  font-weight: 700;
  color: #e4e4e7;
}

.ca-sub {
  font-size: 10px;
  color: #71717a;
  margin-top: 2px;
}

.ca-hl-status {
  color: #6ee7b7;
}

.ca-legend {
  display: flex;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
}

.dot.good { color: #6ee7b7; }
.dot.ok { color: #fcd34d; }
.dot.bad { color: #fca5a5; }

.ca-suggestions {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  background: rgba(120, 53, 15, 0.15);
}

.ca-sug-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a1a1aa;
  margin-bottom: 6px;
}

.ca-sug-list {
  margin: 0;
  padding-left: 16px;
  line-height: 1.45;
}

.ca-sug-list li {
  margin-bottom: 3px;
  color: #d4d4d8;
}

.sug-bad { color: #fca5a5; }
.sug-ok { color: #fcd34d; }

.ca-marked-list {
  margin-bottom: 10px;
}

.ca-marked-scroll {
  max-height: 100px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ca-marked-item {
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.35;
  border-left: 3px solid;
  background: rgba(24, 24, 27, 0.6);
  color: #d4d4d8;
}

.ca-marked-tag {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-right: 6px;
  opacity: 0.85;
}

.mark-passive { border-color: #d97706; }
.mark-long { border-color: #dc2626; }
.mark-consecutive { border-color: #2563eb; }
.mark-keyword { border-color: #7c3aed; }

.ca-checks {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ca-row {
  display: grid;
  grid-template-columns: 12px 100px 1fr;
  gap: 5px;
  align-items: start;
  padding: 3px 5px;
  border-radius: 4px;
  background: rgba(24, 24, 27, 0.5);
}

.ca-good .ca-icon { color: #6ee7b7; }
.ca-ok .ca-icon { color: #fcd34d; }
.ca-bad .ca-icon { color: #fca5a5; }

.ca-label {
  font-weight: 600;
  color: #d4d4d8;
  font-size: 10px;
}

.ca-detail {
  color: #71717a;
  text-align: right;
  line-height: 1.35;
  font-size: 10px;
}

.ca-paragraphs {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(63, 63, 70, 0.5);
}

.ca-para-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ca-para-chip {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  border: 1px solid;
}

.para-good {
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.35);
  background: rgba(6, 78, 59, 0.25);
}

.para-ok {
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(120, 53, 15, 0.2);
}

.para-bad {
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(127, 29, 29, 0.2);
}
</style>
