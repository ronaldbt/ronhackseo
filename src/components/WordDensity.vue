<template>
  <div class="w-full">
    <div class="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
      <input 
        v-model="wordLimit" 
        type="number" 
        min="5" 
        max="50" 
        class="w-16 px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        @change="updateAnalysis"
      />
      <label class="text-sm text-gray-600">Top palabras más frecuentes</label>
    </div>
    <div v-if="topWords.length > 0" class="flex flex-col gap-3 mb-5">
      <div 
        v-for="(word, index) in topWords" 
        :key="word.text" 
        class="grid items-center gap-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100"
        style="grid-template-columns: auto 1fr auto auto;"
      >
        <span class="font-semibold text-indigo-600 text-sm" style="min-width: 30px;">#{{ index + 1 }}</span>
        <span class="font-medium text-gray-800 text-sm">{{ word.text }}</span>
        <span class="text-sm text-gray-600 font-medium">{{ word.count }} veces</span>
        <div class="col-span-4 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div 
            class="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
            :style="{ width: (word.count / topWords[0].count) * 100 + '%' }"
          ></div>
        </div>
        <span class="col-start-4 text-xs text-gray-500 font-medium">{{ ((word.count / totalWords) * 100).toFixed(2) }}%</span>
      </div>
    </div>
    <div class="flex justify-around pt-4 border-t-2 border-gray-100">
      <div class="text-sm text-gray-600">
        <strong class="text-gray-800 mr-1">Total de palabras:</strong> {{ totalWords }}
      </div>
      <div class="text-sm text-gray-600">
        <strong class="text-gray-800 mr-1">Palabras únicas:</strong> {{ uniqueWords }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  }
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
  // Limpiar y normalizar texto
  const cleaned = props.text
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, ' ') // Remover puntuación excepto letras con acentos
    .replace(/\s+/g, ' ')
    .trim()

  // Palabras comunes en español a excluir
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
    'tres', 'mismo', 'segundo', 'volver', 'mismo', 'junto', 'mismo', 'mismo'
  ])

  // Contar palabras
  const words = cleaned.split(' ').filter(word => {
    return word.length > 3 && !stopWords.has(word) && !/^\d+$/.test(word)
  })

  const counts = {}
  words.forEach(word => {
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

