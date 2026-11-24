import { getOperations } from '@/api'
import { describe, expect, test, vi } from 'vitest'

const mockFetch = (body: unknown, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => Response.json(body, { status })),
  )
}

// Une opération complète de l'API : la carte n'en lit qu'une partie.
const operation = {
  id: 1,
  date: '2026-11-03',
  nb_ops: 1,
  operation_type: 'rescue',
  latitude: 34.5,
  longitude: 15.2,
  port_disembarkation: 'La Valette',
  nb_survivor: 38,
}

describe('getOperations', () => {
  test('garde les champs lus par la carte', async () => {
    mockFetch([operation])
    expect(await getOperations()).toEqual([
      {
        id: 1,
        date: '2026-11-03',
        latitude: 34.5,
        longitude: 15.2,
        port_disembarkation: 'La Valette',
        nb_survivor: 38,
      },
    ])
  })

  test('accepte une position, un port et un nombre inconnus', async () => {
    mockFetch([
      {
        ...operation,
        latitude: null,
        longitude: null,
        port_disembarkation: null,
        nb_survivor: null,
      },
    ])
    expect(await getOperations()).toEqual([
      {
        id: 1,
        date: '2026-11-03',
        latitude: null,
        longitude: null,
        port_disembarkation: null,
        nb_survivor: null,
      },
    ])
  })

  test('ignore un champ que la carte ne lit pas', async () => {
    mockFetch([{ ...operation, operation_type: 'medical_evacuation', nb_ops: 3 }])
    expect(await getOperations()).toHaveLength(1)
  })

  test('refuse une opération sans identifiant', async () => {
    mockFetch([{ date: '2026-11-03' }])
    await expect(getOperations()).rejects.toThrow('API: invalid operation')
  })

  test('refuse une date illisible', async () => {
    mockFetch([{ ...operation, date: 'nope' }])
    await expect(getOperations()).rejects.toThrow('API: invalid operation')
  })

  test("refuse une réponse qui n'est pas une liste", async () => {
    mockFetch({})
    await expect(getOperations()).rejects.toThrow('API: unexpected response')
  })

  test("signale une erreur de l'API", async () => {
    mockFetch([], 500)
    await expect(getOperations()).rejects.toThrow('API: 500')
  })
})
