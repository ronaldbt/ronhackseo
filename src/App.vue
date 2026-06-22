<template>
  <div style="width: 760px; max-height: 800px;" class="rh-terminal flex flex-col overflow-hidden font-sans">
    <header
      class="relative shrink-0 overflow-hidden border-b border-emerald-500/45 bg-[#060a0d] px-4 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(52,211,153,0.12)]"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
      />
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.06]"
        style="
          background-image: linear-gradient(rgba(52, 211, 153, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52, 211, 153, 0.45) 1px, transparent 1px);
          background-size: 14px 14px;
        "
      />
      <div
        class="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_3px] opacity-[0.15]" />
      <div class="relative flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-emerald-500/40 bg-black/70 font-mono text-sm font-bold leading-none text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            aria-hidden="true"
          >
            <span class="text-emerald-500">&gt;</span><span class="text-cyan-400/90">_</span>
          </div>
          <div class="min-w-0">
            <h1
              class="rh-title-glow m-0 truncate font-mono text-2xl font-bold leading-tight tracking-tight sm:text-[1.65rem]"
            >
              <span class="text-emerald-400">RonHack</span><span class="text-zinc-600"> </span><span class="text-cyan-300">SEO</span>
            </h1>
          </div>
        </div>
        <button
          type="button"
          class="shrink-0 cursor-pointer rounded border border-emerald-500/50 bg-emerald-950/80 px-4 py-2.5 text-sm font-semibold text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.15)] transition-all duration-200 hover:border-emerald-400/70 hover:bg-emerald-900/90 hover:text-white hover:shadow-[0_0_22px_rgba(52,211,153,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
          :disabled="loading"
          @click="analyze"
        >
          {{ loading && pageData ? 'Actualizando…' : loading ? 'Analizando…' : 'Re-analizar' }}
        </button>
      </div>
    </header>

    <nav class="rh-nav">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="rh-nav-btn"
        :class="activeTab === t.id ? 'rh-nav-btn-active' : ''"
        :disabled="isTabDisabled(t)"
        @click="activeTab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="rh-main-scroll min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="analysisBanner"
        class="mx-4 mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed"
        :class="analysisBannerClass"
      >
        {{ analysisBanner.text }}
        <button
          v-if="analysisBanner.showRefresh"
          type="button"
          class="ml-2 font-semibold underline hover:no-underline"
          @click="refreshActiveTab"
        >
          Recargar pestaña
        </button>
      </div>
      <div v-if="loading && !pageData" class="flex flex-col items-center justify-center px-5 py-16">
        <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-400"></div>
        <p class="font-medium text-zinc-400">Analizando página...</p>
      </div>

      <div v-else-if="activeTab === 'sitio'" class="p-4">
        <SiteCrawlTab />
      </div>

      <div v-else-if="activeTab === 'crawlResumen'" class="p-4">
        <CrawlSummaryTab />
      </div>

      <div v-else-if="activeTab === 'keywords'" class="p-4">
        <div class="rh-panel p-4">
          <h2 class="rh-panel-title m-0 mb-4 border-0 pb-0">
            <MagnifyingGlassIcon class="h-5 w-5 shrink-0 text-emerald-400" />
            Keyword Planner
          </h2>
          <KeywordsTab :page-data="pageData" :tab-url="activeTabUrl" />
        </div>
      </div>

      <div v-else-if="activeTab === 'geo'" class="p-4">
        <div class="rh-panel p-4">
          <h2 class="rh-panel-title m-0 mb-4 border-0 pb-0">
            <GlobeAmericasIcon class="h-5 w-5 shrink-0 text-emerald-400" />
            SERP Local (gl / hl / uule)
          </h2>
          <GeoSerpTab />
        </div>
      </div>

      <div v-else-if="activeTab === 'problemas' && !pageData" class="p-4">
        <ProblemsTab :page-data="null" />
      </div>

      <div v-else-if="!pageData && analyzeError" class="px-5 py-12 text-center text-zinc-400">
        <p class="m-0 text-base">{{ analyzeError }}</p>
      </div>

      <div v-else-if="!pageData" class="px-5 py-12 text-center text-zinc-500">
        <p class="m-0 text-base">No hay datos de la página activa.</p>
      </div>

      <div v-else class="space-y-5 p-4">
      <div v-if="activeTab === 'resumen'" v-memo="[pageData]" class="space-y-5">
      <!-- Score Dashboard -->
      <section v-if="pageData.scores" class="rh-panel">
        <ScoreDashboard :scores="pageData.scores" :explanations="pageData.scores.explanations" />
      </section>

      <!-- Resumen tipo SEO One Click -->
      <section class="rh-panel">
        <h2 class="rh-panel-title">
          <InformationCircleIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Resumen
        </h2>
        <SummaryOverview :page-data="pageData" />
      </section>

      <!-- Análisis de Headers -->
      <section v-if="pageData.headers" class="rh-panel">
        <h2 class="rh-panel-title">
          <DocumentTextIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Análisis de Headers
        </h2>
        <HeadersAnalysis :headers-data="pageData.headers" />
      </section>

      <!-- Stack tecnológico (Wappalyzer) -->
      <section class="rh-panel py-3">
        <h2 class="rh-panel-title mb-2 text-sm">
          <Cog6ToothIcon class="h-4 w-4 shrink-0 text-emerald-400" />
          Tecnologías detectadas
        </h2>
        <TechStackPanel :tech-stack="pageData.techStack" />
      </section>

      <!-- Análisis de contenido (Yoast) -->
      <section v-if="pageData.text" class="rh-panel py-3">
        <h2 class="rh-panel-title mb-2 text-sm">
          <DocumentTextIcon class="h-4 w-4 shrink-0 text-emerald-400" />
          Legibilidad y contenido
        </h2>
        <ContentAnalysisPanel :page-data="pageData" />
      </section>

      <!-- Schema en resumen -->
      <section v-if="pageData.detectedSchemaTypes?.length" class="rh-panel py-3">
        <h2 class="rh-panel-title mb-2 text-sm">
          <DocumentTextIcon class="h-4 w-4 shrink-0 text-emerald-400" />
          Datos estructurados
        </h2>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="t in pageData.detectedSchemaTypes"
            :key="t"
            class="rounded border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
          >
            {{ t }}
          </span>
        </div>
      </section>

      <!-- Auditoría de Accesibilidad -->
      <section v-if="pageData.accessibility" class="rh-panel">
        <h2 class="rh-panel-title">
          <AdjustmentsHorizontalIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Auditoría de Accesibilidad SEO
        </h2>
        <AccessibilityAudit :accessibility="pageData.accessibility" />
      </section>

      <!-- Análisis de Velocidad + Core Web Vitals -->
      <section class="rh-panel" v-if="pageData.performance || pageData.webVitals">
        <h2 class="rh-panel-title">
          <BoltIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Rendimiento y Core Web Vitals
        </h2>
        <WebVitalsPanel v-if="pageData.webVitals" :web-vitals="pageData.webVitals" class="mb-5" />
        <PerformanceMetrics v-if="pageData.performance" :performance="pageData.performance" />
      </section>

      <!-- Análisis SEO Avanzado -->
      <section v-if="pageData.domDepth || pageData.keywordCannibalization" class="rh-panel">
        <h2 class="rh-panel-title">
          <MagnifyingGlassIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Análisis SEO Avanzado
        </h2>
        <AdvancedSEOAnalysis :dom-depth="pageData.domDepth" :keyword-cannibalization="pageData.keywordCannibalization" />
      </section>

      <!-- Contenido Oculto -->
      <section v-if="pageData.hiddenContent" class="rh-panel">
        <h2 class="rh-panel-title">
          <EyeIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Contenido Oculto
        </h2>
        <HiddenContentDetector :hidden-content="pageData.hiddenContent" />
      </section>

      <!-- Densidad de Palabras -->
      <section class="rh-panel" v-if="pageData.text">
        <h2 class="rh-panel-title">
          <ChartBarIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Densidad de Palabras
        </h2>
        <WordDensity :text="pageData.text" />
      </section>

      <!-- Social Preview -->
      <section class="rh-panel">
        <h2 class="rh-panel-title">
          <svg class="h-5 w-5 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
          Social Preview
        </h2>
        <SocialPreview :meta="pageData.metaTags" :title="pageData.title" :url="pageData.url" />
      </section>

      <!-- Chequeo de Enlaces -->
      <section class="rh-panel" v-if="pageData.links && pageData.links.length > 0">
        <h2 class="rh-panel-title">
          <LinkIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Chequeo de Enlaces
        </h2>
        <LinkChecker :links="pageData.links" :current-url="pageData.url" />
      </section>

      <!-- Análisis SEO Técnico -->
      <section
        v-if="pageData.metaRobots || pageData.canonical || pageData.langTag || pageData.stopWordsURL || pageData.titleWidth"
        class="rh-panel"
      >
        <h2 class="rh-panel-title">
          <Cog6ToothIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Análisis SEO Técnico
        </h2>
        <TechnicalSEOAnalysis 
          :meta-robots="pageData.metaRobots"
          :canonical="pageData.canonical"
          :lang-tag="pageData.langTag"
          :stop-words-u-r-l="pageData.stopWordsURL"
          :title-width="pageData.titleWidth"
        />
      </section>

      <!-- Análisis Técnico Avanzado -->
      <section v-if="pageData.lazyLoading || pageData.favicons || pageData.security || pageData.textHTMLRatio || pageData.iframes || pageData.nofollowInternal || pageData.hreflang || pageData.internalAnchors || pageData.socialTags" class="rh-panel">
        <h2 class="rh-panel-title">
          <WrenchScrewdriverIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Análisis Técnico Avanzado
        </h2>
        <AdvancedTechnicalSEO 
          :lazy-loading="pageData.lazyLoading"
          :favicons="pageData.favicons"
          :security="pageData.security"
          :text-h-t-m-l-ratio="pageData.textHTMLRatio"
          :iframes="pageData.iframes"
          :nofollow-internal="pageData.nofollowInternal"
          :hreflang="pageData.hreflang"
          :internal-anchors="pageData.internalAnchors"
          :social-tags="pageData.socialTags"
          :title="pageData.title"
          :current-url="pageData.url"
        />
      </section>

      <!-- Simulador de Daltonismo -->
      <section class="rh-panel">
        <h2 class="rh-panel-title">
          <EyeIcon class="h-5 w-5 shrink-0 text-emerald-400" />
          Simulador de Visión
        </h2>
        <ColorblindSimulator />
      </section>
      </div>

      <div v-if="activeTab === 'schema'" v-memo="[pageData]" class="space-y-4">
        <div class="rh-panel p-4">
          <StructuredDataTab
            :schemas="pageData.schemas || []"
            :detected-types="pageData.detectedSchemaTypes || []"
          />
        </div>
        <div class="rh-panel p-4">
          <h2 class="m-0 mb-3 flex items-center gap-2 border-b border-emerald-500/25 pb-2 text-base font-semibold text-zinc-100">
            <DocumentTextIcon class="h-5 w-5 shrink-0 text-emerald-400" />
            Detalle JSON-LD
          </h2>
          <SchemaDetector
            :schemas="pageData.schemas || []"
            :recommendations="pageData.schemaRecommendations || []"
          />
        </div>
      </div>

      <div v-if="activeTab === 'problemas'" class="rh-panel p-4">
        <ProblemsTab :page-data="pageData" />
      </div>

      <div v-if="activeTab === 'scanner'" class="rh-panel p-4">
        <ScannerTab :scanner-values="pageData.scannerValues" />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  BoltIcon,
  EyeIcon,
  LinkIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  GlobeAmericasIcon,
} from '@heroicons/vue/24/outline'
import SummaryOverview from './components/SummaryOverview.vue'
import ScoreDashboard from './components/ScoreDashboard.vue'
import HeadersAnalysis from './components/HeadersAnalysis.vue'
import SchemaDetector from './components/SchemaDetector.vue'
import AccessibilityAudit from './components/AccessibilityAudit.vue'
import HiddenContentDetector from './components/HiddenContentDetector.vue'
import AdvancedSEOAnalysis from './components/AdvancedSEOAnalysis.vue'
import TechnicalSEOAnalysis from './components/TechnicalSEOAnalysis.vue'
import AdvancedTechnicalSEO from './components/AdvancedTechnicalSEO.vue'
import PerformanceMetrics from './components/PerformanceMetrics.vue'
import WordDensity from './components/WordDensity.vue'
import SocialPreview from './components/SocialPreview.vue'
import LinkChecker from './components/LinkChecker.vue'
import ColorblindSimulator from './components/ColorblindSimulator.vue'
import StructuredDataTab from './components/StructuredDataTab.vue'
import ProblemsTab from './components/ProblemsTab.vue'
import ScannerTab from './components/ScannerTab.vue'
import SiteCrawlTab from './components/SiteCrawlTab.vue'
import CrawlSummaryTab from './components/CrawlSummaryTab.vue'
import KeywordsTab from './components/KeywordsTab.vue'
import GeoSerpTab from './components/GeoSerpTab.vue'
import WebVitalsPanel from './components/WebVitalsPanel.vue'
import TechStackPanel from './components/TechStackPanel.vue'
import ContentAnalysisPanel from './components/ContentAnalysisPanel.vue'
import { calculateScores } from './utils/calculateScores.js'
import { analyzeHeadersInPage } from './utils/headerAnalysis.js'
import { requestPageData } from './utils/contentScriptBridge.js'
import { collectWebVitalsInPage } from './utils/webVitalsCollect.js'
import {
  detectSchemasInPage,
  extractDetectedTypes,
  checkSchemaRecommendations,
} from './utils/schemaDetect.js'
import { detectTechStackInPage } from './utils/techStackDetect.js'
import {
  analyzeImageAltInPage,
  analyzeOutboundLinksInPage,
} from './utils/pageMediaLinks.js'

const tabs = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'geo', label: 'SERP Local' },
  { id: 'schema', label: 'Datos estruct.' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'scanner', label: 'Escáner' },
  { id: 'sitio', label: 'Sitio' },
  { id: 'crawlResumen', label: 'Rastreo' },
]

const loading = ref(false)
const pageData = ref(null)
const activeTab = ref('resumen')
const activeTabUrl = ref('')
const crawlIssueCount = ref(0)
const analyzeError = ref(null)
const SESSION_CACHE_KEY = 'ronhackPageCache'

let crawlIssuePoll = null
onMounted(async () => {
  const tick = async () => {
    try {
      const s = await chrome.storage.local.get('siteCrawlIssues')
      const next = Array.isArray(s.siteCrawlIssues) ? s.siteCrawlIssues.length : 0
      if (crawlIssueCount.value !== next) {
        crawlIssueCount.value = next
      }
    } catch {
      if (crawlIssueCount.value !== 0) {
        crawlIssueCount.value = 0
      }
    }
  }
  void tick()
  crawlIssuePoll = setInterval(tick, 5000)

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  activeTabUrl.value = tab?.url || ''

  try {
    const cached = await chrome.storage.session.get(SESSION_CACHE_KEY)
    const hit = cached[SESSION_CACHE_KEY]
    if (hit?.url && hit.url === tab?.url) {
      pageData.value = hit
      loading.value = false
    }
  } catch {
    /* ignore */
  }

  void loadPageData(false)
})
onUnmounted(() => {
  if (crawlIssuePoll) clearInterval(crawlIssuePoll)
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'clearContentHighlight' }).catch(() => {})
    }
  })
})

async function savePageCache(data) {
  if (!data?.url) return
  try {
    await chrome.storage.session.set({ [SESSION_CACHE_KEY]: data })
  } catch {
    /* ignore */
  }
}

function isTabDisabled(tab) {
  if (tab.id === 'sitio' || tab.id === 'crawlResumen' || tab.id === 'keywords' || tab.id === 'geo') return false
  if (tab.id === 'problemas') return !pageData.value && crawlIssueCount.value === 0
  return !pageData.value
}

const analysisBanner = computed(() => {
  if (!pageData.value) return null
  const d = pageData.value
  const hasFull = d.analysisMode === 'full' || d.accessibility != null
  if (!hasFull) {
    return {
      text: 'Análisis parcial: algunas métricas avanzadas no están disponibles en esta pestaña.',
      showRefresh: true,
      tone: 'warn',
    }
  }
  if (d.reinjected && !hasFull) {
    return {
      text: 'Content script re-conectado. Recarga la página (F5) si faltan datos.',
      showRefresh: true,
      tone: 'info',
    }
  }
  return null
})

const analysisBannerClass = computed(() => {
  if (analysisBanner.value?.tone === 'warn') {
    return 'border-amber-500/40 bg-amber-950/40 text-amber-100'
  }
  return 'border-emerald-500/35 bg-emerald-950/35 text-emerald-100'
})

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const onUpdated = (id, info) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated)
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated)
      resolve()
    }, 12000)
  })
}

async function refreshActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  loading.value = true
  await chrome.tabs.reload(tab.id)
  await waitForTabComplete(tab.id)
  await new Promise((r) => setTimeout(r, 450))
  await loadPageData(false)
}

const getMeta = (name) => {
  if (!pageData.value?.metaTags) return null
  return pageData.value.metaTags[name] ||
         pageData.value.metaTags[`og:${name}`] ||
         pageData.value.metaTags[`twitter:${name}`]
}

function ensurePageScores(data) {
  if (!data) return data
  if (!data.scores) {
    data.scores = calculateScores(data)
  }
  return data
}

async function ensurePageHeaders(tabId, data) {
  if (!data || !tabId) return data
  if (Array.isArray(data.headers?.headers)) return data
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: analyzeHeadersInPage,
    })
    if (result?.result) {
      data.headers = result.result
    }
  } catch (e) {
    console.warn('[RonHack SEO] headers desde página', e)
  }
  return data
}

async function enrichPageExtras(tabId, data) {
  if (!data || !tabId) return data

  const tasks = []

  if (!data.schemas?.length) {
    tasks.push(
      chrome.scripting
        .executeScript({ target: { tabId }, func: detectSchemasInPage })
        .then(([result]) => {
          if (result?.result?.length) {
            data.schemas = result.result
            data.detectedSchemaTypes = extractDetectedTypes(result.result)
            data.schemaRecommendations = checkSchemaRecommendations(result.result)
          }
        })
        .catch(() => {}),
    )
  }

  if (!data.techStack?.total) {
    tasks.push(
      chrome.scripting
        .executeScript({ target: { tabId }, func: detectTechStackInPage })
        .then(([result]) => {
          if (result?.result?.total) data.techStack = result.result
        })
        .catch(() => {}),
    )
  }

  if (!data.imageAltStats) {
    tasks.push(
      chrome.scripting
        .executeScript({ target: { tabId }, func: analyzeImageAltInPage })
        .then(([result]) => {
          if (result?.result) data.imageAltStats = result.result
        })
        .catch(() => {}),
    )
  }

  if (!data.outboundLinks) {
    tasks.push(
      chrome.scripting
        .executeScript({ target: { tabId }, func: analyzeOutboundLinksInPage })
        .then(([result]) => {
          if (result?.result) data.outboundLinks = result.result
        })
        .catch(() => {}),
    )
  }

  if (tasks.length) await Promise.all(tasks)
  return data
}

async function loadPageData(highlightHeaders = false) {
  const hadData = !!pageData.value
  if (!hadData) loading.value = true
  analyzeError.value = null

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab?.id) {
      analyzeError.value = 'No se pudo obtener la pestaña actual.'
      pageData.value = null
      loading.value = false
      return
    }

    if (
      tab.url?.startsWith('chrome://') ||
      tab.url?.startsWith('chrome-extension://') ||
      tab.url?.startsWith('brave://') ||
      tab.url?.startsWith('edge://')
    ) {
      analyzeError.value = 'Abre una página web normal (http:// o https://) para ver el resumen SEO.'
      pageData.value = null
      loading.value = false
      return
    }

    activeTabUrl.value = tab.url || ''

    const bridgeResult = await requestPageData(tab.id, { highlightHeaders })
    if (bridgeResult?.data) {
      const enriched = ensurePageScores(bridgeResult.data)
      enriched.analysisMode = bridgeResult.data.analysisMode || bridgeResult.mode || 'full'
      enriched.reinjected = bridgeResult.reinjected
      await ensurePageHeaders(tab.id, enriched)
      await enrichPageExtras(tab.id, enriched)
      pageData.value = enriched
      await savePageCache(enriched)
      loading.value = false
      return
    }

    console.warn('Content script no disponible, usando análisis parcial…')
    try {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const data = {
              url: window.location.href,
              title: document.title,
              metaTags: {},
              performance: null,
              links: [],
              text: '',
              imageCount: document.images.length,
              headers: null,
              canonical: {
                exists: !!document.querySelector('link[rel="canonical"]'),
                url: document.querySelector('link[rel="canonical"]')?.href || '',
              },
              metaRobots: {
                exists: !!document.querySelector('meta[name="robots"]'),
                content: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
              },
              langTag: {
                htmlLang: document.documentElement.lang || '',
              },
            }
            document.querySelectorAll('meta').forEach((tag) => {
              const name = tag.getAttribute('name') || tag.getAttribute('property') || tag.getAttribute('http-equiv')
              const content = tag.getAttribute('content')
              if (name && content) data.metaTags[name] = content
            })
            if (window.performance?.timing) {
              const timing = window.performance.timing
              data.performance = {
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                tcp: timing.connectEnd - timing.connectStart,
                request: timing.responseStart - timing.requestStart,
                response: timing.responseEnd - timing.responseStart,
                dom: timing.domComplete - timing.domLoading,
                load: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
              }
            } else if (window.performance?.getEntriesByType) {
              const navigation = window.performance.getEntriesByType('navigation')[0]
              if (navigation) {
                data.performance = {
                  dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                  tcp: navigation.connectEnd - navigation.connectStart,
                  request: navigation.responseStart - navigation.requestStart,
                  response: navigation.responseEnd - navigation.responseStart,
                  dom: navigation.domComplete - navigation.domLoading,
                  load: navigation.loadEventEnd - navigation.fetchStart,
                  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                }
              }
            }
            data.links = Array.from(document.querySelectorAll('a[href]')).map((link) => ({
              href: link.href,
              text: link.textContent.trim(),
            }))
            data.text = document.body.innerText || document.body.textContent || ''
            return data
          },
        })
        if (result?.[0]?.result) {
          const partial = {
            ...result[0].result,
            schemas: [],
            detectedSchemaTypes: [],
            schemaRecommendations: [],
            scannerValues: null,
          }
          const enriched = ensurePageScores(partial)
          enriched.analysisMode = 'partial'
          enriched.reinjected = false
          await ensurePageHeaders(tab.id, enriched)
          await enrichPageExtras(tab.id, enriched)
          try {
            const [wv] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: collectWebVitalsInPage,
            })
            if (wv?.result) enriched.webVitals = wv.result
          } catch {
            /* ignore */
          }
          pageData.value = enriched
          await savePageCache(enriched)
          if (highlightHeaders) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  const ATTR = 'data-rh-header-audit'
                  const LABEL_CLASS = 'rh-header-audit-label'
                  const COLORS = {
                    H1: '#FFB6C1',
                    H2: '#B6E0FF',
                    H3: '#C8F7C5',
                    H4: '#FFE4B5',
                    H5: '#E6D9FF',
                    H6: '#FFD4E5',
                  }
                  document.querySelectorAll(`[${ATTR}="1"]`).forEach((el) => {
                    el.querySelectorAll(`.${LABEL_CLASS}`).forEach((n) => n.remove())
                    el.removeAttribute(ATTR)
                    el.style.removeProperty('background-color')
                    el.style.removeProperty('border')
                    el.style.removeProperty('padding')
                    el.style.removeProperty('box-sizing')
                    el.style.removeProperty('color')
                    el.style.removeProperty('position')
                    el.style.removeProperty('z-index')
                  })
                  for (let i = 1; i <= 6; i++) {
                    document.querySelectorAll(`h${i}`).forEach((el) => {
                      const tagName = el.tagName
                      const bg = COLORS[tagName] || '#EEEEEE'
                      el.setAttribute(ATTR, '1')
                      el.style.setProperty('background-color', bg)
                      el.style.setProperty('border', '2px solid #000')
                      el.style.setProperty('padding', '6px 10px')
                      el.style.setProperty('box-sizing', 'border-box')
                      el.style.setProperty('color', '#000')
                      el.style.setProperty('position', 'relative')
                      el.style.setProperty('z-index', '2147483000')
                      const label = document.createElement('span')
                      label.className = LABEL_CLASS
                      label.textContent = `${tagName} - `
                      label.style.fontWeight = '700'
                      el.insertBefore(label, el.firstChild)
                    })
                  }
                },
              })
            } catch {
              /* ignore */
            }
          }
        } else {
          analyzeError.value = 'No se pudieron obtener los datos de la página.'
        }
      } catch (injectError) {
        console.error(injectError)
        analyzeError.value = 'Error al analizar: ' + injectError.message
      }
      loading.value = false
  } catch (error) {
    console.error(error)
    loading.value = false
    analyzeError.value = 'Error al analizar la página. Comprueba permisos de la extensión.'
  }
}

const analyze = async () => {
  activeTab.value = 'resumen'
  await loadPageData(true)
}
</script>

<style scoped>
.rh-title-glow {
  text-shadow:
    0 0 18px rgba(52, 211, 153, 0.45),
    0 0 36px rgba(34, 211, 238, 0.12);
  animation: rh-title-pulse 5s ease-in-out infinite;
}
@keyframes rh-title-pulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.08);
  }
}
</style>
