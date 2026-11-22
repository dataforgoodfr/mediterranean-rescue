// Le vocabulaire de GitHub, gardé tel quel : les bénévoles l'apprennent ici et le retrouveront sur
// d'autres projets. Chaque mot souligné en pointillés s'explique au survol, au focus ou au toucher.
import { type ReactNode, useId, useState } from "react";

export const LEXIQUE = {
  issue: {
    mot: "issue",
    def: "Une tâche du projet sur GitHub : un besoin, ce qu'il faut faire, et la discussion autour. Chaque issue a un numéro, comme #17.",
  },
  epic: {
    mot: "épopée (Epic)",
    def: "Une grande issue qui regroupe d'autres issues, ses sous-issues. Ici, chaque objectif est une épopée.",
  },
  subissue: {
    mot: "sous-issue",
    def: "Une issue rangée sous une autre, plus petite. Sur GitHub, on la voit dans la liste « Sub-issues » de l'issue parente.",
  },
  milestone: {
    mot: "jalon (Milestone)",
    def: "Un lot d'issues à livrer ensemble, avec une date. P0 · MVP est le premier lot, puis P1, P2, P3.",
  },
  mvp: {
    mot: "MVP",
    def: "Minimum Viable Product : la première version utile, la plus simple possible, qu'on peut montrer et tester.",
  },
  project: {
    mot: "tableau (Project)",
    def: "Le tableau de suivi de GitHub (ici le tableau 44). Chaque issue y a un statut : Refinement, Ready, In progress, In review, Done.",
  },
  refinement: { mot: "Refinement", def: "Statut du tableau : l'issue n'est pas encore prête, il manque une décision ou une information." },
  ready: { mot: "Ready", def: "Statut du tableau : l'issue est prête, quelqu'un peut la prendre." },
  inprogress: { mot: "In progress", def: "Statut du tableau : quelqu'un travaille dessus." },
  inreview: { mot: "In review", def: "Statut du tableau : le travail est fait et attend la relecture d'un tech lead." },
  done: { mot: "Done", def: "Statut du tableau : terminé." },
  iteration: { mot: "itération", def: "Une période de deux semaines environ : ce que l'équipe vise sur ce créneau." },
  assignee: {
    mot: "assigner (Assignees)",
    def: "Mettre son nom sur une issue pour dire « je m'en occupe ». Sur GitHub, c'est la case Assignees, à droite de l'issue.",
  },
  blocked: {
    mot: "bloquée (Blocked by)",
    def: "L'issue attend qu'une autre soit finie d'abord. GitHub l'indique par « Blocked by » en haut de l'issue.",
  },
  label: { mot: "étiquette (Label)", def: "Un mot-clé posé sur une issue pour la ranger : front, back, data, design…" },
  front: { mot: "front", def: "La partie du site que le public voit et utilise dans son navigateur : pages, carte, boutons." },
  back: { mot: "back-end", def: "La partie invisible : le serveur et la base de données qui fournissent les informations au site." },
  api: { mot: "API", def: "La porte par laquelle le site demande les données au serveur, par exemple la liste des opérations." },
  fictives: {
    mot: "données fictives",
    def: "Des données inventées, au même format que les vraies, pour construire et tester sans toucher aux données réelles de SOS.",
  },
  pr: {
    mot: "pull request (PR)",
    def: "La proposition d'un changement de code. Un tech lead la relit, puis la fusionne dans le projet.",
  },
  branch: { mot: "branche", def: "Une copie de travail du code, où l'on change des choses sans gêner les autres. On part de main, la version de référence." },
  penpot: { mot: "Penpot", def: "L'outil de dessin où l'équipe design fait les maquettes des écrans." },
} as const;

export type TermKey = keyof typeof LEXIQUE;

/** Un mot de GitHub souligné en pointillés, expliqué au survol, au focus ou au toucher. */
export function Term({ t, children }: { t: TermKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const entry = LEXIQUE[t];
  return (
    <span className="term" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="term-btn"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {children ?? entry.mot}
      </button>
      <span id={id} role="tooltip" className="helptip-bubble term-bubble" data-open={open}>
        <strong>{entry.mot}</strong> : {entry.def}
      </span>
    </span>
  );
}

/** Le lexique complet, dans l'aide. */
export function Lexique() {
  return (
    <dl className="lexique">
      {Object.values(LEXIQUE).map((e) => (
        <div key={e.mot}>
          <dt>{e.mot}</dt>
          <dd>{e.def}</dd>
        </div>
      ))}
    </dl>
  );
}
