/**
 * Genera capturas para Chrome Web Store desde HTML estático.
 * Uso: npm run screenshots:store
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = join(root, 'scripts', 'store-screenshot-static')
const publicDir = join(root, 'public')

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
].filter(Boolean)

function findChrome() {
  return CHROME_PATHS.find((p) => p && existsSync(p))
}

const SHOTS = [
  { html: 'resumen.html', png: 'store-screenshot-1280x800.png' },
  { html: 'spider.html', png: 'store-screenshot-1280x800-2.png' },
  { html: 'problemas.html', png: 'store-screenshot-1280x800-3.png' },
  { html: 'keywords.html', png: 'store-screenshot-1280x800-4.png' },
]

function capture(chrome, htmlFile, outFile, w, h, type = 'png') {
  const url = `file:///${join(staticDir, htmlFile).replace(/\\/g, '/')}`
  const out = join(publicDir, outFile)
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${w},${h}`,
    '--force-device-scale-factor=1',
    `--screenshot=${out}`,
  ]
  if (type === 'jpeg') args.push('--screenshot-format=jpeg', '--screenshot-quality=92')
  args.push(url)
  const r = spawnSync(chrome, args, { encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout)
    throw new Error(`Fallo al capturar ${htmlFile}`)
  }
  console.log(`  ✓ ${out}`)
}

function main() {
  const chrome = findChrome()
  if (!chrome) {
    console.error('No se encontró Google Chrome.')
    process.exit(1)
  }

  mkdirSync(publicDir, { recursive: true })

  console.log('Generando capturas 1280×800…')
  for (const s of SHOTS) capture(chrome, s.html, s.png, 1280, 800)

  console.log('Generando 640×400 y JPG…')
  capture(chrome, 'resumen.html', 'store-screenshot-640x400.png', 640, 400)
  capture(chrome, 'resumen.html', 'store-screenshot-1280x800.jpg', 1280, 800, 'jpeg')
  capture(chrome, 'resumen.html', 'store-screenshot-640x400.jpg', 640, 400, 'jpeg')

  console.log('\nListo — archivos en public/')
}

main()
