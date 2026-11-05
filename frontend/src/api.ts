// Les appels à l'API, un par fonction. Les composants les utilisent avec TanStack Query
// (useQuery), jamais avec fetch dans un useEffect. https://tanstack.com/query/latest
//
// Ce qui arrive du réseau est de type `unknown` et se vérifie avant d'être utilisé (lire.ts) :
// jamais de `as` pour faire passer une réponse pour ce qu'on attend.
import { estObjet } from './lire'

export type Health = { status: string }

export async function getHealth(): Promise<Health> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`API : ${response.status}`)
  const corps: unknown = await response.json()
  if (!estObjet(corps) || typeof corps.status !== 'string') throw new Error('API : réponse inattendue')
  return { status: corps.status }
}
