import { useState } from "react";
import {
  type Issue,
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
  statusKey,
  statusOf,
} from "./data";

export function MaquettesView() {
  // Une seule épopée posée pour l'instant (#12) : un sélecteur viendra avec la deuxième.
  const epicNo = placedEpics[0]?.epic ?? 12;
  const [hover, setHover] = useState<number | null>(null);
  const placed = placedEpics.find((p) => p.epic === epicNo);
  const epic = byNumber.get(epicNo);

  if (!placed || !epic) return null;
  const pinned = new Set(placed.pins.map((p) => p.issue));
  const openUnplaced = descendants(epicNo).filter((i) => i.state === "OPEN" && !pinned.has(i.number));
  const pinnedIssues = [...pinned].flatMap((n) => byNumber.get(n) ?? []).sort((a, b) => a.number - b.number);
  const notPlacedEpics = epics.filter((e) => !placedEpics.some((p) => p.epic === e.number));

  return (
    <div className="maquettes">
      <div className="maquettes-head">
        <div>
          <p className="eyebrow">Épopée #{epic.number} posée sur les maquettes</p>
          <h2 className="epic-title">
            <a href={epic.url} target="_blank" rel="noreferrer">
              {shortTitle(epic.title)}
            </a>
          </h2>
          <p className="lede">
            Chaque repère porte le numéro d'une issue, posé à l'endroit de l'écran qu'elle change. Un clic ouvre l'issue sur
            GitHub. Le contour dit le statut ; un contour en pointillés signale une issue rangée dans une autre épopée.
          </p>
        </div>
        <p className="source">
          Planches du fichier Penpot{" "}
          <a href={penpotFileUrl} target="_blank" rel="noreferrer">
            {penpot.fileName}
          </a>
          , modifié le {formatDate(new Date(penpot.fileModifiedAt))}. Les autres épopées ({notPlacedEpics.map((e) => `#${e.number}`).join(", ")}) ne
          sont pas encore posées.
        </p>
      </div>

      <div className="boards-scroll" role="region" aria-label="Planches de maquette" tabIndex={0}>
        <div className="boards">
          {placed.boards.map((bid) => {
            const board = boards.find((b) => b.id === bid);
            if (!board) return null;
            const pins = placed.pins.filter((p) => p.board === bid);
            return (
              <figure className="board" key={bid}>
                <div className="board-frame" style={{ aspectRatio: `${board.width} / ${board.height}` }}>
                  <img src={boardImage(bid)} alt={`Maquette « ${board.name} » (planche Penpot ${board.penpotName})`} width={board.width} height={board.height} />
                  {pins.map((p) => {
                    const i = byNumber.get(p.issue);
                    if (!i) return null;
                    const foreign = epicOf(i)?.number !== epicNo;
                    return (
                      <a
                        key={`${p.issue}-${p.x}-${p.y}`}
                        className={`pin s-${statusKey(statusOf(i))}${foreign ? " is-foreign" : ""}${hover === p.issue ? " is-hot" : ""}${i.state === "CLOSED" ? " is-closed" : ""}`}
                        style={{ left: `${(p.x / board.width) * 100}%`, top: `${(p.y / board.height) * 100}%` }}
                        href={i.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`#${i.number} ${i.title}, ${statusOf(i)}`}
                        title={`#${i.number} ${i.title} (${statusOf(i)})`}
                        onMouseEnter={() => setHover(p.issue)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(p.issue)}
                        onBlur={() => setHover(null)}
                      >
                        <span className="pin-mark">{i.number}</span>
                      </a>
                    );
                  })}
                </div>
                <figcaption>
                  <strong>{board.name}</strong>
                  <span className="muted">
                    {pins.length} repère{pins.length > 1 ? "s" : ""}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className="pin-lists">
        <section aria-labelledby="placed-h">
          <h3 id="placed-h">Posées sur les maquettes ({pinnedIssues.length})</h3>
          <ul className="pin-list">
            {pinnedIssues.map((i) => (
              <PinListItem key={i.number} i={i} epicNo={epicNo} hot={hover === i.number} setHover={setHover} />
            ))}
          </ul>
        </section>
        <section aria-labelledby="unplaced-h">
          <h3 id="unplaced-h">Ouvertes, pas encore posées ({openUnplaced.length})</h3>
          <p className="muted small">Pas d'écran évident dans ces planches : back-end, données, recherche utilisateur, ou maquette encore à dessiner.</p>
          <ul className="pin-list">
            {openUnplaced.map((i) => (
              <PinListItem key={i.number} i={i} epicNo={epicNo} hot={false} setHover={setHover} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function PinListItem({ i, epicNo, hot, setHover }: { i: Issue; epicNo: number; hot: boolean; setHover: (n: number | null) => void }) {
  const ep = epicOf(i);
  const foreign = ep?.number !== epicNo;
  return (
    <li
      className={`pin-item s-${statusKey(statusOf(i))}${hot ? " is-hot" : ""}`}
      onMouseEnter={() => setHover(i.number)}
      onMouseLeave={() => setHover(null)}
    >
      <a href={i.url} target="_blank" rel="noreferrer" onFocus={() => setHover(i.number)} onBlur={() => setHover(null)}>
        <span className="num">#{i.number}</span> {i.title}
      </a>
      <span className="meta">
        <span className="status-word">{statusOf(i)}</span>
        {i.assignees.length > 0 && <span>{i.assignees.map((a) => `@${a}`).join(", ")}</span>}
        {foreign && <span>{ep ? `épopée #${ep.number} ${shortTitle(ep.title)}` : "hors épopée"}</span>}
      </span>
    </li>
  );
}
