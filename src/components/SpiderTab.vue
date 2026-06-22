<template>
  <div class="spider-root" :class="{ 'spider-fullscreen': fullscreen }">
    <!-- Barra superior -->
    <div class="spider-toolbar">
      <div class="spider-toolbar-row">
        <input
          v-model="seedUrl"
          type="text"
          class="spider-url-input"
          placeholder="https://ejemplo.com/"
          readonly
        />
        <button type="button" class="spider-btn spider-btn-primary" :disabled="starting || state.siteCrawlRunning || !canCrawl" @click="startCrawl">
          {{ starting ? '…' : 'Empezar' }}
        </button>
        <button type="button" class="spider-btn" :disabled="!state.siteCrawlRunning" @click="stopCrawl">Detener</button>
        <button type="button" class="spider-btn" :disabled="!hasCrawlData && !state.siteCrawlRunning" @click="clearStored">Borrar</button>
        <button type="button" class="spider-btn" :disabled="!displayRows.length" @click="exportCsv">CSV</button>
        <button type="button" class="spider-btn" :disabled="!canExportPdf" @click="exportPdf">PDF</button>
        <button v-if="!fullscreen" type="button" class="spider-btn spider-btn-accent" @click="openFullscreen">Pantalla completa</button>
      </div>

      <div v-if="state.siteCrawlProgress" class="spider-progress-wrap">
        <div class="spider-progress-meta">
          <span>{{ progressLabel }}</span>
          <span>{{ progressPct }}%</span>
        </div>
        <div class="spider-progress-bar">
          <div class="spider-progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
      </div>
    </div>

    <!-- Filtros + búsqueda -->
    <div class="spider-filters">
      <div class="spider-filter-tabs">
        <button
          v-for="f in SPIDER_FILTERS"
          :key="f.id"
          type="button"
          class="spider-filter-tab"
          :class="{ active: activeFilter === f.id }"
          @click="activeFilter = f.id"
        >
          {{ f.label }}
          <span class="spider-filter-count">{{ filterCounts[f.id] ?? 0 }}</span>
        </button>
      </div>
      <input v-model="searchQuery" type="search" class="spider-search" placeholder="Buscar URL o texto…" />
      <div v-if="sidebarFilterId" class="spider-overview-chip">
        <span>Filtro: {{ activeOverviewLabel }}</span>
        <button type="button" class="spider-chip-clear" title="Quitar filtro" @click="clearOverviewFilter">✕</button>
      </div>
    </div>

    <p v-if="state.siteCrawlError" class="spider-error">{{ state.siteCrawlError }}</p>

    <!-- Cuerpo: grid + sidebar -->
    <div class="spider-body">
      <div class="spider-grid-wrap">
        <div class="spider-grid-scroll">
          <table class="spider-table">
            <thead>
              <tr>
                <th class="spider-th sticky-col">#</th>
                <th v-for="(col, ci) in SCANNER_COLUMNS" :key="ci" class="spider-th">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in displayRows"
                :key="rowKey(row, ri)"
                class="spider-tr"
                :class="{ selected: selectedRow?.url === row.url }"
                @click="selectRow(row)"
              >
                <td class="spider-td sticky-col tabular-nums text-zinc-500">{{ ri + 1 }}</td>
                <td
                  v-for="(cell, ci) in scannerCells(row)"
                  :key="ci"
                  class="spider-td"
                  :title="String(cell ?? '')"
                >
                  {{ cell }}
                </td>
              </tr>
              <tr v-if="!displayRows.length">
                <td :colspan="SCANNER_COLUMNS.length + 1" class="spider-empty">
                  {{ emptyMessage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <aside class="spider-sidebar">
        <div class="spider-side-title">Descripción general</div>

        <div v-if="summary" class="spider-side-stats">
          <div class="spider-stat"><span>URLs rastreadas</span><strong>{{ summary.totalUrls }}</strong></div>
          <div class="spider-stat"><span>HTML 200</span><strong>{{ summary.htmlOk }}</strong></div>
          <div class="spider-stat"><span>Internas</span><strong>{{ stats.internal }}</strong></div>
          <div class="spider-stat"><span>Externas (enlaces)</span><strong>{{ stats.external }}</strong></div>
        </div>
        <p v-else class="spider-side-hint">Inicia un rastreo o usa «Página actual».</p>

        <template v-if="hasCrawlData">
          <div
            v-for="section in overviewSections"
            :key="section.id"
            class="spider-overview-section"
          >
            <button
              type="button"
              class="spider-overview-header"
              @click="toggleOverviewSection(section.id)"
            >
              <span class="spider-triangle" :class="{ collapsed: !expandedSections[section.id] }">▼</span>
              {{ section.title }}
            </button>

            <div v-show="expandedSections[section.id]" class="spider-overview-body">
              <div v-if="section.subtitle" class="spider-overview-sub">{{ section.subtitle }}</div>

              <div class="spider-overview-table-head">
                <span></span>
                <span>#</span>
                <span>%</span>
              </div>

              <button
                v-for="item in section.items"
                :key="item.id"
                type="button"
                class="spider-overview-row"
                :class="{ active: sidebarFilterId === item.id, zero: item.count === 0 }"
                @click="onOverviewClick(item.id)"
              >
                <span class="spider-overview-label" :title="item.label">{{ item.label }}</span>
                <span class="spider-overview-count">{{ item.count }}</span>
                <span class="spider-overview-pct">{{ item.pct }}</span>
              </button>

              <template v-if="section.codeItems?.length">
                <div class="spider-overview-sub spider-overview-codes">Por código HTTP</div>
                <button
                  v-for="item in section.codeItems"
                  :key="item.id"
                  type="button"
                  class="spider-overview-row spider-overview-row-code"
                  :class="{ active: sidebarFilterId === item.id, zero: item.count === 0 }"
                  @click="onOverviewClick(item.id)"
                >
                  <span class="spider-overview-label">{{ item.label }}</span>
                  <span class="spider-overview-count">{{ item.count }}</span>
                  <span class="spider-overview-pct">{{ item.pct }}</span>
                </button>
              </template>
            </div>
          </div>
        </template>
      </aside>
    </div>

    <!-- Panel inferior: detalle fila -->
    <div v-if="selectedRow" class="spider-detail">
      <div class="spider-detail-header">
        <span class="spider-detail-title">URL Details</span>
        <a :href="selectedDetail.url" target="_blank" rel="noopener" class="spider-detail-link">Abrir ↗</a>
        <button type="button" class="spider-detail-close" @click="selectedRow = null">✕</button>
      </div>
      <div class="spider-detail-grid">
        <div><span class="lbl">URL</span><span class="val mono">{{ selectedDetail.url }}</span></div>
        <div><span class="lbl">Código</span><span class="val">{{ selectedDetail.status }}</span></div>
        <div><span class="lbl">Título</span><span class="val">{{ selectedDetail.title || '—' }}</span></div>
        <div><span class="lbl">H1</span><span class="val">{{ selectedDetail.h1 || '—' }}</span></div>
        <div><span class="lbl">Meta</span><span class="val">{{ selectedDetail.metaDescription || '—' }}</span></div>
        <div><span class="lbl">Indexabilidad</span><span class="val">{{ selectedDetail.indexability || '—' }}</span></div>
      </div>
      <div class="spider-links-panels">
        <div class="spider-links-col">
          <div class="spider-side-title">Inlinks ({{ selectedInlinks.length }})</div>
          <ul class="spider-link-list">
            <li v-for="(l, i) in selectedInlinks.slice(0, 12)" :key="'in-' + i">
              <span class="mono">{{ l.from }}</span>
            </li>
            <li v-if="!selectedInlinks.length" class="text-zinc-500">Sin inlinks internos detectados</li>
          </ul>
        </div>
        <div class="spider-links-col">
          <div class="spider-side-title">Outlinks ({{ selectedOutlinks.length }})</div>
          <ul class="spider-link-list">
            <li v-for="(u, i) in selectedOutlinks.slice(0, 12)" :key="'out-' + i">
              <span class="mono">{{ u }}</span>
            </li>
            <li v-if="!selectedOutlinks.length" class="text-zinc-500">Sin outlinks</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="spider-statusbar">
      <span>Spider Mode: {{ state.siteCrawlRunning ? 'Crawling' : hasCrawlData ? 'Idle' : 'Ready' }}</span>
      <span v-if="speedLabel">{{ speedLabel }}</span>
      <span>{{ statusCountLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  SCANNER_COLUMNS,
  SPIDER_FILTERS,
  scannerCells,
  buildCurrentPageRow,
  expandWithExternalLinks,
  filterSpiderRows,
  searchRows,
  buildLinkGraph,
  getRowDetail,
  deriveSummary,
  deriveIssues,
} from '../utils/spiderHelpers.js'
import {
  buildSpiderOverviewSections,
  applyOverviewFilter,
} from '../utils/spiderOverview.js'

const props = defineProps({
  pageData: { type: Object, default: null },
  fullscreen: { type: Boolean, default: false },
})

const seedUrl = ref('')
const starting = ref(false)
const activeFilter = ref('internal')
const searchQuery = ref('')
const selectedRow = ref(null)
const sidebarFilterId = ref(null)
const expandedSections = reactive({
  security: true,
  response: true,
  issues: true,
})

const state = reactive({
  siteCrawlRunning: false,
  siteCrawlProgress: null,
  siteCrawlResults: [],
  siteCrawlHost: '',
  siteCrawlError: null,
  siteCrawlSummary: null,
  siteCrawlIssues: [],
  siteCrawlStartedAt: null,
})

let pollTimer = null
let linkGraph = { inlinks: new Map(), outlinks: new Map() }

const canCrawl = computed(() => /^https?:\/\//i.test(seedUrl.value || ''))
const hasCrawlData = computed(() => (state.siteCrawlResults || []).length > 0)

const currentPageRow = computed(() => {
  const sv = props.pageData?.scannerValues
  const url = props.pageData?.url || seedUrl.value
  if (!sv?.length || sv.length !== SCANNER_COLUMNS.length) return null
  return buildCurrentPageRow(url, sv)
})

const expandedCrawl = computed(() =>
  expandWithExternalLinks(state.siteCrawlResults, state.siteCrawlHost),
)

const overviewSections = computed(() =>
  buildSpiderOverviewSections(state.siteCrawlResults, state.siteCrawlHost),
)

const baseRows = computed(() => {
  let pool
  if (activeFilter.value === 'current') {
    pool = currentPageRow.value ? [currentPageRow.value] : []
  } else {
    const raw = activeFilter.value === 'external' ? expandedCrawl.value.all : expandedCrawl.value.internal
    pool = filterSpiderRows(raw, activeFilter.value, state.siteCrawlHost)
  }
  if (sidebarFilterId.value) {
    pool = applyOverviewFilter(pool, sidebarFilterId.value, overviewSections.value)
  }
  return pool
})

const displayRows = computed(() => searchRows(baseRows.value, searchQuery.value))

const filterCounts = computed(() => {
  const { internal, external, all } = expandedCrawl.value
  const counts = {}
  for (const f of SPIDER_FILTERS) {
    if (f.id === 'current') {
      counts.current = currentPageRow.value ? 1 : 0
    } else if (f.id === 'external') {
      counts.external = filterSpiderRows(all, 'external', state.siteCrawlHost).length
    } else {
      counts[f.id] = filterSpiderRows(internal, f.id, state.siteCrawlHost).length
    }
  }
  return counts
})

const summary = computed(() =>
  deriveSummary(state.siteCrawlResults, state.siteCrawlSummary, state.siteCrawlProgress),
)

const issues = computed(() =>
  deriveIssues(state.siteCrawlResults, state.siteCrawlIssues, state.siteCrawlSummary, state.siteCrawlProgress),
)

const activeOverviewLabel = computed(() => {
  if (!sidebarFilterId.value) return ''
  for (const sec of overviewSections.value) {
    for (const item of [...(sec.items || []), ...(sec.codeItems || [])]) {
      if (item.id === sidebarFilterId.value) return item.label
    }
  }
  return ''
})

const stats = computed(() => ({
  internal: expandedCrawl.value.internal.length,
  external: expandedCrawl.value.external.length,
}))

const progressPct = computed(() => {
  const p = state.siteCrawlProgress
  if (!p) return 0
  if (p.done) return 100
  const max = p.max || 1000
  return Math.min(100, Math.round(((p.fetched || 0) / max) * 100))
})

const progressLabel = computed(() => {
  const p = state.siteCrawlProgress
  if (!p) return ''
  if (state.siteCrawlRunning) return `Rastreando: ${p.fetched}/${p.max}`
  if (p.done) return `Completado: ${p.fetched} URLs`
  return `${p.fetched} URLs`
})

const speedLabel = computed(() => {
  const p = state.siteCrawlProgress
  if (p?.urlsPerSec) return `${p.urlsPerSec} URL/s`
  return ''
})

const statusCountLabel = computed(() => {
  const p = state.siteCrawlProgress
  const n = displayRows.value.length
  const total = p?.fetched || state.siteCrawlResults?.length || 0
  return `Mostrando ${n} · Rastreadas ${total}`
})

const emptyMessage = computed(() => {
  if (sidebarFilterId.value && !displayRows.value.length) {
    return `Sin URLs para «${activeOverviewLabel.value}».`
  }
  if (activeFilter.value === 'current' && !currentPageRow.value) {
    return 'Analiza la página en Resumen primero (content script activo).'
  }
  if (!hasCrawlData.value && activeFilter.value !== 'current') {
    return 'Pulsa Empezar para rastrear el sitio (máx. 1000 URLs).'
  }
  return 'Sin resultados para este filtro.'
})

const selectedDetail = computed(() => (selectedRow.value ? getRowDetail(selectedRow.value) : {}))

const selectedInlinks = computed(() => {
  if (!selectedRow.value?.url) return []
  return linkGraph.inlinks.get(selectedRow.value.url) || []
})

const selectedOutlinks = computed(() => {
  if (!selectedRow.value?.url) return []
  return linkGraph.outlinks.get(selectedRow.value.url) || [
    ...(selectedRow.value.outlinksInternal || []),
    ...(selectedRow.value.outlinksExternal || []),
  ]
})

const canExportPdf = computed(() => {
  if (activeFilter.value === 'current' && currentPageRow.value) return true
  return displayRows.value.some((r) => scannerCells(r).length === SCANNER_COLUMNS.length)
})

function rowKey(row, i) {
  return `${row.url}-${i}`
}

function selectRow(row) {
  selectedRow.value = row
}

function toggleOverviewSection(id) {
  expandedSections[id] = !expandedSections[id]
}

function onOverviewClick(itemId) {
  if (sidebarFilterId.value === itemId) {
    sidebarFilterId.value = null
  } else {
    sidebarFilterId.value = itemId
    if (activeFilter.value === 'external' || activeFilter.value === 'current') {
      activeFilter.value = 'internal'
    }
  }
  selectedRow.value = null
}

function clearOverviewFilter() {
  sidebarFilterId.value = null
  selectedRow.value = null
}

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
      state.siteCrawlStartedAt = s.siteCrawlStartedAt || null
      linkGraph = buildLinkGraph(state.siteCrawlResults)
    }
  } catch {
    /* ignore */
  }
}

async function loadActiveTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const u = tab?.url || ''
    if (u.startsWith('http://') || u.startsWith('https://')) seedUrl.value = u
    else seedUrl.value = ''
  } catch {
    seedUrl.value = ''
  }
}

function startCrawl() {
  if (!canCrawl.value) return
  starting.value = true
  state.siteCrawlError = null
  let origins
  try {
    origins = [`${new URL(seedUrl.value).origin}/*`]
  } catch {
    state.siteCrawlError = 'URL inválida'
    starting.value = false
    return
  }
  chrome.permissions.request({ origins }, (granted) => {
    if (chrome.runtime.lastError || !granted) {
      state.siteCrawlError = 'Permiso denegado para este dominio.'
      starting.value = false
      return
    }
    chrome.runtime.sendMessage({ type: 'CRAWL_START', seedUrl: seedUrl.value }, (res) => {
      if (chrome.runtime.lastError) state.siteCrawlError = chrome.runtime.lastError.message
      else if (res?.ok === false) state.siteCrawlError = res.error || 'No se pudo iniciar'
      starting.value = false
      activeFilter.value = 'internal'
      sidebarFilterId.value = null
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
    'siteCrawlRunning', 'siteCrawlProgress', 'siteCrawlResults', 'siteCrawlHost',
    'siteCrawlError', 'siteCrawlStartedAt', 'siteCrawlFinishedAt', 'siteCrawlIssues', 'siteCrawlSummary',
  ])
  selectedRow.value = null
  sidebarFilterId.value = null
  await refreshState()
}

function exportCsv() {
  const rows = displayRows.value
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [SCANNER_COLUMNS.map(esc).join(',')]
  for (const r of rows) {
    lines.push(scannerCells(r).map(esc).join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `spider-${state.siteCrawlHost || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function exportPdf() {
  const rows = displayRows.value.slice(0, 50)
  if (!rows.length) return
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a2' })
  doc.text('RonHack SEO — Spider', 14, 12)
  autoTableMod.default(doc, {
    head: [SCANNER_COLUMNS],
    body: rows.map((r) => scannerCells(r).map((c) => String(c ?? ''))),
    startY: 16,
    styles: { fontSize: 3.5, cellPadding: 0.3 },
    headStyles: { fillColor: [5, 122, 85] },
  })
  doc.save(`spider-${new Date().toISOString().slice(0, 10)}.pdf`)
}

function openFullscreen() {
  const url = chrome.runtime.getURL('spider.html')
  chrome.tabs.create({ url })
}

onMounted(async () => {
  if (!props.fullscreen) await loadActiveTabUrl()
  await refreshState()
  pollTimer = setInterval(refreshState, 600)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(
  () => props.pageData?.url,
  (u) => {
    if (u && !state.siteCrawlRunning) seedUrl.value = u
  },
)
</script>

<style scoped>
.spider-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #d4d4d8;
  min-height: 420px;
}

.spider-fullscreen {
  min-height: calc(100vh - 16px);
  padding: 8px;
  background: #09090b;
}

.spider-fullscreen .spider-grid-wrap {
  max-height: calc(100vh - 280px);
}

.spider-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spider-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.spider-url-input {
  flex: 1;
  min-width: 160px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.35);
  background: rgba(9, 9, 11, 0.9);
  padding: 5px 8px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  color: #e4e4e7;
}

.spider-btn {
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.9);
  background: rgba(24, 24, 27, 0.9);
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 600;
  color: #e4e4e7;
  cursor: pointer;
}

.spider-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.spider-btn-primary {
  background: rgba(6, 78, 59, 0.85);
  border-color: rgba(16, 185, 129, 0.5);
  color: #ecfdf5;
}

.spider-btn-accent {
  border-color: rgba(56, 189, 248, 0.4);
  color: #7dd3fc;
}

.spider-progress-wrap {
  width: 100%;
}

.spider-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #71717a;
  margin-bottom: 3px;
}

.spider-progress-bar {
  height: 6px;
  border-radius: 999px;
  background: #27272a;
  overflow: hidden;
}

.spider-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.3s;
}

.spider-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.spider-filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.spider-filter-tab {
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  color: #71717a;
  cursor: pointer;
}

.spider-filter-tab.active {
  color: #6ee7b7;
  border-bottom-color: #10b981;
}

.spider-filter-count {
  margin-left: 4px;
  font-size: 9px;
  opacity: 0.7;
}

.spider-search {
  min-width: 140px;
  flex: 1;
  max-width: 220px;
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.8);
  background: rgba(9, 9, 11, 0.8);
  padding: 4px 8px;
  font-size: 10px;
  color: #f4f4f5;
}

.spider-error {
  margin: 0;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(127, 29, 29, 0.4);
  color: #fecaca;
  font-size: 10px;
}

.spider-body {
  display: grid;
  grid-template-columns: 1fr 210px;
  gap: 8px;
  min-height: 0;
  flex: 1;
}

.spider-grid-wrap {
  min-width: 0;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  background: rgba(9, 9, 11, 0.6);
  max-height: 340px;
}

.spider-grid-scroll {
  overflow: auto;
  max-height: inherit;
  height: 100%;
}

.spider-table {
  border-collapse: collapse;
  font-size: 9px;
  min-width: max-content;
}

.spider-th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #064e3b;
  color: #d1fae5;
  padding: 4px 6px;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid #047857;
}

.spider-th.sticky-col,
.spider-td.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #18181b;
  min-width: 28px;
}

.spider-th.sticky-col {
  z-index: 3;
  background: #065f46;
}

.spider-tr {
  cursor: pointer;
}

.spider-tr:hover {
  background: rgba(16, 185, 129, 0.08);
}

.spider-tr.selected {
  background: rgba(16, 185, 129, 0.18);
}

.spider-td {
  padding: 3px 5px;
  border-bottom: 1px solid rgba(39, 39, 42, 0.8);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #d4d4d8;
}

.spider-empty {
  padding: 24px;
  text-align: center;
  color: #71717a;
}

.spider-sidebar {
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  padding: 8px;
  background: rgba(9, 9, 11, 0.55);
  overflow-y: auto;
  max-height: 340px;
}

.spider-side-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6ee7b7;
  margin-bottom: 6px;
}

.spider-side-hint {
  margin: 0;
  font-size: 9px;
  color: #71717a;
  line-height: 1.4;
}

.spider-side-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spider-stat {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 9px;
}

.spider-stat span {
  color: #71717a;
}

.spider-stat strong {
  color: #f4f4f5;
  font-weight: 700;
}

.spider-overview-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(6, 78, 59, 0.5);
  border: 1px solid rgba(16, 185, 129, 0.45);
  font-size: 9px;
  color: #a7f3d0;
  max-width: 100%;
}

.spider-overview-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-chip-clear {
  border: none;
  background: transparent;
  color: #6ee7b7;
  cursor: pointer;
  padding: 0 2px;
  font-size: 10px;
  flex-shrink: 0;
}

.spider-overview-section {
  margin-top: 8px;
  border-top: 1px solid rgba(39, 39, 42, 0.6);
  padding-top: 6px;
}

.spider-overview-header {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 2px 0 4px;
  font-size: 9px;
  font-weight: 700;
  color: #d4d4d8;
  cursor: pointer;
  text-align: left;
}

.spider-triangle {
  font-size: 7px;
  color: #71717a;
  transition: transform 0.15s;
}

.spider-triangle.collapsed {
  transform: rotate(-90deg);
}

.spider-overview-body {
  padding-left: 2px;
}

.spider-overview-sub {
  font-size: 8px;
  color: #71717a;
  margin: 2px 0 4px;
  font-style: italic;
}

.spider-overview-codes {
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed rgba(63, 63, 70, 0.5);
}

.spider-overview-table-head {
  display: grid;
  grid-template-columns: 1fr 28px 42px;
  gap: 2px;
  font-size: 7px;
  color: #52525b;
  text-align: right;
  padding: 0 2px 2px;
}

.spider-overview-table-head span:first-child {
  text-align: left;
}

.spider-overview-row {
  display: grid;
  grid-template-columns: 1fr 28px 42px;
  gap: 2px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 2px;
  font-size: 8px;
  color: #d4d4d8;
  cursor: pointer;
  text-align: right;
  border-radius: 3px;
}

.spider-overview-row:hover {
  background: rgba(16, 185, 129, 0.1);
}

.spider-overview-row.active {
  background: rgba(16, 185, 129, 0.22);
  color: #ecfdf5;
}

.spider-overview-row.zero {
  opacity: 0.55;
}

.spider-overview-label {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-overview-count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.spider-overview-pct {
  font-variant-numeric: tabular-nums;
  color: #a1a1aa;
}

.spider-overview-row.active .spider-overview-pct {
  color: #bbf7d0;
}

.spider-overview-row-code .spider-overview-label {
  padding-left: 6px;
}

.spider-issues-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.spider-issues-list li {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(39, 39, 42, 0.5);
  font-size: 9px;
}

.spider-issue-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-issue-count {
  color: #f87171;
  font-weight: 700;
}

.spider-detail {
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  padding: 8px;
  background: rgba(9, 9, 11, 0.7);
}

.spider-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.spider-detail-title {
  font-weight: 700;
  color: #6ee7b7;
  font-size: 10px;
}

.spider-detail-link {
  font-size: 9px;
  color: #67e8f9;
  text-decoration: none;
}

.spider-detail-close {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #71717a;
  cursor: pointer;
}

.spider-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
  font-size: 9px;
  margin-bottom: 8px;
}

.spider-detail-grid .lbl {
  display: block;
  color: #71717a;
}

.spider-detail-grid .val {
  display: block;
  color: #e4e4e7;
  word-break: break-all;
}

.spider-detail-grid .mono {
  font-family: ui-monospace, monospace;
  font-size: 8px;
}

.spider-links-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.spider-link-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 72px;
  overflow-y: auto;
  font-size: 8px;
}

.spider-link-list li {
  padding: 2px 0;
  border-bottom: 1px solid rgba(39, 39, 42, 0.4);
  word-break: break-all;
}

.spider-statusbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 6px 8px;
  border-top: 1px solid rgba(63, 63, 70, 0.6);
  font-size: 9px;
  color: #71717a;
  font-family: ui-monospace, monospace;
}
</style>
