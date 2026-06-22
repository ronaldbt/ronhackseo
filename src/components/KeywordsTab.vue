<template>
  <div class="keywords-tab text-sm text-zinc-300">
    <p class="mb-3 text-xs leading-relaxed text-zinc-400">
      Escribe una keyword y obtén ideas de Google, Bing y DuckDuckGo. Si analizaste la página, verás si cada término aparece en title, H1 o meta.
    </p>

    <div class="mb-4 flex flex-wrap items-end gap-3">
      <div class="min-w-[220px] flex-1">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Keyword semilla</label>
        <input
          v-model="seed"
          type="text"
          class="w-full rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100 focus:border-emerald-500 focus:outline-none"
          placeholder="ej: lentes ópticos chile"
          @keydown.enter="runSearch"
        />
      </div>
      <button
        type="button"
        class="rounded-lg border border-emerald-500/50 bg-emerald-950/80 px-4 py-2 font-semibold text-emerald-100 hover:bg-emerald-900/90 disabled:opacity-50"
        :disabled="loading || !seed.trim()"
        @click="runSearch"
      >
        {{ loading ? 'Buscando…' : 'Explorar' }}
      </button>
    </div>

    <p v-if="sourcesLabel" class="mb-3 text-[11px] text-emerald-300/80">Fuentes: {{ sourcesLabel }}</p>
    <p v-if="error" class="mb-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-red-200">{{ error }}</p>

    <div v-if="paa.length" class="mb-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50 p-3">
      <h3 class="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-emerald-400">People Also Ask (Google SERP)</h3>
      <ul class="m-0 list-none space-y-1 p-0">
        <li v-for="(q, i) in paa" :key="'paa-' + i" class="rounded bg-zinc-900/60 px-2 py-1 text-xs text-zinc-200">{{ q }}</li>
      </ul>
    </div>
    <p v-else-if="paaChecked && isGoogleSerp" class="mb-4 text-xs text-zinc-500">No se detectaron PAA en esta SERP de Google.</p>

    <div v-if="rows.length" class="overflow-x-auto rounded-lg border border-emerald-500/20">
      <table class="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead>
          <tr class="border-b border-zinc-700 bg-zinc-900/80 text-zinc-400">
            <th class="px-3 py-2 font-semibold">Keyword</th>
            <th class="px-2 py-2 font-semibold">Fuente</th>
            <th v-if="pageData" class="px-2 py-2 text-center font-semibold">Title</th>
            <th v-if="pageData" class="px-2 py-2 text-center font-semibold">H1</th>
            <th v-if="pageData" class="px-2 py-2 text-center font-semibold">Meta</th>
            <th v-if="pageData" class="px-2 py-2 text-center font-semibold">Body</th>
            <th v-if="pageData" class="px-2 py-2 text-right font-semibold">Densidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.keyword + row.source" class="border-b border-zinc-800/80 odd:bg-zinc-900/30">
            <td class="px-3 py-2 font-medium text-zinc-100">{{ row.keyword }}</td>
            <td class="px-2 py-2 capitalize text-zinc-400">{{ row.source }}</td>
            <template v-if="pageData">
              <td class="px-2 py-2 text-center">{{ badge(row.match.inTitle) }}</td>
              <td class="px-2 py-2 text-center">{{ badge(row.match.inH1) }}</td>
              <td class="px-2 py-2 text-center">{{ badge(row.match.inMeta) }}</td>
              <td class="px-2 py-2 text-center">{{ badge(row.match.inBody) }}</td>
              <td class="px-2 py-2 text-right text-zinc-400">{{ row.match.density }}%</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="searched && !loading" class="text-center text-zinc-500">Sin sugerencias. Prueba otra keyword o recarga la extensión.</p>
    <p v-if="!pageData" class="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
      Abre el popup en una página analizada (pestaña Resumen) para cruzar keywords con title, H1 y meta.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { analyzeKeywordOnPage } from '../utils/keywordAnalysis.js'
import { fetchAllKeywordSuggestions } from '../utils/keywordSuggest.js'

const props = defineProps({
  pageData: { type: Object, default: null },
  tabUrl: { type: String, default: '' },
})

const seed = ref('')
const loading = ref(false)
const searched = ref(false)
const error = ref('')
const allKeywords = ref([])
const sourceMap = ref({})
const sources = ref([])
const paa = ref([])
const paaChecked = ref(false)

const isGoogleSerp = computed(() => /google\.[^/]+\/search/i.test(props.tabUrl || ''))

const sourcesLabel = computed(() => {
  if (!sources.value.length) return ''
  const labels = { google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', página: 'página', variaciones: 'variaciones' }
  return sources.value.map((s) => labels[s] || s).join(', ')
})

const rows = computed(() =>
  allKeywords.value.map((keyword) => ({
    keyword,
    source: sourceMap.value[keyword.toLowerCase()] || 'mixto',
    match: props.pageData ? analyzeKeywordOnPage(keyword, props.pageData) : emptyMatch(),
  })),
)

function emptyMatch() {
  return { inTitle: false, inH1: false, inMeta: false, inBody: false, density: 0, count: 0 }
}

function badge(ok) {
  return ok ? '✓' : '—'
}

function applySuggestionResult(res) {
  if (!res) {
    error.value = 'No se pudieron obtener sugerencias. Comprueba tu conexión e inténtalo de nuevo.'
    return
  }
  if (res.error) error.value = res.error

  const map = {}
  const assign = (list, source) => {
    for (const kw of list || []) {
      const k = String(kw).trim()
      if (!k) continue
      const key = k.toLowerCase()
      if (!map[key]) map[key] = source
    }
  }
  assign(res.google, 'google')
  assign(res.bing, 'bing')
  assign(res.ddg, 'duckduckgo')
  assign(res.local, 'página')

  const merged = res.all?.length
    ? res.all
    : [...(res.google || []), ...(res.bing || []), ...(res.ddg || []), ...(res.local || [])]

  const seen = new Set()
  const unique = []
  for (const kw of merged) {
    const k = String(kw).trim()
    const key = k.toLowerCase()
    if (!k || seen.has(key)) continue
    seen.add(key)
    unique.push(k)
    if (!map[key]) map[key] = 'variación'
  }

  allKeywords.value = unique
  sourceMap.value = map
  sources.value = res.sources || []
}

async function loadPaa() {
  paaChecked.value = false
  paa.value = []
  if (!isGoogleSerp.value) return
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'extractPaa' })
    paa.value = res?.questions || []
  } catch {
    paa.value = []
  } finally {
    paaChecked.value = true
  }
}

async function runSearch() {
  const q = seed.value.trim()
  if (!q) return
  loading.value = true
  error.value = ''
  searched.value = true
  allKeywords.value = []
  try {
    const pageSlice = props.pageData
      ? {
          title: props.pageData.title,
          text: (props.pageData.text || '').slice(0, 80000),
          metaTags: props.pageData.metaTags,
          headers: props.pageData.headers,
        }
      : null
    const res = await fetchAllKeywordSuggestions(q, pageSlice)
    applySuggestionResult(res)
    await loadPaa()
  } catch (e) {
    error.value = e?.message || 'Error al obtener sugerencias'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.pageData?.title) {
    const words = props.pageData.title.split(/\s+/).slice(0, 4).join(' ')
    if (words) seed.value = words
  }
  if (seed.value.trim()) void runSearch()
  else if (isGoogleSerp.value) void loadPaa()
})

watch(
  () => props.pageData?.title,
  (title) => {
    if (title && !seed.value) {
      seed.value = title.split(/\s+/).slice(0, 4).join(' ')
      if (seed.value) void runSearch()
    }
  },
)
</script>
