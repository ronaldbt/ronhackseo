<template>
  <div class="colorblind-simulator">
    <div class="info-box bg-blue-50 border-blue-500 mb-4">
      <p class="text-sm m-0">
        <strong>💡 Sabías que:</strong> El 8% de los hombres tienen problemas de visión. Prueba cómo ve tu sitio alguien con daltonismo.
      </p>
    </div>

    <div class="filters-grid">
      <button
        v-for="filter in filters"
        :key="filter.name"
        @click="applyFilter(filter)"
        class="filter-button"
        :class="{ active: activeFilter === filter.name }"
      >
        <span class="filter-name">{{ filter.label }}</span>
        <span v-if="activeFilter === filter.name" class="filter-badge">Activo</span>
      </button>
    </div>

    <div v-if="activeFilter" class="actions mt-4">
      <button @click="removeFilter" class="remove-button">
        ✕ Remover filtro
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeFilter = ref(null)

const filters = [
  {
    name: 'protanopia',
    label: 'Protanopia (Rojo-Verde)',
    css: 'url(#protanopia)'
  },
  {
    name: 'deuteranopia',
    label: 'Deuteranopia (Rojo-Verde)',
    css: 'url(#deuteranopia)'
  },
  {
    name: 'tritanopia',
    label: 'Tritanopia (Azul-Amarillo)',
    css: 'url(#tritanopia)'
  },
  {
    name: 'grayscale',
    label: 'Escala de Grises',
    css: 'grayscale(100%)'
  },
  {
    name: 'blur',
    label: 'Visión Borrosa',
    css: 'blur(2px)'
  },
  {
    name: 'contrast',
    label: 'Alto Contraste',
    css: 'contrast(150%)'
  }
]

const applyFilter = async (filter) => {
  activeFilter.value = filter.name

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (!tab || !tab.id) return

    // Inyectar CSS para aplicar el filtro
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (filterCSS, filterName) => {
        // Remover filtro anterior si existe
        const existingStyle = document.getElementById('seo-extension-filter')
        if (existingStyle) {
          existingStyle.remove()
        }

        // Crear nuevo estilo
        const style = document.createElement('style')
        style.id = 'seo-extension-filter'
        
        if (filterName === 'protanopia' || filterName === 'deuteranopia' || filterName === 'tritanopia') {
          // Para filtros de color complejos, usar SVG
          style.textContent = `
            html {
              filter: ${filterCSS};
            }
            @supports (filter: url('#svg-filter')) {
              html {
                filter: url('#svg-filter-${filterName}');
              }
            }
          `
          
          // Agregar SVG filters al documento si no existen
          let svgFilters = document.getElementById('seo-extension-svg-filters')
          if (!svgFilters) {
            svgFilters = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svgFilters.id = 'seo-extension-svg-filters'
            svgFilters.style.position = 'absolute'
            svgFilters.style.width = '0'
            svgFilters.style.height = '0'
            document.body.appendChild(svgFilters)
          }

          // Agregar el filtro específico
          let filterElement = document.getElementById(`svg-filter-${filterName}`)
          if (!filterElement) {
            filterElement = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
            filterElement.id = `svg-filter-${filterName}`
            
            // Matrices de color para daltonismo (simplificadas)
            let colorMatrix = ''
            if (filterName === 'protanopia') {
              colorMatrix = '0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0'
            } else if (filterName === 'deuteranopia') {
              colorMatrix = '0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0'
            } else if (filterName === 'tritanopia') {
              colorMatrix = '0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0'
            }

            const colorMatrixElement = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
            colorMatrixElement.setAttribute('type', 'matrix')
            colorMatrixElement.setAttribute('values', colorMatrix)
            filterElement.appendChild(colorMatrixElement)
            svgFilters.appendChild(filterElement)
          }
        } else {
          // Para filtros CSS simples
          style.textContent = `
            html {
              filter: ${filterCSS} !important;
            }
          `
        }

        document.head.appendChild(style)
      },
      args: [filter.css, filter.name]
    })
  } catch (error) {
    console.error('Error al aplicar filtro:', error)
  }
}

const removeFilter = async () => {
  activeFilter.value = null

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (!tab || !tab.id) return

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const style = document.getElementById('seo-extension-filter')
        if (style) {
          style.remove()
        }
        const svgFilters = document.getElementById('seo-extension-svg-filters')
        if (svgFilters) {
          svgFilters.remove()
        }
      }
    })
  } catch (error) {
    console.error('Error al remover filtro:', error)
  }
}
</script>

<style scoped>
.colorblind-simulator {
  width: 100%;
}

.info-box {
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.filter-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.filter-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.filter-button.active {
  background: #dbeafe;
  border-color: #3b82f6;
}


.filter-name {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  text-align: center;
}

.filter-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #3b82f6;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.actions {
  text-align: center;
}

.remove-button {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
}

.remove-button:hover {
  background: #dc2626;
}
</style>
