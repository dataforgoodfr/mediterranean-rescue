// Vérifie que maquettes.json colle encore à GitHub, avant chaque build (et donc chaque heure dans
// le workflow) : une pastille ne doit jamais pointer vers une issue qui n'existe pas, une planche
// ou une zone inconnue. Une erreur arrête le build ; un avertissement s'affiche seulement.
// Lancé par Node directement (types effacés, sans compilation) : `node scripts/check.ts`.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMA_ZONES } from "../src/schemas-data.ts";

type Raw = { number: number; title: string; state: string; type: string | null; parent: number | null };

const here = dirname(fileURLToPath(import.meta.url));
const snapshot: { issues: Raw[] } = JSON.parse(readFileSync(join(here, "..", "..", "..", "data", "issues-map", "snapshot.json"), "utf8"));
const maquettes: {
  boards: { id: string; kind?: string; width: number; height: number; ecran?: Record<string, unknown> }[];
  epics: { epic: number; boards: string[]; pins: { issue: number; board: string; x: number; y: number }[]; zones?: Record<string, number[]> }[];
} = JSON.parse(readFileSync(join(here, "..", "maquettes.json"), "utf8"));

const errors: string[] = [];
const warnings: string[] = [];
const byNumber = new Map(snapshot.issues.map((i) => [i.number, i]));
const boards = new Map(maquettes.boards.map((b) => [b.id, b]));

function epicOf(n: number): number | null {
  let cur = byNumber.get(n);
  while (cur) {
    if (cur.type === "Epic") return cur.number;
    cur = cur.parent ? byNumber.get(cur.parent) : undefined;
  }
  return null;
}

function issue(n: number, where: string, epic: number) {
  const i = byNumber.get(n);
  if (!i) return errors.push(`${where} : l'issue #${n} n'existe pas sur GitHub.`);
  const e = epicOf(n);
  if (e !== epic) warnings.push(`${where} : #${n} est rangée dans ${e ? `l'épopée #${e}` : "aucune épopée"}, pas dans #${epic}.`);
}

if (snapshot.issues.length === 0) errors.push("L'instantané ne contient aucune issue : GitHub n'a rien renvoyé.");

for (const e of maquettes.epics) {
  const epic = byNumber.get(e.epic);
  if (!epic || epic.type !== "Epic") errors.push(`Objectif #${e.epic} : ce n'est pas une épopée sur GitHub.`);
  for (const b of e.boards) if (!boards.has(b)) errors.push(`Objectif #${e.epic} : planche « ${b} » inconnue.`);
  for (const p of e.pins) {
    const b = boards.get(p.board);
    const where = `Objectif #${e.epic}, planche « ${p.board} »`;
    if (!b || !e.boards.includes(p.board)) errors.push(`${where} : la planche n'est pas dans cet objectif.`);
    else if (p.x < 0 || p.y < 0 || p.x > b.width || p.y > b.height) errors.push(`${where} : #${p.issue} est posée hors de la planche.`);
    issue(p.issue, where, e.epic);
  }
  for (const [zone, nums] of Object.entries(e.zones ?? {})) {
    const schema = e.boards.find((b) => boards.get(b)?.kind === "schema");
    const where = `Objectif #${e.epic}, zone « ${zone} »`;
    if (!schema || !SCHEMA_ZONES[schema]?.includes(zone)) errors.push(`${where} : zone inconnue du schéma.`);
    for (const n of nums) issue(n, where, e.epic);
  }
}

for (const b of maquettes.boards) {
  for (const [layer, nums] of Object.entries(b.ecran ?? {})) {
    if (!Array.isArray(nums)) continue;
    for (const n of nums) if (typeof n === "number" && !byNumber.has(n)) errors.push(`Écran « ${b.id} », ${layer} : l'issue #${n} n'existe pas.`);
  }
}

for (const w of warnings) console.log(`attention : ${w}`);
for (const e of errors) console.error(`erreur : ${e}`);
console.log(`check : ${errors.length} erreur(s), ${warnings.length} avertissement(s).`);
if (errors.length) process.exit(1);
