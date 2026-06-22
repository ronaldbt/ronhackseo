import { createApp, h } from 'vue'
import './style.css'
import SpiderTab from './components/SpiderTab.vue'

const SESSION_CACHE_KEY = 'ronhackPageCache'

async function loadPageData() {
  try {
    const cached = await chrome.storage.session.get(SESSION_CACHE_KEY)
    return cached[SESSION_CACHE_KEY] || null
  } catch {
    return null
  }
}

;(async () => {
  const pageData = await loadPageData()
  createApp({
    render: () => h(SpiderTab, { pageData, fullscreen: true }),
  }).mount('#spider-app')
})()
