<template>
  <div class="geo-serp-tab text-sm text-zinc-300">
    <p class="mb-4 text-xs leading-relaxed text-zinc-400">
      Simula búsquedas de Google desde otro país o ciudad (como
      <a href="https://valentin.app/" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">valentin.app</a>
      ) usando <code class="text-emerald-300">gl</code>, <code class="text-emerald-300">hl</code> y
      <code class="text-emerald-300">uule</code>. Abre la SERP en una pestaña nueva.
    </p>

    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-400/90">País (gl)</label>
        <select v-model="gl" class="w-full rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100">
          <option v-for="c in GEO_COUNTRIES" :key="c.gl" :value="c.gl">{{ c.label }} ({{ c.gl }})</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Idioma UI (hl)</label>
        <select v-model="hl" class="w-full rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100">
          <option v-for="l in GEO_LANGUAGES" :key="l.hl" :value="l.hl">{{ l.label }} ({{ l.hl }})</option>
        </select>
      </div>
    </div>

    <div class="mt-3">
      <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Ciudad / ubicación (opcional)</label>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="locationQuery"
          type="text"
          class="min-w-[200px] flex-1 rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100 focus:border-emerald-500 focus:outline-none"
          placeholder="ej: Santiago, Chile"
        />
        <button
          type="button"
          class="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-200 hover:border-emerald-500/40 disabled:opacity-50"
          :disabled="geocoding || !locationQuery.trim()"
          @click="geocode"
        >
          {{ geocoding ? 'Geocoding…' : 'Geocodificar' }}
        </button>
      </div>
      <p v-if="geoResult" class="mt-2 text-xs text-emerald-200/90">
        ✓ {{ geoResult.displayName }} → <span class="font-mono text-emerald-300">{{ geoResult.canonical }}</span>
      </p>
      <p v-if="geoError" class="mt-2 text-xs text-red-300">{{ geoError }}</p>
    </div>

    <div class="mt-3">
      <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Consulta de búsqueda</label>
      <input
        v-model="query"
        type="text"
        class="w-full rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-zinc-100 focus:border-emerald-500 focus:outline-none"
        placeholder="keyword a buscar en Google"
        @keydown.enter="openSerp"
      />
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-emerald-500/50 bg-emerald-950/80 px-4 py-2 font-semibold text-emerald-100 hover:bg-emerald-900/90 disabled:opacity-50"
        :disabled="!query.trim()"
        @click="openSerp"
      >
        Abrir SERP localizada
      </button>
      <button
        type="button"
        class="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-zinc-200 hover:border-emerald-500/40"
        @click="copyUrl"
      >
        Copiar URL
      </button>
    </div>

    <div v-if="previewUrl" class="mt-4 rounded-lg border border-emerald-500/20 bg-zinc-950/50 p-3">
      <div class="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">URL generada</div>
      <code class="block break-all text-[11px] leading-relaxed text-cyan-300/90">{{ previewUrl }}</code>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { GEO_COUNTRIES, GEO_LANGUAGES } from '../constants/geoLocales.js'
import { buildGoogleSearchUrl, encodeUule } from '../utils/uule.js'

const gl = ref('cl')
const hl = ref('es')
const query = ref('')
const locationQuery = ref('')
const geoResult = ref(null)
const geoError = ref('')
const geocoding = ref(false)

const uule = computed(() => (geoResult.value?.canonical ? encodeUule(geoResult.value.canonical) : null))

const previewUrl = computed(() => {
  if (!query.value.trim()) return ''
  return buildGoogleSearchUrl({
    query: query.value,
    gl: gl.value,
    hl: hl.value,
    uule: uule.value,
  })
})

async function geocode() {
  geoError.value = ''
  geoResult.value = null
  geocoding.value = true
  try {
    const res = await chrome.runtime.sendMessage({
      action: 'geocodeLocation',
      query: locationQuery.value.trim(),
    })
    if (res?.error) {
      geoError.value = res.error
      return
    }
    geoResult.value = res
  } catch (e) {
    geoError.value = e?.message || 'Error de geocoding'
  } finally {
    geocoding.value = false
  }
}

function openSerp() {
  const url = previewUrl.value
  if (!url) return
  chrome.tabs.create({ url })
}

async function copyUrl() {
  const url = previewUrl.value
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    /* ignore */
  }
}
</script>
