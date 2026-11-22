// L'état de la vue vit dans l'adresse (#maquettes?o=11&i=58&e=a-prendre&j=P0 · MVP) : un lien
// s'envoie tel quel, un rechargement garde la vue, le bouton Retour revient à l'objectif d'avant.
// Seule la partie après « # » est lue : c'est aussi la seule qu'un Artifact transmet à la page.
import { type Step, byNumber, epics, MILESTONES, STEPS } from "./data";

export type Tab = "maquettes" | "relire" | "liste";
export type View = { tab: Tab; epic: number; issue: number | null; focus: Step | null; jalon: string | null; done: boolean };

export function readView(fallbackEpic: number): View {
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const q = new URLSearchParams(query);
  const o = Number(q.get("o"));
  const i = Number(q.get("i"));
  const j = q.get("j");
  return {
    tab: path === "liste" ? "liste" : path === "relire" ? "relire" : "maquettes",
    epic: epics.some((e) => e.number === o) ? o : fallbackEpic,
    issue: byNumber.has(i) ? i : null,
    focus: STEPS.find((s) => s.key === q.get("e"))?.key ?? null,
    jalon: MILESTONES.some((m) => m.title === j) ? j : null,
    done: q.get("f") === "1",
  };
}

export function viewHash(v: View) {
  if (v.tab === "liste") return "#liste";
  if (v.tab === "relire") return "#relire";
  const q = new URLSearchParams({ o: String(v.epic) });
  if (v.issue) q.set("i", String(v.issue));
  if (v.focus) q.set("e", v.focus);
  if (v.jalon) q.set("j", v.jalon);
  if (v.done) q.set("f", "1");
  return `#maquettes?${q}`;
}

/** Écrit la vue dans l'adresse : une entrée d'historique quand l'onglet ou l'objectif change. */
export function writeView(v: View, push: boolean) {
  const h = viewHash(v);
  if (h === location.hash) return;
  try {
    if (push) history.pushState(null, "", h);
    else history.replaceState(null, "", h);
  } catch {
    // Certains cadres refusent l'historique : la vue marche quand même, sans lien partageable.
  }
}
