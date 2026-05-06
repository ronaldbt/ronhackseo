<template>
  <div style="width: 680px; max-height: 800px;" class="flex flex-col overflow-hidden bg-gray-50 font-sans">
    <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-4 text-white shadow-lg">
      <h1 class="m-0 flex items-center gap-2 text-lg font-semibold">
        <MagnifyingGlassIcon class="h-5 w-5" />
        SEO Extension Pro
      </h1>
      <button
        class="cursor-pointer rounded-lg border-none bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        :disabled="loading"
        @click="analyze"
      >
        {{ loading ? 'Analizando...' : 'Analizar Página' }}
      </button>
    </header>

    <nav class="flex shrink-0 border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-600">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="flex-1 border-b-2 border-transparent px-1.5 py-2.5 transition-colors hover:bg-slate-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        :class="activeTab === t.id ? 'border-indigo-600 text-indigo-700' : ''"
        :disabled="t.id !== 'sitio' && !pageData"
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

      <div v-else-if="!pageData" class="px-5 py-12 text-center text-gray-500">
        <p class="m-0 text-base">Haz clic en «Analizar Página» o abre la pestaña <strong>Sitio</strong> para rastrear el dominio.</p>
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
import { ref } from 'vue'
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

const tabs = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'schema', label: 'Datos estruct.' },
  { id: 'problemas', label: 'Problemas' },
  { id: 'scanner', label: 'Escáner' },
  { id: 'sitio', label: 'Sitio' },
]

const loading = ref(false)
const pageData = ref(null)
const activeTab = ref('sitio')

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

