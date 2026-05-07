<template>
  <div class="headers-analysis">
    <div class="summary-section mb-4">
      <div class="stats-grid">
        <div class="stat-card" v-for="(count, tag) in headerCounts" :key="tag">
          <div class="stat-value">{{ count }}</div>
          <div class="stat-label">{{ tag.toUpperCase() }}</div>
        </div>
        <div class="stat-card total">
          <div class="stat-value">{{ totalHeaders }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </div>

    <!-- Issues críticos -->
    <div v-if="headersData.issues && headersData.issues.length > 0" class="critical-section mb-4">
      <div v-for="(issue, idx) in headersData.issues" :key="idx" class="alert-box critical">
        <div class="alert-icon">⚠</div>
        <div class="alert-content">
          <strong>{{ issue.message }}</strong>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="headersData.warnings && headersData.warnings.length > 0" class="warnings-section mb-4">
      <div v-for="(warning, idx) in headersData.warnings" :key="idx" 
           :class="['alert-box', warning.type === 'warning' ? 'warning' : 'info']">
        <div class="alert-icon">{{ warning.type === 'warning' ? '⚠' : 'ℹ' }}</div>
        <div class="alert-content">
          {{ warning.message }}
        </div>
      </div>
    </div>

    <!-- Lista de headers -->
    <div class="headers-list">
      <div class="list-header">
        <h4 class="list-title">Todos los headers en orden de aparición en HTML</h4>
      </div>
      
      <div v-if="headersData.headers && headersData.headers.length === 0" class="empty-state">
        <p>No se encontraron headers (H1-H6) en esta página.</p>
      </div>
      
      <div v-else class="headers-tree">
        <div 
          v-for="(header, index) in headersData.headers" 
          :key="index"
          :class="['header-item', `level-${header.level}`]"
        >
          <div class="header-tag">{{ header.tag.toUpperCase() }}</div>
          <div class="header-text">{{ header.text || '(vacío)' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  headersData: {
    type: Object,
    required: true
  }
})

const headerCounts = computed(() => {
  if (!props.headersData.count) return {}
  return {
    h1: props.headersData.count.h1 || 0,
    h2: props.headersData.count.h2 || 0,
    h3: props.headersData.count.h3 || 0,
    h4: props.headersData.count.h4 || 0,
    h5: props.headersData.count.h5 || 0,
    h6: props.headersData.count.h6 || 0
  }
})

const totalHeaders = computed(() => {
  return props.headersData.count?.total || 0
})
</script>

<style scoped>
.headers-analysis {
  width: 100%;
}

.summary-section {
  padding: 12px;
  background: rgba(39, 39, 42, 0.45);
  border-radius: 8px;
  border: 1px solid rgba(52, 211, 153, 0.14);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  text-align: center;
  padding: 12px;
  background: rgba(24, 24, 27, 0.9);
  border-radius: 6px;
  border: 2px solid rgba(63, 63, 70, 0.85);
}

.stat-card.total {
  border-color: rgba(52, 211, 153, 0.5);
  background: rgba(6, 78, 59, 0.35);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #f4f4f5;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.critical-section,
.warnings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.alert-box.critical {
  background: rgba(127, 29, 29, 0.35);
  border-color: #f87171;
}

.alert-box.warning {
  background: rgba(120, 53, 15, 0.35);
  border-color: #fbbf24;
}

.alert-box.info {
  background: rgba(30, 58, 138, 0.35);
  border-color: #60a5fa;
}

.alert-icon {
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: #e4e4e7;
}

.headers-list {
  margin-top: 16px;
}

.list-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(52, 211, 153, 0.15);
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: #e4e4e7;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #a1a1aa;
  background: rgba(24, 24, 27, 0.65);
  border-radius: 6px;
}

.headers-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(52, 211, 153, 0.12);
  border-radius: 6px;
  padding: 8px;
  background: rgba(9, 9, 11, 0.6);
}

.header-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: rgba(24, 24, 27, 0.85);
  border-radius: 4px;
  border-left: 3px solid rgba(63, 63, 70, 0.9);
  transition: all 0.2s;
}

.header-item:hover {
  background: rgba(39, 39, 42, 0.95);
  border-left-color: #34d399;
}

.header-item.level-1 {
  border-left-color: #ef4444;
  font-weight: 600;
}

.header-item.level-2 {
  border-left-color: #f59e0b;
  margin-left: 20px;
}

.header-item.level-3 {
  border-left-color: #10b981;
  margin-left: 40px;
}

.header-item.level-4 {
  border-left-color: #3b82f6;
  margin-left: 60px;
}

.header-item.level-5 {
  border-left-color: #8b5cf6;
  margin-left: 80px;
}

.header-item.level-6 {
  border-left-color: #6b7280;
  margin-left: 100px;
}

.header-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  background: rgba(63, 63, 70, 0.9);
  color: #e4e4e7;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  min-width: 32px;
  text-align: center;
}

.header-item.level-1 .header-tag {
  background: #fee2e2;
  color: #991b1b;
}

.header-item.level-2 .header-tag {
  background: #fef3c7;
  color: #92400e;
}

.header-item.level-3 .header-tag {
  background: #d1fae5;
  color: #065f46;
}

.header-text {
  flex: 1;
  font-size: 13px;
  color: #d4d4d8;
  line-height: 1.4;
  word-break: break-word;
}
</style>
