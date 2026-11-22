// L'instantané GitHub et les vignettes Penpot sont téléchargés dans data/issues-map/ à la racine
// du dépôt (ignoré par Git) : `pnpm snapshot` et `pnpm boards`.
import snapshot from "../../../data/issues-map/snapshot.json";
import maquettes from "../maquettes.json";

export type Issue = (typeof snapshot.issues)[number];

export const issues: Issue[] = snapshot.issues;
export const byNumber = new Map(issues.map((i) => [i.number, i]));
export const takenAt = new Date(snapshot.takenAt);
export const repoUrl = snapshot.source;
export const projectUrl = snapshot.project;

// Ordre du champ Status du tableau 44.
export const STATUSES: readonly string[] = ["Refinement", "Ready", "In progress", "In review", "Done", "Out"];
export const NO_STATUS = "Sans statut";
export const statusOf = (i: Issue) => i.status ?? NO_STATUS;
export const statusKey = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export const DOMAINS: readonly string[] = ["front", "back", "data"];

export const epics = issues.filter((i) => i.type === "Epic").sort((a, b) => a.number - b.number);
export const looseRoots = issues.filter((i) => i.parent === null && i.type !== "Epic");

/** Toutes les issues sous `n`, à toute profondeur. */
export function descendants(n: number): Issue[] {
  const out: Issue[] = [];
  const walk = (k: number) => {
    for (const c of byNumber.get(k)?.children ?? []) {
      const ci = byNumber.get(c);
      if (!ci) continue;
      out.push(ci);
      walk(c);
    }
  };
  walk(n);
  return out;
}

export function epicOf(i: Issue): Issue | null {
  let cur: Issue | undefined = i;
  while (cur) {
    if (cur.type === "Epic") return cur;
    cur = cur.parent ? byNumber.get(cur.parent) : undefined;
  }
  return null;
}

export const shortTitle = (t: string) => t.replace(/^Épopée\s*:\s*/, "");

export const isFreeReady = (i: Issue) => i.state === "OPEN" && i.status === "Ready" && i.assignees.length === 0;

// Quatre états en mots simples, pour la vue maquettes. Le statut exact du tableau reste affiché
// dans la fiche de l'issue.
export type Step = "faite" | "en-cours" | "a-prendre" | "a-preciser";
export const STEPS: readonly { key: Step; word: string }[] = [
  { key: "a-prendre", word: "à prendre" },
  { key: "en-cours", word: "en cours" },
  { key: "a-preciser", word: "à préciser" },
  { key: "faite", word: "faite" },
];
export function stepOf(i: Issue): Step {
  if (i.state === "CLOSED" || i.status === "Done") return "faite";
  if (i.status === "In progress" || i.status === "In review") return "en-cours";
  if (i.status === "Ready") return i.assignees.length ? "en-cours" : "a-prendre";
  return "a-preciser";
}
export const stepWord = (s: Step) => STEPS.find((x) => x.key === s)?.word ?? s;

// Maquettes (planches Penpot) et repères posés à la main.
export type Board = (typeof maquettes.boards)[number];
export type Pin = (typeof maquettes.epics)[number]["pins"][number];
export const penpot = maquettes.penpot;
export const boards = maquettes.boards;
export const placedEpics = maquettes.epics;

const images = import.meta.glob<string>("../../../data/issues-map/boards/*.png", { eager: true, query: "?url", import: "default" });
export const boardImage = (id: string) => images[`../../../data/issues-map/boards/${id}.png`];

export const penpotFileUrl = `${penpot.base}/#/workspace?team-id=${penpot.team}&file-id=${penpot.file}&page-id=${penpot.page}`;

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
export const formatDate = (d: Date) => dateFmt.format(d);
