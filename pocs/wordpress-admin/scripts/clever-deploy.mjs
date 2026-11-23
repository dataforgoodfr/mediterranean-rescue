// Déploie le site de test commun sur Clever Cloud : WordPress (en français, même version que SOS
// MEDITERRANEE), le plugin construit, et le script qui l'installe au démarrage. Le dossier
// déployé est assemblé dans .clever-deploy/ (hors Git), puis poussé avec `clever deploy`.
// Créer l'application, une fois, et la détruire : GUIDE.md, « Le site de test commun ».
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WP_VERSION } from './server.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP = process.env.RA_CLEVER_APP ?? 'rescue-atlas-wp-test'
const ORG = 'SOS MEDITERRANEE'
// Archive officielle en français, et son empreinte publiée (…tar.gz.sha1), relevée le 23/11/2026.
const ARCHIVE = `wordpress-${WP_VERSION}-fr_FR.tar.gz`
const ARCHIVE_SHA1 = 'b4b4d139e2351fded6c5fd8b5c36cb07dfb3b6dc'

const run = (cmd, args, cwd = out) => execFileSync(cmd, args, { cwd, stdio: 'inherit' })

if (!existsSync(join(root, 'plugin', 'rescue-atlas-admin', 'build', 'operations.js'))) {
  throw new Error("L'écran n'est pas construit : lance `pnpm deploy:clever`, qui le construit d'abord.")
}

// 1. WordPress, téléchargé une fois et vérifié.
const cache = join(root, '.clever-deploy-cache')
const archive = join(cache, ARCHIVE)
mkdirSync(cache, { recursive: true })
if (!existsSync(archive)) {
  const response = await fetch(`https://fr.wordpress.org/${ARCHIVE}`)
  if (!response.ok) throw new Error(`Téléchargement de ${ARCHIVE} : ${response.status}`)
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()))
}
const sha1 = createHash('sha1').update(readFileSync(archive)).digest('hex')
if (sha1 !== ARCHIVE_SHA1) {
  rmSync(archive)
  throw new Error(`Empreinte inattendue pour ${ARCHIVE} : ${sha1}`)
}

// 2. Le dossier déployé : web/ est servi (CC_WEBROOT=/web), setup/ ne l'est pas.
const out = join(root, '.clever-deploy')
rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'web'), { recursive: true })
run('tar', ['-xzf', archive, '--strip-components=1', '-C', join(out, 'web')])
const clever = join(root, 'deploy', 'clever')
cpSync(join(clever, 'wp-config.php'), join(out, 'web', 'wp-config.php'))
cpSync(join(clever, '.htaccess'), join(out, 'web', '.htaccess'))
cpSync(join(root, 'plugin', 'rescue-atlas-admin'), join(out, 'web', 'wp-content', 'plugins', 'rescue-atlas-admin'), {
  recursive: true,
  filter: (source) => !source.endsWith('.DS_Store'),
})
mkdirSync(join(out, 'setup'))
cpSync(join(clever, 'setup.php'), join(out, 'setup', 'setup.php'))
cpSync(join(root, 'dev', 'seed.php'), join(out, 'setup', 'seed.php'))

// 3. Un dépôt Git jetable, poussé vers l'application.
run('git', ['init', '-q', '-b', 'main'])
run('git', ['add', '-A'])
run('git', ['-c', 'user.name=Rescue Atlas deploy', '-c', 'user.email=deploy@example.test', 'commit', '-qm', `WordPress ${WP_VERSION} et Rescue Atlas Admin`])
run('clever', ['link', APP, '--org', ORG])
run('clever', ['deploy', '--force'])
console.log(`Déployé sur ${APP}. Vérifier : RA_BASE=<adresse du site> pnpm test:contract`)
