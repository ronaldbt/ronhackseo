<template>
  <div class="advanced-seo-analysis">
    <!-- Profundidad DOM -->
    <div v-if="domDepth" class="analysis-card mb-4">
      <div class="analysis-header">
        <h3 class="analysis-title">Profundidad del DOM</h3>
      </div>
      <div class="analysis-content">
        <div class="metrics-row">
          <div class="metric">
            <span class="metric-label">Profundidad máxima:</span>
            <span class="metric-value">{{ domDepth.maxDepth }} niveles</span>
          </div>
          <div class="metric">
            <span class="metric-label">Profundidad promedio:</span>
            <span class="metric-value">{{ domDepth.averageDepth }} niveles</span>
          </div>
        </div>
        <div v-if="domDepth.warning" class="warning-box mt-3 border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="m-0 text-sm">{{ domDepth.warning }}</p>
        </div>
        <div class="score-badge mt-3" :class="getDOMScoreClass(domDepth.score)">
          Puntuación: {{ domDepth.score }}/100
        </div>
      </div>
    </div>

    <!-- Canibalización de Keywords -->
    <div v-if="keywordCannibalization" class="analysis-card">
      <div class="analysis-header">
        <h3 class="analysis-title">Canibalización de Keywords</h3>
      </div>
      <div class="analysis-content">
        <div v-if="keywordCannibalization.count === 0" class="success-box border-emerald-500 bg-emerald-950/35 text-emerald-50">
          <strong>✓ Sin problemas</strong>
          <p>No se detectó canibalización de keywords en el menú de navegación.</p>
        </div>
        <div v-else>
          <div class="warning-box mb-3 border-amber-500 bg-amber-950/35 text-amber-50">
            <p class="m-0 text-sm">{{ keywordCannibalization.warning }}</p>
          </div>
          <div v-if="keywordCannibalization.duplicates && keywordCannibalization.duplicates.length > 0" class="duplicates-list">
            <details>
              <summary class="mb-2 cursor-pointer text-sm font-semibold text-zinc-300 hover:text-emerald-400">
                Ver keywords duplicadas ({{ keywordCannibalization.duplicates.length }})
              </summary>
              <div class="duplicates-grid space-y-2 mt-2">
                <div v-for="(dup, index) in keywordCannibalization.duplicates" :key="index" class="duplicate-item">
                  <div class="duplicate-text">
                    <strong>"{{ dup.text }}"</strong>
                  </div>
                  <div class="duplicate-count">
                    Aparece {{ dup.count }} veces
                  </div>
                  <div class="duplicate-message">
                    <p class="m-0 text-xs text-zinc-400">{{ dup.message }}</p>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  domDepth: {
    type: Object,
    default: null
  },
  keywordCannibalization: {
    type: Object,
    default: null
  }
})

const getDOMScoreClass = (score) => {
  if (score >= 80) return 'border-emerald-500 bg-emerald-950/50 text-emerald-200'
  if (score >= 60) return 'border-amber-500 bg-amber-950/45 text-amber-100'
  return 'border-red-500 bg-red-950/45 text-red-100'
}
</script>

<style scoped>
.advanced-seo-analysis {
  width: 100%;
}

.analysis-card {
  padding: 16px;
  background: rgba(24, 24, 27, 0.65);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(63, 63, 70, 0.9);
}

.analysis-icon {
  font-size: 20px;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #e4e4e7;
  margin: 0;
  letter-spacing: 0.02em;
}

.analysis-content {
  padding-top: 8px;
}

.metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #a1a1aa;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #f4f4f5;
}

.warning-box,
.success-box {
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid;
}

.warning-box p,
.success-box p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.success-box strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}

.score-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  border: 2px solid;
  font-weight: 600;
  font-size: 13px;
}

.duplicates-list {
  margin-top: 12px;
}

.duplicates-grid {
  max-height: 250px;
  overflow-y: auto;
}

.duplicate-item {
  padding: 10px;
  background: rgba(9, 9, 11, 0.55);
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.85);
}

.duplicate-text {
  margin-bottom: 6px;
}

.duplicate-text strong {
  color: #e4e4e7;
  font-size: 13px;
}

.duplicate-count {
  font-size: 11px;
  color: #a1a1aa;
  margin-bottom: 6px;
}

.duplicate-message {
  padding-top: 6px;
  border-top: 1px solid rgba(63, 63, 70, 0.85);
}
</style>
