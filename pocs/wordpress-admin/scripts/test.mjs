// Lance un WordPress de test sur un port à part, attend qu'il réponde, passe les tests, l'arrête.
// Une commande : `pnpm test`. Aucun Docker, aucune base à installer.
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startServer } from './server.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 9410
const BASE = `http://127.0.0.1:${PORT}`

const server = startServer({ port: PORT, stdio: 'ignore' })
const stop = () => server.kill()
process.on('exit', stop)

// Le premier lancement télécharge WordPress : on laisse jusqu'à 3 minutes.
const deadline = Date.now() + 180_000
let ready = false
while (Date.now() < deadline) {
  try {
    // Prêt quand le plugin est actif et les données fictives chargées : la liste des ports est remplie.
    const res = await fetch(`${BASE}/wp-json/rescue-atlas/v1/ports`, {
      redirect: 'manual',
      headers: { cookie: 'playground_auto_login_already_happened=1' },
    })
    if (res.status === 200 && (await res.json()).length > 0) { ready = true; break }
  } catch { /* pas encore prêt */ }
  await new Promise((r) => setTimeout(r, 2000))
}
if (!ready) {
  console.error(`Le WordPress de test ne répond pas sur ${BASE}.`)
  process.exit(1)
}

const tests = spawn(process.execPath, ['--test', '--test-concurrency=1', join(root, 'tests')], {
  stdio: 'inherit',
  env: { ...process.env, RA_BASE: BASE },
})
tests.on('exit', (code) => { stop(); process.exit(code ?? 1) })
