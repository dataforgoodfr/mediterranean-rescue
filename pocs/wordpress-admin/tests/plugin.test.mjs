// Ce que NOTRE plugin garantit en plus du contrat (contract.test.mjs), vérifié sur le WordPress de
// test lancé par `pnpm test`, avec ses données fictives (dev/seed.php) : une fiche incohérente ou
// non validée ne sort jamais, l'archivage, les rôles.
import { strict as assert } from 'node:assert'
import { describe, test } from 'node:test'
import { API, BASE, assertContract, get, publicList } from './helpers.mjs'

// Une session WordPress minimale : on garde les cookies d'une requête à l'autre.
class Session {
  cookies = new Map([['playground_auto_login_already_happened', '1']])

  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  async fetch(url, options = {}) {
    let res = await fetch(url, { ...options, redirect: 'manual', headers: { ...options.headers, cookie: this.header() } })
    for (let hops = 0; ; hops++) {
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(';')
        const i = pair.indexOf('=')
        this.cookies.set(pair.slice(0, i), pair.slice(i + 1))
      }
      const next = res.headers.get('location')
      if (!next || res.status < 300 || res.status >= 400 || hops > 5) return res
      res = await fetch(new URL(next, url), { redirect: 'manual', headers: { cookie: this.header() } })
    }
  }

  // Le compte se connecte par le formulaire de WordPress, puis récupère le jeton des appels à l'API.
  static async login(user, password) {
    const s = new Session()
    s.cookies.set('wordpress_test_cookie', 'WP%20Cookie%20check')
    const body = new URLSearchParams({ log: user, pwd: password, 'wp-submit': 'Log In', testcookie: '1' })
    await s.fetch(`${BASE}/wp-login.php`, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    const nonce = await (await s.fetch(`${BASE}/wp-admin/admin-ajax.php?action=rest-nonce`)).text()
    assert.match(nonce, /^[0-9a-f]{10}$/, `connexion de ${user} refusée`)
    s.nonce = nonce
    return s
  }

  async save(fields, intent, id = '') {
    const res = await this.fetch(`${API}/admin/operations${id ? `/${id}` : ''}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-wp-nonce': this.nonce },
      body: JSON.stringify({ fields, intent }),
    })
    return { status: res.status, body: await res.json() }
  }
}

// Comptes du site de test (dev/seed.php), fictifs.
const admin = () => Session.login('admin', 'password')
const validation = () => Session.login('validation', 'ra-test-valid-3Kp')
const saisie = () => Session.login('saisie', 'ra-test-saisie-7Qx')

const byId = async (id) => (await publicList('map-operations', '?per_page=100')).items.find((o) => o.operation_id === `op-${id}`)

const VALID = {
  operation_date: '2026-11-02', operation_type: 'rescue', latitude: '34.1', longitude: '15.2',
  nb_survivor: '48', male: '30', female: '18', under_18: '12', under_18_unacc: '9', under_5: '2',
}

describe('les données fictives et la lecture publique', () => {
  test('les données fictives sont chargées', async () => {
    for (const route of ['map-operations', 'map-other', 'ports', 'ships', 'glossary']) {
      assert.ok((await publicList(route)).items.length > 0, `${route} vide`)
    }
  })

  test("une fiche en attente de relecture n'en sort pas", async () => {
    const { items } = await publicList('map-operations')
    assert.ok(!items.some((o) => o.operation_date === '2026-10-27'), 'le transfert fictif en attente est sorti')
  })
})

describe('les contrôles avant publication', () => {
  test('une fiche incohérente est enregistrée mais pas publiée', async () => {
    const s = await validation()
    const { status, body } = await s.save({ ...VALID, male: '30', female: '30' }, 'publish')
    assert.equal(status, 200)
    assert.notEqual(body.item.status, 'publish')
    assert.ok(body.errors.codes.includes('men_women_over_total'), JSON.stringify(body.errors))
    assert.equal(await byId(body.item.id), undefined)
  })

  test('un port et un navire de débarquement à la fois sont refusés', async () => {
    const s = await validation()
    const ports = (await publicList('ports')).items
    const ships = (await publicList('ships')).items
    assert.ok(ports.length && ships.length)
    // L'écran envoie les identifiants WordPress : on les retrouve par le formulaire de l'écran.
    const page = await (await s.fetch(`${BASE}/wp-admin/edit.php?post_type=rsatlas_operation&page=rsatlas-operations`)).text()
    const data = JSON.parse(page.match(/window\.rsatlasOperations = (.*?);\n/s)[1])
    const { body } = await s.save({ ...VALID, port_disembarkation: String(data.ports[0].id), disembarkation_vessel: String(data.ships[0].id) }, 'publish')
    assert.ok(body.errors.codes.includes('port_and_ship'), JSON.stringify(body.errors))
    assert.notEqual(body.item.status, 'publish')
  })

  test('une valeur hors bornes est signalée sur son champ', async () => {
    const s = await validation()
    const { body } = await s.save({ ...VALID, latitude: '120' }, 'publish')
    assert.ok(body.errors.fields.latitude, JSON.stringify(body.errors))
    assert.notEqual(body.item.status, 'publish')
  })
})

describe('publier, archiver', () => {
  test('une fiche valide publiée sort dans l API, puis archivée ne garde que sa clé', async () => {
    const s = await validation()
    const published = await s.save(VALID, 'publish')
    assert.equal(published.body.item.status, 'publish', JSON.stringify(published.body.errors))
    const out = await byId(published.body.item.id)
    assert.ok(out, 'la fiche publiée ne sort pas')
    assertContract('MapOperation', out)
    assert.equal(out.nb_survivor, 48)

    const archived = await s.save({}, 'archive', published.body.item.id)
    assert.equal(archived.body.item.status, 'rsatlas_archived')
    const gone = await byId(published.body.item.id)
    assert.deepEqual(Object.keys(gone).sort(), ['_last_updated', '_status', 'operation_id'])
    assert.equal(gone._status, 'archived')
    assertContract('MapOperation', gone)
  })

  test('une fiche publiée qui devient incohérente repasse en relecture et sort de l API', async () => {
    const s = await validation()
    const { body } = await s.save(VALID, 'publish')
    const again = await s.save({ ...VALID, under_5: '20' }, 'save', body.item.id)
    assert.equal(again.body.item.status, 'pending')
    assert.equal(await byId(body.item.id), undefined)
  })
})

describe('les rôles', () => {
  test('Saisie ne peut pas publier', async () => {
    const s = await saisie()
    const { status } = await s.save(VALID, 'publish')
    assert.equal(status, 403)
  })

  test('Saisie envoie en relecture, et la fiche ne sort pas', async () => {
    const s = await saisie()
    const { status, body } = await s.save(VALID, 'submit')
    assert.equal(status, 200)
    assert.equal(body.item.status, 'pending')
    assert.equal(await byId(body.item.id), undefined)
  })

  test("sans connexion, les routes de l'admin sont fermées", async () => {
    const res = await get(`${API}/admin/operations`)
    assert.equal(res.status, 401)
  })

  test("l'administrateur garde l'accès (rôle créé à l'activation)", async () => {
    const s = await admin()
    const res = await s.fetch(`${API}/admin/operations`, { headers: { 'x-wp-nonce': s.nonce } })
    assert.equal(res.status, 200)
  })
})
