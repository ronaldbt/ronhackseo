<template>
  <div class="w-full">
    <div class="mb-5 flex flex-col gap-5">
      <!-- Facebook/LinkedIn Style -->
      <div
        class="max-w-[500px] overflow-hidden rounded-lg border border-emerald-500/25 bg-zinc-900/80 shadow-lg shadow-black/30"
        style="max-width: 500px;"
      >
        <div v-if="ogImage" class="w-full overflow-hidden bg-zinc-800" style="height: 250px;">
          <img :src="ogImage" :alt="ogTitle" class="h-full w-full object-cover" @error="handleImageError" />
        </div>
        <div class="p-4">
          <div class="mb-1 text-xs uppercase tracking-wider text-zinc-500">{{ getDomain(url) }}</div>
          <h3 class="my-2 text-lg font-semibold leading-snug text-zinc-100">{{ ogTitle || title || 'Sin título' }}</h3>
          <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">{{ ogDescription || 'Sin descripción disponible' }}</p>
        </div>
      </div>

      <!-- Twitter/X Style -->
      <div
        class="max-w-[500px] overflow-hidden rounded-lg border border-emerald-500/25 bg-zinc-900/80 shadow-lg shadow-black/30"
        style="max-width: 500px;"
      >
        <div class="p-3">
          <div class="mb-3 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-xl">🐦</div>
            <div class="flex-1">
              <div class="text-sm font-semibold text-zinc-200">{{ getDomain(url) }}</div>
              <div class="text-sm text-zinc-500">@website</div>
            </div>
          </div>
          <p class="my-3 leading-relaxed text-zinc-300" style="font-size: 15px;">{{ ogDescription || ogTitle || title || 'Sin contenido' }}</p>
          <div v-if="ogImage" class="mt-3 overflow-hidden rounded-xl border border-zinc-700">
            <img :src="ogImage" :alt="ogTitle" class="block w-full" @error="handleImageError" />
          </div>
        </div>
      </div>
    </div>

    <div class="border-t-2 border-emerald-500/20 pt-4">
      <h4 class="m-0 mb-4 text-sm font-semibold text-zinc-200">Meta Tags Detectados:</h4>
      <div class="flex flex-col gap-3">
        <div v-if="ogTitle" class="rounded-lg border-l-4 border-emerald-500 bg-zinc-900/60 p-3 text-sm text-zinc-300">
          <strong class="mr-2 text-emerald-400">og:title:</strong> {{ ogTitle }}
        </div>
        <div v-if="ogDescription" class="rounded-lg border-l-4 border-emerald-500 bg-zinc-900/60 p-3 text-sm text-zinc-300">
          <strong class="mr-2 text-emerald-400">og:description:</strong> {{ ogDescription }}
        </div>
        <div v-if="ogImage" class="rounded-lg border-l-4 border-emerald-500 bg-zinc-900/60 p-3 text-sm text-zinc-300">
          <strong class="mr-2 text-emerald-400">og:image:</strong>
          <a :href="ogImage" target="_blank" class="break-all text-cyan-400 hover:underline">{{ ogImage }}</a>
        </div>
        <div v-if="ogUrl" class="rounded-lg border-l-4 border-emerald-500 bg-zinc-900/60 p-3 text-sm text-zinc-300">
          <strong class="mr-2 text-emerald-400">og:url:</strong> {{ ogUrl }}
        </div>
        <div v-if="twitterCard" class="rounded-lg border-l-4 border-emerald-500 bg-zinc-900/60 p-3 text-sm text-zinc-300">
          <strong class="mr-2 text-emerald-400">twitter:card:</strong> {{ twitterCard }}
        </div>
        <div
          v-if="!ogTitle && !ogDescription && !ogImage"
          class="rounded-lg border-l-4 border-amber-500 bg-amber-950/35 p-3 text-sm text-amber-100"
        >
          ⚠️ No se encontraron meta tags Open Graph. Añádelos para mejorar el compartido en redes sociales.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: {
    type: Object,
    default: () => ({}),
  },
  title: {
    type: String,
    default: '',
  },
  url: {
    type: String,
    default: '',
  },
})

const ogTitle = computed(() => props.meta['og:title'] || props.meta['twitter:title'])
const ogDescription = computed(() => props.meta['og:description'] || props.meta['twitter:description'] || props.meta['description'])
const ogImage = computed(() => {
  const image = props.meta['og:image'] || props.meta['twitter:image']
  if (image && !image.startsWith('http')) {
    try {
      const urlObj = new URL(props.url)
      return new URL(image, urlObj.origin).href
    } catch {
      return image
    }
  }
  return image
})
const ogUrl = computed(() => props.meta['og:url'])
const twitterCard = computed(() => props.meta['twitter:card'])

const getDomain = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}
</script>
