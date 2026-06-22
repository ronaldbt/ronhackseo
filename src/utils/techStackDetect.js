/**
 * Detección compacta de tecnologías (estilo Wappalyzer).
 */

function collectSignals(doc) {
  const scripts = [...doc.querySelectorAll('script[src]')].map((s) => s.src).join(' ')
  const inline = [...doc.querySelectorAll('script:not([src])')]
    .map((s) => (s.textContent || '').slice(0, 8000))
    .join(' ')
  const links = [...doc.querySelectorAll('link[href]')].map((l) => l.href).join(' ')
  const html = doc.documentElement?.outerHTML?.slice(0, 180000) || ''
  const meta = [...doc.querySelectorAll('meta')].map((m) => m.outerHTML).join(' ')
  const generator = doc.querySelector('meta[name="generator"]')?.getAttribute('content') || ''
  const bodyClass = doc.body?.className || ''
  const htmlAttrs = doc.documentElement?.outerHTML?.slice(0, 500) || ''

  return {
    combined: `${scripts} ${inline} ${links} ${meta} ${html} ${generator} ${bodyClass} ${htmlAttrs}`.toLowerCase(),
    generator: generator.toLowerCase(),
    doc,
  }
}

const RULES = [
  { cat: 'CMS', name: 'WordPress', test: (s) => /wp-content|wp-includes|wp-json|wordpress/i.test(s.combined) || /wordpress/i.test(s.generator) },
  { cat: 'CMS', name: 'WooCommerce', test: (s) => /woocommerce|wc-blocks|add-to-cart/i.test(s.combined) },
  { cat: 'CMS', name: 'Shopify', test: (s) => /cdn\.shopify|shopify\.com|shopify-checkout|myshopify/i.test(s.combined) || typeof s.doc.defaultView?.Shopify !== 'undefined' },
  { cat: 'CMS', name: 'Wix', test: (s) => /wix\.com|wixstatic|parastorage|x-wix/i.test(s.combined) || typeof s.doc.defaultView?.wixBiSession !== 'undefined' },
  { cat: 'CMS', name: 'Webflow', test: (s) => /webflow\.com|data-wf-site|data-wf-page/i.test(s.combined) },
  { cat: 'CMS', name: 'Squarespace', test: (s) => /squarespace|static\.squarespace/i.test(s.combined) },
  { cat: 'CMS', name: 'Magento', test: (s) => /magento|mage\/cookies|data-mage-init/i.test(s.combined) },
  { cat: 'CMS', name: 'PrestaShop', test: (s) => /prestashop|prestashop\.com/i.test(s.combined) },
  { cat: 'CMS', name: 'Joomla', test: (s) => /joomla|\/media\/jui\//i.test(s.combined) || /joomla/i.test(s.generator) },
  { cat: 'CMS', name: 'Drupal', test: (s) => /drupal|sites\/default\/files/i.test(s.combined) || /drupal/i.test(s.generator) },
  { cat: 'CMS', name: 'Ghost', test: (s) => /ghost\.org|content-api|ghost-/i.test(s.combined) },
  { cat: 'CMS', name: 'HubSpot CMS', test: (s) => /hubspot|hs-scripts|hs-banner|hsforms/i.test(s.combined) },
  { cat: 'CMS', name: 'Tilda', test: (s) => /tilda\.ws|tildacdn/i.test(s.combined) },
  { cat: 'CMS', name: 'Blogger', test: (s) => /blogger\.com|blogspot/i.test(s.combined) },
  { cat: 'CMS', name: 'TYPO3', test: (s) => /typo3|t3/i.test(s.combined) || /typo3/i.test(s.generator) },
  { cat: 'CMS', name: 'BigCommerce', test: (s) => /bigcommerce|mybigcommerce/i.test(s.combined) },
  { cat: 'CMS', name: 'OpenCart', test: (s) => /opencart|route=product/i.test(s.combined) },
  { cat: 'CMS', name: 'VTEX', test: (s) => /vtex|vtexassets/i.test(s.combined) },
  { cat: 'CMS', name: 'Elementor', test: (s) => /elementor/i.test(s.combined) },
  { cat: 'CMS', name: 'Divi', test: (s) => /et-db|divi/i.test(s.combined) },
  { cat: 'Framework JS', name: 'Vue.js', test: (s) => /vue\.js|vue@|__vue__|data-v-app|data-v-[a-f0-9]/i.test(s.combined) || !!s.doc.querySelector('[data-v-app]') },
  { cat: 'Framework JS', name: 'Nuxt.js', test: (s) => /__nuxt__|__nuxt|_nuxt\/|nuxt\.js|nuxtjs/i.test(s.combined) || !!s.doc.querySelector('#__nuxt') || typeof s.doc.defaultView?.__NUXT__ !== 'undefined' },
  { cat: 'Framework JS', name: 'React', test: (s) => /react\.js|react-dom|__react|data-reactroot|reactroot/i.test(s.combined) },
  { cat: 'Framework JS', name: 'Next.js', test: (s) => /__next_data__|_next\/static|next\.js/i.test(s.combined) || !!s.doc.querySelector('#__next') },
  { cat: 'Framework JS', name: 'Angular', test: (s) => /angular\.js|ng-version|ng-app|angular/i.test(s.combined) },
  { cat: 'Framework JS', name: 'Svelte', test: (s) => /svelte/i.test(s.combined) },
  { cat: 'Framework JS', name: 'Alpine.js', test: (s) => /alpine\.js|x-data/i.test(s.combined) },
  { cat: 'Framework JS', name: 'jQuery', test: (s) => /jquery\.js|jquery\.min\.js|jquery-/i.test(s.combined) },
  { cat: 'UI', name: 'Tailwind CSS', test: (s) => /tailwindcss|tailwind\.css|@tailwind/i.test(s.combined) },
  { cat: 'UI', name: 'Bootstrap', test: (s) => /bootstrap\.css|bootstrap\.min\.css|bootstrap\.js|bootstrap@/i.test(s.combined) },
  { cat: 'UI', name: 'Material UI', test: (s) => /mui\.com|material-ui/i.test(s.combined) },
  { cat: 'Analítica', name: 'Google Analytics', test: (s) => /google-analytics|googletagmanager\.com\/gtag|gtag\(|g-[a-z0-9]{6,}/i.test(s.combined) },
  { cat: 'Analítica', name: 'Google Tag Manager', test: (s) => /googletagmanager\.com\/gtm\.js|gtm-[a-z0-9]+/i.test(s.combined) },
  { cat: 'Analítica', name: 'Hotjar', test: (s) => /hotjar/i.test(s.combined) },
  { cat: 'Analítica', name: 'Meta Pixel', test: (s) => /connect\.facebook\.net|fbq\(/i.test(s.combined) },
  { cat: 'Analítica', name: 'Microsoft Clarity', test: (s) => /clarity\.ms/i.test(s.combined) },
  { cat: 'CDN', name: 'Cloudflare', test: (s) => /cloudflare|cdnjs\.cloudflare|__cf_bm|cf-ray/i.test(s.combined) },
  { cat: 'CDN', name: 'jsDelivr', test: (s) => /cdn\.jsdelivr\.net/i.test(s.combined) },
  { cat: 'CDN', name: 'unpkg', test: (s) => /unpkg\.com/i.test(s.combined) },
  { cat: 'CDN', name: 'Amazon CloudFront', test: (s) => /cloudfront\.net/i.test(s.combined) },
  { cat: 'Misc', name: 'Open Graph', test: (s) => !!s.doc.querySelector('meta[property^="og:"]') },
  { cat: 'Misc', name: 'PWA', test: (s) => !!s.doc.querySelector('link[rel="manifest"]') },
  { cat: 'Tipografía', name: 'Google Font API', test: (s) => /fonts\.googleapis\.com|fonts\.gstatic/i.test(s.combined) },
  { cat: 'Tipografía', name: 'Lucide', test: (s) => /lucide/i.test(s.combined) },
  { cat: 'Tipografía', name: 'Font Awesome', test: (s) => /font-awesome|fontawesome/i.test(s.combined) },
  { cat: 'Rendimiento', name: 'Priority Hints', test: (s) => !!s.doc.querySelector('[fetchpriority]') },
  { cat: 'JS libs', name: 'Goober', test: (s) => /goober/i.test(s.combined) },
  { cat: 'JS libs', name: 'Lodash', test: (s) => /lodash/i.test(s.combined) },
  { cat: 'JS libs', name: 'Axios', test: (s) => /axios/i.test(s.combined) },
  { cat: 'JS libs', name: 'Swiper', test: (s) => /swiper/i.test(s.combined) },
  { cat: 'Pagos', name: 'Stripe', test: (s) => /stripe\.com|js\.stripe/i.test(s.combined) },
  { cat: 'Pagos', name: 'PayPal', test: (s) => /paypal\.com|paypalobjects/i.test(s.combined) },
]

export function detectTechStack(doc = document) {
  const signals = collectSignals(doc)
  const found = new Map()

  for (const rule of RULES) {
    try {
      if (rule.test(signals)) {
        if (!found.has(rule.name)) {
          found.set(rule.name, { name: rule.name, category: rule.cat })
        }
      }
    } catch {
      /* ignore */
    }
  }

  const win = doc.defaultView || window
  if (win.__NUXT__) found.set('Nuxt.js', { name: 'Nuxt.js', category: 'Framework JS' })
  if (win.__VUE__) found.set('Vue.js', { name: 'Vue.js', category: 'Framework JS' })
  if (win.Shopify) found.set('Shopify', { name: 'Shopify', category: 'CMS' })

  const byCategory = {}
  for (const tech of found.values()) {
    if (!byCategory[tech.category]) byCategory[tech.category] = []
    byCategory[tech.category].push(tech.name)
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort()
  }

  return {
    technologies: [...found.values()],
    byCategory,
    total: found.size,
  }
}

/** Autocontenida para executeScript en la pestaña. */
export function detectTechStackInPage() {
  const doc = document
  const scripts = [...doc.querySelectorAll('script[src]')].map((s) => s.src).join(' ')
  const inline = [...doc.querySelectorAll('script:not([src])')].map((s) => (s.textContent || '').slice(0, 8000)).join(' ')
  const links = [...doc.querySelectorAll('link[href]')].map((l) => l.href).join(' ')
  const html = doc.documentElement?.outerHTML?.slice(0, 180000) || ''
  const meta = [...doc.querySelectorAll('meta')].map((m) => m.outerHTML).join(' ')
  const generator = doc.querySelector('meta[name="generator"]')?.getAttribute('content') || ''
  const combined = `${scripts} ${inline} ${links} ${meta} ${html} ${generator}`.toLowerCase()

  const found = new Map()
  const add = (cat, name, ok) => {
    if (ok && !found.has(name)) found.set(name, { name, category: cat })
  }

  add('CMS', 'WordPress', /wp-content|wp-includes|wp-json|wordpress/i.test(combined))
  add('CMS', 'WooCommerce', /woocommerce|wc-blocks/i.test(combined))
  add('CMS', 'Shopify', /cdn\.shopify|shopify|myshopify/i.test(combined) || typeof window.Shopify !== 'undefined')
  add('CMS', 'Wix', /wix\.com|wixstatic|parastorage/i.test(combined))
  add('CMS', 'Webflow', /webflow|data-wf-site/i.test(combined))
  add('CMS', 'Squarespace', /squarespace/i.test(combined))
  add('CMS', 'Magento', /magento|mage\/cookies/i.test(combined))
  add('CMS', 'PrestaShop', /prestashop/i.test(combined))
  add('CMS', 'Joomla', /joomla/i.test(combined))
  add('CMS', 'Drupal', /drupal/i.test(combined))
  add('CMS', 'Ghost', /ghost/i.test(combined))
  add('CMS', 'HubSpot CMS', /hubspot|hs-scripts/i.test(combined))
  add('CMS', 'Tilda', /tilda/i.test(combined))
  add('CMS', 'Blogger', /blogger|blogspot/i.test(combined))
  add('CMS', 'Elementor', /elementor/i.test(combined))
  add('Framework JS', 'Vue.js', /vue|data-v-app|__vue__/i.test(combined) || !!doc.querySelector('[data-v-app]'))
  add('Framework JS', 'Nuxt.js', /__nuxt|_nuxt\/|nuxt/i.test(combined) || !!doc.querySelector('#__nuxt') || typeof window.__NUXT__ !== 'undefined')
  add('Framework JS', 'React', /react/i.test(combined))
  add('Framework JS', 'Next.js', /__next|_next\//i.test(combined) || !!doc.querySelector('#__next'))
  add('Framework JS', 'Angular', /angular|ng-version/i.test(combined))
  add('Framework JS', 'jQuery', /jquery/i.test(combined))
  add('UI', 'Tailwind CSS', /tailwind/i.test(combined))
  add('UI', 'Bootstrap', /bootstrap/i.test(combined))
  add('Analítica', 'Google Analytics', /google-analytics|gtag\(/i.test(combined))
  add('Analítica', 'Google Tag Manager', /googletagmanager|gtm-/i.test(combined))
  add('Analítica', 'Meta Pixel', /facebook\.net|fbq\(/i.test(combined))
  add('CDN', 'Cloudflare', /cloudflare/i.test(combined))
  add('Misc', 'Open Graph', !!doc.querySelector('meta[property^="og:"]'))
  add('Tipografía', 'Google Font API', /fonts\.googleapis|fonts\.gstatic/i.test(combined))

  const byCategory = {}
  for (const tech of found.values()) {
    if (!byCategory[tech.category]) byCategory[tech.category] = []
    byCategory[tech.category].push(tech.name)
  }

  return { technologies: [...found.values()], byCategory, total: found.size }
}
