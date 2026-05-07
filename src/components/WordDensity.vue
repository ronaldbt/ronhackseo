<template>
  <div class="w-full">
    <div class="mb-5 flex items-center gap-3 border-b-2 border-emerald-500/20 pb-4">
      <input
        v-model="wordLimit"
        type="number"
        min="5"
        max="50"
        class="w-16 rounded-lg border-2 border-emerald-500/35 bg-zinc-900/80 px-3 py-1.5 text-sm text-zinc-200 transition-colors focus:border-emerald-500 focus:outline-none"
        @change="updateAnalysis"
      />
      <label class="text-sm text-zinc-400">Top palabras más frecuentes</label>
    </div>
    <div v-if="topWords.length > 0" class="mb-5 flex flex-col gap-3">
      <div
        v-for="(word, index) in topWords"
        :key="word.text"
        class="grid items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-3 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80"
        style="grid-template-columns: auto 1fr auto auto;"
      >
        <span class="min-w-[30px] text-sm font-semibold text-emerald-400">#{{ index + 1 }}</span>
        <span class="text-sm font-medium text-zinc-200">{{ word.text }}</span>
        <span class="text-sm font-medium text-zinc-400">{{ word.count }} veces</span>
        <div class="col-span-4 mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-300"
            :style="{ width: (word.count / topWords[0].count) * 100 + '%' }"
          ></div>
        </div>
        <span class="col-start-4 text-xs font-medium text-zinc-500">{{ ((word.count / totalWords) * 100).toFixed(2) }}%</span>
      </div>
    </div>
    <div class="flex justify-around border-t-2 border-emerald-500/20 pt-4">
      <div class="text-sm text-zinc-400">
        <strong class="mr-1 text-zinc-200">Total de palabras:</strong> {{ totalWords }}
      </div>
      <div class="text-sm text-zinc-400">
        <strong class="mr-1 text-zinc-200">Palabras únicas:</strong> {{ uniqueWords }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
})

const wordLimit = ref(10)
const wordCounts = ref({})

const totalWords = computed(() => {
  return Object.values(wordCounts.value).reduce((sum, count) => sum + count, 0)
})

const uniqueWords = computed(() => {
  return Object.keys(wordCounts.value).length
})

const topWords = computed(() => {
  return Object.entries(wordCounts.value)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, wordLimit.value)
})

const analyzeText = () => {
  const cleaned = props.text
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const stopWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
    'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
    'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
    'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
    'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
    'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
    'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
    'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
    'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
    'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo',
    'mientras', 'lado', 'quien', 'aunque', 'mundo', 'servir', 'mejor', 'empezar',
    'trabajar', 'pueblo', 'casa', 'mujer', 'todo', 'junto', 'demás', 'después',
    'viejo', 'casa', 'llamar', 'durante', 'nunca', 'primer', 'hacer', 'madre',
    'tres', 'mismo', 'segundo', 'volver', 'mismo', 'junto', 'mismo', 'mismo',
  ])

  const words = cleaned.split(' ').filter((word) => {
    return word.length > 3 && !stopWords.has(word) && !/^\d+$/.test(word)
  })

  const counts = {}
  words.forEach((word) => {
    counts[word] = (counts[word] || 0) + 1
  })

  wordCounts.value = counts
}

const updateAnalysis = () => {
  analyzeText()
}

onMounted(() => {
  analyzeText()
})
</script>
