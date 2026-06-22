/**
 * Puente popup ↔ content script con re-inyección automática.
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve(response)
    })
  })
}

export async function injectContentScripts(tabId) {
  const manifest = chrome.runtime.getManifest()
  const war = manifest.web_accessible_resources?.[0]?.resources || []
  const contentBundle = war.find((r) => /content\.js-/.test(r) && !r.includes('loader'))
  const loaders = (manifest.content_scripts || []).flatMap((entry) => entry.js || [])

  const files = contentBundle ? [contentBundle] : loaders
  if (!files.length) return false

  for (const file of files) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    })
  }
  return true
}

function isValidPageData(response) {
  return response && typeof response === 'object' && !response.error && typeof response.url === 'string'
}

export async function requestPageData(tabId, options = {}) {
  const message = {
    action: 'getPageData',
    highlightHeaders: options.highlightHeaders === true,
  }

  // Ruta rápida: content script ya activo en la pestaña
  try {
    const fast = await sendMessageToTab(tabId, message)
    if (fast?.error) throw new Error(fast.error)
    if (isValidPageData(fast)) {
      return { data: fast, mode: fast.analysisMode || 'full', reinjected: false }
    }
  } catch {
    /* re-inyectar */
  }

  let reinjected = false
  try {
    await injectContentScripts(tabId)
    reinjected = true
    await delay(120)
  } catch {
    /* chrome:// u otras páginas restringidas */
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      try {
        await injectContentScripts(tabId)
        reinjected = true
      } catch {
        /* ignore */
      }
      await delay(100 + attempt * 100)
    }

    try {
      const response = await sendMessageToTab(tabId, message)
      if (response?.error) throw new Error(response.error)
      if (isValidPageData(response)) {
        return {
          data: response,
          mode: response.analysisMode || 'full',
          reinjected,
        }
      }
    } catch {
      /* reintentar */
    }
  }

  return null
}
