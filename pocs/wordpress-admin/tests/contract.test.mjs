// Les critères d'acceptation de l'API de lecture, valables pour N'IMPORTE QUEL WordPress : notre
// plugin, un développement de leur webmaster, ou autre chose. Ils ne supposent aucune donnée.
//
//   RA_BASE=https://site-de-test.example pnpm test:contract
//   (RA_API_KEY=... si le site demande une clé de lecture)
//
// Ce qui est vérifié : chaque route répond, chaque élément suit le contrat
// (contract/rescue-atlas.openapi.yaml), la pagination et modified_after se comportent comme prévu.
import { strict as assert } from 'node:assert'
import { describe, test } from 'node:test'
import { API, assertContract, get, publicList } from './helpers.mjs'

const ROUTES = [
  ['map-operations', 'MapOperation'],
  ['map-other', 'MapEvent'],
  ['ports', 'Port'],
  ['ships', 'Ship'],
  ['glossary', 'GlossaryEntry'],
]

describe("le contrat de l'API de lecture", () => {
  for (const [route, name] of ROUTES) {
    test(`${route} : une liste, des en-têtes de pagination, chaque élément suit ${name}`, async () => {
      const { items, total, pages } = await publicList(route)
      assert.ok(Array.isArray(items), `${route} ne renvoie pas une liste`)
      assert.ok(Number.isInteger(total) && total >= items.length, 'en-tête X-WP-Total')
      assert.ok(Number.isInteger(pages), 'en-tête X-WP-TotalPages')
      for (const item of items) {
        assertContract(name, item)
      }
    })

    test(`${route} : modified_after ne renvoie que ce qui a changé après la date`, async () => {
      const all = await publicList(route)
      assert.equal((await publicList(route, '?modified_after=2099-01-01T00:00:00Z')).items.length, 0)
      assert.equal((await publicList(route, '?modified_after=2000-01-01T00:00:00Z')).total, all.total)
    })
  }

  test('per_page ne dépasse pas 100', async () => {
    const res = await get(`${API}/ports?per_page=101`)
    assert.equal(res.status, 400)
  })

  test('web-log-book suit le schéma WebLogBook', async () => {
    const res = await get(`${API}/web-log-book`)
    assert.equal(res.status, 200)
    assertContract('WebLogBook', await res.json())
  })
})
