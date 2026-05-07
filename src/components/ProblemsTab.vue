<template>
  <div class="problems-tab text-sm text-zinc-300">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p class="m-0 text-xs text-zinc-400">
        Incluye hallazgos del <strong class="text-emerald-400/90">último rastreo del sitio</strong> (duplicados, 404, etc.) y reglas de
        <strong class="text-emerald-400/90">esta URL</strong>.
      </p>
      <div class="flex flex-wrap gap-1 text-[11px] font-semibold">
        <span class="rounded border border-zinc-600 bg-zinc-800/90 px-2 py-0.5 text-zinc-200">Problemas {{ summary.problemas }}</span>
        <span class="rounded border border-zinc-600 bg-zinc-800/90 px-2 py-0.5 text-zinc-200">Avisos {{ summary.avisos }}</span>
        <span class="rounded border border-zinc-600 bg-zinc-800/90 px-2 py-0.5 text-zinc-200">Oportunidades {{ summary.oportunidades }}</span>
        <span class="rounded border border-emerald-500/50 bg-emerald-900/80 px-2 py-0.5 text-emerald-100">Total {{ summary.total }}</span>
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-emerald-500/20 bg-zinc-950/40">
      <table class="w-full min-w-[520px] border-collapse text-left text-xs">
        <thead>
          <tr class="bg-zinc-900/90 text-zinc-300">
            <th class="border-b border-emerald-500/20 px-2 py-2 font-semibold">Nombre del problema</th>
            <th class="border-b border-emerald-500/20 px-2 py-2 font-semibold">Tipo</th>
            <th class="border-b border-emerald-500/20 px-2 py-2 font-semibold">Prioridad</th>
            <th class="border-b border-emerald-500/20 px-2 py-2 text-right font-semibold">URL</th>
            <th class="border-b border-emerald-500/20 px-2 py-2 text-right font-semibold">% del total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in issues" :key="i" class="odd:bg-zinc-900/50 even:bg-zinc-950/80">
            <td class="border-b border-zinc-800 px-2 py-1.5 text-zinc-200">
              <div>{{ row.nombre }}</div>
              <div v-if="row.detalle" class="mt-0.5 max-w-md truncate font-mono text-[10px] text-zinc-500" :title="row.detalle">
                {{ row.detalle }}
              </div>
            </td>
            <td class="border-b border-zinc-800 px-2 py-1.5">
              <span class="inline-flex items-center gap-1">
                <span
                  class="inline-block h-2.5 w-2.5 rounded-full"
                  :class="tipoDot(row.tipo)"
                />
                {{ row.tipo }}
              </span>
            </td>
            <td class="border-b border-zinc-800 px-2 py-1.5">
              <span class="inline-flex items-center gap-1 text-[11px]">
                <span class="text-base leading-none">{{ prioridadIcon(row.prioridad) }}</span>
                {{ row.prioridad }}
              </span>
            </td>
            <td class="border-b border-zinc-800 px-2 py-1.5 text-right tabular-nums">{{ row.urls }}</td>
            <td class="border-b border-zinc-800 px-2 py-1.5 text-right tabular-nums">{{ row.pct }}</td>
          </tr>
          <tr v-if="issues.length === 0">
            <td colspan="5" class="px-3 py-6 text-center text-zinc-500">Sin problemas detectados con las reglas actuales.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { buildIssuesFromPageData, summarizeIssues } from '../utils/seoIssues.js'

const props = defineProps({
  pageData: { type: Object, default: null },
})

const crawlIssuesStored = ref([])

let crawlPoll = null
onMounted(() => {
  const load = async () => {
    try {
      const s = await chrome.storage.local.get('siteCrawlIssues')
      crawlIssuesStored.value = s.siteCrawlIssues || []
    } catch {
      crawlIssuesStored.value = []
    }
  }
  void load()
  crawlPoll = setInterval(load, 900)
})
onUnmounted(() => {
  if (crawlPoll) clearInterval(crawlPoll)
})

const issues = computed(() => {
  const fromPage = buildIssuesFromPageData(props.pageData)
  const fromCrawl = crawlIssuesStored.value || []
  return [...fromCrawl, ...fromPage]
})
const summary = computed(() => summarizeIssues(issues.value))

function tipoDot(tipo) {
  if (tipo === 'Problema') return 'bg-red-600'
  if (tipo === 'Aviso') return 'bg-amber-400'
  return 'bg-blue-500'
}

function prioridadIcon(p) {
  if (p === 'Alta') return '↓'
  if (p === 'Media') return '○'
  return '↓'
}
</script>
