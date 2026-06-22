<template>
  <div class="web-vitals-panel">
    <div class="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.key"
        class="rounded-lg border p-3"
        :class="ratingClass(item.rating)"
      >
        <div class="text-[10px] font-bold uppercase tracking-wide opacity-80">{{ item.label }}</div>
        <div class="mt-1 text-xl font-bold leading-none">{{ item.display }}</div>
        <div class="mt-1 text-[10px] opacity-70">{{ item.hint }}</div>
      </div>
    </div>
    <p class="m-0 text-[11px] text-zinc-500">
      Umbrales Google (good / needs improvement / poor). Datos de Performance API de la pestaña activa.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { rateWebVital } from '../utils/webVitalsCollect.js'

const props = defineProps({
  webVitals: { type: Object, default: null },
})

const defs = [
  { key: 'lcp', label: 'LCP', unit: 'ms', hint: '≤2.5s bueno' },
  { key: 'inp', label: 'INP', unit: 'ms', hint: '≤200ms bueno' },
  { key: 'cls', label: 'CLS', unit: '', hint: '≤0.1 bueno' },
  { key: 'fcp', label: 'FCP', unit: 'ms', hint: '≤1.8s bueno' },
  { key: 'ttfb', label: 'TTFB', unit: 'ms', hint: '≤800ms bueno' },
]

const items = computed(() =>
  defs.map((d) => {
    const value = props.webVitals?.[d.key]
    const rating = rateWebVital(d.key, value)
    let display = '—'
    if (value != null) {
      display = d.key === 'cls' ? String(value) : `${value}${d.unit}`
    }
    return { ...d, value, rating, display }
  }),
)

function ratingClass(rating) {
  if (rating === 'good') return 'border-emerald-500/40 bg-emerald-950/40 text-emerald-100'
  if (rating === 'needs-improvement') return 'border-amber-500/40 bg-amber-950/35 text-amber-100'
  if (rating === 'poor') return 'border-red-500/40 bg-red-950/35 text-red-100'
  return 'border-zinc-700 bg-zinc-900/50 text-zinc-400'
}
</script>
