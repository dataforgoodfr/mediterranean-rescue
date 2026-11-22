// Sous chaque maquette : ce qu'il faut pour que l'écran existe, couche par couche
// (suggestion de Julien, 22 novembre 2026). Ce qu'on ne sait pas s'écrit « inconnu ».
import { type Issue, byNumber, stepOf, stepWord } from "./data";

export type EcranData = {
  sources?: readonly { label: string; url: string }[];
  fictives?: readonly number[];
  design?: readonly number[];
  api?: readonly number[];
  front?: readonly number[];
};

const hasLabel = (i: Issue, l: string) => i.labels.some((x) => x.name === l);

function merge(manual: readonly number[] | undefined, auto: readonly Issue[]) {
  const nums = new Set([...(manual ?? []), ...auto.map((i) => i.number)]);
  return [...nums].flatMap((n) => byNumber.get(n) ?? []);
}

function IssueChips({ issues, onPick, empty }: { issues: readonly Issue[]; onPick: (n: number) => void; empty: string }) {
  if (!issues.length) return <span className="ecran-unknown">{empty}</span>;
  return (
    <span className="ecran-issues">
      {issues.map((i) => (
        <button key={i.number} type="button" className={`ecran-issue st-${stepOf(i)}`} onClick={() => onPick(i.number)} title={i.title}>
          #{i.number} <span className="ecran-step">{stepWord(stepOf(i))}</span>
        </button>
      ))}
    </span>
  );
}

export function Ecran({ data, pinned, onPick }: { data: EcranData | undefined; pinned: readonly Issue[]; onPick: (n: number) => void }) {
  const design = merge(data?.design, pinned.filter((i) => hasLabel(i, "design")));
  const code = pinned.filter((i) => !hasLabel(i, "design"));
  const api = merge(data?.api, code.filter((i) => hasLabel(i, "back")));
  const front = merge(data?.front, code.filter((i) => hasLabel(i, "front")));
  const fictives = (data?.fictives ?? []).flatMap((n) => byNumber.get(n) ?? []);
  const validated = design.length > 0 && design.every((i) => stepOf(i) === "faite");

  return (
    <details className="ecran" open>
      <summary>Ce qu'il faut pour cet écran</summary>
      <dl className="ecran-list">
        <dt>Données réelles</dt>
        <dd>
          {data?.sources?.length ? (
            data.sources.map((s) => (
              <a key={s.url + s.label} href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))
          ) : (
            <span className="ecran-unknown">{data && !data.sources ? "aucune" : "inconnu"}</span>
          )}
        </dd>
        <dt>Données fictives</dt>
        <dd>
          <IssueChips issues={fictives} onPick={onPick} empty={data && !data.fictives ? "aucune" : "inconnu"} />
        </dd>
        <dt>Maquette</dt>
        <dd>
          {design.length > 0 && <span className={validated ? "ecran-ok" : "ecran-wait"}>{validated ? "validée" : "pas encore validée"}</span>}
          <IssueChips issues={design} onPick={onPick} empty="inconnu" />
        </dd>
        <dt>API back-end</dt>
        <dd>
          <IssueChips issues={api} onPick={onPick} empty="aucun ticket" />
        </dd>
        <dt>Front</dt>
        <dd>
          <IssueChips issues={front} onPick={onPick} empty="aucun ticket" />
        </dd>
      </dl>
    </details>
  );
}
