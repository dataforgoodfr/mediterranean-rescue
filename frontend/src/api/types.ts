// Les types de l'API ne s'écrivent pas directement ici à la main : ils viennent de src/api/schema.ts, généré
// depuis le schéma OpenAPI du backend (`pnpm api:types`, TECHNICAL.md). Si l'API change, ces
// types changent, et tsc montre chaque endroit du front à reprendre.
// Ce fichier peut en revanche définir des types dérivés ou simplifiés à partir de ceux du schéma.
import type { components } from './schema'

export type OperationPublic = components['schemas']['OperationPublic']

// Ce que la carte et sa fiche lisent d'une opération. Le reste du schéma n'est pas validé ici :
// un champ que l'écran ne lit pas ne peut pas le casser. Quand la fiche lira d'autres champs,
// il suffira de les ajouter à ce Pick.
export type MapOperation = Pick<
  OperationPublic,
  'id' | 'date' | 'latitude' | 'longitude' | 'port_disembarkation' | 'nb_survivor'
>
