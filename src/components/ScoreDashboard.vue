<template>
  <div class="score-dashboard">
    <div class="mb-5 flex items-start justify-between gap-4 border-b border-emerald-500/20 pb-3">
      <h2 class="m-0 shrink-0 text-lg font-semibold text-zinc-100">Puntuaciones SEO</h2>
      <div class="min-w-0 max-w-[58%] shrink-0 rounded-lg border px-3 py-2 text-right" :class="overallBoxClass">
        <div class="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0">
          <span class="text-[10px] font-bold uppercase tracking-wide" :class="overallLabelClass">Puntuación General</span>
          <span class="text-2xl font-bold leading-none" :class="overallValueClass">{{ overallScore }}</span>
        </div>
        <p class="mt-1 text-[11px] leading-snug" :class="overallTextClass">{{ overallExplanation }}</p>
      </div>
    </div>

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

          <details class="score-explanations mt-3">
            <summary class="score-details-toggle">Ver detalle del puntaje</summary>
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
          </details>
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
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  const filled = (pct / 100) * circumference
  return {
    strokeDasharray: `${filled} ${circumference}`,
    strokeDashoffset: 0,
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

const overallExplanation = computed(() => {
  if (overallScore.value >= 80) return 'Excelente trabajo. Tu sitio está muy bien optimizado.'
  if (overallScore.value >= 60) return 'Buen rendimiento general con oportunidades de mejora.'
  return 'Necesita mejoras significativas. Revisa las recomendaciones.'
})

const overallToneClass = computed(() => {
  if (overallScore.value >= 80) return 'ok'
  if (overallScore.value >= 60) return 'warn'
  return 'bad'
})

const overallBoxClass = computed(() => {
  if (overallToneClass.value === 'ok') return 'border-emerald-500/55 bg-emerald-950/80'
  if (overallToneClass.value === 'warn') return 'border-amber-500/55 bg-amber-950/70'
  return 'border-red-500/50 bg-red-950/70'
})

const overallLabelClass = computed(() => {
  if (overallToneClass.value === 'ok') return 'text-emerald-300'
  if (overallToneClass.value === 'warn') return 'text-amber-300'
  return 'text-red-300'
})

const overallValueClass = computed(() => {
  if (overallToneClass.value === 'ok') return 'text-emerald-50'
  if (overallToneClass.value === 'warn') return 'text-amber-50'
  return 'text-red-50'
})

const overallTextClass = computed(() => {
  if (overallToneClass.value === 'ok') return 'text-emerald-200/90'
  if (overallToneClass.value === 'warn') return 'text-amber-200/90'
  return 'text-red-200/90'
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

.score-details-toggle {
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  list-style: none;
  user-select: none;
}

.score-details-toggle::-webkit-details-marker {
  display: none;
}

.score-details-toggle:hover {
  color: #6ee7b7;
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
</style>