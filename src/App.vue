<template>
  <div style="width: 760px; max-height: 800px;" class="flex flex-col overflow-hidden bg-gray-50 font-sans">
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
          {{ loading ? 'Analizando...' : 'Analizar Página' }}
        </button>
      </div>
    </header>

    <nav class="flex shrink-0 border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-600">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="flex-1 border-b-2 border-transparent px-1.5 py-2.5 transition-colors hover:bg-slate-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        :class="activeTab === t.id ? 'border-indigo-600 text-indigo-700' : ''"
        :disabled="isTabDisabled(t)"
        @click="activeTab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="loading" class="flex flex-col items-center justify-center px-5 py-16">
        <div class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
        <p class="font-medium text-gray-600">Analizando página...</p>
      </div>

      <div v-else-if="activeTab === 'sitio'" class="p-4">
        <SiteCrawlTab />
      </div>

      <div v-else-if="activeTab === 'crawlResumen'" class="p-4">
        <CrawlSummaryTab />
      </div>

      <div v-else-if="activeTab === 'problemas' && !pageData" class="p-4">
        <ProblemsTab :page-data="null" />
      </div>

      <div v-else-if="!pageData" class="px-5 py-12 text-center text-gray-500">
        <p class="m-0 text-base">
          Haz clic en «Analizar Página» o usa <strong>Sitio</strong> / <strong>Rastreo</strong> para el crawl.
        </p>
      </div>

      <div v-else class="space-y-5 p-4">
      <div v-show="activeTab === 'resumen'" class="space-y-5">
      <!-- Score Dashboard -->
      <section v-if="pageData.scores" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0">Puntuaciones SEO</h2>
        <ScoreDashboard :scores="pageData.scores" :explanations="pageData.scores.explanations" />
      </section>

      <!-- Análisis de Headers -->
      <section v-if="pageData.headers" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <DocumentTextIcon class="w-5 h-5 text-indigo-600" />
          Análisis de Headers
        </h2>
        <HeadersAnalysis :headers-data="pageData.headers" />
      </section>

      <!-- Información básica -->
      <section class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <InformationCircleIcon class="w-5 h-5 text-indigo-600" />
          Información Básica
        </h2>
        <div class="grid gap-4">
          <div>
            <strong class="block text-indigo-600 mb-2 text-sm font-semibold">URL:</strong>
            <p class="text-xs text-gray-500 break-words m-0">{{ pageData.url }}</p>
          </div>
          <div>
            <strong class="block text-indigo-600 mb-2 text-sm font-semibold">Título:</strong>
            <p class="text-gray-600 break-words m-0">{{ pageData.title || 'No encontrado' }}</p>
          </div>
  <div>
            <strong class="block text-indigo-600 mb-2 text-sm font-semibold">Meta Description:</strong>
            <p class="text-gray-600 break-words m-0">{{ getMeta('description') || 'No encontrada' }}</p>
          </div>
        </div>
      </section>

      <!-- Auditoría de Accesibilidad -->
      <section v-if="pageData.accessibility" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <AdjustmentsHorizontalIcon class="w-5 h-5 text-indigo-600" />
          Auditoría de Accesibilidad SEO
        </h2>
        <AccessibilityAudit :accessibility="pageData.accessibility" />
      </section>

      <!-- Análisis de Velocidad -->
      <section class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5" v-if="pageData.performance">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <BoltIcon class="w-5 h-5 text-indigo-600" />
          Análisis de Velocidad
        </h2>
        <PerformanceMetrics :performance="pageData.performance" />
      </section>

      <!-- Análisis SEO Avanzado -->
      <section v-if="pageData.domDepth || pageData.keywordCannibalization" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <MagnifyingGlassIcon class="w-5 h-5 text-indigo-600" />
          Análisis SEO Avanzado
        </h2>
        <AdvancedSEOAnalysis :dom-depth="pageData.domDepth" :keyword-cannibalization="pageData.keywordCannibalization" />
      </section>

      <!-- Contenido Oculto -->
      <section v-if="pageData.hiddenContent" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <EyeIcon class="w-5 h-5 text-indigo-600" />
          Contenido Oculto
        </h2>
        <HiddenContentDetector :hidden-content="pageData.hiddenContent" />
      </section>

      <!-- Densidad de Palabras -->
      <section class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5" v-if="pageData.text">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <ChartBarIcon class="w-5 h-5 text-indigo-600" />
          Densidad de Palabras
        </h2>
        <WordDensity :text="pageData.text" />
      </section>

      <!-- Social Preview -->
      <section class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
          Social Preview
        </h2>
        <SocialPreview :meta="pageData.metaTags" :title="pageData.title" :url="pageData.url" />
      </section>

      <!-- Chequeo de Enlaces -->
      <section class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5" v-if="pageData.links && pageData.links.length > 0">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <LinkIcon class="w-5 h-5 text-indigo-600" />
          Chequeo de Enlaces
        </h2>
        <LinkChecker :links="pageData.links" :current-url="pageData.url" />
      </section>

      <!-- Análisis SEO Técnico -->
      <section v-if="pageData.metaRobots || pageData.canonical || pageData.langTag || pageData.stopWordsURL || pageData.titleWidth" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <Cog6ToothIcon class="w-5 h-5 text-indigo-600" />
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
      <section v-if="pageData.lazyLoading || pageData.favicons || pageData.security || pageData.textHTMLRatio || pageData.iframes || pageData.nofollowInternal || pageData.hreflang || pageData.internalAnchors || pageData.socialTags" class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <WrenchScrewdriverIcon class="w-5 h-5 text-indigo-600" />
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
      <section class="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
        <h2 class="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-100 m-0 flex items-center gap-2">
          <EyeIcon class="w-5 h-5 text-indigo-600" />
          Simulador de Visión
        </h2>
        <ColorblindSimulator />
      </section>
      </div>

      <div v-show="activeTab === 'schema'" class="space-y-4">
        <div class="rounded-xl bg-white p-4 shadow-md">
          <StructuredDataTab
            :schemas="pageData.schemas || []"
            :detected-types="pageData.detectedSchemaTypes || []"
          />
        </div>
        <div class="rounded-xl bg-white p-4 shadow-md">
          <h2 class="m-0 mb-3 flex items-center gap-2 border-b-2 border-gray-100 pb-2 text-base font-semibold text-gray-800">
            <DocumentTextIcon class="h-5 w-5 text-indigo-600" />
            Detalle JSON-LD
          </h2>
          <SchemaDetector
            :schemas="pageData.schemas || []"
            :recommendations="pageData.schemaRecommendations || []"
          />
        </div>
      </div>

      <div v-show="activeTab === 'problemas'" class="rounded-xl bg-white p-4 shadow-md">
        <ProblemsTab :page-data="pageData" />
      </div>

      <div v-show="activeTab === 'scanner'" class="rounded-xl bg-white p-4 shadow-md">
        <ScannerTab :scanner-values="pageData.scannerValues" />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
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
  AdjustmentsHorizontalIcon
} from '@heroicons/vue/24/outline'
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

const tabs = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'schema', label: 'Datos estruct.' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'scanner', label: 'Escáner' },
  { id: 'sitio', label: 'Sitio' },
  { id: 'crawlResumen', label: 'Rastreo' },
]

const loading = ref(false)
const pageData = ref(null)
const activeTab = ref('sitio')
const crawlIssueCount = ref(0)

let crawlIssuePoll = null
onMounted(() => {
  const tick = async () => {
    try {
      const s = await chrome.storage.local.get('siteCrawlIssues')
      crawlIssueCount.value = Array.isArray(s.siteCrawlIssues) ? s.siteCrawlIssues.length : 0
    } catch {
      crawlIssueCount.value = 0
    }
  }
  void tick()
  crawlIssuePoll = setInterval(tick, 1200)
})
onUnmounted(() => {
  if (crawlIssuePoll) clearInterval(crawlIssuePoll)
})

function isTabDisabled(tab) {
  if (tab.id === 'sitio' || tab.id === 'crawlResumen') return false
  if (tab.id === 'problemas') return !pageData.value && crawlIssueCount.value === 0
  return !pageData.value
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(response)
    })
  })
}

const getMeta = (name) => {
  if (!pageData.value?.metaTags) return null
  return pageData.value.metaTags[name] || 
         pageData.value.metaTags[`og:${name}`] || 
         pageData.value.metaTags[`twitter:${name}`]
}

const analyze = async () => {
  loading.value = true
  pageData.value = null
  activeTab.value = 'resumen'

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab?.id) {
      alert('No se pudo obtener la pestaña actual')
      loading.value = false
      return
    }

    if (
      tab.url?.startsWith('chrome://') ||
      tab.url?.startsWith('chrome-extension://') ||
      tab.url?.startsWith('brave://')
    ) {
      alert('No se puede analizar esta página. Navega a una página web normal (http:// o https://)')
      loading.value = false
      return
    }

    try {
      const response = await sendMessageToTab(tab.id, { action: 'getPageData' })
      if (response?.error) {
        alert('Error al obtener datos: ' + response.error)
        loading.value = false
        return
      }
      pageData.value = response
      loading.value = false
    } catch {
      console.warn('Content script no disponible, inyectando código mínimo…')
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
        loading.value = false
        if (result?.[0]?.result) {
          pageData.value = {
            ...result[0].result,
            schemas: [],
            detectedSchemaTypes: [],
            schemaRecommendations: [],
            scannerValues: null,
          }
          alert(
            'Análisis parcial: recarga la página (F5) para activar el content script y obtener datos estructurados, problemas completos y escáner.',
          )
        } else {
          alert('No se pudieron obtener los datos de la página')
        }
      } catch (injectError) {
        console.error(injectError)
        loading.value = false
        alert('Error al analizar la página: ' + injectError.message)
      }
    }
  } catch (error) {
    console.error(error)
    loading.value = false
    alert('Error al analizar la página. Comprueba permisos de la extensión.')
  }
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
