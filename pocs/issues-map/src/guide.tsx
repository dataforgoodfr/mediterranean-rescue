// Captures d'écran de GitHub (dépôt public et tableau 44), prises le 22 novembre 2026, pour
// montrer dans la visite et l'aide à quoi ressemble chaque geste sur GitHub.
import { useState } from "react";
import epopee from "./guide/epopee.jpg";
import issueCote from "./guide/issue-cote.jpg";
import jePrends from "./guide/je-prends.jpg";
import prete from "./guide/prete.jpg";
import tableau from "./guide/tableau.jpg";

export type Shot = { src: string; alt: string; caption: string };

export const SHOTS = {
  epopee: {
    src: epopee,
    alt: "Capture de l'épopée Transparence (#12) sur GitHub, avec la liste de ses sous-issues",
    caption: "Sur GitHub, une épopée et la liste de ses sous-issues.",
  },
  tableau: {
    src: tableau,
    alt: "Capture du tableau 44 sur GitHub : colonnes Ready, In progress et In review",
    caption: "Le tableau 44 : Ready, ce sont les issues prêtes ; In progress, celles en cours.",
  },
  issueCote: {
    src: issueCote,
    alt: "Capture du côté droit d'une issue sur GitHub : personne assignée, étiquettes, statut sur le tableau",
    caption: "Sur l'issue, à droite : qui est dessus (Assignees) et son statut sur le tableau.",
  },
  prete: {
    src: prete,
    alt: "Capture de la liste « Prête à prendre » cochée dans une issue",
    caption: "Une issue prête a sa liste « Prête à prendre » cochée.",
  },
  jePrends: {
    src: jePrends,
    alt: "Capture d'un commentaire « Je prends », suivi de l'assignation et du passage de Ready à In progress",
    caption: "Un bénévole écrit « Je prends », il est assigné, l'issue passe en In progress.",
  },
} satisfies Record<string, Shot>;

/** Une capture de GitHub, qu'un clic agrandit (les vignettes sont trop petites pour être lues). */
export function Figure({ shot }: { shot: Shot }) {
  const [zoom, setZoom] = useState(false);
  return (
    <figure className={zoom ? "shot is-zoomed" : "shot"}>
      <button type="button" className="shot-btn" onClick={() => setZoom(!zoom)} aria-expanded={zoom} aria-label={zoom ? "Réduire la capture" : "Agrandir la capture"}>
        <img src={shot.src} alt={shot.alt} loading="lazy" />
      </button>
      <figcaption>
        {shot.caption} <span className="shot-hint">{zoom ? "Clique pour réduire." : "Clique pour agrandir."}</span>
      </figcaption>
    </figure>
  );
}
