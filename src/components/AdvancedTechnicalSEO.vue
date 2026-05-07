<template>
  <div class="advanced-technical-seo space-y-4">
    <!-- Lazy Loading -->
    <div class="analysis-card" v-if="lazyLoading">
      <div class="card-header">
        <h4 class="card-title">Lazy Loading de Imágenes</h4>
        <span :class="lazyLoading.score >= 80 ? 'badge-success' : 'badge-warning'">
          {{ lazyLoading.score }}/100
        </span>
      </div>
      <div class="card-content">
        <div class="stats-row">
          <div class="stat">
            <span class="stat-label">Con lazy:</span>
            <span class="stat-value text-green-600">{{ lazyLoading.lazyImages }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Sin lazy:</span>
            <span class="stat-value text-red-600">{{ lazyLoading.nonLazyImages }}</span>
          </div>
        </div>
        <div v-if="lazyLoading.warning" class="warning-box mt-3 border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ lazyLoading.warning }}</p>
        </div>
      </div>
    </div>

    <!-- Favicons -->
    <div class="analysis-card" v-if="favicons">
      <div class="card-header">
        <h4 class="card-title">Favicons e Iconos</h4>
        <span :class="favicons.score >= 80 ? 'badge-success' : 'badge-warning'">
          {{ favicons.score }}/100
        </span>
      </div>
      <div class="card-content">
        <div class="icons-list">
          <div class="icon-item" v-for="(icon, key) in favicons.icons" :key="key">
            <span class="icon-status" :class="icon ? 'text-green-600' : 'text-red-600'">
              {{ icon ? '✓' : '✗' }}
            </span>
            <span class="icon-name">{{ getIconName(key) }}</span>
            <span v-if="icon" class="icon-url truncate text-xs text-zinc-500">{{ icon }}</span>
          </div>
        </div>
        <div v-if="favicons.missing && favicons.missing.length > 0" class="warning-box mt-3 border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ favicons.warning }}</p>
        </div>
        <div v-if="favicons.icons.favicon" class="serp-preview mt-4">
          <p class="mb-2 text-xs font-semibold text-zinc-400">Vista previa en Google:</p>
          <div class="serp-result">
            <div class="serp-icon">
              <img :src="getFaviconUrl(favicons.icons.favicon)" 
                   alt="Favicon" 
                   @error="$event.target.style.display='none'"
                   style="width: 16px; height: 16px;"/>
            </div>
            <div class="serp-title">{{ title || 'Título de la página' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="analysis-card" v-if="security">
      <div class="card-header">
        <h4 class="card-title">Seguridad Básica</h4>
        <span :class="security.isHTTPS && security.insecureForms === 0 ? 'badge-success' : 'badge-error'">
          {{ security.isHTTPS ? 'HTTPS' : 'HTTP' }}
        </span>
      </div>
      <div class="card-content">
        <div class="stats-row">
          <div class="stat">
            <span class="stat-label">Protocolo:</span>
            <span :class="security.isHTTPS ? 'stat-value text-green-600' : 'stat-value text-red-600'">
              {{ security.isHTTPS ? 'HTTPS ✓' : 'HTTP ✗' }}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">Formularios:</span>
            <span class="stat-value">{{ security.formsCount }}</span>
          </div>
        </div>
        <div v-if="security.warning" class="warning-box mt-3 border-red-500 bg-red-950/40 text-red-100">
          <p class="text-sm m-0 font-semibold">{{ security.warning }}</p>
        </div>
      </div>
    </div>

    <!-- Text vs HTML Ratio -->
    <div class="analysis-card" v-if="textHTMLRatio">
      <div class="card-header">
        <h4 class="card-title">Ratio Texto vs HTML</h4>
        <span :class="textHTMLRatio.ratio >= 15 ? 'badge-success' : 'badge-warning'">
          {{ textHTMLRatio.ratio }}%
        </span>
      </div>
      <div class="card-content">
        <div class="stats-row">
          <div class="stat">
            <span class="stat-label">Tamaño HTML:</span>
            <span class="stat-value">{{ textHTMLRatio.htmlSize }} KB</span>
          </div>
          <div class="stat">
            <span class="stat-label">Tamaño texto:</span>
            <span class="stat-value">{{ textHTMLRatio.textSize }} KB</span>
          </div>
        </div>
        <div class="ratio-bar mt-3">
          <div class="ratio-fill" :style="{ width: textHTMLRatio.ratio + '%' }"></div>
        </div>
        <div v-if="textHTMLRatio.warning" class="warning-box mt-3 border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ textHTMLRatio.warning }}</p>
        </div>
      </div>
    </div>

    <!-- IFrames -->
    <div class="analysis-card" v-if="iframes">
      <div class="card-header">
        <h4 class="card-title">IFrames</h4>
        <span class="stat-value">{{ iframes.count }}</span>
      </div>
      <div class="card-content">
        <p class="mb-2 text-sm text-zinc-400">
          Se detectaron <strong class="text-zinc-200">{{ iframes.count }}</strong> iframe(s) en la página.
        </p>
        <div v-if="iframes.warning" class="warning-box border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ iframes.warning }}</p>
        </div>
      </div>
    </div>

    <!-- Nofollow Internal Links -->
    <div class="analysis-card" v-if="nofollowInternal">
      <div class="card-header">
        <h4 class="card-title">Nofollow en Enlaces Internos</h4>
        <span :class="nofollowInternal.nofollowCount === 0 ? 'badge-success' : 'badge-error'">
          {{ nofollowInternal.nofollowCount === 0 ? '✓ OK' : '⚠ ' + nofollowInternal.nofollowCount }}
        </span>
      </div>
      <div class="card-content">
        <div class="stats-row">
          <div class="stat">
            <span class="stat-label">Enlaces internos:</span>
            <span class="stat-value">{{ nofollowInternal.totalInternal }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Con nofollow:</span>
            <span class="stat-value text-red-600">{{ nofollowInternal.nofollowCount }}</span>
          </div>
        </div>
        <div v-if="nofollowInternal.warning" class="warning-box mt-3 border-red-500 bg-red-950/40 text-red-100">
          <p class="text-sm m-0 font-semibold">{{ nofollowInternal.warning }}</p>
        </div>
      </div>
    </div>

    <!-- Hreflang -->
    <div class="analysis-card" v-if="hreflang">
      <div class="card-header">
        <h4 class="card-title">Hreflang (Multi-idioma)</h4>
        <span :class="hreflang.exists ? 'badge-success' : 'badge-info'">
          {{ hreflang.exists ? hreflang.count + ' variantes' : 'No detectado' }}
        </span>
      </div>
      <div class="card-content" v-if="hreflang.exists">
        <div class="languages-list">
          <span v-for="lang in hreflang.languages" :key="lang" class="language-badge">
            {{ lang }}
          </span>
        </div>
        <div v-if="hreflang.warning" class="warning-box mt-3 border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ hreflang.warning }}</p>
        </div>
      </div>
      <div v-else class="text-sm text-zinc-500">
        No se detectaron etiquetas hreflang. Solo necesario para sitios multi-idioma.
      </div>
    </div>

    <!-- Internal Anchors -->
    <div class="analysis-card" v-if="internalAnchors">
      <div class="card-header">
        <h4 class="card-title">Enlaces Internos (Anclas)</h4>
        <span :class="internalAnchors.score >= 80 ? 'badge-success' : 'badge-warning'">
          {{ internalAnchors.validCount }}/{{ internalAnchors.count }}
        </span>
      </div>
      <div class="card-content">
        <p class="mb-2 text-sm text-zinc-400">
          Se encontraron <strong class="text-zinc-200">{{ internalAnchors.count }}</strong> enlace(s) con anclas (#).
          <strong class="text-zinc-200">{{ internalAnchors.validCount }}</strong> apuntan a elementos válidos.
        </p>
        <div v-if="internalAnchors.warning" class="warning-box border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ internalAnchors.warning }}</p>
        </div>
      </div>
    </div>

    <!-- Social Tags Completo -->
    <div class="analysis-card" v-if="socialTags">
      <div class="card-header">
        <h4 class="card-title">Etiquetas Sociales Completas</h4>
        <span :class="socialTags.score >= 80 ? 'badge-success' : 'badge-warning'">
          {{ socialTags.count }}/12
        </span>
      </div>
      <div class="card-content">
        <div class="tags-grid">
          <div v-for="(tag, key) in socialTags.found" :key="key" class="tag-item found">
            <span class="tag-status">✓</span>
            <span class="tag-name">{{ getTagName(key) }}</span>
          </div>
          <div v-for="tag in socialTags.missing.slice(0, 8)" :key="tag" class="tag-item missing">
            <span class="tag-status">✗</span>
            <span class="tag-name">{{ getTagName(tag) }}</span>
          </div>
        </div>
        <div v-if="socialTags.warning" class="warning-box mt-3 border-amber-500 bg-amber-950/35 text-amber-50">
          <p class="text-sm m-0">{{ socialTags.warning }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  lazyLoading: Object,
  favicons: Object,
  security: Object,
  textHTMLRatio: Object,
  iframes: Object,
  nofollowInternal: Object,
  hreflang: Object,
  internalAnchors: Object,
  socialTags: Object,
  title: String,
  currentUrl: String
})

const getIconName = (key) => {
  const names = {
    favicon: 'Favicon',
    appleTouchIcon: 'Apple Touch Icon',
    androidIcon: 'Android/Chrome Icon',
    manifest: 'Manifest'
  }
  return names[key] || key
}

const getTagName = (key) => {
  const names = {
    ogTitle: 'OG Title',
    ogDescription: 'OG Description',
    ogImage: 'OG Image',
    ogUrl: 'OG URL',
    twitterCard: 'Twitter Card',
    twitterTitle: 'Twitter Title',
    twitterDescription: 'Twitter Description',
    twitterImage: 'Twitter Image',
    fbAppId: 'Facebook App ID',
    twitterCreator: 'Twitter Creator',
    twitterSite: 'Twitter Site'
  }
  return names[key] || key
}

const getFaviconUrl = (faviconPath) => {
  if (!faviconPath) return ''
  if (faviconPath.startsWith('http://') || faviconPath.startsWith('https://')) {
    return faviconPath
  }
  if (faviconPath.startsWith('//')) {
    try {
      return new URL(faviconPath, props.currentUrl || 'https://example.com').href
    } catch {
      return faviconPath
    }
  }
  try {
    const baseUrl = props.currentUrl || 'https://example.com'
    const urlObj = new URL(baseUrl)
    if (faviconPath.startsWith('/')) {
      return urlObj.origin + faviconPath
    }
    return urlObj.origin + '/' + faviconPath
  } catch {
    return faviconPath
  }
}
</script>

<style scoped>
.advanced-technical-seo {
  width: 100%;
}

.analysis-card {
  padding: 14px;
  background: rgba(24, 24, 27, 0.65);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.18);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(63, 63, 70, 0.9);
}

.card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #e4e4e7;
  margin: 0;
  letter-spacing: 0.02em;
}

.badge-success,
.badge-warning,
.badge-error,
.badge-info {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
}

.badge-success {
  background: rgba(6, 78, 59, 0.55);
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.35);
}

.badge-warning {
  background: rgba(120, 53, 15, 0.45);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.4);
}

.badge-error {
  background: rgba(127, 29, 29, 0.45);
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.35);
}

.badge-info {
  background: rgba(30, 58, 138, 0.45);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.35);
}

.card-content {
  padding-top: 8px;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: #a1a1aa;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #f4f4f5;
}

.warning-box {
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid;
}

.icons-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(9, 9, 11, 0.55);
  border-radius: 4px;
  border: 1px solid rgba(63, 63, 70, 0.7);
}

.icon-status {
  font-weight: bold;
  font-size: 14px;
}

.icon-name {
  font-size: 12px;
  font-weight: 500;
  flex: 1;
  color: #d4d4d8;
}

.icon-url {
  max-width: 200px;
}

.serp-preview {
  padding: 12px;
  background: rgba(9, 9, 11, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.serp-result {
  display: flex;
  align-items: center;
  gap: 8px;
}

.serp-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.serp-title {
  font-size: 18px;
  color: #6ee7b7;
  line-height: 1.3;
  text-shadow: 0 0 24px rgba(16, 185, 129, 0.15);
}

.ratio-bar {
  width: 100%;
  height: 12px;
  background: #27272a;
  border-radius: 6px;
  overflow: hidden;
}

.ratio-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
  transition: width 0.3s ease;
}

.languages-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.language-badge {
  padding: 4px 10px;
  background: rgba(30, 58, 138, 0.45);
  color: #93c5fd;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 4px;
  font-size: 11px;
}

.tag-item.found {
  background: rgba(6, 78, 59, 0.4);
  color: #a7f3d0;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.tag-item.missing {
  background: rgba(127, 29, 29, 0.35);
  color: #fecaca;
  border: 1px solid rgba(248, 113, 113, 0.25);
}

.tag-status {
  font-weight: bold;
}

.tag-name {
  flex: 1;
}
</style>
