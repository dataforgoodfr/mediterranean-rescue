// Les appels à l'API, un par fonction. Les composants les utilisent avec TanStack Query
// (useQuery), jamais avec fetch dans un useEffect. https://tanstack.com/query/latest
//
// Les types de l'API ne s'écrivent pas ici à la main : ils viennent de src/api/schema.ts, généré
// depuis le schéma OpenAPI du backend (`pnpm api:types`, TECHNICAL.md). Si l'API change, ces
// types changent, et tsc montre chaque endroit du front à reprendre. Ce qui arrive du réseau est
// de type `unknown` et se vérifie avant d'être utilisé (parse.ts) : jamais de `as`.
import type { components } from './api/schema'

export type Health = components['schemas']['Health']

export type OperationPublic = components['schemas']['OperationPublic']

// Ce que la carte et sa fiche lisent d'une opération. Le reste du schéma n'est pas validé ici :
// un champ que l'écran ne lit pas ne peut pas le casser. Quand la fiche lira d'autres champs,
// il suffira de les ajouter à ce Pick.
export type MapOperation = Pick<
  OperationPublic,
  'id' | 'date' | 'latitude' | 'longitude' | 'port_disembarkation' | 'nb_survivor'
>
