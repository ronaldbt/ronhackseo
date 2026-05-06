<template>
  <div class="w-full">
    <div class="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-100">
      <button @click="checkLinks" class="bg-indigo-600 text-white border-none px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition-colors hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="checking">
        {{ checking ? 'Verificando...' : 'Verificar Enlaces' }}
      </button>
      <div class="text-sm text-gray-600">
        Total: {{ links.length }} enlaces
      </div>
    </div>

    <div v-if="checking" class="mb-5">
      <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div 
          class="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
          :style="{ width: (checkedLinks / links.length) * 100 + '%' }"
        ></div>
      </div>
      <p class="m-0 text-sm text-gray-600 text-center">Verificando {{ checkedLinks }} / {{ links.length }}...</p>
    </div>

    <div v-if="results.length > 0" class="space-y-5">
      <div class="flex gap-5 mb-5 p-4 bg-gray-50 rounded-lg">
        <div class="flex-1 text-center p-3 rounded-lg bg-green-100 text-green-900">
          <strong class="block text-lg mb-1">✓ Funcionales:</strong> {{ workingCount }}
        </div>
        <div class="flex-1 text-center p-3 rounded-lg bg-red-100 text-red-900">
          <strong class="block text-lg mb-1">✗ Rotos:</strong> {{ brokenCount }}
        </div>
      </div>

      <div class="flex flex-col gap-3 overflow-y-auto" style="max-height: 400px;">
        <div 
          v-for="result in sortedResults" 
          :key="result.href"
          class="p-3 rounded-lg border-l-4 transition-colors"
          :class="{ 
            'bg-red-50 border-red-500': !result.status || result.status >= 400,
            'bg-gray-50 border-gray-300 hover:bg-gray-100': result.status && result.status < 400
          }"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="flex-shrink-0">
              <span v-if="result.status === null" class="inline-block w-5 h-5 rounded-full bg-yellow-500 text-white text-center leading-5 text-xs font-bold animate-spin">⟳</span>
              <span v-else-if="result.status >= 200 && result.status < 300" class="inline-block w-5 h-5 rounded-full bg-green-500 text-white text-center leading-5 text-xs font-bold">✓</span>
              <span v-else class="inline-block w-5 h-5 rounded-full bg-red-500 text-white text-center leading-5 text-xs font-bold">✗</span>
            </span>
            <span class="flex-1 text-sm text-gray-800 break-all">{{ result.href }}</span>
            <span v-if="result.status" class="px-2 py-1 rounded text-xs font-semibold"
              :class="{
                'bg-green-100 text-green-800': result.status >= 200 && result.status < 300,
                'bg-yellow-100 text-yellow-800': result.status >= 300 && result.status < 400,
                'bg-red-100 text-red-800': result.status >= 400
              }"
            >
              {{ result.status }}
            </span>
          </div>
          <div v-if="result.text" class="text-xs text-gray-600 mt-2 italic">{{ result.text }}</div>
          <div v-if="result.error" class="text-xs text-red-600 mt-2 font-medium">{{ result.error }}</div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10 px-5 text-gray-500 text-sm">
      Haz clic en "Verificar Enlaces" para comenzar la verificación
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  links: {
    type: Array,
    required: true
  },
  currentUrl: {
    type: String,
    default: ''
  }
})

const checking = ref(false)
const results = ref([])
const checkedLinks = ref(0)

const workingCount = computed(() => {
  return results.value.filter(r => r.status >= 200 && r.status < 300).length
})

const brokenCount = computed(() => {
  return results.value.filter(r => !r.status || r.status >= 400).length
})

const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => {
    // Primero los rotos, luego los funcionales
    const aIsBroken = !a.status || a.status >= 400
    const bIsBroken = !b.status || b.status >= 400
    if (aIsBroken && !bIsBroken) return -1
    if (!aIsBroken && bIsBroken) return 1
    return 0
  })
})

const getStatusClass = (status) => {
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 300 && status < 400) return 'status-redirect'
  return 'status-error'
}

const checkLink = async (link) => {
  try {
    // Obtener la URL actual
    let currentOrigin = ''
    if (props.currentUrl) {
      try {
        currentOrigin = new URL(props.currentUrl).origin
      } catch (e) {
        // Si no se puede parsear, intentar obtener de la pestaña
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        currentOrigin = tab?.url ? new URL(tab.url).origin : ''
      }
    } else {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      currentOrigin = tab?.url ? new URL(tab.url).origin : ''
    }
    
    const linkUrl = new URL(link.href)
    
    if (linkUrl.origin === currentOrigin) {
      // Para enlaces internos, usar fetch normal
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(link.href, {
          method: 'HEAD',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        return {
          href: link.href,
          text: link.text,
          status: response.status,
          error: null
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return {
            href: link.href,
            text: link.text,
            status: null,
            error: 'Timeout'
          }
        }
        // Intentar con GET si HEAD falla
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(link.href, {
            method: 'GET',
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          return {
            href: link.href,
            text: link.text,
            status: response.status,
            error: null
          }
        } catch (e) {
          return {
            href: link.href,
            text: link.text,
            status: null,
            error: 'No se pudo verificar (posible enlace roto)'
          }
        }
      }
    } else {
      // Para enlaces externos, usar fetch con no-cors
      // No podemos obtener el status code real, pero podemos verificar si hay respuesta
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        await fetch(link.href, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        // Con no-cors no podemos obtener el status, asumimos 200 si no hay error
        return {
          href: link.href,
          text: link.text,
          status: 200,
          error: null
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return {
            href: link.href,
            text: link.text,
            status: null,
            error: 'Timeout (no se pudo verificar)'
          }
        }
        return {
          href: link.href,
          text: link.text,
          status: null,
          error: 'Posible enlace roto o bloqueado por CORS'
        }
      }
    }
  } catch (error) {
    return {
      href: link.href,
      text: link.text,
      status: null,
      error: error.message || 'Error al verificar enlace'
    }
  }
}

const checkLinks = async () => {
  checking.value = true
  results.value = []
  checkedLinks.value = 0

  // Filtrar enlaces únicos
  const uniqueLinks = Array.from(
    new Map(props.links.map(link => [link.href, link])).values()
  )

  // Procesar enlaces en lotes para no sobrecargar
  const batchSize = 5
  for (let i = 0; i < uniqueLinks.length; i += batchSize) {
    const batch = uniqueLinks.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(link => checkLink(link))
    )
    
    results.value.push(...batchResults)
    checkedLinks.value = results.value.length

    // Pequeña pausa entre lotes
    if (i + batchSize < uniqueLinks.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  checking.value = false
}
</script>

