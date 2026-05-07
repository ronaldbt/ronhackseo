<template>
  <div class="hidden-content-detector">
    <div v-if="!hiddenContent || hiddenContent.count === 0" class="success-box border-emerald-500 bg-emerald-950/35 text-emerald-100">
      <strong>✓ Todo bien</strong>
      <p>No se detectó contenido oculto sospechoso.</p>
    </div>

    <div v-else>
      <div
        class="warning-box mb-4"
        :class="hiddenContent.count > 5 ? 'border-red-500 bg-red-950/40 text-red-100' : 'border-amber-500 bg-amber-950/40 text-amber-100'"
      >
        <strong>⚠️ Contenido Oculto Detectado</strong>
        <p>Se encontraron {{ hiddenContent.count }} elementos con contenido oculto que contienen texto.</p>
        <p v-if="hiddenContent.warning" class="mt-2 font-semibold">{{ hiddenContent.warning }}</p>
      </div>

      <div v-if="hiddenContent.elements && hiddenContent.elements.length > 0" class="elements-list">
        <details>
          <summary class="mb-2 cursor-pointer text-sm font-semibold text-zinc-300 hover:text-emerald-400">
            Ver elementos ocultos ({{ hiddenContent.elements.length }})
          </summary>
          <div class="elements-grid space-y-2 mt-2">
            <div v-for="(element, index) in hiddenContent.elements" :key="index" class="element-item">
              <div class="element-info">
                <span class="element-tag">{{ element.element }}</span>
                <span class="element-length">{{ element.textLength }} caracteres</span>
              </div>
              <div class="element-reason">
                <span class="text-xs text-zinc-400">Razón: {{ element.reason }}</span>
              </div>
              <div class="element-preview">
                <code class="text-xs text-emerald-200/80">{{ element.textPreview }}</code>
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
  background: rgba(24, 24, 27, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.9);
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
  color: #a7f3d0;
  background: rgba(6, 78, 59, 0.45);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.element-length {
  font-size: 11px;
  color: #a1a1aa;
}

.element-reason {
  margin-bottom: 6px;
}

.element-preview {
  padding: 6px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 4px;
  border: 1px solid rgba(63, 63, 70, 0.9);
}

.element-preview code {
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
