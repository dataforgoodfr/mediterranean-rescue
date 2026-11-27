// Fabrique dist/rescue-atlas-admin.zip, le fichier à téléverser dans WordPress
// (Extensions > Ajouter > Téléverser une extension). Utilise la commande `zip` du système.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist', 'rescue-atlas-admin.zip')
mkdirSync(join(root, 'dist'), { recursive: true })
rmSync(out, { force: true })
execFileSync('zip', ['-qr', out, 'rescue-atlas-admin', '-x', '*.DS_Store'], { cwd: join(root, 'plugin'), stdio: 'inherit' })
console.log(`Prêt à téléverser : ${out}`)
