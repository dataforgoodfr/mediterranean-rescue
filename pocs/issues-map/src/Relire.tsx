// « À relire » : le chemin de qui ne code pas. Ce qui attend un avis, une réponse métier ou une
// validation, avec ce qu'on attend de la personne et où répondre.
import { type Issue, epicOf, issues, shortTitle, stepOf, stepWord } from "./data";
import { Term } from "./lexique";

const MATTERMOST_SOS = "https://mattermost.services.dataforgood.fr/data-for-good/channels/15-mediterranean-rescue_sos-med";

const hasLabel = (i: Issue, l: string) => i.labels.some((x) => x.name === l);
const open = issues.filter((i) => i.state === "OPEN" && i.type !== "Epic" && i.status !== "Out");

function Item({ i }: { i: Issue }) {
  const ep = epicOf(i);
  const step = stepOf(i);
  return (
    <li className={`relire-item st-${step}`}>
      <div className="relire-main">
        <p className="relire-title">
          <span className="num">#{i.number}</span> {i.title}
        </p>
        <p className="meta">
          <span className="status-word step-word">{stepWord(step)}</span>
          {ep && <span>{shortTitle(ep.title)}</span>}
          <span>{i.assignees.length ? i.assignees.map((a) => `@${a}`).join(", ") : "personne dessus"}</span>
        </p>
      </div>
      <div className="relire-actions">
        {ep && (
          <a className="btn btn-quiet" href={`#maquettes?o=${ep.number}&i=${i.number}`}>
            Voir dans l'atlas
          </a>
        )}
        <a className="btn" href={i.url} target="_blank" rel="noreferrer">
          Répondre sur GitHub
        </a>
      </div>
    </li>
  );
}

export function RelireView() {
  const toValidate = open.filter((i) => hasLabel(i, "design") || hasLabel(i, "UX research"));
  const questions = open.filter((i) => stepOf(i) === "a-preciser" && !toValidate.includes(i));
  const byEpic = new Map<string, Issue[]>();
  for (const i of questions) {
    const key = epicOf(i) ? shortTitle(epicOf(i)?.title ?? "") : "Hors objectif";
    byEpic.set(key, [...(byEpic.get(key) ?? []), i]);
  }

  return (
    <div className="relire">
      <header className="relire-head">
        <h2>À relire : ce qui attend un avis</h2>
        <p className="lede">
          Pas besoin de coder ici. Ces <Term t="issue">issues</Term> attendent une validation, une réponse métier ou un
          retour d'usage. Lis l'issue, puis réponds en commentaire sur GitHub. Tu préfères écrire ailleurs ? Le canal{" "}
          <a href={MATTERMOST_SOS} target="_blank" rel="noreferrer">
            SOS Med sur Mattermost
          </a>{" "}
          est fait pour ça.
        </p>
      </header>

      <section className="relire-section" aria-labelledby="relire-maquettes">
        <h3 id="relire-maquettes">Maquettes et recherche utilisateur ({toValidate.length})</h3>
        <p className="relire-ask">
          Ce qu'on attend de toi : regarder la maquette dans <Term t="penpot">Penpot</Term> ou le compte rendu, et dire sur
          l'issue si ça correspond à ce que fait SOS MEDITERRANEE.
        </p>
        <ul className="relire-list">
          {toValidate.map((i) => (
            <Item key={i.number} i={i} />
          ))}
        </ul>
      </section>

      <section className="relire-section" aria-labelledby="relire-questions">
        <h3 id="relire-questions">Questions à trancher ({questions.length})</h3>
        <p className="relire-ask">
          Ces issues sont en <Term t="refinement">Refinement</Term> : il manque une décision ou une information pour qu'on
          puisse les faire. Si tu connais la réponse (métier, données, usage), écris-la en commentaire.
        </p>
        {[...byEpic.entries()].map(([name, list], k) => (
          <details key={name} className="relire-group" open={k === 0}>
            <summary>
              {name} ({list.length})
            </summary>
            <ul className="relire-list">
              {list.map((i) => (
                <Item key={i.number} i={i} />
              ))}
            </ul>
          </details>
        ))}
      </section>
    </div>
  );
}
