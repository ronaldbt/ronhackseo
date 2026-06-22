import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const stamp = new Date().toISOString()

writeFileSync(
  join(dist, 'BUILD.txt'),
  `RonHack SEO build: ${stamp}\nCarga en Chrome: esta carpeta (dist)\n`,
  'utf8',
)

console.log('\n✓ Extensión compilada en:', dist)
console.log('  En chrome://extensions → Recargar extensión → abre el popup de nuevo.\n')
