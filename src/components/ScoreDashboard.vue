<template>
  <div class="score-dashboard">
    <div class="scores-grid">
      <div class="score-item" v-for="score in scores" :key="score.name">
        <div class="donut-wrapper">
          <svg class="donut" viewBox="0 0 42 42">
            <circle
              class="donut-ring"
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="#3f3f46"
              stroke-width="3"
            />
            <circle
              class="donut-segment"
              :class="score.colorClass"
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              :stroke="score.color"
              stroke-width="3"
              :style="getDonutStyle(score.value)"
            />
          </svg>
          <div class="donut-text">
            <span class="donut-value">{{ score.value }}</span>
            <span class="donut-label">/100</span>
          </div>
        </div>
        <div class="score-info">
          <h3 class="score-name">{{ score.name }}</h3>
          <p class="score-description">{{ score.description }}</p>
          
          <!-- Explicaciones -->
          <div class="score-explanations mt-3">
            <div class="why-box" v-if="score.explanations.reasons.length > 0">
              <div class="why-title">Por qué este puntaje:</div>
              <ul class="why-list">
                <li v-for="(reason, idx) in score.explanations.reasons" :key="idx">{{ reason }}</li>
              </ul>
            </div>
            
            <div class="issues-box" v-if="score.explanations.issues.length > 0">
              <div class="issues-title">Qué falta arreglar:</div>
              <ul class="issues-list">
                <li v-for="(issue, idx) in score.explanations.issues" :key="idx">{{ issue }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="overall-score">
      <div class="overall-badge" :class="overallClass">
        <span class="overall-label">Puntuación General</span>
        <span class="overall-value">{{ overallScore }}</span>
        <div v-if="explanations" class="overall-explanation">
          <p v-if="overallScore >= 80" class="mt-2 text-sm text-zinc-300">Excelente trabajo. Tu sitio está muy bien optimizado.</p>
          <p v-else-if="overallScore >= 60" class="mt-2 text-sm text-zinc-300">Buen rendimiento general con oportunidades de mejora.</p>
          <p v-else class="mt-2 text-sm text-zinc-300">Necesita mejoras significativas. Revisa las recomendaciones arriba.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scores: {
    type: Object,
    required: true
  },
  explanations: {
    type: Object,
    default: null
  }
})

const circumference = 2 * Math.PI * 15.91549430918954 // ~100

const getDonutStyle = (value) => {
  const percentage = value / 100
  const dasharray = `${circumference * percentage} ${circumference}`
  return {
    strokeDasharray: dasharray,
    strokeDashoffset: circumference * 0.25 // Offset para empezar desde arriba
  }
}

const scores = computed(() => {
  const explanations = props.explanations || props.scores.explanations || {}
  
  return [
    {
      name: 'SEO On-Page',
      value: props.scores.seo || 0,
      description: 'Optimización técnica y contenido',
      color: props.scores.seo >= 80 ? '#10b981' : props.scores.seo >= 60 ? '#f59e0b' : '#ef4444',
      colorClass: props.scores.seo >= 80 ? 'text-green-500' : props.scores.seo >= 60 ? 'text-yellow-500' : 'text-red-500',
      explanations: explanations.seo || { reasons: [], issues: [] }
    },
    {
      name: 'Rendimiento',
      value: props.scores.performance || 0,
      description: 'Velocidad y optimización',
      color: props.scores.performance >= 80 ? '#10b981' : props.scores.performance >= 60 ? '#f59e0b' : '#ef4444',
      colorClass: props.scores.performance >= 80 ? 'text-green-500' : props.scores.performance >= 60 ? 'text-yellow-500' : 'text-red-500',
      explanations: explanations.performance || { reasons: [], issues: [] }
    },
    {
      name: 'Contenido',
      value: props.scores.content || 0,
      description: 'Calidad y accesibilidad',
      color: props.scores.content >= 80 ? '#10b981' : props.scores.content >= 60 ? '#f59e0b' : '#ef4444',
      colorClass: props.scores.content >= 80 ? 'text-green-500' : props.scores.content >= 60 ? 'text-yellow-500' : 'text-red-500',
      explanations: explanations.content || { reasons: [], issues: [] }
    }
  ]
})

const overallScore = computed(() => props.scores.overall || 0)

const overallClass = computed(() => {
  if (overallScore.value >= 80) return 'bg-green-100 text-green-900 border-green-500'
  if (overallScore.value >= 60) return 'bg-yellow-100 text-yellow-900 border-yellow-500'
  return 'bg-red-100 text-red-900 border-red-500'
})
</script>

<style scoped>
.score-dashboard {
  width: 100%;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.donut-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 10px;
}

.donut {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-ring {
  transition: stroke 0.3s;
}

.donut-segment {
  transition: stroke-dasharray 0.6s ease-in-out, stroke 0.3s;
}

.donut-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  display: block;
  color: #f4f4f5;
}

.donut-label {
  font-size: 12px;
  color: #a1a1aa;
  display: block;
}

.score-info {
  margin-top: 8px;
  width: 100%;
}

.score-name {
  font-size: 14px;
  font-weight: 600;
  color: #e4e4e7;
  margin: 0 0 4px 0;
}

.score-description {
  font-size: 12px;
  color: #a1a1aa;
  margin: 0 0 12px 0;
}

.score-explanations {
  text-align: left;
  font-size: 11px;
}

.why-box,
.issues-box {
  margin-bottom: 10px;
  padding: 10px;
  background: rgba(24, 24, 27, 0.75);
  border-radius: 6px;
  border-left: 3px solid #38bdf8;
}

.issues-box {
  border-left-color: #f87171;
}

.why-title,
.issues-title {
  font-weight: 600;
  color: #d4d4d8;
  margin-bottom: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.why-list,
.issues-list {
  margin: 0;
  padding-left: 16px;
  color: #a1a1aa;
  line-height: 1.6;
}

.why-list li,
.issues-list li {
  margin-bottom: 4px;
}

.overall-score {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 2px solid rgba(52, 211, 153, 0.15);
}

.overall-badge {
  padding: 16px 32px;
  border-radius: 12px;
  border: 3px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}

.overall-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.overall-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.overall-explanation {
  margin-top: 8px;
  text-align: center;
  max-width: 300px;
}
</style>
