/**
 * Resaltado visual de H1–H6 en la página (auditoría en sitio).
 * Debe ejecutarse tras leer el DOM para análisis, para no falsear métricas.
 */
const ATTR = 'data-rh-header-audit'
const LABEL_CLASS = 'rh-header-audit-label'

const COLORS = {
  H1: '#FFB6C1',
  H2: '#B6E0FF',
  H3: '#C8F7C5',
  H4: '#FFE4B5',
  H5: '#E6D9FF',
  H6: '#FFD4E5',
}

export function removeHeaderVisualAudit() {
  const roots = document.querySelectorAll(`[${ATTR}="1"]`)
  roots.forEach((el) => {
    el.querySelectorAll(`.${LABEL_CLASS}`).forEach((n) => n.remove())
    el.removeAttribute(ATTR)
    el.style.removeProperty('background-color')
    el.style.removeProperty('border')
    el.style.removeProperty('padding')
    el.style.removeProperty('box-sizing')
    el.style.removeProperty('color')
    el.style.removeProperty('position')
    el.style.removeProperty('z-index')
  })
}

/**
 * Aplica cajas de color, borde y prefijo "Hn - " como en la referencia visual.
 */
export function applyHeaderVisualAudit() {
  removeHeaderVisualAudit()

  for (let i = 1; i <= 6; i++) {
    const sel = `h${i}`
    document.querySelectorAll(sel).forEach((el) => {
      const tagName = el.tagName
      const bg = COLORS[tagName] || '#EEEEEE'

      el.setAttribute(ATTR, '1')
      el.style.setProperty('background-color', bg)
      el.style.setProperty('border', '2px solid #000')
      el.style.setProperty('padding', '6px 10px')
      el.style.setProperty('box-sizing', 'border-box')
      el.style.setProperty('color', '#000')
      el.style.setProperty('position', 'relative')
      el.style.setProperty('z-index', '2147483000')

      const label = document.createElement('span')
      label.className = LABEL_CLASS
      label.textContent = `${tagName} - `
      label.style.fontWeight = '700'
      el.insertBefore(label, el.firstChild)
    })
  }
}
