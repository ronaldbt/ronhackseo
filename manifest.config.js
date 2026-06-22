import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'RonHack SEO',
  version: '1.0.1',
  description:
    'Consola de auditoría SEO: análisis on-page, rastreo de sitio, escáner de columnas, problemas y datos estructurados.',
  permissions: ['activeTab', 'tabs', 'scripting', 'storage'],
  host_permissions: [
    'https://suggestqueries.google.com/*',
    'https://api.bing.com/*',
    'https://duckduckgo.com/*',
    'https://nominatim.openstreetmap.org/*',
  ],
  background: {
    service_worker: 'src/background.js',
    type: 'module',
  },
  action: {
    default_popup: 'index.html',
    default_title: 'RonHack SEO',
    default_icon: {
      16: 'public/icon-16.png',
      32: 'public/icon-32.png',
      48: 'public/icon-48.png',
    },
  },
  options_page: 'spider.html',
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content.js']
    }
  ],
  icons: {
    16: 'public/icon-16.png',
    32: 'public/icon-32.png',
    48: 'public/icon-48.png',
    128: 'public/icon-128.png',
  },
})
