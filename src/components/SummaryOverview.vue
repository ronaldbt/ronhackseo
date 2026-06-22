<template>
  <section class="summary-overview">
    <div class="summary-rows">
      <div v-for="row in metaRows" :key="row.id" class="summary-row">
        <div class="summary-left">
          <span class="summary-label">{{ row.label }}</span>
          <span v-if="row.sub" class="summary-sub" :class="row.subClass">{{ row.sub }}</span>
        </div>
        <div class="summary-value" :class="row.valueClass">{{ row.value }}</div>
        <div class="summary-badge-wrap">
          <span v-if="row.badge" class="status-badge" :class="row.badgeClass">{{ row.badge }}</span>
        </div>
      </div>
    </div>

    <div class="summary-stats">
      <div class="stats-block stats-headers">
        <div class="header-counts">
          <div
            v-for="h in headerLevels"
            :key="h.tag"
            class="header-count"
            :class="h.statusClass"
          >
            <span class="header-tag">{{ h.tag }}</span>
            <span class="header-num">{{ h.count }}</span>
          </div>
        </div>
      </div>
      <div class="stats-block stats-block-sm">
        <div class="stats-title">Images</div>
        <div class="stats-big">{{ imageCount }}</div>
      </div>
      <div class="stats-block stats-block-sm">
        <div class="stats-title">Links</div>
        <div class="stats-big">{{ linkCount }}</div>
      </div>
    </div>

    <div v-if="technicalChecks.length" class="technical-strip">
      <div class="technical-strip-title">Análisis SEO técnico</div>
      <div class="technical-chips">
        <div v-for="check in technicalChecks" :key="check.id" class="tech-chip" :class="check.chipClass">
          <span class="tech-chip-label">{{ check.label }}</span>
          <span class="tech-chip-status">{{ check.status }}</span>
        </div>
      </div>
    </div>

    <div v-if="metaRobots?.noindex" class="critical-strip">
      ¡ALERTA: esta página tiene <strong>noindex</strong>. Google no puede indexarla.
    </div>

    <div class="summary-footer">
      <a :href="robotsTxtUrl" target="_blank" rel="noopener noreferrer" class="summary-link">Robots.txt</a>
      <span class="footer-sep">|</span>
      <a :href="sitemapUrl" target="_blank" rel="noopener noreferrer" class="summary-link">Sitemap.xml</a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
})

function badge(ok, okText = '✓ OK', warnText = '⚠ Revisar') {
  return {
    badge: ok ? okText : warnText,
    badgeClass: ok ? 'badge-ok' : 'badge-warn',
  }
}

const titleLen = computed(() => (props.pageData.title || '').length)
const descriptionLen = computed(() => (props.pageData.metaTags?.description || '').length)

const titleSubClass = computed(() => {
  const n = titleLen.value
  if (!n) return 'sub-bad'
  if (n >= 30 && n <= 60) return 'sub-ok'
  return 'sub-warn'
})

const descSubClass = computed(() => {
  const n = descriptionLen.value
  if (!n) return 'sub-bad'
  if (n >= 120 && n <= 160) return 'sub-ok'
  return 'sub-warn'
})

const metaRows = computed(() => {
  const title = props.pageData.title || ''
  const desc = props.pageData.metaTags?.description || ''
  const keywords = props.pageData.metaTags?.keywords || ''
  const canonical = props.pageData.canonical?.url || props.pageData.metaTags?.['og:url'] || ''
  const robots =
    props.pageData.metaRobots?.content || props.pageData.metaTags?.robots || ''
  const author = props.pageData.metaTags?.author || ''
  const publisher = props.pageData.metaTags?.publisher || ''
  const lang =
    props.pageData.langTag?.htmlLang || props.pageData.metaTags?.['og:locale'] || ''

  const titleOk = titleLen.value >= 30 && titleLen.value <= 60
  const descOk = descriptionLen.value >= 120 && descriptionLen.value <= 160
  const canonicalOk =
    props.pageData.canonical?.exists && props.pageData.canonical?.matches
  const langOk = props.pageData.langTag?.matches

  return [
    {
      id: 'title',
      label: 'Title',
      sub: `${titleLen.value} characters`,
      subClass: titleSubClass.value,
      value: title || 'Title is missing.',
      valueClass: !title ? 'summary-missing' : '',
      ...badge(titleOk, '✓ OK', title ? '⚠ Longitud' : '✗ Falta'),
    },
    {
      id: 'description',
      label: 'Description',
      sub: `${descriptionLen.value} characters`,
      subClass: descSubClass.value,
      value: desc || 'Description is missing.',
      valueClass: !desc ? 'summary-missing' : '',
      ...badge(descOk, '✓ OK', desc ? '⚠ Longitud' : '✗ Falta'),
    },
    {
      id: 'keywords',
      label: 'Keywords',
      sub: null,
      subClass: '',
      value: keywords || 'Keywords are missing!',
      valueClass: !keywords ? 'summary-missing' : '',
      ...badge(keywords, '✓ OK', '— Falta'),
    },
    {
      id: 'url',
      label: 'URL',
      sub: null,
      subClass: '',
      value: props.pageData.url,
      valueClass: 'text-cyan-400/90 break-all',
      badge: null,
      badgeClass: '',
    },
    {
      id: 'canonical',
      label: 'Canonical',
      sub: null,
      subClass: '',
      value: canonical || 'Canonical is missing.',
      valueClass: !canonical ? 'summary-missing' : 'break-all',
      ...badge(canonicalOk, '✓ Correcta', canonical ? '⚠ Revisar' : '✗ Falta'),
    },
    {
      id: 'robots',
      label: 'Robots Tag',
      sub: null,
      subClass: '',
      value: robots || 'Robots tag is missing.',
      valueClass: !robots ? 'summary-missing' : '',
      badge: props.pageData.metaRobots?.noindex
        ? '✗ Noindex'
        : robots
          ? '✓ OK'
          : '— Falta',
      badgeClass: props.pageData.metaRobots?.noindex
        ? 'badge-bad'
        : robots
          ? 'badge-ok'
          : 'badge-neutral',
    },
    {
      id: 'author',
      label: 'Author',
      sub: null,
      subClass: '',
      value: author || 'Author is missing.',
      valueClass: !author ? 'summary-missing' : '',
      badge: author ? '✓ OK' : '—',
      badgeClass: author ? 'badge-ok' : 'badge-neutral',
    },
    {
      id: 'publisher',
      label: 'Publisher',
      sub: null,
      subClass: '',
      value: publisher || 'Publisher is missing.',
      valueClass: !publisher ? 'summary-missing' : '',
      badge: publisher ? '✓ OK' : '—',
      badgeClass: publisher ? 'badge-ok' : 'badge-neutral',
    },
    {
      id: 'lang',
      label: 'Lang',
      sub: null,
      subClass: '',
      value: lang || 'Lang is missing.',
      valueClass: !lang ? 'summary-missing' : '',
      ...badge(langOk, '✓ Coincide', lang ? '⚠ Revisar' : '✗ Falta'),
    },
  ]
})

const headerLevels = computed(() => {
  const c = props.pageData.headers?.count || {}
  const h1 = c.h1 ?? 0
  const items = [
    { tag: 'H1', count: h1 },
    { tag: 'H2', count: c.h2 ?? 0 },
    { tag: 'H3', count: c.h3 ?? 0 },
    { tag: 'H4', count: c.h4 ?? 0 },
    { tag: 'H5', count: c.h5 ?? 0 },
    { tag: 'H6', count: c.h6 ?? 0 },
  ]
  return items.map((item) => {
    let statusClass = ''
    if (item.tag === 'H1') {
      statusClass = item.count === 1 ? 'header-ok' : 'header-bad'
    }
    return { ...item, statusClass }
  })
})

const imageCount = computed(() => props.pageData.imageCount ?? 0)
const linkCount = computed(() => (props.pageData.links || []).length)
const metaRobots = computed(() => props.pageData.metaRobots)

const technicalChecks = computed(() => {
  const checks = []
  const canonical = props.pageData.canonical
  const langTag = props.pageData.langTag
  const titleWidth = props.pageData.titleWidth
  const stopWords = props.pageData.stopWordsURL
  const security = props.pageData.security

  if (canonical) {
    const ok = canonical.exists && canonical.matches
    checks.push({
      id: 'canonical',
      label: 'Canónica',
      status: ok ? '✓ Correcta' : canonical.exists ? '⚠ No coincide' : '✗ Falta',
      chipClass: ok ? 'chip-ok' : 'chip-warn',
    })
  }
  if (langTag) {
    const ok = langTag.matches
    checks.push({
      id: 'lang',
      label: 'Idioma',
      status: ok ? '✓ Coincide' : '⚠ Revisar',
      chipClass: ok ? 'chip-ok' : 'chip-warn',
    })
  }
  if (titleWidth) {
    const ok = !titleWidth.isTooLong
    checks.push({
      id: 'titleWidth',
      label: 'Ancho título',
      status: ok ? '✓ OK' : '⚠ Muy largo',
      chipClass: ok ? 'chip-ok' : 'chip-warn',
    })
  }
  if (stopWords) {
    const ok = !stopWords.isTooLong && stopWords.stopWordsCount === 0
    checks.push({
      id: 'stopWords',
      label: 'URL',
      status: ok ? '✓ OK' : '⚠ Mejorable',
      chipClass: ok ? 'chip-ok' : 'chip-warn',
    })
  }
  if (security) {
    checks.push({
      id: 'https',
      label: 'HTTPS',
      status: security.isHTTPS ? '✓ Seguro' : '✗ HTTP',
      chipClass: security.isHTTPS ? 'chip-ok' : 'chip-bad',
    })
  }
  const h1 = props.pageData.headers?.count?.h1 ?? 0
  checks.push({
    id: 'h1',
    label: 'H1',
    status: h1 === 1 ? '✓ Uno' : h1 === 0 ? '✗ Falta' : '⚠ Múltiples',
    chipClass: h1 === 1 ? 'chip-ok' : 'chip-warn',
  })

  return checks
})

const origin = computed(() => {
  try {
    return new URL(props.pageData.url).origin
  } catch {
    return ''
  }
})

const robotsTxtUrl = computed(() => (origin.value ? `${origin.value}/robots.txt` : '#'))
const sitemapUrl = computed(() => (origin.value ? `${origin.value}/sitemap.xml` : '#'))
</script>

<style scoped>
.summary-overview {
  width: 100%;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.summary-row {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr) 92px;
  column-gap: 12px;
  row-gap: 2px;
  align-items: start;
  width: 100%;
  padding: 10px 0;
  border-bottom: 1px solid rgba(63, 63, 70, 0.55);
}

.summary-left {
  grid-column: 1;
  grid-row: 1;
}

.summary-value {
  grid-column: 2;
  grid-row: 1;
  font-size: 13px;
  line-height: 1.45;
  color: #d4d4d8;
  word-break: break-word;
  min-width: 0;
}

.summary-badge-wrap {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  min-width: 92px;
}

.summary-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #e4e4e7;
  line-height: 1.3;
}

.summary-sub {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  font-weight: 600;
}

.sub-ok {
  color: #34d399;
}

.sub-warn {
  color: #fbbf24;
}

.sub-bad {
  color: #f87171;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-align: center;
}

.badge-ok {
  background: rgba(6, 78, 59, 0.55);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-warn {
  background: rgba(120, 53, 15, 0.45);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.badge-bad {
  background: rgba(127, 29, 29, 0.45);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.badge-neutral {
  background: rgba(63, 63, 70, 0.5);
  color: #a1a1aa;
  border: 1px solid rgba(82, 82, 91, 0.6);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-missing {
  color: #a1a1aa;
  font-style: italic;
}

.summary-stats {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(16, 185, 129, 0.2);
}

.stats-block {
  background: rgba(9, 9, 11, 0.55);
  border: 1px solid rgba(63, 63, 70, 0.8);
  border-radius: 8px;
  padding: 10px 12px;
}

.stats-title {
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.header-counts {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.header-count {
  text-align: center;
  padding: 6px 4px;
  background: rgba(24, 24, 27, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.6);
}

.header-ok {
  border-color: rgba(16, 185, 129, 0.45);
  background: rgba(6, 78, 59, 0.25);
}

.header-bad {
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(127, 29, 29, 0.2);
}

.header-tag {
  display: block;
  font-size: 10px;
  color: #6ee7b7;
  font-weight: 700;
}

.header-num {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #f4f4f5;
  line-height: 1.2;
}

.stats-big {
  font-size: 28px;
  font-weight: 700;
  color: #f4f4f5;
  line-height: 1;
}

.technical-strip {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  background: rgba(9, 9, 11, 0.45);
}

.technical-strip-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6ee7b7;
  margin-bottom: 10px;
}

.technical-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(63, 63, 70, 0.8);
  font-size: 11px;
}

.tech-chip-label {
  color: #a1a1aa;
  font-weight: 600;
}

.tech-chip-status {
  font-weight: 700;
}

.chip-ok {
  background: rgba(6, 78, 59, 0.35);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.chip-warn {
  background: rgba(120, 53, 15, 0.35);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fcd34d;
}

.chip-bad {
  background: rgba(127, 29, 29, 0.35);
  border-color: rgba(248, 113, 113, 0.35);
  color: #fca5a5;
}

.critical-strip {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.5);
  background: rgba(127, 29, 29, 0.4);
  color: #fecaca;
  font-size: 12px;
  line-height: 1.4;
}

.summary-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
}

.footer-sep {
  color: #52525b;
  font-size: 12px;
}

.summary-link {
  font-size: 12px;
  color: #67e8f9;
  text-decoration: none;
}

.summary-link:hover {
  text-decoration: underline;
  color: #a5f3fc;
}
</style>
