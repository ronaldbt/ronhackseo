<template>
  <div class="schema-detector">
    <div v-if="schemas.length === 0" class="no-schema">
      <div class="warning-box bg-yellow-50 border-yellow-500">
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
          <span v-if="schema.isValid" class="valid-badge bg-green-100 text-green-800">
            ✓ Válido
          </span>
          <span v-else class="invalid-badge bg-red-100 text-red-800">
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
            <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">Ver detalles del Schema</summary>
            <pre class="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">{{ JSON.stringify(schema.data, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>

    <div v-if="recommendations && recommendations.length > 0" class="recommendations mt-4">
      <h4 class="text-sm font-semibold text-gray-800 mb-2">💡 Recomendaciones:</h4>
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
    'Product': 'bg-blue-100 text-blue-800',
    'Article': 'bg-purple-100 text-purple-800',
    'LocalBusiness': 'bg-green-100 text-green-800',
    'Organization': 'bg-indigo-100 text-indigo-800',
    'Review': 'bg-yellow-100 text-yellow-800',
    'BreadcrumbList': 'bg-pink-100 text-pink-800',
    'Invalid': 'bg-red-100 text-red-800'
  }
  return typeColors[type] || 'bg-gray-100 text-gray-800'
}

const getRecommendationClass = (priority) => {
  if (priority === 'high') return 'bg-red-50 border-red-500 text-red-900'
  if (priority === 'medium') return 'bg-yellow-50 border-yellow-500 text-yellow-900'
  return 'bg-blue-50 border-blue-500 text-blue-900'
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
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #10b981;
  transition: all 0.2s;
}

.schema-card.invalid {
  border-left-color: #ef4444;
  background: #fef2f2;
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
  background: #fee2e2;
  border-radius: 6px;
  font-size: 13px;
}

.schema-errors strong {
  color: #991b1b;
  display: block;
  margin-bottom: 8px;
}

.schema-errors ul {
  margin: 0;
  padding-left: 20px;
}

.schema-errors li {
  color: #7f1d1d;
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
