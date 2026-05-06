<template>
  <div class="site-crawl text-sm text-gray-800">
    <p class="mt-0 text-xs leading-relaxed text-slate-600">
      Rastrea enlaces internos del <strong>mismo dominio</strong> que la pestaña activa (máx.
      <strong>1000</strong> URLs). Los datos se guardan en el almacenamiento local de la extensión.
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

    <div v-if="state.siteCrawlProgress" class="mt-4">
      <div class="mb-1 flex justify-between text-xs text-slate-600">
        <span>Progreso</span>
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
      <p v-if="state.siteCrawlProgress.current" class="mt-1 truncate font-mono text-[10px] text-slate-500">
        {{ state.siteCrawlProgress.current }}
      </p>
    </div>

    <div class="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-200">
      <table class="w-full min-w-full border-collapse text-left text-[11px]">
        <thead class="sticky top-0 bg-slate-100 text-slate-700">
          <tr>
            <th class="border-b border-slate-200 px-2 py-1.5 font-semibold">#</th>
            <th class="border-b border-slate-200 px-2 py-1.5 font-semibold">Código</th>
            <th class="border-b border-slate-200 px-2 py-1.5 font-semibold">URL</th>
            <th class="border-b border-slate-200 px-2 py-1.5 font-semibold">Título</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in state.siteCrawlResults || []" :key="row.url + i" class="odd:bg-white even:bg-slate-50/80">
            <td class="border-b border-slate-100 px-2 py-1 tabular-nums text-slate-500">{{ i + 1 }}</td>
            <td class="border-b border-slate-100 px-2 py-1 tabular-nums">{{ row.status }}</td>
            <td class="max-w-[200px] break-all border-b border-slate-100 px-2 py-1 font-mono text-[10px]">
              {{ row.url }}
            </td>
            <td class="max-w-[160px] truncate border-b border-slate-100 px-2 py-1" :title="row.title">
              {{ row.title || '—' }}
            </td>
          </tr>
          <tr v-if="!(state.siteCrawlResults || []).length">
            <td colspan="4" class="px-3 py-6 text-center text-slate-500">Aún no hay URLs rastreadas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

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
  ])
  await refreshState()
}

function exportCsv() {
  const rows = state.siteCrawlResults || []
  const header = ['url', 'status', 'title', 'contentType', 'error']
  const lines = [header.join(',')]
  for (const r of rows) {
    const esc = (v) => {
      const s = String(v ?? '')
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    lines.push([esc(r.url), esc(r.status), esc(r.title), esc(r.contentType), esc(r.error)].join(','))
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
