<template>
  <div class="site-crawl text-sm text-gray-800">
    <p class="mt-0 text-xs leading-relaxed text-slate-600">
      Rastrea el mismo sitio que la pestaña (máx. <strong>1000</strong> URLs): enlaces en HTML, respaldo por
      <code>href</code> en texto, <strong>sitemap.xml</strong> (e índices) y equivalencia <strong>www</strong>/apex.
      No ejecuta JavaScript del sitio: las páginas SPA pueden mostrar menos enlaces hasta que el HTML inicial incluya
      rutas o enlaces estáticos.
    </p>

    <div class="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <div class="font-mono break-all"><span class="text-slate-500">Origen:</span> {{ seedDisplay }}</div>
      <div v-if="state.siteCrawlHost" class="mt-1">
        <span class="text-slate-500">Dominio:</span> {{ state.siteCrawlHost }}
      </div>
    </div>

    <div v-if="state.siteCrawlError" class="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
      {{ state.siteCrawlError }}
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="starting || state.siteCrawlRunning || !canCrawl"
        @click="startCrawl"
      >
        {{ starting ? 'Iniciando…' : 'Iniciar rastreo del sitio' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        :disabled="!state.siteCrawlRunning"
        @click="stopCrawl"
      >
        Detener
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        :disabled="!state.siteCrawlResults?.length"
        @click="exportCsv"
      >
        Exportar CSV
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        :disabled="!state.siteCrawlResults?.length && !state.siteCrawlRunning"
        @click="clearStored"
      >
        Limpiar resultados
      </button>
    </div>

    <div v-if="state.siteCrawlProgress" class="mt-4 space-y-3">
      <div>
        <div class="mb-1 flex justify-between text-xs text-slate-600">
          <span>URLs visitadas (tope {{ state.siteCrawlProgress.max }})</span>
          <span>
            {{ state.siteCrawlProgress.fetched }} / {{ state.siteCrawlProgress.max }}
            <span v-if="state.siteCrawlRunning" class="text-emerald-600"> · en curso</span>
            <span v-else-if="state.siteCrawlProgress.aborted" class="text-amber-600"> · detenido</span>
            <span v-else class="text-slate-500"> · fin</span>
          </span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-emerald-500 transition-all duration-300"
            :style="{ width: progressPct + '%' }"
          />
        </div>
      </div>
      <div>
        <div class="mb-1 flex justify-between text-xs text-slate-600">
          <span>Avance de la cola (URLs procesadas / pendientes)</span>
          <span>{{ queueProgressPct }}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-sky-500 transition-all duration-300"
            :style="{ width: queueProgressPct + '%' }"
          />
        </div>
      </div>
      <p v-if="state.siteCrawlProgress.current" class="truncate font-mono text-[10px] text-slate-500">
        {{ state.siteCrawlProgress.current }}
      </p>
    </div>

    <div
      v-if="completionBanner && !state.siteCrawlRunning"
      class="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
    >
      {{ completionBanner }}
    </div>

    <div
      v-if="state.siteCrawlSummary && !state.siteCrawlRunning"
      class="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm"
    >
      <div class="mb-2 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Resumen del rastreo
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div><span class="text-slate-500">HTML 200 analizado:</span> {{ state.siteCrawlSummary.htmlOk }}</div>
        <div><span class="text-slate-500">Títulos duplicados (grupos):</span> {{ state.siteCrawlSummary.duplicateTitleGroups }}</div>
        <div><span class="text-slate-500">H1 duplicados (grupos):</span> {{ state.siteCrawlSummary.duplicateH1Groups }}</div>
        <div><span class="text-slate-500">Meta duplicada:</span> {{ state.siteCrawlSummary.duplicateMetaGroups }}</div>
        <div><span class="text-slate-500">Hallazgos:</span> {{ state.siteCrawlSummary.issuesCount }}</div>
      </div>
      <p class="mb-0 mt-2 text-[11px] text-slate-500">
        El detalle también está en <strong>Problemas</strong> y en la pestaña <strong>Rastreo</strong>.
      </p>
    </div>

    <div class="mt-6 border-t border-slate-200 pt-5">
      <h3 class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Vista rápida</h3>
      <p class="mb-2 text-[11px] text-slate-500">Una fila por URL: código, tipo y título detectado.</p>
      <div class="max-h-48 overflow-auto rounded-lg border border-slate-200 shadow-sm">
        <table class="w-full min-w-[420px] border-collapse text-left text-[10px]">
          <thead class="sticky top-0 z-[1] bg-slate-700 text-white">
            <tr>
              <th class="border-b border-slate-800 px-2 py-1.5 font-semibold">#</th>
              <th class="border-b border-slate-800 px-2 py-1.5 font-semibold">Código</th>
              <th class="border-b border-slate-800 px-2 py-1.5 font-semibold">Tipo</th>
              <th class="border-b border-slate-800 px-2 py-1.5 font-semibold">URL</th>
              <th class="border-b border-slate-800 px-2 py-1.5 font-semibold">Título</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in state.siteCrawlResults || []" :key="'q-' + row.url + ri" class="odd:bg-white even:bg-slate-50/80">
              <td class="border-b border-slate-100 px-2 py-1 tabular-nums text-slate-500">{{ ri + 1 }}</td>
              <td class="border-b border-slate-100 px-2 py-1 tabular-nums">{{ row.status }}</td>
              <td class="max-w-[100px] truncate border-b border-slate-100 px-2 py-1" :title="row.contentType">{{ shortType(row.contentType) }}</td>
              <td class="border-b border-slate-100 px-2 py-1 font-mono text-[9px] text-slate-800">{{ row.url }}</td>
              <td class="max-w-[140px] truncate border-b border-slate-100 px-2 py-1" :title="row.title || quickTitle(row)">
                {{ row.title || quickTitle(row) || '—' }}
              </td>
            </tr>
            <tr v-if="!(state.siteCrawlResults || []).length">
              <td colspan="5" class="px-3 py-6 text-center text-slate-500">Aún no hay URLs.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-6 border-t border-slate-200 pt-5">
      <h3 class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Detalle extendido (export CSV)</h3>
      <p class="mb-2 text-[11px] text-slate-500">
        Mismas columnas que la pestaña Escáner para documentos HTML con respuesta 200; el resto muestra URL, código y
        motivo en columnas base.
      </p>
      <div class="max-h-72 overflow-auto rounded-lg border border-slate-200 shadow-sm">
        <table class="w-max min-w-full border-collapse text-left text-[9px]">
          <thead class="sticky top-0 z-[1] bg-emerald-700 text-white">
            <tr>
              <th class="whitespace-nowrap border-b border-emerald-800 px-1 py-1 font-semibold">#</th>
              <th
                v-for="(col, ci) in SCANNER_COLUMNS"
                :key="ci"
                class="whitespace-nowrap border-b border-emerald-800 px-1 py-1 font-semibold"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in state.siteCrawlResults || []" :key="'d-' + row.url + ri" class="odd:bg-white even:bg-slate-50/80">
              <td class="border-b border-slate-100 px-1 py-0.5 tabular-nums text-slate-500">{{ ri + 1 }}</td>
              <td
                v-for="(cell, ci) in scannerCells(row)"
                :key="ci"
                class="max-w-[120px] whitespace-normal break-words border-b border-slate-100 px-1 py-0.5"
              >
                {{ cell }}
              </td>
            </tr>
            <tr v-if="!(state.siteCrawlResults || []).length">
              <td :colspan="SCANNER_COLUMNS.length + 1" class="px-3 py-6 text-center text-slate-500">Aún no hay URLs.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { SCANNER_COLUMNS } from '../constants/scannerColumns.js'

const seedUrl = ref('')
const seedDisplay = computed(() => seedUrl.value || '(sin pestaña http/https)')
const canCrawl = computed(() => /^https?:\/\//i.test(seedUrl.value || ''))
const starting = ref(false)

const state = reactive({
  siteCrawlRunning: false,
  siteCrawlProgress: null,
  siteCrawlResults: [],
  siteCrawlHost: '',
  siteCrawlError: null,
  siteCrawlSummary: null,
  siteCrawlIssues: [],
})

let pollTimer = null

async function refreshState() {
  try {
    const s = await chrome.runtime.sendMessage({ type: 'CRAWL_GET_STATE' })
    if (s) {
      state.siteCrawlRunning = !!s.siteCrawlRunning
      state.siteCrawlProgress = s.siteCrawlProgress || null
      state.siteCrawlResults = s.siteCrawlResults || []
      state.siteCrawlHost = s.siteCrawlHost || ''
      state.siteCrawlError = s.siteCrawlError || null
      state.siteCrawlSummary = s.siteCrawlSummary || null
      state.siteCrawlIssues = s.siteCrawlIssues || []
    }
  } catch {
    /* popup cerrado o SW inactivo */
  }
}

async function loadActiveTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const u = tab?.url || ''
    if (u.startsWith('http://') || u.startsWith('https://')) {
      seedUrl.value = u
    } else {
      seedUrl.value = ''
    }
  } catch {
    seedUrl.value = ''
  }
}

const progressPct = computed(() => {
  const max = state.siteCrawlProgress?.max || 1000
  const n = state.siteCrawlProgress?.fetched || 0
  return Math.min(100, Math.round((n / max) * 100))
})

const queueProgressPct = computed(() => {
  const p = state.siteCrawlProgress
  if (!p) return 0
  if (p.queuePct != null && p.done) return Math.min(100, p.queuePct)
  const f = p.fetched || 0
  const q = p.queued || 0
  const denom = Math.max(1, f + q)
  return Math.min(100, Math.round((f / denom) * 100))
})

function shortType(ct) {
  if (!ct) return '—'
  const base = String(ct).split(';')[0].trim()
  return base.length > 30 ? `${base.slice(0, 28)}…` : base
}

function quickTitle(row) {
  const v = row.scannerValues
  if (Array.isArray(v) && v.length > 6 && v[6]) return v[6]
  return ''
}

/** Filas antiguas sin 72 celdas: relleno para no romper cabeceras. */
function scannerCells(row) {
  const v = row.scannerValues
  if (Array.isArray(v) && v.length === SCANNER_COLUMNS.length) return v
  return Array(SCANNER_COLUMNS.length).fill('—')
}

const completionBanner = computed(() => {
  const p = state.siteCrawlProgress
  if (!p || state.siteCrawlRunning) return ''
  if (p.aborted) return 'Rastreo detenido manualmente.'
  if (p.finishReason === 'limit')
    return 'Se alcanzó el límite de 1000 URL. Puede quedar cola sin visitar.'
  if (p.finishReason === 'exhausted')
    return 'Rastreo completo: el sitio quedó escaneado (cola vacía, menos de 1000 URL o todas descubiertas).'
  return 'Rastreo finalizado.'
})

/**
 * chrome.permissions.request() debe ejecutarse en el popup y en la misma
 * pila del clic (sin await antes). El service worker no tiene user gesture.
 */
function startCrawl() {
  if (!canCrawl.value) return
  starting.value = true
  state.siteCrawlError = null

  let origins
  try {
    origins = [`${new URL(seedUrl.value).origin}/*`]
  } catch {
    state.siteCrawlError = 'URL de inicio no válida'
    starting.value = false
    return
  }

  chrome.permissions.request({ origins }, (granted) => {
    if (chrome.runtime.lastError) {
      state.siteCrawlError = chrome.runtime.lastError.message || 'Error de permisos'
      starting.value = false
      void refreshState()
      return
    }
    if (!granted) {
      state.siteCrawlError = 'Permiso denegado: hace falta acceso a este dominio para rastrear.'
      starting.value = false
      void refreshState()
      return
    }

    chrome.runtime.sendMessage({ type: 'CRAWL_START', seedUrl: seedUrl.value }, (res) => {
      if (chrome.runtime.lastError) {
        state.siteCrawlError = chrome.runtime.lastError.message || 'Error al hablar con el worker'
      } else if (res && res.ok === false) {
        state.siteCrawlError = res.error || 'No se pudo iniciar'
      }
      starting.value = false
      void refreshState()
    })
  })
}

async function stopCrawl() {
  try {
    await chrome.runtime.sendMessage({ type: 'CRAWL_STOP' })
  } catch {
    /* ignore */
  }
  await refreshState()
}

async function clearStored() {
  await chrome.storage.local.remove([
    'siteCrawlRunning',
    'siteCrawlProgress',
    'siteCrawlResults',
    'siteCrawlHost',
    'siteCrawlError',
    'siteCrawlStartedAt',
    'siteCrawlFinishedAt',
    'siteCrawlIssues',
    'siteCrawlSummary',
  ])
  await refreshState()
}

function exportCsv() {
  const rows = state.siteCrawlResults || []
  const esc = (v) => {
    const s = String(v ?? '')
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = []
  const first = rows[0]
  if (first && Array.isArray(first.scannerValues) && SCANNER_COLUMNS.length === first.scannerValues.length) {
    lines.push(SCANNER_COLUMNS.map(esc).join(','))
    for (const r of rows) {
      const vals = Array.isArray(r.scannerValues) ? r.scannerValues : []
      lines.push(vals.map(esc).join(','))
    }
  } else {
    lines.push(['url', 'status', 'title', 'contentType', 'error'].join(','))
    for (const r of rows) {
      lines.push([esc(r.url), esc(r.status), esc(r.title), esc(r.contentType), esc(r.error)].join(','))
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `crawl-${state.siteCrawlHost || 'sitio'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(async () => {
  await loadActiveTabUrl()
  await refreshState()
  pollTimer = setInterval(refreshState, 600)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
