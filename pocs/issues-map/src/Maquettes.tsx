import { useState } from "react";
import {
  type Issue,
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
import { DataFlow, slot, ZONES } from "./DataFlow";

type Placed = (typeof placedEpics)[number];
type Board = (typeof boards)[number];

/** Les repères d'une planche : posés à la main, ou rangés par zone sur le schéma de la donnée. */
function pinsOn(placed: Placed, board: Board) {
  if (board.kind === "schema") {
    return Object.entries(placed.zones ?? {}).flatMap(([zoneId, nums]) => {
      const zone = ZONES.find((z) => z.id === zoneId);
      return zone ? nums.map((issue, n) => ({ issue, ...slot(zone, n) })) : [];
    });
  }
  return placed.pins.filter((p) => p.board === board.id);
}

/** Où apparaît une issue : noms des planches et des zones du schéma. */
function placesOf(issue: number) {
  const names = placedEpics.flatMap((p) => [
    ...p.pins.filter((pin) => pin.issue === issue).flatMap((pin) => boards.find((b) => b.id === pin.board)?.name ?? []),
    ...Object.entries(p.zones ?? {}).flatMap(([zoneId, nums]) => (nums.includes(issue) ? (ZONES.find((z) => z.id === zoneId)?.label ?? []) : [])),
  ]);
  return [...new Set(names)];
}

export function MaquettesView() {
  // Par défaut, le premier objectif posé sur les maquettes.
  const [epicNo, setEpicNo] = useState(placedEpics[0]?.epic ?? epics[0]?.number ?? 0);
  const [selected, setSelected] = useState<number | null>(null);
  const epic = byNumber.get(epicNo);
  if (!epic) return null;

  const placed = placedEpics.find((p) => p.epic === epicNo);
  const all = descendants(epicNo).filter((i) => i.status !== "Out");
  const pinned = new Set(placed ? boards.flatMap((b) => pinsOn(placed, b)).map((p) => p.issue) : []);
  // À prendre d'abord, puis en cours, puis à préciser : ce qu'un bénévole cherche en premier.
  const rank = (i: Issue) => STEPS.findIndex((s) => s.key === stepOf(i));
  const withoutScreen = all.filter((i) => i.state === "OPEN" && !pinned.has(i.number)).sort((a, b) => rank(a) - rank(b));
  const chosen = selected === null ? undefined : byNumber.get(selected);

  const pick = (n: number) => {
    setSelected(n);
    // Sur téléphone, la fiche est sous les planches : on l'amène à l'écran.
    if (matchMedia("(max-width: 979px)").matches) {
      requestAnimationFrame(() => document.getElementById("fiche")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  };

  return (
    <div className="mq">
      <nav className="objectives" aria-label="Objectifs">
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
                <span style={{ width: `${d.length ? (done / d.length) * 100 : 0}%` }} />
              </span>
            </button>
          );
        })}
      </nav>

      <ul className="legend" aria-label="Légende des couleurs">
        {STEPS.map((s) => (
          <li key={s.key} className={`st-${s.key}`}>
            {s.word}
          </li>
        ))}
      </ul>

      <div className="mq-layout">
        <div className="mq-main">
          {placed ? (
            <div className="boards-scroll" role="region" aria-label="Planches de maquette" tabIndex={0}>
              <div className="boards">
                {placed.boards.map((bid) => {
                  const board = boards.find((b) => b.id === bid);
                  if (!board) return null;
                  const pins = pinsOn(placed, board);
                  const schema = board.kind === "schema";
                  return (
                    <figure className={schema ? "board board-schema" : "board"} key={bid}>
                      <div className="board-frame" style={{ aspectRatio: `${board.width} / ${board.height}` }}>
                        {schema ? (
                          <DataFlow />
                        ) : (
                          <img src={boardImage(bid)} alt={`Maquette « ${board.name} »`} width={board.width} height={board.height} />
                        )}
                        {pins.map((p) => {
                          const i = byNumber.get(p.issue);
                          if (!i) return null;
                          return (
                            <button
                              type="button"
                              key={`${p.issue}-${p.x}-${p.y}`}
                              className={`pin st-${stepOf(i)}${selected === p.issue ? " is-on" : ""}`}
                              style={{ left: `${(p.x / board.width) * 100}%`, top: `${(p.y / board.height) * 100}%` }}
                              aria-label={`#${i.number} ${i.title}, ${stepWord(stepOf(i))}`}
                              title={`#${i.number} ${i.title}`}
                              onClick={() => pick(p.issue)}
                            >
                              <span className="pin-mark">{i.number}</span>
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
              <p className="muted">Ses issues sont listées ci-dessous.</p>
            </div>
          )}

          {withoutScreen.length > 0 && (
            <details className="no-screen" open={!placed}>
              <summary>
                {placed ? "Sans écran sur ces maquettes" : "Les issues de cet objectif"} ({withoutScreen.length})
              </summary>
              <ul>
                {withoutScreen.map((i) => (
                  <li key={i.number}>
                    <button type="button" className={`issue-line st-${stepOf(i)}${selected === i.number ? " is-on" : ""}`} onClick={() => pick(i.number)}>
                      <span className="num">#{i.number}</span> {i.title}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <aside id="fiche" className="fiche" aria-live="polite">
          {chosen ? <Fiche i={chosen} epicNo={epicNo} onClose={() => setSelected(null)} /> : <Summary issues={all} placed={Boolean(placed)} />}
        </aside>
      </div>

      {placed?.boards.some((bid) => boards.find((b) => b.id === bid)?.kind !== "schema") ? (
        <p className="source">
          Planches Penpot « {penpot.fileName} » du {formatDate(new Date(penpot.fileModifiedAt))} ·{" "}
          <a href={penpotFileUrl} target="_blank" rel="noreferrer">
            ouvrir dans Penpot
          </a>
        </p>
      ) : placed ? (
        <p className="source">
          Pas encore de maquette du back-office (#104) : ce schéma de travail range les issues par étape du chemin de la
          donnée. À faire vérifier par l'équipe produit.
        </p>
      ) : null}
    </div>
  );
}

function Summary({ issues, placed }: { issues: Issue[]; placed: boolean }) {
  const count = (s: Step) => issues.filter((i) => stepOf(i) === s).length;
  return (
    <div className="fiche-empty">
      <p className="fiche-hint">{placed ? "Clique sur un numéro pour voir l'issue." : "Clique sur une issue pour la voir."}</p>
      <ul className="counts">
        {STEPS.map((s) => (
          <li key={s.key} className={`st-${s.key}`}>
            <strong>{count(s.key)}</strong> {s.word}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fiche({ i, epicNo, onClose }: { i: Issue; epicNo: number; onClose: () => void }) {
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
      <a className="btn fiche-open" href={i.url} target="_blank" rel="noreferrer">
        Ouvrir sur GitHub
      </a>
    </div>
  );
}
