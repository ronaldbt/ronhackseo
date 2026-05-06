import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'SEO Extension Pro',
  version: '1.0.0',
  description: 'Herramienta completa de análisis SEO con análisis de velocidad, densidad de palabras, social preview y chequeo de enlaces',
  permissions: ['activeTab', 'tabs', 'scripting', 'storage'],
  optional_host_permissions: ['http://*/*', 'https://*/*'],
  background: {
    service_worker: 'src/background.js',
    type: 'module',
  },
  action: {
    default_popup: 'index.html',
    default_title: 'SEO Extension Pro'
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
