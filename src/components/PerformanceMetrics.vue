<template>
  <div class="w-full">
    <div class="mb-5 grid gap-4">
      <div v-for="(value, key) in metrics" :key="key" class="grid gap-2" style="grid-template-columns: 1fr auto;">
        <div class="text-sm font-medium text-zinc-400">{{ getLabel(key) }}</div>
        <div class="text-sm font-semibold text-zinc-100">{{ formatTime(value) }}</div>
        <div class="col-span-2 mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="getColorClass(value)"
            :style="{ width: getPercentage(value) + '%' }"
          ></div>
        </div>
      </div>
    </div>
    <div class="border-t-2 border-emerald-500/20 pt-4 text-sm text-zinc-200">
      <strong class="font-semibold text-emerald-400/90">Tiempo total de carga:</strong> {{ formatTime(performance.load) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  performance: {
    type: Object,
    required: true,
  },
})

const metrics = computed(() => ({
  dns: props.performance.dns || 0,
  tcp: props.performance.tcp || 0,
  request: props.performance.request || 0,
  response: props.performance.response || 0,
  dom: props.performance.dom || 0,
  domContentLoaded: props.performance.domContentLoaded || 0,
}))

const maxTime = computed(() => {
  return Math.max(...Object.values(metrics.value), props.performance.load || 0)
})

const getLabel = (key) => {
  const labels = {
    dns: 'DNS Lookup',
    tcp: 'TCP Connection',
    request: 'Request',
    response: 'Response',
    dom: 'DOM Processing',
    domContentLoaded: 'DOM Content Loaded',
  }
  return labels[key] || key
}

const formatTime = (ms) => {
  if (!ms || ms < 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const getPercentage = (value) => {
  if (!maxTime.value || maxTime.value === 0) return 0
  return Math.min((value / maxTime.value) * 100, 100)
}

const getColorClass = (value) => {
  const percentage = getPercentage(value)
  if (percentage < 30) return 'bg-green-500'
  if (percentage < 60) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>
