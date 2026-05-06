<template>
  <div class="structured-data-tab text-sm text-gray-800">
    <div class="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      Vista inspirada en <strong>Schema Builder</strong>: tipos detectados en esta página, lista popular y catálogo. “Ver markup” muestra el JSON-LD parseado.
    </div>

    <section class="mb-5">
      <h3 class="mb-2 mt-0 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        Tipos de schema detectados
      </h3>
      <p v-if="!detected.length" class="m-0 text-slate-500">No se encontró JSON-LD en esta página.</p>
      <ul v-else class="m-0 list-none space-y-1 p-0">
        <li
          v-for="t in detected"
          :key="t"
          class="flex items-center justify-between gap-2 rounded border border-slate-100 bg-white px-2 py-1.5"
        >
          <span class="flex items-center gap-2">
            <span class="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Detectado" />
            <span class="font-medium">{{ t }}</span>
          </span>
          <button
            type="button"
            class="cursor-pointer text-xs text-blue-600 underline hover:text-blue-800"
            @click="openMarkupForType(t)"
          >
            Ver markup
          </button>
        </li>
      </ul>
    </section>

    <section class="mb-5">
      <h3 class="mb-2 mt-0 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        Tipos populares
      </h3>
      <ul class="m-0 max-h-48 list-none space-y-0 overflow-y-auto p-0">
        <li
          v-for="p in POPULAR_SCHEMA_TYPES"
          :key="p.key"
          class="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0"
        >
          <span class="flex items-center gap-2">
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :class="detectedSet.has(p.key) ? 'bg-emerald-500' : 'bg-slate-200'"
            />
            {{ p.label }}
          </span>
          <span class="text-slate-400" title="Ayuda genérica">?</span>
        </li>
      </ul>
    </section>

    <section class="mb-2">
      <h3 class="mb-2 mt-0 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        Todos los esquemas soportados ({{ ALL_SCHEMA_TYPES.length }})
      </h3>
      <input
        v-model="filterAll"
        type="search"
        placeholder="Filtrar…"
        class="mb-2 w-full rounded border border-slate-200 px-2 py-1 text-xs"
      />
      <ul class="m-0 max-h-40 list-none space-y-0 overflow-y-auto p-0">
        <li
          v-for="t in filteredAll"
          :key="t"
          class="flex items-center justify-between border-b border-slate-100 py-1 text-xs last:border-0"
        >
          <span class="flex items-center gap-2">
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :class="detectedSet.has(t) ? 'bg-emerald-500' : 'bg-transparent'"
            />
            {{ t }}
          </span>
          <span class="text-slate-400">?</span>
        </li>
      </ul>
    </section>

    <div
      v-if="markupPreview"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      @click.self="markupPreview = null"
    >
      <div class="max-h-[70vh] w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
        <div class="flex items-center justify-between border-b px-3 py-2">
          <span class="text-sm font-semibold">{{ markupPreview.type }}</span>
          <button type="button" class="text-slate-500 hover:text-slate-800" @click="markupPreview = null">✕</button>
        </div>
        <pre class="m-0 max-h-[55vh] overflow-auto bg-slate-50 p-3 text-[10px] leading-relaxed">{{ markupPreview.json }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { POPULAR_SCHEMA_TYPES, ALL_SCHEMA_TYPES } from '../constants/schemaTypes.js'

const props = defineProps({
  schemas: { type: Array, default: () => [] },
  detectedTypes: { type: Array, default: () => [] },
})

const filterAll = ref('')
const markupPreview = ref(null)

const detected = computed(() => props.detectedTypes || [])

const detectedSet = computed(() => new Set(detected.value))

const filteredAll = computed(() => {
  const q = filterAll.value.trim().toLowerCase()
  if (!q) return ALL_SCHEMA_TYPES
  return ALL_SCHEMA_TYPES.filter((t) => t.toLowerCase().includes(q))
})

function openMarkupForType(typeName) {
  const blocks = []
  for (const s of props.schemas || []) {
    if (!s.data) continue
    const types = []
    const add = (t) => {
      if (!t) return
      const a = Array.isArray(t) ? t : [t]
      a.forEach((x) => types.push(String(x)))
    }
    add(s.data['@type'])
    if (Array.isArray(s.data['@graph'])) {
      s.data['@graph'].forEach((n) => add(n && n['@type']))
    }
    if (types.includes(typeName) || s.type === typeName) {
      blocks.push(JSON.stringify(s.data, null, 2))
    }
  }
  markupPreview.value = {
    type: typeName,
    json: blocks.length ? blocks.join('\n---\n') : 'Sin bloque JSON para este tipo.',
  }
}
</script>
