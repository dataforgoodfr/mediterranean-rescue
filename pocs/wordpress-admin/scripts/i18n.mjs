// Met à jour les traductions, avec les outils officiels de WordPress (wp i18n), lancés dans un
// WordPress Playground : aucun WP-CLI à installer. Gettext (msgmerge, msgfmt) doit être installé :
// `brew install gettext` sur Mac, `apt install gettext` sur Linux.
//
// 1. Extrait les textes du PHP et du JS construit (build/operations.js) dans languages/*.pot.
// 2. Fusionne ces textes dans chaque languages/*.po : les nouveaux arrivent vides, à traduire.
// 3. Compile les .po en .mo, en .l10n.php (PHP) et en .json (JavaScript).
//
// Lancer après `pnpm build`, puis traduire les textes vides du .po (Poedit, ou un éditeur de
// texte), puis relancer pour compiler. Doc : https://developer.wordpress.org/cli/commands/i18n/
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WP_VERSION } from './server.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const plugin = join(root, 'plugin', 'rescue-atlas-admin')
const languages = join(plugin, 'languages')
const inWp = '/wordpress/wp-content/plugins/rescue-atlas-admin'

function wpCli(commands) {
  const dir = mkdtempSync(join(tmpdir(), 'rsatlas-i18n-'))
  const blueprint = join(dir, 'blueprint.json')
  writeFileSync(blueprint, JSON.stringify({ steps: commands.map((command) => ({ step: 'wp-cli', command })) }))
  execFileSync(join(root, 'node_modules', '.bin', 'wp-playground-cli'), [
    'run-blueprint', `--wp=${WP_VERSION}`, '--php=8.3',
    // Le build embarque MapLibre (1 Mo) : l'extraction des textes demande plus que 256 Mo.
    '--php-ini', 'memory_limit', '2048M',
    '--mount-dir', plugin, inWp,
    '--blueprint', blueprint,
  ], { stdio: 'inherit' })
}

// 1. Extraction (le worker de la carte, *.mjs, ne contient aucun texte).
wpCli([`wp i18n make-pot ${inWp} ${inWp}/languages/rescue-atlas-admin.pot --slug=rescue-atlas-admin --domain=rescue-atlas-admin --exclude=*.mjs --skip-audit`])

// 2 et 3. Fusion et compilation, langue par langue.
const poFiles = readdirSync(languages).filter((f) => f.endsWith('.po'))
for (const po of poFiles) {
  const path = join(languages, po)
  execFileSync('msgmerge', ['--quiet', '--update', '--backup=none', '--no-fuzzy-matching', path, join(languages, 'rescue-atlas-admin.pot')], { stdio: 'inherit' })
  execFileSync('msgfmt', ['--check', '--statistics', '-o', path.replace(/\.po$/, '.mo'), path], { stdio: 'inherit' })
}
wpCli([`wp i18n make-json ${inWp}/languages --no-purge`, `wp i18n make-php ${inWp}/languages`])
console.log(`Traductions à jour : ${poFiles.join(', ')}. Un texte non traduit reste en anglais à l'écran.`)
