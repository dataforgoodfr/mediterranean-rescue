// Les cadres de la carte, en degrés : [ouest, sud, est, nord].
export type Bounds = [number, number, number, number]

// Ce que montre la carte à l'ouverture : la Méditerranée centrale, de la Libye à la Sicile. La
// carte s'ajuste pour la montrer en entier, quelle que soit la largeur de l'écran.
export const CENTRAL_MEDITERRANEAN: Bounds = [10, 30.5, 20, 38.5]

// Jusqu'où on peut la déplacer : la Méditerranée, de Gibraltar au Levant. Plus large que la vue
// d'ouverture, pour garder à portée les ports de débarquement du nord et de l'ouest (Marseille,
// Valence, Ravenne : docs/donnees.md, onglet Data_ports).
export const MEDITERRANEAN: Bounds = [-6, 29, 37, 46.5]
