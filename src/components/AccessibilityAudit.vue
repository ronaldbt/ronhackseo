<template>
  <div class="accessibility-audit">
    <div v-if="!accessibility || accessibility.issues.length === 0" class="success-box bg-green-50 border-green-500">
      <strong>✓ Excelente</strong>
      <p>No se encontraron problemas de accesibilidad SEO.</p>
    </div>

    <div v-else>
      <div class="score-display mb-4">
        <div class="score-badge" :class="getScoreClass(accessibility.score)">
          Puntuación de Accesibilidad: {{ accessibility.score }}/100
        </div>
      </div>

      <div class="issues-list space-y-3">
        <div v-for="(issue, index) in accessibility.issues" :key="index" class="issue-card">
          <div class="issue-header">
            <span class="issue-icon">
              <span v-if="issue.type === 'font-size'">🔤</span>
              <span v-else-if="issue.type === 'contrast'">🎨</span>
              <span v-else-if="issue.type === 'touch-target'">👆</span>
            </span>
            <span class="issue-type">{{ getIssueTypeLabel(issue.type) }}</span>
            <span class="issue-count">{{ issue.count }} elementos</span>
          </div>
          <p class="issue-message">{{ issue.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  accessibility: {
    type: Object,
    default: null
  }
})

const getIssueTypeLabel = (type) => {
  const labels = {
    'font-size': 'Tamaño de Fuente',
    'contrast': 'Contraste de Color',
    'touch-target': 'Touch Targets'
  }
  return labels[type] || type
}

const getScoreClass = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-900 border-green-500'
  if (score >= 60) return 'bg-yellow-100 text-yellow-900 border-yellow-500'
  return 'bg-red-100 text-red-900 border-red-500'
}
</script>

<style scoped>
.accessibility-audit {
  width: 100%;
}

.success-box {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.score-display {
  margin-bottom: 16px;
}

.score-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 6px;
  border: 2px solid;
  font-weight: 600;
  font-size: 14px;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-card {
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.issue-icon {
  font-size: 18px;
}

.issue-type {
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
  flex: 1;
}

.issue-count {
  font-size: 12px;
  color: #6b7280;
  background: white;
  padding: 2px 8px;
  border-radius: 4px;
}

.issue-message {
  font-size: 12px;
  color: #7f1d1d;
  margin: 0;
  line-height: 1.5;
}
</style>
