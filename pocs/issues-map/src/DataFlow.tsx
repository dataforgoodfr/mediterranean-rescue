// Schéma de travail du chemin de la donnée, pour poser les issues de Data management faute de
// maquette du back-office. Les étapes sont déduites des titres d'issues : à faire vérifier.
// Coordonnées dans un repère de 1000 × 560.

export const FLOW_WIDTH = 1000;
export const FLOW_HEIGHT = 560;

export type Zone = { id: string; label: string; x: number; y: number; w: number; h: number };

export const ZONES: readonly Zone[] = [
  { id: "journal", label: "Journal de bord", x: 20, y: 20, w: 230, h: 100 },
  { id: "kobo", label: "Formulaires Kobo", x: 20, y: 135, w: 230, h: 84 },
  { id: "monster", label: "« The Monster »", x: 20, y: 234, w: 230, h: 84 },
  { id: "ancienne-carte", label: "Ancienne carte 2016-2024", x: 20, y: 333, w: 230, h: 100 },
  { id: "ais", label: "Positions AIS des navires", x: 20, y: 448, w: 230, h: 92 },
  { id: "base", label: "Base de données", x: 300, y: 150, w: 180, h: 130 },
  { id: "back-office", label: "Back-office : vérifier, publier", x: 530, y: 20, w: 270, h: 240 },
  { id: "carte", label: "Carte publique", x: 840, y: 110, w: 140, h: 130 },
  { id: "analyses", label: "Enquêtes et analyses", x: 300, y: 360, w: 500, h: 110 },
  { id: "processus", label: "Le travail de SOS", x: 840, y: 360, w: 140, h: 140 },
];

const STEP = 40;

/** Position du n-ième repère d'une zone : en lignes, sous le titre de la zone. */
export function slot(zone: Zone, n: number) {
  const perRow = Math.max(1, Math.floor((zone.w - 24) / STEP));
  return { x: zone.x + 30 + (n % perRow) * STEP, y: zone.y + 58 + Math.floor(n / perRow) * STEP };
}

const ARROWS: readonly [number, number, number, number][] = [
  [250, 70, 300, 185],
  [250, 177, 300, 200],
  [250, 276, 300, 230],
  [250, 383, 300, 255],
  [480, 215, 530, 215],
  [800, 170, 840, 170],
  [390, 280, 390, 360],
];

export function DataFlow() {
  return (
    <svg className="flow" viewBox={`0 0 ${FLOW_WIDTH} ${FLOW_HEIGHT}`} role="img" aria-label="Schéma du chemin de la donnée, des sources de SOS à la carte publique">
      <defs>
        <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="flow-arrow-head" />
        </marker>
      </defs>
      {ARROWS.map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} className="flow-line" markerEnd="url(#flow-arrow)" />
      ))}
      {ZONES.map((z) => (
        <g key={z.id}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={10} className={`flow-zone flow-${z.id}`} />
          <text x={z.x + 14} y={z.y + 26} className="flow-label">
            {z.label}
          </text>
        </g>
      ))}
      <text x={850} y={262} className="flow-note">
        objectif Transparence
      </text>
    </svg>
  );
}
