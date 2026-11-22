import { useEffect, useRef } from "react";
import { formatDate, penpot, projectUrl, repoUrl, STEPS, takenAt } from "./data";
import { Figure, SHOTS } from "./guide";
import { Lexique } from "./lexique";

const MEANING: Record<string, string> = {
  "a-prendre": "Prête (Ready sur le tableau) et personne dessus. C'est là qu'un bénévole peut commencer.",
  "en-cours": "Quelqu'un y travaille : In progress, In review, ou Ready avec une personne assignée.",
  bloquee: "Ready, mais elle attend qu'une autre issue soit finie (Blocked by sur GitHub).",
  "a-preciser": "Refinement : l'équipe produit doit encore la préciser avant qu'on la prenne.",
  faite: "Fermée, ou Done sur le tableau.",
};

/** Le panneau d'aide : comment lire la page et comment prendre une issue. */
export function Help({ open, onClose, onTour }: { open: boolean; onClose: () => void; onTour: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="help"
      aria-labelledby="help-title"
      onClose={onClose}
      onClick={(e) => {
        // Un clic sur le fond (hors du panneau) ferme l'aide.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="help-inner">
        <div className="help-head">
          <h2 id="help-title">Comment lire l'atlas</h2>
          <button type="button" className="fiche-close" onClick={onClose} aria-label="Fermer l'aide">
            ×
          </button>
        </div>

        <section>
          <h3>En trois gestes</h3>
          <ol className="help-steps">
            <li>
              <strong>Choisis un objectif</strong> en haut : chaque bouton regroupe une épopée.
            </li>
            <li>
              <strong>Regarde les pastilles</strong> sur les écrans : chaque numéro est une issue, posée là où elle change
              l'écran.
            </li>
            <li>
              <strong>Clique sur une pastille</strong> : sa fiche dit qui est dessus et ce que tu peux faire.
            </li>
          </ol>
        </section>

        <section>
          <h3>Ce qu'on fait en premier</h3>
          <p>
            Les jalons rangent le travail dans l'ordre : P0 · MVP d'abord, puis P1, P2, P3. Un clic sur un jalon estompe tout
            ce qui n'en fait pas partie, sur tous les objectifs.
          </p>
        </section>

        <section>
          <h3>Ce qu'il faut pour un écran</h3>
          <p>
            Sous chaque maquette, cinq lignes : la source des données réelles, les données fictives, la maquette (validée
            ou non), les tickets d'API back-end et ceux du front. « inconnu » veut dire que personne ne l'a encore renseigné.
          </p>
        </section>

        <section>
          <h3>Les quatre couleurs</h3>
          <dl className="help-states">
            {STEPS.map((s) => (
              <div key={s.key} className={`st-${s.key}`}>
                <dt>{s.word}</dt>
                <dd>{MEANING[s.key]}</dd>
              </div>
            ))}
          </dl>
          <Figure shot={SHOTS.tableau} />
        </section>

        <section>
          <h3>Prendre une issue</h3>
          <ol className="help-steps">
            <li>
              Choisis une issue rouge, « à prendre ». Si sa fiche dit « Attend d'abord », commence par l'autre.
              <Figure shot={SHOTS.prete} />
            </li>
            <li>
              Sur GitHub, commente « Je prends », puis assigne-la-toi (lien « assign yourself », à droite).
              <Figure shot={SHOTS.jePrends} />
            </li>
            <li>Crée ta branche depuis main, code, puis ouvre ta pull request.</li>
            <li>Un tech lead relit et fusionne. Bloqué ? Écris-le sur l'issue ou sur Mattermost.</li>
          </ol>
          <p>
            Le détail est dans{" "}
            <a href={`${repoUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
              CONTRIBUTING.md
            </a>
            .
          </p>
        </section>

        <section>
          <h3>Le vocabulaire de GitHub</h3>
          <p>
            L'atlas garde les mots de GitHub, pour qu'ils te servent aussi sur d'autres projets. Un mot souligné en pointillés
            s'explique quand on le survole ou le touche. Les voici tous :
          </p>
          <Lexique />
        </section>

        <section>
          <h3>D'où viennent les données</h3>
          <p>
            Les issues sont lues sur GitHub (
            <a href={repoUrl} target="_blank" rel="noreferrer">
              dépôt
            </a>{" "}
            et{" "}
            <a href={projectUrl} target="_blank" rel="noreferrer">
              tableau 44
            </a>
            ) le {formatDate(takenAt)}. Les écrans sont les maquettes Penpot « {penpot.fileName} ». L'atlas ne fait que lire :
            une issue se modifie sur GitHub.
          </p>
          <p className="muted small">Raccourcis : « ? » ouvre cette aide, Échap ferme une fiche ou un panneau.</p>
        </section>

        <div className="help-foot">
          <button
            type="button"
            className="btn"
            onClick={() => {
              onClose();
              onTour();
            }}
          >
            Revoir la visite guidée
          </button>
        </div>
      </div>
    </dialog>
  );
}
