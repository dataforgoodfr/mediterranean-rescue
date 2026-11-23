// Le dessin d'un schéma de travail (les données sont dans schemas-data.ts).
import { SCHEMAS } from "./schemas-data";

export { SCHEMAS, slot, zoneOf } from "./schemas-data";

export function Schema({ id, used }: { id: string; used: ReadonlySet<string> }) {
  const def = SCHEMAS[id];
  if (!def) return null;
  return (
    <svg className="flow" viewBox={`0 0 ${def.width} ${def.height}`} role="img" aria-label={def.label}>
      <defs>
        <marker id={`flow-arrow-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="flow-arrow-head" />
        </marker>
      </defs>
      {def.arrows.map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} className="flow-line" markerEnd={`url(#flow-arrow-${id})`} />
      ))}
      {def.zones
        .filter((z) => !z.optional || used.has(z.id))
        .map((z) => (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={10} className={`flow-zone flow-${z.id}${z.dashed ? " flow-dashed" : ""}${used.has(z.id) ? "" : " flow-empty"}`} />
            <text x={z.x + 14} y={z.y + 26} className="flow-label">
              {z.label}
            </text>
            {z.hint && (
              <text x={z.x + 14} y={z.y + z.h - 14} className="flow-note">
                {z.hint}
              </text>
            )}
          </g>
        ))}
    </svg>
  );
}
