<template>
  <div class="w-full">
    <div class="flex flex-col gap-5 mb-5">
      <!-- Facebook/LinkedIn Style -->
      <div class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md" style="max-width: 500px;">
        <div class="w-full overflow-hidden bg-gray-100" style="height: 250px;" v-if="ogImage">
          <img :src="ogImage" :alt="ogTitle" @error="handleImageError" class="w-full h-full object-cover" />
        </div>
        <div class="p-4">
          <div class="text-xs text-gray-600 uppercase tracking-wider mb-1">{{ getDomain(url) }}</div>
          <h3 class="text-lg font-semibold text-gray-900 my-2 leading-snug">{{ ogTitle || title || 'Sin título' }}</h3>
          <p class="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">{{ ogDescription || 'Sin descripción disponible' }}</p>
        </div>
      </div>

      <!-- Twitter/X Style -->
      <div class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md" style="max-width: 500px;">
        <div class="p-3">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-xl">🐦</div>
            <div class="flex-1">
              <div class="font-semibold text-gray-800 text-sm">{{ getDomain(url) }}</div>
              <div class="text-sm text-gray-600">@website</div>
            </div>
          </div>
          <p class="text-gray-800 leading-relaxed my-3" style="font-size: 15px;">{{ ogDescription || ogTitle || title || 'Sin contenido' }}</p>
          <div class="mt-3 rounded-xl overflow-hidden border border-gray-200" v-if="ogImage">
            <img :src="ogImage" :alt="ogTitle" @error="handleImageError" class="w-full block" />
          </div>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t-2 border-gray-100">
      <h4 class="m-0 mb-4 text-sm text-gray-800 font-semibold">Meta Tags Detectados:</h4>
      <div class="flex flex-col gap-3">
        <div v-if="ogTitle" class="text-sm p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-600">
          <strong class="text-indigo-600 mr-2">og:title:</strong> {{ ogTitle }}
        </div>
        <div v-if="ogDescription" class="text-sm p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-600">
          <strong class="text-indigo-600 mr-2">og:description:</strong> {{ ogDescription }}
        </div>
        <div v-if="ogImage" class="text-sm p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-600">
          <strong class="text-indigo-600 mr-2">og:image:</strong> <a :href="ogImage" target="_blank" class="text-indigo-600 break-all hover:underline">{{ ogImage }}</a>
        </div>
        <div v-if="ogUrl" class="text-sm p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-600">
          <strong class="text-indigo-600 mr-2">og:url:</strong> {{ ogUrl }}
        </div>
        <div v-if="twitterCard" class="text-sm p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-600">
          <strong class="text-indigo-600 mr-2">twitter:card:</strong> {{ twitterCard }}
        </div>
        <div v-if="!ogTitle && !ogDescription && !ogImage" class="text-sm p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 text-yellow-900">
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
    default: () => ({})
  },
  title: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  }
})

const ogTitle = computed(() => props.meta['og:title'] || props.meta['twitter:title'])
const ogDescription = computed(() => props.meta['og:description'] || props.meta['twitter:description'] || props.meta['description'])
const ogImage = computed(() => {
  const image = props.meta['og:image'] || props.meta['twitter:image']
  if (image && !image.startsWith('http')) {
    // Convertir URLs relativas a absolutas
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

