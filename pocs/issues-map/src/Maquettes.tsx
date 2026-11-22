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
  STEPS,
  stepOf,
  stepWord,
} from "./data";
import { Schema, SCHEMAS, slot, zoneOf } from "./Schemas";
import { HelpTip } from "./HelpTip";
import { Figure, SHOTS } from "./guide";

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
  "a-preciser": "Pas encore prête : l'équipe produit doit la préciser avant qu'on la prenne. Tu peux poser une question sur l'issue.",
  faite: "Terminée. Le détail du travail est sur GitHub.",
};

export type MaquettesState = {
  epicNo: number;
  setEpicNo: (n: number) => void;
  selected: number | null;
  setSelected: (n: number | null) => void;
  focus: Step | null;
  setFocus: (s: Step | null) => void;
};

export function MaquettesView({ epicNo, setEpicNo, selected, setSelected, focus, setFocus }: MaquettesState) {
  const epic = byNumber.get(epicNo);
  if (!epic) return null;

  const placed = placedEpics.find((p) => p.epic === epicNo);
  const all = descendants(epicNo).filter((i) => i.status !== "Out");
  const pinned = new Set(placed ? boards.flatMap((b) => pinsOn(placed, b)).map((p) => p.issue) : []);
  // À prendre d'abord, puis en cours, puis à préciser : ce qu'un bénévole cherche en premier.
  const rank = (i: Issue) => STEPS.findIndex((s) => s.key === stepOf(i));
  const withoutScreen = all
    .filter((i) => i.state === "OPEN" && !pinned.has(i.number))
    .filter((i) => !focus || stepOf(i) === focus)
    .sort((a, b) => rank(a) - rank(b));
  const chosen = selected === null ? undefined : byNumber.get(selected);
  const count = (s: Step) => all.filter((i) => stepOf(i) === s).length;

  const pick = (n: number) => {
    setSelected(n);
    // Sur téléphone, la fiche est sous les planches : on l'amène à l'écran.
    if (matchMedia("(max-width: 979px)").matches) {
      requestAnimationFrame(() => document.getElementById("fiche")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  };

  let pinIndex = 0;

  return (
    <div className="mq">
      <div className="mq-row">
        <nav className="objectives" aria-label="Objectifs" data-tour="objectives">
          {epics.map((e) => {
            const d = descendants(e.number);
            const done = d.filter((i) => stepOf(i) === "faite").length;
            const free = d.filter((i) => stepOf(i) === "a-prendre").length;
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
                  {done}/{d.length} faites{free > 0 ? ` · ${free} à prendre` : ""}
                </span>
                <span className="objective-bar" aria-hidden="true">
                  <span style={{ transform: `scaleX(${d.length ? done / d.length : 0})` }} />
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="legend-row" data-tour="legend">
        <ul className="legend" aria-label="Filtrer par état">
          {STEPS.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className={`legend-btn st-${s.key}`}
                aria-pressed={focus === s.key}
                onClick={() => setFocus(focus === s.key ? null : s.key)}
              >
                {s.word} <span className="legend-count">{count(s.key)}</span>
              </button>
            </li>
          ))}
        </ul>
        <HelpTip label="Que veulent dire les couleurs ?">
          <strong>à prendre</strong> : prête et personne dessus. <strong>en cours</strong> : quelqu'un y travaille.{" "}
          <strong>à préciser</strong> : il manque encore des infos. <strong>faite</strong> : terminée. Un contour en
          pointillés : elle attend une autre issue. Clique sur une couleur pour ne garder qu'elle.
        </HelpTip>
        {focus && (
          <button type="button" className="legend-reset" onClick={() => setFocus(null)}>
            Tout montrer
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
                          const fx = p.x / board.width;
                          const fy = p.y / board.height;
                          const tipPos = `${fy < 0.2 ? " tip-below" : ""}${fx > 0.7 ? " tip-left" : fx < 0.3 ? " tip-right" : ""}`;
                          pinIndex += 1;
                          return (
                            <button
                              type="button"
                              key={`${p.issue}-${p.x}-${p.y}`}
                              className={`pin st-${step}${selected === p.issue ? " is-on" : ""}${focus && focus !== step ? " is-dim" : ""}${i.blockedBy.length ? " is-blocked" : ""}${tipPos}`}
                              style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, "--i": pinIndex }}
                              aria-label={`#${i.number} ${i.title}, ${stepWord(step)}`}
                              onClick={() => pick(p.issue)}
                            >
                              <span className="pin-mark">{i.number}</span>
                              <span className="tip" aria-hidden="true">
                                <span className="tip-step">
                                  {stepWord(step)}
                                  {i.blockedBy.length ? ` · attend #${i.blockedBy.join(", #")}` : ""}
                                </span>
                                {i.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <figcaption>{board.name}</figcaption>
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

        <aside id="fiche" className="fiche" aria-live="polite" data-tour="fiche">
          {chosen ? (
            <Fiche key={chosen.number} i={chosen} epicNo={epicNo} onClose={() => setSelected(null)} onPick={pick} />
          ) : (
            <Summary key={`summary-${epicNo}`} count={count} placed={Boolean(placed)} setFocus={setFocus} focus={focus} />
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
    </div>
  );
}

function Summary(props: { count: (s: Step) => number; placed: boolean; focus: Step | null; setFocus: (s: Step | null) => void }) {
  const { count, placed, focus, setFocus } = props;
  return (
    <div className="fiche-empty">
      <p className="fiche-hint">{placed ? "Clique sur un numéro pour voir l'issue." : "Clique sur une issue pour la voir."}</p>
      <ul className="counts">
        {STEPS.map((s) => (
          <li key={s.key}>
            <button type="button" className={`count-btn st-${s.key}`} aria-pressed={focus === s.key} onClick={() => setFocus(focus === s.key ? null : s.key)}>
              <strong>{count(s.key)}</strong> {s.word}
            </button>
          </li>
        ))}
      </ul>
      <p className="muted small">Un clic sur un état ne garde que ses issues.</p>
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
        <dt>Qui</dt>
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
        <dt>Tableau</dt>
        <dd>
          {i.status ?? "sans statut"}
          {i.iteration ? `, ${i.iteration.title.replace("Iteration", "itération")}` : ""}
        </dd>
      </dl>
      {i.blockedBy.length > 0 && step !== "faite" && (
        <div className="fiche-blocked">
          <span>Attend d'abord</span>
          {i.blockedBy.map((b) => (
            <button key={b} type="button" className="blocker" onClick={() => onPick(b)}>
              #{b} {byNumber.get(b)?.title ?? ""}
            </button>
          ))}
        </div>
      )}
      <p className="fiche-next">
        {i.blockedBy.length && step === "a-prendre"
          ? "Elle attend une autre issue : commence plutôt par celle-ci, ou attends qu'elle soit finie."
          : NEXT[step]}
      </p>
      {step === "a-prendre" && i.blockedBy.length === 0 && (
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
