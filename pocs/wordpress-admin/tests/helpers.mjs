// Outils communs aux tests : l'adresse du site, les appels anonymes, le contrat.
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parse } from 'yaml'

// Le site testé : le WordPress local de `pnpm test`, ou n'importe quel WordPress (RA_BASE).
export const BASE = (process.env.RA_BASE ?? 'http://127.0.0.1:9410').replace(/\/$/, '')
export const API = `${BASE}/wp-json/rescue-atlas/v1`

// Sans ce cookie, le WordPress de test (Playground) connecte d'office chaque visiteur comme admin
// en le redirigeant ; ailleurs, il ne change rien. La clé de lecture, si le site en demande une,
// vient de RA_API_KEY.
const headers = {
  cookie: 'playground_auto_login_already_happened=1',
  ...(process.env.RA_API_KEY ? { 'x-api-key': process.env.RA_API_KEY } : {}),
}
export const get = (url) => fetch(url, { headers, redirect: 'manual' })

export async function publicList(route, query = '') {
  const res = await get(`${API}/${route}${query}`)
  assert.equal(res.status, 200, `${route} : ${res.status}`)
  return {
    items: await res.json(),
    total: Number(res.headers.get('x-wp-total')),
    pages: Number(res.headers.get('x-wp-totalpages')),
  }
}

// Le contrat (contract/rescue-atlas.openapi.yaml) sert de référence : ses schémas valident les réponses.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contract = parse(readFileSync(join(root, 'contract', 'rescue-atlas.openapi.yaml'), 'utf8'))
const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(contract, 'contract')

export function assertContract(name, value) {
  const validate = ajv.getSchema(`contract#/components/schemas/${name}`)
  assert.ok(validate, `schéma ${name} absent du contrat`)
  assert.ok(validate(value), `${name} hors contrat : ${ajv.errorsText(validate.errors)}\n${JSON.stringify(value)}`)
}
