<template>
  <div class="shot-canvas" :class="`shot-${shot}`">
    <div class="shot-frame">
      <div class="rh-terminal shot-popup">
        <header class="shot-header">
          <div class="shot-header-inner">
            <div class="shot-logo" aria-hidden="true">
              <span class="text-emerald-500">&gt;</span><span class="text-cyan-400/90">_</span>
            </div>
            <h1 class="shot-title">
              <span class="text-emerald-400">RonHack</span><span class="text-zinc-600"> </span><span class="text-cyan-300">SEO</span>
            </h1>
            <span class="shot-version">v1.0.1</span>
            <button type="button" class="shot-analyze-btn">Re-analizar</button>
          </div>
        </header>

        <nav class="rh-nav">
          <button
            v-for="t in NAV_TABS"
            :key="t.id"
            type="button"
            class="rh-nav-btn"
            :class="{ 'rh-nav-btn-active': activeTab === t.id }"
          >
            {{ t.label }}
          </button>
        </nav>

        <div class="shot-content">
          <!-- RESUMEN -->
          <template v-if="shot === 'resumen'">
            <section class="rh-panel">
              <ScoreDashboard :scores="mockPageData.scores" :explanations="mockPageData.scores.explanations" />
            </section>
            <section class="rh-panel mt-4">
              <h2 class="rh-panel-title mb-3 text-base">Rendimiento y Core Web Vitals</h2>
              <WebVitalsPanel :web-vitals="webVitalsMock" />
            </section>
            <section class="rh-panel mt-4">
              <h2 class="rh-panel-title mb-3 text-base">Resumen on-page</h2>
              <SummaryOverview :page-data="mockPageData" />
            </section>
          </template>

          <!-- SPIDER -->
          <template v-else-if="shot === 'spider'">
            <div class="spider-shot">
              <div class="spider-shot-toolbar">
                <input class="spider-shot-url" readonly value="https://ejemplo.com/" />
                <span class="spider-shot-btn primary">Empezar</span>
                <span class="spider-shot-btn">Detener</span>
                <span class="spider-shot-btn">CSV</span>
                <span class="spider-shot-btn accent">Pantalla completa</span>
              </div>
              <div class="spider-shot-filters">
                <span class="spider-shot-tab active">Internas <b>70</b></span>
                <span class="spider-shot-tab">HTML <b>52</b></span>
                <span class="spider-shot-tab">Errores <b>4</b></span>
                <span class="spider-shot-tab">No index <b>2</b></span>
              </div>
              <div class="spider-shot-body">
                <div class="spider-shot-grid">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>URL</th>
                        <th>Código</th>
                        <th>Título</th>
                        <th>Indexabilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, i) in spiderRows" :key="i" :class="{ sel: i === 1 }">
                        <td>{{ i + 1 }}</td>
                        <td>{{ row.url }}</td>
                        <td :class="row.statusClass">{{ row.status }}</td>
                        <td>{{ row.title }}</td>
                        <td>{{ row.index }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <aside class="spider-shot-sidebar">
                  <div class="side-title">Descripción general</div>
                  <div class="side-section">
                    <div class="side-header">▼ Seguridad</div>
                    <div v-for="r in mockSpiderOverview.security" :key="r.label" class="side-row">
                      <span>{{ r.label }}</span><span>{{ r.count }}</span><span>{{ r.pct }}</span>
                    </div>
                  </div>
                  <div class="side-section">
                    <div class="side-header">▼ Códigos de respuesta</div>
                    <div v-for="r in mockSpiderOverview.response" :key="r.label" class="side-row">
                      <span>{{ r.label }}</span><span>{{ r.count }}</span><span>{{ r.pct }}</span>
                    </div>
                  </div>
                  <div class="side-section">
                    <div class="side-header">▼ Problemas</div>
                    <div class="side-row active">
                      <span>HTTP 404 (Not Found)</span><span>3</span><span>4,29%</span>
                    </div>
                    <div class="side-row">
                      <span>HTTP 500 (Internal…)</span><span>1</span><span>1,43%</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </template>

          <!-- PROBLEMAS -->
          <template v-else-if="shot === 'problemas'">
            <div class="problems-shot">
              <p class="problems-hint">
                Hallazgos del <strong>último rastreo</strong> (duplicados, 404, 500, headers) y reglas de <strong>esta URL</strong>.
              </p>
              <div class="problems-badges">
                <span>Problemas 6</span>
                <span>Avisos 3</span>
                <span>Oportunidades 1</span>
                <span class="accent">Total 10</span>
              </div>
              <table class="problems-table">
                <thead>
                  <tr>
                    <th>Nombre del problema</th>
                    <th>Tipo</th>
                    <th>Prioridad</th>
                    <th>URL</th>
                    <th>% del total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in mockProblems" :key="i">
                    <td>
                      <div>{{ row.nombre }}</div>
                      <div v-if="row.detalle" class="problems-detail">{{ row.detalle }}</div>
                    </td>
                    <td><span class="dot" :class="tipoClass(row.tipo)" />{{ row.tipo }}</td>
                    <td>{{ row.prioridad }}</td>
                    <td class="num">{{ row.urls }}</td>
                    <td class="num">{{ row.pct }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- KEYWORDS -->
          <template v-else>
            <div class="keywords-shot">
              <h2 class="rh-panel-title mb-4 border-0 pb-0">Keyword Planner</h2>
              <div class="keywords-search">Palabra clave semilla: <strong>auditoría seo</strong></div>
              <table class="keywords-table">
                <thead>
                  <tr>
                    <th>Keyword sugerida</th>
                    <th>Relevancia</th>
                    <th>Coincidencia on-page</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(k, i) in mockKeywords" :key="i">
                    <td>{{ k.term }}</td>
                    <td><span class="kw-badge">{{ k.volume }}</span></td>
                    <td>{{ k.match }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="keywords-paa mt-4">
                <div class="side-title">People Also Ask</div>
                <ul>
                  <li>¿Cómo hacer una auditoría SEO completa?</li>
                  <li>¿Qué es Screaming Frog y para qué sirve?</li>
                  <li>¿Cuáles son los Core Web Vitals?</li>
                </ul>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ScoreDashboard from '../components/ScoreDashboard.vue'
import SummaryOverview from '../components/SummaryOverview.vue'
import WebVitalsPanel from '../components/WebVitalsPanel.vue'
import {
  NAV_TABS,
  mockPageData,
  mockProblems,
  mockKeywords,
  mockSpiderOverview,
} from './mockData.js'

const props = defineProps({
  shot: { type: String, default: 'resumen' },
})

const activeTab = computed(() => props.shot)

const webVitalsMock = {
  lcp: 2100,
  inp: 180,
  cls: 0.08,
  fcp: 1200,
  ttfb: 420,
}

const spiderRows = [
  { url: 'https://ejemplo.com/', status: '200', title: 'Inicio — RonHack SEO', index: 'Indexable', statusClass: 'ok' },
  { url: 'https://ejemplo.com/servicios/seo', status: '200', title: 'Auditoría SEO profesional', index: 'Indexable', statusClass: 'ok' },
  { url: 'https://ejemplo.com/vieja', status: '404', title: '—', index: '—', statusClass: 'err' },
  { url: 'https://ejemplo.com/blog', status: '301', title: '—', index: '—', statusClass: 'warn' },
  { url: 'https://ejemplo.com/api/legacy', status: '500', title: '—', index: '—', statusClass: 'err' },
  { url: 'https://ejemplo.com/contacto', status: '200', title: 'Contacto — RonHack SEO', index: 'Indexable', statusClass: 'ok' },
]

function tipoClass(tipo) {
  if (tipo === 'Problema') return 'dot-red'
  if (tipo === 'Aviso') return 'dot-amber'
  return 'dot-blue'
}
</script>

<style scoped>
.shot-canvas {
  width: 1280px;
  height: 800px;
  overflow: hidden;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.12), transparent 55%),
    linear-gradient(180deg, #060a0d 0%, #0b1014 45%, #070b0f 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 28px;
  box-sizing: border-box;
}

.shot-frame {
  width: 1180px;
}

.shot-popup {
  width: 100%;
  border: 1px solid rgba(52, 211, 153, 0.35);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65), 0 0 40px rgba(16, 185, 129, 0.08);
}

.shot-header {
  border-bottom: 1px solid rgba(16, 185, 129, 0.45);
  background: #060a0d;
  padding: 14px 18px;
}

.shot-header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shot-logo {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.7);
  font-family: ui-monospace, monospace;
  font-weight: 700;
  font-size: 14px;
}

.shot-title {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 1.55rem;
  font-weight: 700;
  flex: 1;
}

.shot-version {
  font-size: 11px;
  font-weight: 700;
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.45);
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(6, 78, 59, 0.35);
}

.shot-analyze-btn {
  border: 1px solid rgba(16, 185, 129, 0.5);
  background: rgba(6, 78, 59, 0.85);
  color: #ecfdf5;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
}

.shot-content {
  max-height: 620px;
  overflow: hidden;
  padding: 14px;
  background: #0b1014;
}

.shot-spider .shot-content,
.shot-spider .shot-canvas {
  /* alias */
}

/* Spider mock */
.spider-shot-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.spider-shot-url {
  flex: 1;
  min-width: 200px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.35);
  background: rgba(9, 9, 11, 0.9);
  padding: 6px 8px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: #e4e4e7;
}

.spider-shot-btn {
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.9);
  background: rgba(24, 24, 27, 0.9);
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 600;
  color: #e4e4e7;
}

.spider-shot-btn.primary {
  background: rgba(6, 78, 59, 0.85);
  border-color: rgba(16, 185, 129, 0.5);
  color: #ecfdf5;
}

.spider-shot-btn.accent {
  border-color: rgba(56, 189, 248, 0.4);
  color: #7dd3fc;
}

.spider-shot-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.spider-shot-tab {
  font-size: 10px;
  font-weight: 600;
  color: #71717a;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
}

.spider-shot-tab.active {
  color: #6ee7b7;
  border-bottom-color: #10b981;
}

.spider-shot-body {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 8px;
}

.spider-shot-grid {
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  overflow: hidden;
  max-height: 420px;
}

.spider-shot-grid table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.spider-shot-grid th {
  background: #064e3b;
  color: #d1fae5;
  padding: 5px 6px;
  text-align: left;
}

.spider-shot-grid td {
  padding: 4px 6px;
  border-bottom: 1px solid rgba(39, 39, 42, 0.8);
  color: #d4d4d8;
}

.spider-shot-grid tr.sel {
  background: rgba(16, 185, 129, 0.18);
}

.spider-shot-grid .ok { color: #6ee7b7; }
.spider-shot-grid .warn { color: #fbbf24; }
.spider-shot-grid .err { color: #f87171; font-weight: 700; }

.spider-shot-sidebar {
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  padding: 8px;
  background: rgba(9, 9, 11, 0.55);
  font-size: 8px;
}

.side-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6ee7b7;
  margin-bottom: 6px;
}

.side-section {
  margin-top: 8px;
  border-top: 1px solid rgba(39, 39, 42, 0.6);
  padding-top: 4px;
}

.side-header {
  font-weight: 700;
  color: #d4d4d8;
  margin-bottom: 4px;
}

.side-row {
  display: grid;
  grid-template-columns: 1fr 22px 38px;
  gap: 2px;
  padding: 2px;
  color: #d4d4d8;
  text-align: right;
}

.side-row span:first-child {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-row.active {
  background: rgba(16, 185, 129, 0.22);
  border-radius: 3px;
}

/* Problemas */
.problems-shot {
  font-size: 12px;
}

.problems-hint {
  margin: 0 0 10px;
  font-size: 11px;
  color: #a1a1aa;
}

.problems-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.problems-badges span {
  border: 1px solid #52525b;
  background: rgba(39, 39, 42, 0.9);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
}

.problems-badges .accent {
  border-color: rgba(16, 185, 129, 0.5);
  background: rgba(6, 78, 59, 0.5);
  color: #a7f3d0;
}

.problems-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  overflow: hidden;
  font-size: 11px;
}

.problems-table th {
  background: rgba(24, 24, 27, 0.95);
  color: #d4d4d8;
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
}

.problems-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(39, 39, 42, 0.8);
  color: #e4e4e7;
}

.problems-detail {
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: #71717a;
  margin-top: 4px;
}

.problems-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.dot-red { background: #dc2626; }
.dot-amber { background: #fbbf24; }
.dot-blue { background: #3b82f6; }

/* Keywords */
.keywords-shot {
  font-size: 12px;
}

.keywords-search {
  margin-bottom: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: rgba(9, 9, 11, 0.6);
  color: #a1a1aa;
}

.keywords-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.keywords-table th,
.keywords-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(39, 39, 42, 0.8);
  text-align: left;
}

.keywords-table th {
  color: #6ee7b7;
  font-weight: 600;
}

.kw-badge {
  background: rgba(6, 78, 59, 0.5);
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  color: #a7f3d0;
}

.keywords-paa ul {
  margin: 6px 0 0;
  padding-left: 18px;
  color: #d4d4d8;
  line-height: 1.6;
}

.shot-resumen .shot-content {
  max-height: 640px;
}

.shot-resumen :deep(.scores-grid) {
  gap: 14px;
}

.shot-resumen :deep(.donut-wrapper) {
  width: 96px;
  height: 96px;
}

.shot-resumen :deep(.donut-value) {
  font-size: 20px;
}
</style>
