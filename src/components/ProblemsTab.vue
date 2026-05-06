<template>
  <div class="problems-tab text-sm">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p class="m-0 text-xs text-slate-600">
        Problemas derivados del análisis de <strong>esta URL</strong> (no es un rastreo completo como Screaming Frog).
      </p>
      <div class="flex flex-wrap gap-1 text-[11px] font-semibold">
        <span class="rounded bg-slate-200 px-2 py-0.5 text-slate-800">Problemas {{ summary.problemas }}</span>
        <span class="rounded bg-slate-200 px-2 py-0.5 text-slate-800">Avisos {{ summary.avisos }}</span>
        <span class="rounded bg-slate-200 px-2 py-0.5 text-slate-800">Oportunidades {{ summary.oportunidades }}</span>
        <span class="rounded bg-emerald-600 px-2 py-0.5 text-white">Total {{ summary.total }}</span>
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-slate-200">
      <table class="w-full min-w-[520px] border-collapse text-left text-xs">
        <thead>
          <tr class="bg-slate-100 text-slate-700">
            <th class="border-b border-slate-200 px-2 py-2 font-semibold">Nombre del problema</th>
            <th class="border-b border-slate-200 px-2 py-2 font-semibold">Tipo</th>
            <th class="border-b border-slate-200 px-2 py-2 font-semibold">Prioridad</th>
            <th class="border-b border-slate-200 px-2 py-2 text-right font-semibold">URL</th>
            <th class="border-b border-slate-200 px-2 py-2 text-right font-semibold">% del total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in issues" :key="i" class="odd:bg-white even:bg-slate-50/80">
            <td class="border-b border-slate-100 px-2 py-1.5 text-gray-800">{{ row.nombre }}</td>
            <td class="border-b border-slate-100 px-2 py-1.5">
              <span class="inline-flex items-center gap-1">
                <span
                  class="inline-block h-2.5 w-2.5 rounded-full"
                  :class="tipoDot(row.tipo)"
                />
                {{ row.tipo }}
              </span>
            </td>
            <td class="border-b border-slate-100 px-2 py-1.5">
              <span class="inline-flex items-center gap-1 text-[11px]">
                <span class="text-base leading-none">{{ prioridadIcon(row.prioridad) }}</span>
                {{ row.prioridad }}
              </span>
            </td>
            <td class="border-b border-slate-100 px-2 py-1.5 text-right tabular-nums">{{ row.urls }}</td>
            <td class="border-b border-slate-100 px-2 py-1.5 text-right tabular-nums">{{ row.pct }}</td>
          </tr>
          <tr v-if="issues.length === 0">
            <td colspan="5" class="px-3 py-6 text-center text-slate-500">Sin problemas detectados con las reglas actuales.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildIssuesFromPageData, summarizeIssues } from '../utils/seoIssues.js'

const props = defineProps({
  pageData: { type: Object, default: null },
})

const issues = computed(() => buildIssuesFromPageData(props.pageData))
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
