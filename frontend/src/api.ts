// Les appels à l'API, un par fonction. Les composants les utilisent avec TanStack Query
// (useQuery), jamais avec fetch dans un useEffect. https://tanstack.com/query/latest
//
// Les types de l'API ne s'écrivent pas ici à la main : ils viennent de src/api/schema.ts, généré
// depuis le schéma OpenAPI du backend (`pnpm api:types`, TECHNICAL.md). Si l'API change, ces
// types changent, et tsc montre chaque endroit du front à reprendre. Ce qui arrive du réseau est
// de type `unknown` et se vérifie avant d'être utilisé (parse.ts) : jamais de `as`.
import type { components } from './api/schema'
import { isRecord, isArray, isDateString } from './parse'

export type Health = components['schemas']['Health']

export async function getHealth(): Promise<Health> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`API: ${response.status}`)
  const body: unknown = await response.json()
  if (!isRecord(body) || body.status !== 'ok') throw new Error('API: unexpected response')
  return { status: body.status }
}

export type OperationPublic = components['schemas']['OperationPublic']

// Ce que la carte et sa fiche lisent d'une opération. Le reste du schéma n'est pas validé ici :
// un champ que l'écran ne lit pas ne peut pas le casser. Quand la fiche lira d'autres champs,
// il suffira de les ajouter à ce Pick.
export type MapOperation = Pick<
  OperationPublic,
  'id' | 'date' | 'latitude' | 'longitude' | 'port_disembarkation' | 'nb_survivor'
>

export async function getOperations(): Promise<MapOperation[]> {
  const response = await fetch('/api/operations')
  if (!response.ok) throw new Error(`API: ${response.status}`)

  const body: unknown = await response.json()
  if (!isArray(body)) throw new Error('API: unexpected response')

  return body.map((item) => {
    const operation = parseOperation(item)
    if (operation === null) throw new Error('API: invalid operation')
    return operation
  })
}

function parseOperation(raw: unknown): MapOperation | null {
  if (!isRecord(raw)) return null
  const { id, date, latitude, longitude, port_disembarkation, nb_survivor } = raw
  if (typeof id !== 'number' || !isDateString(date)) return null
  if (latitude !== undefined && latitude !== null && typeof latitude !== 'number') return null
  if (longitude !== undefined && longitude !== null && typeof longitude !== 'number') return null
  if (
    port_disembarkation !== undefined &&
    port_disembarkation !== null &&
    typeof port_disembarkation !== 'string'
  ) {
    return null
  }
  if (nb_survivor !== undefined && nb_survivor !== null && typeof nb_survivor !== 'number')
    return null

  return { id, date, latitude, longitude, port_disembarkation, nb_survivor }
}
