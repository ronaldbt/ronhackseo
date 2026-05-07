<template>
  <div class="w-full">
    <div class="mb-5 flex items-center justify-between border-b-2 border-emerald-500/20 pb-4">
      <button
        class="cursor-pointer rounded-lg border-none bg-emerald-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="checking"
        @click="checkLinks"
      >
        {{ checking ? 'Verificando...' : 'Verificar Enlaces' }}
      </button>
      <div class="text-sm text-zinc-400">Total: {{ links.length }} enlaces</div>
    </div>

    <div v-if="checking" class="mb-5">
      <div class="mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          class="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-300"
          :style="{ width: (checkedLinks / links.length) * 100 + '%' }"
        ></div>
      </div>
      <p class="m-0 text-center text-sm text-zinc-400">Verificando {{ checkedLinks }} / {{ links.length }}...</p>
    </div>

    <div v-if="results.length > 0" class="space-y-5">
      <div class="mb-5 flex gap-5 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
        <div class="flex-1 rounded-lg bg-emerald-950/50 p-3 text-center text-emerald-200 ring-1 ring-emerald-500/30">
          <strong class="mb-1 block text-lg">✓ Funcionales:</strong> {{ workingCount }}
        </div>
        <div class="flex-1 rounded-lg bg-red-950/50 p-3 text-center text-red-200 ring-1 ring-red-500/35">
          <strong class="mb-1 block text-lg">✗ Rotos:</strong> {{ brokenCount }}
        </div>
      </div>

      <div class="flex max-h-[400px] flex-col gap-3 overflow-y-auto">
        <div
          v-for="result in sortedResults"
          :key="result.href"
          class="rounded-lg border-l-4 p-3 transition-colors"
          :class="{
            'border-red-500 bg-red-950/25': !result.status || result.status >= 400,
            'border-zinc-600 bg-zinc-900/40 hover:bg-zinc-900/70': result.status && result.status < 400,
          }"
        >
          <div class="mb-2 flex items-center gap-3">
            <span class="flex-shrink-0">
              <span
                v-if="result.status === null"
                class="inline-block h-5 w-5 animate-spin rounded-full bg-yellow-500 text-center text-xs font-bold leading-5 text-black"
                >⟳</span
              >
              <span
                v-else-if="result.status >= 200 && result.status < 300"
                class="inline-block h-5 w-5 rounded-full bg-green-500 text-center text-xs font-bold leading-5 text-white"
                >✓</span
              >
              <span v-else class="inline-block h-5 w-5 rounded-full bg-red-500 text-center text-xs font-bold leading-5 text-white">✗</span>
            </span>
            <span class="flex-1 break-all text-sm text-zinc-200">{{ result.href }}</span>
            <span
              v-if="result.status"
              class="rounded px-2 py-1 text-xs font-semibold"
              :class="{
                'bg-emerald-950/60 text-emerald-300': result.status >= 200 && result.status < 300,
                'bg-amber-950/60 text-amber-200': result.status >= 300 && result.status < 400,
                'bg-red-950/60 text-red-300': result.status >= 400,
              }"
            >
              {{ result.status }}
            </span>
          </div>
          <div v-if="result.text" class="mt-2 text-xs italic text-zinc-500">{{ result.text }}</div>
          <div v-if="result.error" class="mt-2 text-xs font-medium text-red-400">{{ result.error }}</div>
        </div>
      </div>
    </div>

    <div v-else class="px-5 py-10 text-center text-sm text-zinc-500">Haz clic en "Verificar Enlaces" para comenzar la verificación</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  links: {
    type: Array,
    required: true,
  },
  currentUrl: {
    type: String,
    default: '',
  },
})

const checking = ref(false)
const results = ref([])
const checkedLinks = ref(0)

const workingCount = computed(() => {
  return results.value.filter((r) => r.status >= 200 && r.status < 300).length
})

const brokenCount = computed(() => {
  return results.value.filter((r) => !r.status || r.status >= 400).length
})

const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => {
    const aIsBroken = !a.status || a.status >= 400
    const bIsBroken = !b.status || b.status >= 400
    if (aIsBroken && !bIsBroken) return -1
    if (!aIsBroken && bIsBroken) return 1
    return 0
  })
})

const checkLink = async (link) => {
  try {
    let currentOrigin = ''
    if (props.currentUrl) {
      try {
        currentOrigin = new URL(props.currentUrl).origin
      } catch (e) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        currentOrigin = tab?.url ? new URL(tab.url).origin : ''
      }
    } else {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      currentOrigin = tab?.url ? new URL(tab.url).origin : ''
    }

    const linkUrl = new URL(link.href)

    if (linkUrl.origin === currentOrigin) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(link.href, {
          method: 'HEAD',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        return {
          href: link.href,
          text: link.text,
          status: response.status,
          error: null,
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return {
            href: link.href,
            text: link.text,
            status: null,
            error: 'Timeout',
          }
        }
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(link.href, {
            method: 'GET',
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          return {
            href: link.href,
            text: link.text,
            status: response.status,
            error: null,
          }
        } catch (e) {
          return {
            href: link.href,
            text: link.text,
            status: null,
            error: 'No se pudo verificar (posible enlace roto)',
          }
        }
      }
    } else {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        await fetch(link.href, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        return {
          href: link.href,
          text: link.text,
          status: 200,
          error: null,
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return {
            href: link.href,
            text: link.text,
            status: null,
            error: 'Timeout (no se pudo verificar)',
          }
        }
        return {
          href: link.href,
          text: link.text,
          status: null,
          error: 'Posible enlace roto o bloqueado por CORS',
        }
      }
    }
  } catch (error) {
    return {
      href: link.href,
      text: link.text,
      status: null,
      error: error.message || 'Error al verificar enlace',
    }
  }
}

const checkLinks = async () => {
  checking.value = true
  results.value = []
  checkedLinks.value = 0

  const uniqueLinks = Array.from(new Map(props.links.map((link) => [link.href, link])).values())

  const batchSize = 5
  for (let i = 0; i < uniqueLinks.length; i += batchSize) {
    const batch = uniqueLinks.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((link) => checkLink(link)))

    results.value.push(...batchResults)
    checkedLinks.value = results.value.length

    if (i + batchSize < uniqueLinks.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  checking.value = false
}
</script>
