import { isRecord, isArray, isDateString } from '@/parse'
import { apiClient } from './client'
import type { components } from './schema'

export type OperationPublic = components['schemas']['OperationPublic']

// Ce que la carte et sa fiche lisent d'une opération. Le reste du schéma n'est pas validé ici :
// un champ que l'écran ne lit pas ne peut pas le casser. Quand la fiche lira d'autres champs,
// il suffira de les ajouter à ce Pick.
export type MapOperation = Pick<
  OperationPublic,
  'id' | 'date' | 'latitude' | 'longitude' | 'port_disembarkation' | 'nb_survivor'
>

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

export async function getOperations(): Promise<MapOperation[]> {
  const { response, data } = await apiClient.GET('/api/operations')
  if (!response.ok) throw new Error(`API: ${response.status}`)
  if (!isArray(data)) throw new Error('API: unexpected response')

  return data.map((item) => {
    const operation = parseOperation(item)
    if (operation === null) throw new Error('API: invalid operation')
    return operation
  })
}
