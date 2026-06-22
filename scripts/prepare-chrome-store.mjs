/**
 * Genera chrome-store-upload/ con el contenido listo para ZIP (manifest en raíz).
 * Uso: npm run package:store
 */
import { cpSync, rmSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const out = join(root, 'chrome-store-upload')

console.log('Building extension…')
execSync('npm run build', { cwd: root, stdio: 'inherit' })

if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('Error: dist/manifest.json no existe. Ejecuta npm run build primero.')
  process.exit(1)
}

if (existsSync(out)) {
  rmSync(out, { recursive: true, force: true })
}
mkdirSync(out, { recursive: true })

/** Copia recursiva sin node_modules ni basura. */
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const name of readdirSync(src)) {
    if (name === '.vite') continue
    const from = join(src, name)
    const to = join(dest, name)
    if (statSync(from).isDirectory()) copyDir(from, to)
    else cpSync(from, to)
  }
}

copyDir(dist, out)

console.log('')
console.log('Listo: chrome-store-upload/')
console.log('  → Contiene manifest.json en la raíz (estructura correcta para CWS).')
console.log('')
console.log('Para crear el ZIP en Windows (PowerShell):')
console.log('  cd chrome-store-upload')
console.log('  Compress-Archive -Path * -DestinationPath ..\\ronhack-seo-v1.0.1.zip -Force')
console.log('')
console.log('Sube ronhack-seo-v1.0.1.zip en Chrome Web Store → Package.')
