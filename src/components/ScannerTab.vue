<template>
  <div class="scanner-tab text-sm text-zinc-300">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p class="m-0 text-xs text-zinc-400">
        Una fila por la página actual. Columnas alineadas con el export <strong>Internos · Todo</strong> y con el rastreo
        del sitio.
      </p>
      <button
        type="button"
        class="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canExport"
        @click="exportPdf"
      >
        Exportar PDF
      </button>
    </div>

    <div v-if="!canExport" class="rounded border border-amber-500/50 bg-amber-950/50 px-3 py-2 text-xs text-amber-200">
      No hay fila de escáner. Vuelve a analizar la página con el content script activo (recarga la pestaña si acabas de instalar la extensión).
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-emerald-500/20 bg-zinc-950/50">
      <table class="w-max min-w-full border-collapse text-left text-[10px]">
        <thead>
          <tr class="sticky top-0 z-[1] bg-emerald-950 text-emerald-100">
            <th
              v-for="(col, i) in SCANNER_COLUMNS"
              :key="i"
              class="whitespace-nowrap border-b border-emerald-800 px-1.5 py-1.5 font-semibold"
            >
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              v-for="(cell, i) in values"
              :key="i"
              class="max-w-[140px] whitespace-normal break-words border-b border-zinc-800 px-1.5 py-1 text-zinc-300"
            >
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SCANNER_COLUMNS } from '../constants/scannerColumns.js'

const props = defineProps({
  scannerValues: { type: Array, default: null },
})

const values = computed(() => (Array.isArray(props.scannerValues) ? props.scannerValues : []))
const canExport = computed(() => values.value.length === SCANNER_COLUMNS.length)

async function exportPdf() {
  if (!canExport.value) return
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const autoTable = autoTableMod.default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a2' })
  doc.setProperties({ title: 'RonHack SEO — Escáner', subject: 'Vista Internos' })
  doc.setFontSize(10)
  doc.text('RonHack SEO — Escáner (página actual)', 14, 12)
  autoTable(doc, {
    head: [SCANNER_COLUMNS],
    body: [values.value.map((c) => String(c ?? ''))],
    startY: 16,
    styles: { fontSize: 4, cellPadding: 0.4, overflow: 'linebreak' },
    headStyles: { fillColor: [5, 122, 85], textColor: 255, fontStyle: 'bold' },
    margin: { left: 6, right: 6 },
    tableWidth: 'auto',
  })
  const name = `seo-scan-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(name)
}
</script>
