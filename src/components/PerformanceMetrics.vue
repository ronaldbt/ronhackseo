<template>
  <div class="w-full">
    <div class="grid gap-4 mb-5">
      <div class="grid gap-2" style="grid-template-columns: 1fr auto;" v-for="(value, key) in metrics" :key="key">
        <div class="text-sm text-gray-600 font-medium">{{ getLabel(key) }}</div>
        <div class="text-sm text-gray-800 font-semibold">{{ formatTime(value) }}</div>
        <div class="col-span-2 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div 
            class="h-full transition-all duration-300 rounded-full"
            :class="getColorClass(value)"
            :style="{ width: getPercentage(value) + '%' }"
          ></div>
        </div>
      </div>
    </div>
    <div class="pt-4 border-t-2 border-gray-100 text-sm text-gray-800">
      <strong class="font-semibold">Tiempo total de carga:</strong> {{ formatTime(performance.load) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  performance: {
    type: Object,
    required: true
  }
})

const metrics = computed(() => ({
  dns: props.performance.dns || 0,
  tcp: props.performance.tcp || 0,
  request: props.performance.request || 0,
  response: props.performance.response || 0,
  dom: props.performance.dom || 0,
  domContentLoaded: props.performance.domContentLoaded || 0
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
    domContentLoaded: 'DOM Content Loaded'
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
  if (percentage < 30) return 'bg-green-500' // verde
  if (percentage < 60) return 'bg-yellow-500' // amarillo
  return 'bg-red-500' // rojo
}
</script>

