import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'RonHack SEO',
  version: '1.0.0',
  description:
    'Consola de auditoría SEO: análisis on-page, rastreo de sitio, escáner de columnas, problemas y datos estructurados.',
  permissions: ['activeTab', 'tabs', 'scripting', 'storage'],
  optional_host_permissions: ['http://*/*', 'https://*/*'],
  background: {
    service_worker: 'src/background.js',
    type: 'module',
  },
  action: {
    default_popup: 'index.html',
    default_title: 'RonHack SEO'
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content.js']
    }
  ],
  icons: {
    16: 'public/vite.svg',
    48: 'public/vite.svg',
    128: 'public/vite.svg'
  }
})
