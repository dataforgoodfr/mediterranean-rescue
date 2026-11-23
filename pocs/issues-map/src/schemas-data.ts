// Les schémas de travail, en données pures (sans JSX) : lus par Schemas.tsx pour le dessin et par
// scripts/check.ts pour vérifier maquettes.json. Les étapes sont déduites des titres d'issues : à
// faire vérifier par l'équipe produit.

export type Zone = {
  id: string;
  label: string;
  hint?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Une zone qui ne se dessine que si l'objectif y pose une issue. */
  optional?: boolean;
  dashed?: boolean;
};

export type SchemaDef = {
  label: string;
  width: number;
  height: number;
  zones: readonly Zone[];
  arrows: readonly [number, number, number, number][];
  /** Ce qu'il faut savoir sur ce schéma, affiché sous les planches. */
  note: string;
};

export const SCHEMAS: Record<string, SchemaDef> = {
  donnee: {
    label: "Schéma du chemin de la donnée, des sources de SOS à la carte publique",
    width: 1000,
    height: 590,
    zones: [
      { id: "journal", label: "Journal de bord", x: 20, y: 20, w: 230, h: 100 },
      { id: "kobo", label: "Formulaires Kobo", x: 20, y: 135, w: 230, h: 84 },
      { id: "monster", label: "« The Monster »", x: 20, y: 234, w: 230, h: 84 },
      { id: "ancienne-carte", label: "Ancienne carte 2016-2024", x: 20, y: 333, w: 230, h: 100 },
      { id: "ais", label: "Positions AIS des navires", x: 20, y: 448, w: 230, h: 92 },
      { id: "base", label: "Base de données", x: 300, y: 150, w: 180, h: 130 },
      { id: "back-office", label: "Back-office : vérifier, publier", x: 530, y: 20, w: 270, h: 240 },
      { id: "carte", label: "Carte publique", x: 840, y: 110, w: 140, h: 150, dashed: true },
      { id: "analyses", label: "Enquêtes et analyses", x: 300, y: 360, w: 500, h: 110 },
      { id: "processus", label: "Le travail de SOS", x: 840, y: 360, w: 140, h: 110 },
      { id: "chaine", label: "Toute la chaîne", x: 300, y: 490, w: 680, h: 80, optional: true },
    ],
    arrows: [
      [250, 70, 300, 185],
      [250, 177, 300, 200],
      [250, 276, 300, 230],
      [250, 383, 300, 255],
      [480, 215, 530, 215],
      [800, 170, 840, 170],
      [390, 280, 390, 360],
    ],
    note: "Pas encore de maquette du back-office (#104) : ce schéma de travail range les issues par étape du chemin de la donnée. La cybersécurité s'y pose en calque. À faire vérifier par l'équipe produit.",
  },
  contribution: {
    label: "Schéma du chemin d'une contribution, de l'issue au site en ligne",
    width: 1000,
    height: 290,
    zones: [
      { id: "benevole", label: "Bénévole", hint: "prend une issue Ready", x: 20, y: 30, w: 150, h: 220 },
      { id: "depot", label: "Le dépôt", hint: "suit CONTRIBUTING", x: 190, y: 30, w: 150, h: 220 },
      { id: "branche", label: "Branche et PR", hint: "feat/8-ma-carte", x: 360, y: 30, w: 150, h: 220 },
      { id: "ci", label: "CI et relecture", hint: "tests, tech lead", x: 530, y: 30, w: 150, h: 220 },
      { id: "main", label: "main et staging", hint: "fusion en squash", x: 700, y: 30, w: 130, h: 220 },
      { id: "site", label: "Le site", hint: "vu du public", x: 850, y: 30, w: 130, h: 220, dashed: true },
    ],
    arrows: [
      [170, 140, 190, 140],
      [340, 140, 360, 140],
      [510, 140, 530, 140],
      [680, 140, 700, 140],
      [830, 140, 850, 140],
    ],
    note: "Schéma de travail : chaque issue du socle est posée sur l'étape qu'elle a mise en place. C'est aussi le chemin que suit toute contribution d'un bénévole.",
  },
  plaidoyer: {
    label: "Schéma du parcours d'un lecteur, de la carte à l'argument",
    width: 1000,
    height: 270,
    zones: [
      { id: "operation", label: "Une opération", hint: "le détail de l'événement", x: 20, y: 30, w: 220, h: 200 },
      { id: "acteurs", label: "Qui a fait quoi", hint: "garde-côtes, États, navires", x: 270, y: 30, w: 220, h: 200 },
      { id: "droit", label: "Le droit", hint: "droit maritime, politiques", x: 520, y: 30, w: 220, h: 200 },
      { id: "attentes", label: "Ce qu'ils attendent", hint: "journalistes, ONG, SOS", x: 770, y: 30, w: 210, h: 200, dashed: true },
    ],
    arrows: [
      [240, 130, 270, 130],
      [490, 130, 520, 130],
    ],
    note: "Schéma de travail : le parcours d'un journaliste ou d'une ONG qui creuse une opération. La recherche utilisateur nourrit tout le parcours.",
  },
};

const STEP = 40;

/** Position du n-ième repère d'une zone : en lignes, sous le titre de la zone. */
export function slot(zone: Zone, n: number) {
  const perRow = Math.max(1, Math.floor((zone.w - 24) / STEP));
  return { x: zone.x + 30 + (n % perRow) * STEP, y: zone.y + 58 + Math.floor(n / perRow) * STEP };
}

export function zoneOf(schemaId: string, zoneId: string) {
  return SCHEMAS[schemaId]?.zones.find((z) => z.id === zoneId);
}

/** Les zones de chaque schéma, pour la vérification. */
export const SCHEMA_ZONES: Record<string, string[]> = Object.fromEntries(
  Object.entries(SCHEMAS).map(([id, def]) => [id, def.zones.map((z) => z.id)]),
);
