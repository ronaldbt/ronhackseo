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
        <div v-if="domDepth.warning" class="warning-box bg-yellow-50 border-yellow-500 mt-3">
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
        <div v-if="keywordCannibalization.count === 0" class="success-box bg-green-50 border-green-500">
          <strong>✓ Sin problemas</strong>
          <p>No se detectó canibalización de keywords en el menú de navegación.</p>
        </div>
        <div v-else>
          <div class="warning-box bg-yellow-50 border-yellow-500 mb-3">
            <p class="m-0 text-sm">{{ keywordCannibalization.warning }}</p>
          </div>
          <div v-if="keywordCannibalization.duplicates && keywordCannibalization.duplicates.length > 0" class="duplicates-list">
            <details>
              <summary class="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
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
                    <p class="text-xs text-gray-600 m-0">{{ dup.message }}</p>
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
  if (score >= 80) return 'bg-green-100 text-green-900 border-green-500'
  if (score >= 60) return 'bg-yellow-100 text-yellow-900 border-yellow-500'
  return 'bg-red-100 text-red-900 border-red-500'
}
</script>

<style scoped>
.advanced-seo-analysis {
  width: 100%;
}

.analysis-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

.analysis-icon {
  font-size: 20px;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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
  color: #6b7280;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
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
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.duplicate-text {
  margin-bottom: 6px;
}

.duplicate-text strong {
  color: #1f2937;
  font-size: 13px;
}

.duplicate-count {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 6px;
}

.duplicate-message {
  padding-top: 6px;
  border-top: 1px solid #e5e7eb;
}
</style>
