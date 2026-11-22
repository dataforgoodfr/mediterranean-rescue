import {
  type Issue,
  type Placed,
  type Step,
  boardImage,
  boards,
  byNumber,
  descendants,
  epicOf,
  epics,
  formatDate,
  penpot,
  penpotFileUrl,
  placedEpics,
  shortTitle,
  MILESTONES,
  formatDay,
  STEPS,
  stepOf,
  stepWord,
} from "./data";
import { Schema, SCHEMAS, slot, zoneOf } from "./Schemas";
import { useRef, useState } from "react";
import { Bubble } from "./Bubble";
import { HelpTip } from "./HelpTip";
import { Figure, SHOTS } from "./guide";
import { Ecran } from "./Ecran";
import { Term, type TermKey } from "./lexique";
import { DEFAULT_SHOWN } from "./route";

type Board = (typeof boards)[number];

/** Les repères d'une planche : posés à la main, ou rangés par zone sur le schéma de la donnée. */
function pinsOn(placed: Placed, board: Board) {
  if (board.kind === "schema") {
    return Object.entries(placed.zones ?? {}).flatMap(([zoneId, nums]) => {
      const zone = zoneOf(board.id, zoneId);
      return zone ? nums.map((issue, n) => ({ issue, ...slot(zone, n) })) : [];
    });
  }
  return placed.pins.filter((p) => p.board === board.id);
}

/** Où apparaît une issue : noms des planches et des zones du schéma. */
function placesOf(issue: number) {
  const names = placedEpics.flatMap((p) => [
    ...p.pins.filter((pin) => pin.issue === issue).flatMap((pin) => boards.find((b) => b.id === pin.board)?.name ?? []),
    ...Object.entries(p.zones ?? {}).flatMap(([zoneId, nums]) =>
      nums.includes(issue) ? p.boards.flatMap((bid) => zoneOf(bid, zoneId)?.label ?? []) : [],
    ),
  ]);
  return [...new Set(names)];
}

// Ce qu'on peut faire d'une issue, selon son état : le dernier pas du parcours.
const NEXT: Record<Step, string> = {
  "a-prendre": "Personne n'est dessus. Pour la prendre : commente « Je prends » sur l'issue, puis assigne-la-toi.",
  "en-cours": "Quelqu'un est dessus. Pour aider, écris-lui un commentaire sur l'issue.",
  bloquee: "Elle attend qu'une autre issue soit finie (ci-dessus). Commence plutôt par celle-ci, ou attends qu'elle soit fermée.",
  "a-preciser": "Pas encore prête : l'équipe produit doit la préciser avant qu'on la prenne. Tu peux poser une question sur l'issue.",
  faite: "Terminée. Le détail du travail est sur GitHub.",
};

// Le mot du tableau GitHub, expliqué au survol dans la fiche.
const STATUS_TERM: Record<string, TermKey> = {
  Refinement: "refinement",
  Ready: "ready",
  "In progress": "inprogress",
  "In review": "inreview",
  Done: "done",
};

export type MaquettesState = {
  epicNo: number;
  setEpicNo: (n: number) => void;
  selected: number | null;
  setSelected: (n: number | null) => void;
  /** Les états affichés : la légende montre ou cache chaque couleur. */
  shown: Step[];
  setShown: (list: Step[]) => void;
  jalon: string | null;
  setJalon: (j: string | null) => void;
  /** Premier chargement : la grande entrée animée. */
  intro: boolean;
};

export function MaquettesView({ epicNo, setEpicNo, selected, setSelected, shown, setShown, jalon, setJalon, intro }: MaquettesState) {
  // L'infobulle des pastilles : une seule, rendue hors de la zone qui défile pour n'être jamais coupée.
  const tipAnchor = useRef<HTMLElement | null>(null);
  const [tip, setTip] = useState<number | null>(null);
  const showTip = (n: number, el: HTMLElement, allowed: boolean) => {
    if (!allowed) return;
    tipAnchor.current = el;
    setTip(n);
  };
  const tipIssue = tip === null ? undefined : byNumber.get(tip);
  const toggle = (k: Step) => setShown(shown.includes(k) ? shown.filter((x) => x !== k) : [...shown, k]);
  const isDefault = shown.length === DEFAULT_SHOWN.length && shown.every((k) => DEFAULT_SHOWN.includes(k));
  const inJalon = (i: Issue) => !jalon || i.milestone?.title === jalon;
  const epic = byNumber.get(epicNo);
  if (!epic) return null;

  const placed = placedEpics.find((p) => p.epic === epicNo);
  const all = descendants(epicNo).filter((i) => i.status !== "Out");
  const pinned = new Set(placed ? boards.flatMap((b) => pinsOn(placed, b)).map((p) => p.issue) : []);
  // À prendre d'abord, puis en cours, puis à préciser : ce qu'un bénévole cherche en premier.
  const rank = (i: Issue) => STEPS.findIndex((s) => s.key === stepOf(i));
  const withoutScreen = all
    .filter((i) => i.state === "OPEN" && !pinned.has(i.number))
    .filter((i) => shown.includes(stepOf(i)) && inJalon(i))
    .sort((a, b) => rank(a) - rank(b));
  const chosen = selected === null ? undefined : byNumber.get(selected);
  // Les compteurs suivent le jalon choisi, comme les pastilles.
  const count = (s: Step) => all.filter((i) => stepOf(i) === s && inJalon(i)).length;

  const pick = (n: number, from?: HTMLElement) => {
    // Sur téléphone, la fiche s'ouvre en panneau qui monte du bas : on remonte la pastille touchée
    // dans le haut de l'écran pour qu'elle reste visible au-dessus du panneau.
    setSelected(n);
    if (from && matchMedia("(max-width: 979px)").matches) {
      const top = from.getBoundingClientRect().top - innerHeight * 0.2;
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => window.scrollBy({ top, behavior: smooth ? "smooth" : "auto" }));
    }
  };

  let pinIndex = 0;

  return (
    <div className={intro ? "mq is-intro" : "mq"}>
      <div className="mq-row">
        <p className="row-label row-label-top">
          Objectifs, c'est-à-dire les <Term t="epic">épopées</Term> du projet
        </p>
        <nav className="objectives" aria-label="Objectifs" data-tour="objectives">
          {epics.map((e) => {
            const d = descendants(e.number);
            const done = d.filter((i) => stepOf(i) === "faite").length;
            const free = d.filter((i) => stepOf(i) === "a-prendre").length;
            const inJ = jalon ? d.filter((i) => i.milestone?.title === jalon && i.state === "OPEN").length : 0;
            return (
              <button
                key={e.number}
                type="button"
                className="objective"
                aria-pressed={e.number === epicNo}
                onClick={() => {
                  setEpicNo(e.number);
                  setSelected(null);
                }}
              >
                <span className="objective-name">{shortTitle(e.title)}</span>
                <span className="objective-meta">
                  {jalon ? `${inJ} ouvertes dans ${jalon}` : `${done}/${d.length} faites${free > 0 ? ` · ${free} à prendre` : ""}`}
                </span>
                <span className="objective-bar" aria-hidden="true">
                  <span style={{ transform: `scaleX(${d.length ? done / d.length : 0})` }} />
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="legend-row jalon-row" data-tour="jalons">
        <span className="row-label">
          <Term t="milestone">Jalon</Term>
        </span>
        <ul className="legend" aria-label="Filtrer par jalon">
          {MILESTONES.map((m) => (
            <li key={m.title}>
              <button type="button" className="legend-btn jalon-btn" aria-pressed={jalon === m.title} onClick={() => setJalon(jalon === m.title ? null : m.title)}>
                {m.title}
                {m.due && <span className="legend-count">{formatDay(m.due)}</span>}
              </button>
            </li>
          ))}
        </ul>
        <HelpTip label="Qu'est-ce qu'un jalon ?">
          Un jalon regroupe ce qu'on livre ensemble, dans l'ordre : <strong>P0 · MVP</strong> d'abord, puis P1, P2, P3. Clique
          sur un jalon pour ne garder que ses issues, sur tous les objectifs.
        </HelpTip>
        {jalon && (
          <button type="button" className="legend-reset" onClick={() => setJalon(null)}>
            Tous les jalons
          </button>
        )}
      </div>

      <div className="legend-row" data-tour="legend">
        <ul className="legend" aria-label="Filtrer par état">
          {STEPS.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className={`legend-btn st-${s.key}`}
                aria-pressed={shown.includes(s.key)}
                onClick={() => toggle(s.key)}
              >
                {s.word} <span className="legend-count">{count(s.key)}</span>
              </button>
            </li>
          ))}
        </ul>
        <HelpTip label="Que veulent dire les couleurs ?">
          Chaque couleur traduit un statut du tableau GitHub. <strong>à prendre</strong> : Ready et personne dessus.{" "}
          <strong>en cours</strong> : In progress, In review, ou Ready avec quelqu'un d'assigné. <strong>bloquée</strong> :
          Ready mais elle attend une autre issue. <strong>à préciser</strong> : Refinement. <strong>faite</strong> : Done ou
          fermée. Un clic sur une couleur la montre ou la cache ; les faites sont cachées au départ.
        </HelpTip>
        {!isDefault && (
          <button type="button" className="legend-reset" onClick={() => setShown(DEFAULT_SHOWN)}>
            Revenir au départ
          </button>
        )}
      </div>

      <div className="mq-layout">
        <div className="mq-main">
          {placed ? (
            <div className="boards-scroll" role="region" aria-label="Planches de maquette" tabIndex={0}>
              <div className="boards" key={epicNo}>
                {placed.boards.map((bid, b) => {
                  const board = boards.find((x) => x.id === bid);
                  if (!board) return null;
                  const pins = pinsOn(placed, board);
                  const schema = board.kind === "schema";
                  return (
                    <figure
                      className={schema ? "board board-schema" : board.width > 600 ? "board board-desktop" : "board"}
                      key={bid}
                      style={{ "--b": b }}
                    >
                      <div className="board-frame" style={{ aspectRatio: `${board.width} / ${board.height}` }}>
                        {schema ? <Schema id={bid} used={new Set(Object.keys(placed.zones ?? {}))} /> : <img src={boardImage(bid)} alt={`Maquette « ${board.name} »`} width={board.width} height={board.height} />}
                        {pins.map((p) => {
                          const i = byNumber.get(p.issue);
                          if (!i) return null;
                          const step = stepOf(i);
                          if (!shown.includes(step)) return null;
                          const fx = p.x / board.width;
                          const fy = p.y / board.height;
                          pinIndex += 1;
                          return (
                            <button
                              type="button"
                              key={`${p.issue}-${p.x}-${p.y}`}
                              className={`pin st-${step}${selected === p.issue ? " is-on" : ""}${!inJalon(i) ? " is-dim" : ""}${i.blockedBy.length && step !== "faite" ? " is-blocked" : ""}`}
                              style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, "--i": pinIndex }}
                              aria-label={`#${i.number} ${i.title}, ${stepWord(step)}`}
                              onClick={(e) => pick(p.issue, e.currentTarget)}
                              onMouseEnter={(e) => showTip(p.issue, e.currentTarget, matchMedia("(hover: hover)").matches)}
                              onMouseLeave={() => setTip(null)}
                              onFocus={(e) => showTip(p.issue, e.currentTarget, e.currentTarget.matches(":focus-visible"))}
                              onBlur={() => setTip(null)}
                            >
                              <span className="pin-mark">{i.number}</span>
                            </button>
                          );
                        })}
                      </div>
                      <figcaption>{board.name}</figcaption>
                      {!schema && (
                        <Ecran
                          data={board.ecran}
                          pinned={[...new Set(pins.map((p) => p.issue))].flatMap((n) => byNumber.get(n) ?? [])}
                          onPick={pick}
                        />
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-board">
              <p className="no-board-title">Pas encore de maquette pour cet objectif.</p>
              <p className="muted">Ses issues sont listées ci-dessous, celles à prendre en premier.</p>
            </div>
          )}

          <details className="no-screen" open={!placed} data-tour="no-screen">
            <summary>
              {placed ? "Sans écran sur ces maquettes" : "Les issues de cet objectif"} ({withoutScreen.length})
              <HelpTip label="Pourquoi sans écran ?">
                Ces issues ne changent aucun écran visible : données, back-end, enquêtes, ou maquette pas encore dessinée.
              </HelpTip>
            </summary>
            {withoutScreen.length ? (
              <ul>
                {withoutScreen.map((i, n) => (
                  <li key={i.number} style={{ "--i": n }}>
                    <button type="button" className={`issue-line st-${stepOf(i)}${selected === i.number ? " is-on" : ""}`} onClick={() => pick(i.number)}>
                      <span className="num">#{i.number}</span> {i.title}
                      <span className="issue-step">{stepWord(stepOf(i))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Aucune issue sans écran dans cet état.</p>
            )}
          </details>
        </div>

        <aside id="fiche" className={chosen ? "fiche has-card" : "fiche"} aria-live="polite" data-tour="fiche">
          {chosen ? (
            <Fiche key={chosen.number} i={chosen} epicNo={epicNo} onClose={() => setSelected(null)} onPick={pick} />
          ) : (
            <Summary key={`summary-${epicNo}`} count={count} placed={Boolean(placed)} shown={shown} toggle={toggle} />
          )}
        </aside>
      </div>

      {placed?.boards.some((bid) => boards.find((b) => b.id === bid)?.kind !== "schema") && (
        <p className="source">
          Planches Penpot « {penpot.fileName} » du {formatDate(new Date(penpot.fileModifiedAt))} ·{" "}
          <a href={penpotFileUrl} target="_blank" rel="noreferrer">
            ouvrir dans Penpot
          </a>
        </p>
      )}
      {placed?.boards.flatMap((bid) => SCHEMAS[bid]?.note ?? []).map((note) => (
        <p className="source" key={note}>
          {note}
        </p>
      ))}
      {tipIssue && (
        <Bubble id="pin-tip" open anchor={tipAnchor} className={`pin-bubble st-${stepOf(tipIssue)}`}>
          <span className="tip-step">
            {stepWord(stepOf(tipIssue))}
            {tipIssue.blockedBy.length && stepOf(tipIssue) !== "faite" ? ` · attend #${tipIssue.blockedBy.join(", #")}` : ""}
          </span>
          {tipIssue.title}
        </Bubble>
      )}
    </div>
  );
}

function Summary(props: { count: (s: Step) => number; placed: boolean; shown: Step[]; toggle: (s: Step) => void }) {
  const { count, placed, shown, toggle } = props;
  return (
    <div className="fiche-empty">
      <p className="fiche-hint">
        {placed ? "Clique sur un numéro pour ouvrir son " : "Clique sur une "}
        <Term t="issue">issue</Term>
        {placed ? "." : " pour l'ouvrir."}
      </p>
      <ul className="counts">
        {STEPS.map((s) => (
          <li key={s.key}>
            <button type="button" className={`count-btn st-${s.key}`} aria-pressed={shown.includes(s.key)} onClick={() => toggle(s.key)}>
              <strong>{count(s.key)}</strong> {s.word}
            </button>
          </li>
        ))}
      </ul>
      <p className="muted small">Un clic sur un état le montre ou le cache.</p>
    </div>
  );
}

function Fiche({ i, epicNo, onClose, onPick }: { i: Issue; epicNo: number; onClose: () => void; onPick: (n: number) => void }) {
  const step = stepOf(i);
  const ep = epicOf(i);
  const screens = placesOf(i.number);
  return (
    <div className={`fiche-card st-${step}`}>
      <div className="fiche-top">
        <p className="fiche-step">{stepWord(step)}</p>
        <button type="button" className="fiche-close" onClick={onClose} aria-label="Fermer la fiche">
          ×
        </button>
      </div>
      <h3 className="fiche-title">
        <span className="num">#{i.number}</span> {i.title}
      </h3>
      <dl className="fiche-facts">
        <dt>
          <Term t="assignee">Qui</Term>
        </dt>
        <dd>{i.assignees.length ? i.assignees.map((a) => `@${a}`).join(", ") : "personne"}</dd>
        {screens.length > 0 && (
          <>
            <dt>Où</dt>
            <dd>{screens.join(", ")}</dd>
          </>
        )}
        {ep && ep.number !== epicNo && (
          <>
            <dt>Objectif</dt>
            <dd>{shortTitle(ep.title)}</dd>
          </>
        )}
        <dt>
          <Term t="project">Tableau</Term>
        </dt>
        <dd>
          {i.status && STATUS_TERM[i.status] ? <Term t={STATUS_TERM[i.status]}>{i.status}</Term> : (i.status ?? "sans statut")}
          {i.iteration ? `, ${i.iteration.title.replace("Iteration", "itération")}` : ""}
        </dd>
      </dl>
      {i.blockedBy.length > 0 && step !== "faite" && (
        <div className="fiche-blocked">
          <span>
            <Term t="blocked">Attend d'abord</Term>
          </span>
          {i.blockedBy.map((b) => (
            <button key={b} type="button" className="blocker" onClick={() => onPick(b)}>
              #{b} {byNumber.get(b)?.title ?? ""}
            </button>
          ))}
        </div>
      )}
      <p className="fiche-next">{NEXT[step]}</p>
      {step === "a-prendre" && (
        <details className="howto">
          <summary>Comment la prendre ?</summary>
          <Figure shot={SHOTS.jePrends} />
        </details>
      )}
      <a className="btn fiche-open" href={i.url} target="_blank" rel="noreferrer">
        Ouvrir sur GitHub
      </a>
    </div>
  );
}
