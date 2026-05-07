<template>
  <div class="schema-detector">
    <div v-if="schemas.length === 0" class="no-schema">
      <div class="warning-box bg-amber-950/40 border-amber-500 text-amber-100">
        <strong>⚠️ No se detectó Schema Markup</strong>
        <p>Agregar Schema JSON-LD puede mejorar significativamente cómo tu página aparece en los resultados de búsqueda de Google.</p>
      </div>
    </div>

    <div v-else class="schemas-list">
      <div v-for="(schema, index) in schemas" :key="index" class="schema-card" :class="{ 'invalid': !schema.isValid }">
        <div class="schema-header">
          <span class="schema-type-badge" :class="getTypeClass(schema.type)">
            {{ schema.type }}
          </span>
          <span v-if="schema.isValid" class="valid-badge bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-500/40">
            ✓ Válido
          </span>
          <span v-else class="invalid-badge bg-red-950/60 text-red-200 ring-1 ring-red-500/40">
            ✗ Inválido
          </span>
        </div>

        <div v-if="schema.errors && schema.errors.length > 0" class="schema-errors">
          <strong>Errores encontrados:</strong>
          <ul>
            <li v-for="(error, i) in schema.errors" :key="i">{{ error }}</li>
          </ul>
        </div>

        <div class="schema-details">
          <details>
            <summary class="cursor-pointer text-sm text-zinc-400 hover:text-emerald-400">Ver detalles del Schema</summary>
            <pre class="mt-2 max-h-40 overflow-auto rounded border border-zinc-700 bg-black/40 p-3 text-xs text-emerald-100/90">{{ JSON.stringify(schema.data, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <div v-if="recommendations && recommendations.length > 0" class="recommendations mt-4">
      <h4 class="mb-2 text-sm font-semibold text-zinc-200">💡 Recomendaciones:</h4>
      <div v-for="(rec, index) in recommendations" :key="index" class="recommendation-box" :class="getRecommendationClass(rec.priority)">
        <p class="m-0">{{ rec.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  schemas: {
    type: Array,
    default: () => []
  },
  recommendations: {
    type: Array,
    default: () => []
  }
})

const getTypeClass = (type) => {
  const typeColors = {
    Product: 'bg-blue-950/55 text-blue-200 ring-1 ring-blue-500/35',
    Article: 'bg-purple-950/55 text-purple-200 ring-1 ring-purple-500/35',
    LocalBusiness: 'bg-emerald-950/55 text-emerald-200 ring-1 ring-emerald-500/35',
    Organization: 'bg-indigo-950/55 text-indigo-200 ring-1 ring-indigo-500/35',
    Review: 'bg-amber-950/55 text-amber-200 ring-1 ring-amber-500/35',
    BreadcrumbList: 'bg-pink-950/55 text-pink-200 ring-1 ring-pink-500/35',
    Invalid: 'bg-red-950/55 text-red-200 ring-1 ring-red-500/35',
  }
  return typeColors[type] || 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-600'
}

const getRecommendationClass = (priority) => {
  if (priority === 'high') return 'bg-red-950/45 border-red-500 text-red-100'
  if (priority === 'medium') return 'bg-amber-950/45 border-amber-500 text-amber-100'
  return 'bg-sky-950/45 border-sky-500 text-sky-100'
}
</script>

<style scoped>
.schema-detector {
  width: 100%;
}

.no-schema {
  padding: 20px;
}

.warning-box {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.schemas-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schema-card {
  padding: 16px;
  background: rgba(24, 24, 27, 0.75);
  border-radius: 8px;
  border: 1px solid rgba(63, 63, 70, 0.8);
  border-left: 4px solid #10b981;
  transition: all 0.2s;
}

.schema-card.invalid {
  border-left-color: #ef4444;
  background: rgba(69, 10, 10, 0.25);
}

.schema-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.schema-type-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.valid-badge,
.invalid-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.schema-errors {
  margin-top: 8px;
  padding: 12px;
  background: rgba(127, 29, 29, 0.35);
  border-radius: 6px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  font-size: 13px;
}

.schema-errors strong {
  color: #fecaca;
  display: block;
  margin-bottom: 8px;
}

.schema-errors ul {
  margin: 0;
  padding-left: 20px;
}

.schema-errors li {
  color: #fca5a5;
  margin-bottom: 4px;
}

.schema-details {
  margin-top: 12px;
}

.recommendations {
  margin-top: 16px;
}

.recommendation-box {
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
  margin-bottom: 8px;
  font-size: 13px;
}
</style>
