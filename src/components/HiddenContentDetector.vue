<template>
  <div class="hidden-content-detector">
    <div v-if="!hiddenContent || hiddenContent.count === 0" class="success-box bg-green-50 border-green-500">
      <strong>✓ Todo bien</strong>
      <p>No se detectó contenido oculto sospechoso.</p>
    </div>

    <div v-else>
      <div class="warning-box mb-4" :class="hiddenContent.count > 5 ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'">
        <strong>⚠️ Contenido Oculto Detectado</strong>
        <p>Se encontraron {{ hiddenContent.count }} elementos con contenido oculto que contienen texto.</p>
        <p v-if="hiddenContent.warning" class="mt-2 font-semibold">{{ hiddenContent.warning }}</p>
      </div>

      <div v-if="hiddenContent.elements && hiddenContent.elements.length > 0" class="elements-list">
        <details>
          <summary class="cursor-pointer text-sm font-semibold text-gray-700 mb-2">Ver elementos ocultos ({{ hiddenContent.elements.length }})</summary>
          <div class="elements-grid space-y-2 mt-2">
            <div v-for="(element, index) in hiddenContent.elements" :key="index" class="element-item">
              <div class="element-info">
                <span class="element-tag">{{ element.element }}</span>
                <span class="element-length">{{ element.textLength }} caracteres</span>
              </div>
              <div class="element-reason">
                <span class="text-xs text-gray-600">Razón: {{ element.reason }}</span>
              </div>
              <div class="element-preview">
                <code class="text-xs text-gray-500">{{ element.textPreview }}</code>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  hiddenContent: {
    type: Object,
    default: null
  }
})
</script>

<style scoped>
.hidden-content-detector {
  width: 100%;
}

.success-box,
.warning-box {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.warning-box strong {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.warning-box p {
  font-size: 13px;
  margin: 4px 0;
  line-height: 1.5;
}

.elements-list {
  margin-top: 12px;
}

.elements-grid {
  max-height: 300px;
  overflow-y: auto;
}

.element-item {
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.element-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.element-tag {
  font-size: 11px;
  font-weight: 600;
  color: #1f2937;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 3px;
}

.element-length {
  font-size: 11px;
  color: #6b7280;
}

.element-reason {
  margin-bottom: 6px;
}

.element-preview {
  padding: 6px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.element-preview code {
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
