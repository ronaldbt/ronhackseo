<template>
  <div class="crawl-summary text-sm text-zinc-300">
    <p class="mt-0 text-xs text-zinc-400">
      Resumen del <strong class="text-emerald-400/90">último rastreo</strong> guardado en la extensión. Vuelve a la pestaña <strong class="text-emerald-400/90">Sitio</strong> para
      iniciar uno nuevo.
    </p>

    <div v-if="idleEmpty" class="mt-6 rounded-lg border border-emerald-500/20 bg-zinc-900/60 px-4 py-8 text-center text-zinc-500">
      Aún no hay un rastreo finalizado con datos de resumen.
    </div>

    <template v-else>
      <div v-if="finishLabel" class="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-950/55 px-3 py-2 text-xs font-medium text-emerald-200">
        {{ finishLabel }}
      </div>

      <p v-if="rebuiltLocally" class="mt-2 text-[11px] text-amber-400">
        El resumen se reconstruyó a partir de los resultados guardados (útil si el almacenamiento recibió los datos en
        dos pasos).
      </p>

      <div v-if="summary" class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div class="rounded border border-emerald-500/15 bg-zinc-900/70 px-2 py-2">
          <div class="text-zinc-500">URLs rastreadas</div>
          <div class="text-lg font-semibold text-zinc-100">{{ summary.totalUrls }}</div>
        </div>
        <div class="rounded border border-emerald-500/15 bg-zinc-900/70 px-2 py-2">
          <div class="text-zinc-500">HTML OK (200)</div>
          <div class="text-lg font-semibold text-zinc-100">{{ summary.htmlOk }}</div>
        </div>
        <div class="rounded border border-emerald-500/15 bg-zinc-900/70 px-2 py-2">
          <div class="text-zinc-500">Grupos título duplicado</div>
          <div class="text-lg font-semibold text-amber-400">{{ summary.duplicateTitleGroups }}</div>
        </div>
        <div class="rounded border border-emerald-500/15 bg-zinc-900/70 px-2 py-2">
          <div class="text-zinc-500">Grupos H1 duplicado</div>
          <div class="text-lg font-semibold text-amber-400">{{ summary.duplicateH1Groups }}</div>
        </div>
        <div class="rounded border border-emerald-500/15 bg-zinc-900/70 px-2 py-2">
          <div class="text-zinc-500">Meta duplicada</div>
          <div class="text-lg font-semibold text-zinc-200">{{ summary.duplicateMetaGroups }}</div>
        </div>
        <div class="rounded border border-emerald-500/15 bg-zinc-900/70 px-2 py-2">
          <div class="text-zinc-500">Problemas generados</div>
          <div class="text-lg font-semibold text-red-400">{{ summary.issuesCount }}</div>
        </div>
      </div>

      <div v-else-if="crawlEnded" class="mt-4 rounded border border-emerald-500/20 bg-zinc-900/50 px-3 py-3 text-xs text-zinc-400">
        Rastreo finalizado ({{ state.siteCrawlProgress?.fetched ?? '?' }} URLs). No hay bloque de resumen en almacenamiento;
        vuelve a abrir esta pestaña o ejecuta un rastreo nuevo.
      </div>

      <h3 class="mb-2 mt-6 border-b border-emerald-500/15 pb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
        Hallazgos del rastreo
      </h3>
      <div class="overflow-x-auto rounded-lg border border-emerald-500/20 bg-zinc-950/40">
        <table class="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr class="bg-zinc-900/90 text-zinc-300">
              <th class="border-b border-emerald-500/20 px-2 py-2 font-semibold">Nombre</th>
              <th class="border-b border-emerald-500/20 px-2 py-2 font-semibold">Tipo</th>
              <th class="border-b border-emerald-500/20 px-2 py-2 font-semibold">Prioridad</th>
              <th class="border-b border-emerald-500/20 px-2 py-2 text-right font-semibold">URLs</th>
              <th class="border-b border-emerald-500/20 px-2 py-2 text-right font-semibold">% del total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in issues" :key="i" class="odd:bg-zinc-900/50 even:bg-zinc-950/80">
              <td class="border-b border-zinc-800 px-2 py-1.5 text-zinc-200">
                <div>{{ row.nombre }}</div>
                <div v-if="row.detalle" class="mt-0.5 max-w-xs truncate font-mono text-[10px] text-zinc-500" :title="row.detalle">
                  {{ row.detalle }}
                </div>
              </td>
              <td class="border-b border-zinc-800 px-2 py-1.5">{{ row.tipo }}</td>
              <td class="border-b border-zinc-800 px-2 py-1.5">{{ row.prioridad }}</td>
              <td class="border-b border-zinc-800 px-2 py-1.5 text-right tabular-nums">{{ row.urls }}</td>
              <td class="border-b border-zinc-800 px-2 py-1.5 text-right tabular-nums">{{ row.pct }}</td>
            </tr>
            <tr v-if="!issues.length">
              <td colspan="5" class="px-3 py-6 text-center text-zinc-500">Sin hallazgos de duplicados ni 404.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { analyzeCrawlResults } from '../utils/crawlDuplicateAnalysis.js'

const STORAGE_KEYS = [
  'siteCrawlSummary',
  'siteCrawlIssues',
  'siteCrawlProgress',
  'siteCrawlResults',
  'siteCrawlRunning',
  'siteCrawlFinishedAt',
]

const state = reactive({
  siteCrawlSummary: null,
  siteCrawlIssues: [],
  siteCrawlProgress: null,
  siteCrawlResults: [],
  siteCrawlRunning: false,
  siteCrawlFinishedAt: null,
})

const rebuiltLocally = ref(false)

let pollTimer = null

function applyDerivedFromResults(rawResults, progress) {
  if (!Array.isArray(rawResults) || !rawResults.length) return false
  try {
    const { issues, summary } = analyzeCrawlResults(rawResults)
    const fr = progress?.finishReason
    if (fr) summary.finishReason = fr
    state.siteCrawlSummary = summary
    state.siteCrawlIssues = issues
    rebuiltLocally.value = true
    return true
  } catch {
    return false
  }
}

async function refresh() {
  rebuiltLocally.value = false
  try {
    const s = await chrome.storage.local.get(STORAGE_KEYS)
    state.siteCrawlProgress = s.siteCrawlProgress || null
    state.siteCrawlRunning = !!s.siteCrawlRunning
    state.siteCrawlFinishedAt = s.siteCrawlFinishedAt || null
    state.siteCrawlResults = Array.isArray(s.siteCrawlResults) ? s.siteCrawlResults : []

    const hasStoredSummary = s.siteCrawlSummary != null && typeof s.siteCrawlSummary === 'object'
    const hasStoredIssues = Array.isArray(s.siteCrawlIssues) && s.siteCrawlIssues.length > 0

    if (hasStoredSummary) {
      state.siteCrawlSummary = s.siteCrawlSummary
      state.siteCrawlIssues = Array.isArray(s.siteCrawlIssues) ? s.siteCrawlIssues : []
      return
    }

    if (hasStoredIssues) {
      state.siteCrawlSummary = null
      state.siteCrawlIssues = s.siteCrawlIssues
      return
    }

    if (!state.siteCrawlRunning && state.siteCrawlResults.length && (state.siteCrawlFinishedAt || s.siteCrawlProgress?.done)) {
      if (applyDerivedFromResults(state.siteCrawlResults, s.siteCrawlProgress)) return
    }

    state.siteCrawlSummary = null
    state.siteCrawlIssues = []
  } catch {
    /* popup o almacenamiento no disponible */
  }
}

function onStorageChanged(changes, area) {
  if (area !== 'local') return
  const touched = STORAGE_KEYS.some((k) => Object.prototype.hasOwnProperty.call(changes, k))
  if (touched) void refresh()
}

const summary = computed(() => state.siteCrawlSummary)
const issues = computed(() => state.siteCrawlIssues || [])

const crawlEnded = computed(
  () => !!state.siteCrawlFinishedAt || !!state.siteCrawlProgress?.done,
)

const idleEmpty = computed(() => {
  if (state.siteCrawlRunning) return false
  if (state.siteCrawlSummary) return false
  if (issues.value.length) return false
  if (crawlEnded.value) return false
  return !state.siteCrawlResults?.length
})

const finishLabel = computed(() => {
  const fr = summary.value?.finishReason || state.siteCrawlProgress?.finishReason
  if (!fr) return ''
  if (fr === 'aborted') return 'Estado: rastreo detenido manualmente.'
  if (fr === 'limit') return 'Estado: se alcanzó el tope de 1000 URL (puede haber cola pendiente).'
  if (fr === 'exhausted') return 'Estado: rastreo completo — no quedan URLs internas en la cola.'
  return ''
})

onMounted(() => {
  void refresh()
  pollTimer = setInterval(refresh, 900)
  try {
    chrome.storage.onChanged.addListener(onStorageChanged)
  } catch {
    /* sin API en entornos de prueba */
  }
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  try {
    chrome.storage.onChanged.removeListener(onStorageChanged)
  } catch {
    /* ignore */
  }
})
</script>
