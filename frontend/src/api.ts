// Les appels à l'API, un par fonction. Les composants les utilisent avec TanStack Query
// (useQuery), jamais avec fetch dans un useEffect. https://tanstack.com/query/latest
//
// Les types de l'API ne s'écrivent pas ici à la main : ils viennent de src/api/schema.ts, généré
// depuis le schéma OpenAPI du backend (`pnpm api:types`, TECHNICAL.md). Si l'API change, ces
// types changent, et tsc montre chaque endroit du front à reprendre. Ce qui arrive du réseau est
// de type `unknown` et se vérifie avant d'être utilisé (lire.ts) : jamais de `as`.
import type { components } from './api/schema'
import { estObjet } from './lire'

export type Sante = components['schemas']['Sante']

export async function getHealth(): Promise<Sante> {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error(`API : ${response.status}`)
  const corps: unknown = await response.json()
  if (!estObjet(corps) || corps.status !== 'ok') throw new Error('API : réponse inattendue')
  return { status: corps.status }
}
