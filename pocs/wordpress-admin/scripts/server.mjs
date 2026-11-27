// Lance un WordPress de test, de la même version que celui de SOS MEDITERRANEE, avec le plugin
// et des données fictives. WordPress Playground le fait tourner en WebAssembly : ni Docker, ni
// PHP, ni base à installer. Tout est en mémoire et repart de zéro à chaque lancement.
// Doc : https://wordpress.github.io/wordpress-playground/developers/local-development/wp-playground-cli
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// WordPress 7.1.4 : la version du site de SOS MEDITERRANEE, relevée le 23/11/2026 (balise generator).
export const WP_VERSION = '7.1.4'

export function startServer({ port = 9400, stdio = 'inherit' } = {}) {
  const bin = join(root, 'node_modules', '.bin', 'wp-playground-cli')
  return spawn(
    bin,
    [
      'server',
      `--wp=${WP_VERSION}`,
      '--php=8.3',
      `--port=${port}`,
      '--mount-dir', join(root, 'plugin', 'rescue-atlas-admin'), '/wordpress/wp-content/plugins/rescue-atlas-admin',
      '--mount-dir', join(root, 'dev'), '/wordpress/ra-dev',
      '--blueprint', join(root, 'dev', 'blueprint.json'),
    ],
    { stdio },
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
  console.log('WordPress de test : http://127.0.0.1:9400/wp-admin/ (comptes dans le README)')
}
