<template>
  <div class="tech-stack">
    <div v-if="categories.length" class="tech-grid">
      <div v-for="cat in categories" :key="cat.name" class="tech-col">
        <div class="tech-cat">{{ cat.name }}</div>
        <div class="tech-items">
          <span v-for="name in cat.items" :key="name" class="tech-pill">{{ name }}</span>
        </div>
      </div>
    </div>
    <p v-else class="tech-empty">
      No se detectaron tecnologías. Recarga la pestaña (F5) y vuelve a analizar.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  techStack: { type: Object, default: null },
})

const categories = computed(() => {
  const by = props.techStack?.byCategory || {}
  return Object.entries(by)
    .map(([name, items]) => ({ name, items }))
    .filter((c) => c.items?.length)
    .sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<style scoped>
.tech-stack {
  margin-top: 2px;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}

.tech-col {
  min-width: 0;
}

.tech-cat {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717a;
  margin-bottom: 4px;
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tech-pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #c4b5fd;
  background: rgba(91, 33, 182, 0.18);
  border: 1px solid rgba(167, 139, 250, 0.25);
  line-height: 1.3;
}

.tech-empty {
  margin: 0;
  font-size: 11px;
  color: #71717a;
}
</style>
