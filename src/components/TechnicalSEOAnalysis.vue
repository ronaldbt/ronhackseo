<template>
  <div class="technical-seo-analysis space-y-4">
    <!-- Meta Robots (Crítico) -->
    <div v-if="metaRobots && metaRobots.noindex" class="critical-alert bg-red-600 text-white p-4 rounded-lg border-4 border-red-800">
      <div class="text-center">
        <h3 class="text-xl font-bold mb-2">¡ALERTA CRÍTICA!</h3>
        <p class="text-lg font-semibold">{{ metaRobots.warning }}</p>
      </div>
    </div>

    <!-- Canonical URL -->
    <div class="analysis-item" v-if="canonical">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-zinc-100">URL Canónica</h4>
        <span :class="canonical.exists && canonical.matches ? 'badge-success' : 'badge-warning'">
          {{ canonical.exists && canonical.matches ? '✓ Correcta' : '⚠ Problema' }}
        </span>
      </div>
      <div v-if="canonical.exists">
        <p class="mb-1 text-sm text-zinc-400"><strong class="text-zinc-300">URL Canónica:</strong> {{ canonical.url }}</p>
        <p class="text-sm text-zinc-400"><strong class="text-zinc-300">URL Actual:</strong> {{ canonical.currentURL }}</p>
      </div>
      <div v-else class="warning-box bg-amber-950/40 border-amber-500/70 text-amber-100">
        <p class="text-sm m-0">{{ canonical.warning }}</p>
      </div>
    </div>

    <!-- Lang Tag -->
    <div class="analysis-item" v-if="langTag">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-zinc-100">Idioma (Lang Tag)</h4>
        <span :class="langTag.matches ? 'badge-success' : 'badge-warning'">
          {{ langTag.matches ? '✓ Coincide' : '⚠ No coincide' }}
        </span>
      </div>
      <p class="mb-1 text-sm text-zinc-400"><strong class="text-zinc-300">Atributo lang:</strong> {{ langTag.htmlLang }}</p>
      <p class="mb-2 text-sm text-zinc-400"><strong class="text-zinc-300">Idioma detectado:</strong> {{ langTag.detectedLang }}</p>
      <div v-if="langTag.warning" class="warning-box bg-amber-950/40 border-amber-500/70 text-amber-100">
        <p class="text-sm m-0">{{ langTag.warning }}</p>
      </div>
    </div>

    <!-- Stop Words en URL -->
    <div class="analysis-item" v-if="stopWordsURL">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-zinc-100">Stop Words en URL</h4>
        <span :class="stopWordsURL.isTooLong || stopWordsURL.stopWordsCount > 0 ? 'badge-warning' : 'badge-success'">
          {{ stopWordsURL.isTooLong || stopWordsURL.stopWordsCount > 0 ? '⚠ Mejorable' : '✓ OK' }}
        </span>
      </div>
      <p class="mb-1 text-sm text-zinc-400"><strong class="text-zinc-300">URL:</strong> {{ stopWordsURL.url }}</p>
      <p class="mb-1 text-sm text-zinc-400"><strong class="text-zinc-300">Longitud:</strong> {{ stopWordsURL.urlLength }} caracteres</p>
      <p v-if="stopWordsURL.stopWordsCount > 0" class="mb-2 text-sm text-zinc-400">
        <strong class="text-zinc-300">Stop words encontradas:</strong> {{ stopWordsURL.stopWords.join(', ') }}
      </p>
      <div v-if="stopWordsURL.warning" class="warning-box bg-amber-950/40 border-amber-500/70 text-amber-100">
        <p class="text-sm m-0">{{ stopWordsURL.warning }}</p>
      </div>
    </div>

    <!-- Title Width -->
    <div class="analysis-item" v-if="titleWidth">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-zinc-100">Ancho del Título</h4>
        <span :class="titleWidth.isTooLong ? 'badge-warning' : 'badge-success'">
          {{ titleWidth.isTooLong ? '⚠ Muy largo' : '✓ OK' }}
        </span>
      </div>
      <p class="mb-1 text-sm text-zinc-400"><strong class="text-zinc-300">Título:</strong> {{ titleWidth.title }}</p>
      <div class="mt-2 mb-2">
        <div class="width-bar">
          <div class="width-indicator" :style="{ width: Math.min((titleWidth.width / titleWidth.maxWidth) * 100, 100) + '%' }"></div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-zinc-500">
          <span>{{ Math.round(titleWidth.width) }}px</span>
          <span>Máx: {{ titleWidth.maxWidth }}px</span>
        </div>
      </div>
      <div v-if="titleWidth.truncated" class="mb-2 text-sm italic text-zinc-500">
        Como se verá: "{{ titleWidth.truncated }}"
      </div>
      <div v-if="titleWidth.warning" class="warning-box bg-amber-950/40 border-amber-500/70 text-amber-100">
        <p class="text-sm m-0">{{ titleWidth.warning }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  metaRobots: Object,
  canonical: Object,
  langTag: Object,
  stopWordsURL: Object,
  titleWidth: Object
})
</script>

<style scoped>
.technical-seo-analysis {
  width: 100%;
}

.critical-alert {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}

.analysis-item {
  padding: 12px;
  background: rgba(24, 24, 27, 0.65);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge-success {
  padding: 4px 10px;
  background: rgba(6, 78, 59, 0.55);
  color: #6ee7b7;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-warning {
  padding: 4px 10px;
  background: rgba(120, 53, 15, 0.45);
  color: #fcd34d;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(245, 158, 11, 0.45);
}

.warning-box {
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid;
  margin-top: 8px;
}

.width-bar {
  width: 100%;
  height: 8px;
  background: #27272a;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.width-indicator {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
  transition: width 0.3s ease;
}

.width-indicator::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ef4444;
}
</style>
