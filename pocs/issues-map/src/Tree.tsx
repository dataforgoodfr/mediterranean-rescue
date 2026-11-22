import { useState } from "react";
import {
  type Issue,
  byNumber,
  DOMAINS,
  descendants,
  epics,
  isFreeReady,
  looseRoots,
  NO_STATUS,
  shortTitle,
  STATUSES,
  statusKey,
  statusOf,
} from "./data";

export type Filters = {
  statuses: Set<string>;
  domains: Set<string>;
  freeReady: boolean;
  showClosed: boolean;
  query: string;
};

export const emptyFilters = (): Filters => ({
  statuses: new Set(),
  domains: new Set(),
  freeReady: false,
  showClosed: false,
  query: "",
});

function matches(i: Issue, f: Filters): boolean {
  if (!f.showClosed && i.state === "CLOSED") return false;
  if (f.freeReady && !isFreeReady(i)) return false;
  if (f.statuses.size && !f.statuses.has(statusOf(i))) return false;
  if (f.domains.size && !i.labels.some((l) => f.domains.has(l.name))) return false;
  const q = f.query.trim().toLowerCase().replace(/^#/, "");
  if (q && !(String(i.number) === q || i.title.toLowerCase().includes(q))) return false;
  return true;
}

/** Les issues à dessiner : celles qui correspondent, et leurs parents pour le contexte. */
function visibleSet(f: Filters) {
  const hit = new Set<number>();
  const shown = new Set<number>();
  for (const i of byNumber.values()) {
    if (i.type === "Epic") continue; // une épopée est un en-tête de section
    if (!matches(i, f)) continue;
    hit.add(i.number);
    let cur: Issue | undefined = i;
    while (cur) {
      shown.add(cur.number);
      cur = cur.parent ? byNumber.get(cur.parent) : undefined;
    }
  }
  return { hit, shown };
}

export function TreeView({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
  const { hit, shown } = visibleSet(filters);
  const [folded, setFolded] = useState<Set<number>>(new Set());
  const toggleFold = (n: number) => {
    const next = new Set(folded);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setFolded(next);
  };

  const sections = [...epics.map((e) => ({ epic: e, roots: e.children })), { epic: null, roots: looseRoots.map((i) => i.number) }];
  const visibleSections = sections.filter((s) => s.roots.some((r) => shown.has(r)));

  return (
    <div className="tree-layout">
      <FilterBar filters={filters} setFilters={setFilters} count={hit.size} />
      <div className="sections">
        {visibleSections.length === 0 && (
          <div className="empty">
            <p className="empty-title">Aucune issue ne correspond à ces filtres.</p>
            <button type="button" className="btn" onClick={() => setFilters(emptyFilters())}>
              Retirer les filtres
            </button>
          </div>
        )}
        {visibleSections.map(({ epic, roots }) => (
          <EpicSection key={epic?.number ?? "loose"} epic={epic} roots={roots} hit={hit} shown={shown} folded={folded} toggleFold={toggleFold} />
        ))}
      </div>
    </div>
  );
}

function EpicSection(props: {
  epic: Issue | null;
  roots: number[];
  hit: Set<number>;
  shown: Set<number>;
  folded: Set<number>;
  toggleFold: (n: number) => void;
}) {
  const { epic, roots, hit, shown, folded, toggleFold } = props;
  const all = epic ? descendants(epic.number) : roots.flatMap((r) => {
        const root = byNumber.get(r);
        return root ? [root, ...descendants(r)] : [];
      });
  const open = all.filter((i) => i.state === "OPEN").length;
  const done = all.length - open;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const shownHere = all.filter((i) => hit.has(i.number)).length;
  const isFolded = epic ? folded.has(epic.number) : folded.has(0);
  const foldKey = epic?.number ?? 0;

  return (
    <section className="epic" aria-labelledby={`epic-${foldKey}`}>
      <header className="epic-head">
        <button
          type="button"
          className="fold epic-fold"
          aria-expanded={!isFolded}
          aria-controls={`epic-body-${foldKey}`}
          onClick={() => toggleFold(foldKey)}
          aria-label={isFolded ? "Déplier l'épopée" : "Replier l'épopée"}
        >
          <span aria-hidden="true">{isFolded ? "▸" : "▾"}</span>
        </button>
        <div className="epic-title-block">
          <p className="eyebrow">{epic ? `Épopée #${epic.number}` : "Sans épopée"}</p>
          <h2 id={`epic-${foldKey}`} className="epic-title">
            {epic ? (
              <a href={epic.url} target="_blank" rel="noreferrer">
                {shortTitle(epic.title)}
              </a>
            ) : (
              "Issues hors épopée"
            )}
          </h2>
        </div>
        <div className="epic-progress" title={`${done} fermées sur ${all.length}`}>
          <p className="epic-counts">
            <strong>{open}</strong> ouvertes · {done} fermées
            {shownHere !== open && <span className="muted"> · {shownHere} affichées</span>}
          </p>
          <div className="bar" role="img" aria-label={`${pct} % fermées`}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>
      {!isFolded && (
        <ul className="rows" id={`epic-body-${foldKey}`}>
          {roots
            .filter((r) => shown.has(r))
            .map((r) => (
              <Row key={r} n={r} depth={0} hit={hit} shown={shown} folded={folded} toggleFold={toggleFold} />
            ))}
        </ul>
      )}
    </section>
  );
}

function Row(props: { n: number; depth: number; hit: Set<number>; shown: Set<number>; folded: Set<number>; toggleFold: (n: number) => void }) {
  const { n, depth, hit, shown, folded, toggleFold } = props;
  const i = byNumber.get(n);
  if (!i) return null;
  const kids = i.children.filter((c) => shown.has(c));
  const isFolded = folded.has(n);
  const status = statusOf(i);
  const domains = i.labels.map((l) => l.name).filter((l) => DOMAINS.includes(l));
  const others = i.labels.map((l) => l.name).filter((l) => !DOMAINS.includes(l));
  const context = !hit.has(n);

  return (
    <li className={`row-item depth-${Math.min(depth, 3)}`}>
      <div className={`row s-${statusKey(status)}${context ? " is-context" : ""}${i.state === "CLOSED" ? " is-closed" : ""}`}>
        {kids.length > 0 ? (
          <button
            type="button"
            className="fold"
            aria-expanded={!isFolded}
            onClick={() => toggleFold(n)}
            aria-label={`${isFolded ? "Déplier" : "Replier"} les ${kids.length} sous-issues de #${n}`}
          >
            <span aria-hidden="true">{isFolded ? "▸" : "▾"}</span>
          </button>
        ) : (
          <span className="fold-spacer" aria-hidden="true" />
        )}
        <div className="row-main">
          <a className="row-title" href={i.url} target="_blank" rel="noreferrer">
            <span className="num">#{i.number}</span> {i.title}
          </a>
          <p className="meta">
            <span className="status-word">{i.state === "CLOSED" && status !== "Done" ? `${status}, fermée` : status}</span>
            {isFreeReady(i) && <span className="free">libre</span>}
            {i.iteration && <span>{i.iteration.title.replace("Iteration", "Itération")}</span>}
            {i.assignees.length > 0 && <span>{i.assignees.map((a) => `@${a}`).join(", ")}</span>}
            {domains.length > 0 && <span className="domains">{domains.join(" · ")}</span>}
            {others.length > 0 && <span className="labels">{others.join(", ")}</span>}
            {i.subTotal > 0 && (
              <span>
                {i.subDone}/{i.subTotal} sous-issues fermées
              </span>
            )}
            {!i.inProject && <span className="warn">absente du tableau 44</span>}
          </p>
        </div>
      </div>
      {kids.length > 0 && !isFolded && (
        <ul className="rows">
          {kids.map((c) => (
            <Row key={c} n={c} depth={depth + 1} hit={hit} shown={shown} folded={folded} toggleFold={toggleFold} />
          ))}
        </ul>
      )}
    </li>
  );
}

function toggleIn(set: Set<string>, v: string) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

function FilterBar({ filters, setFilters, count }: { filters: Filters; setFilters: (f: Filters) => void; count: number }) {
  const statusOptions = [...STATUSES, NO_STATUS];
  // Ouvert d'office sur grand écran ; sur téléphone, l'arbre passe d'abord.
  const [wide, setWide] = useState(() => matchMedia("(min-width: 900px)").matches);
  const active = filters.statuses.size || filters.domains.size || filters.freeReady || filters.showClosed || filters.query;
  return (
    <aside className="filters" aria-label="Filtres">
      <div className="field">
        <label htmlFor="q">Chercher</label>
        <input
          id="q"
          type="search"
          placeholder="Titre ou numéro"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
      </div>

      <label className="switch" htmlFor="free-ready">
        <input
          id="free-ready"
          type="checkbox"
          checked={filters.freeReady}
          onChange={(e) => setFilters({ ...filters, freeReady: e.target.checked })}
        />
        <span>
          <strong>Libres et Ready</strong>
          <small>Prêtes, personne dessus</small>
        </span>
      </label>

      <details className="more" open={wide} onToggle={(e) => setWide(e.currentTarget.open)}>
        <summary>
          Statut, domaine, fermées
          {filters.statuses.size + filters.domains.size + (filters.showClosed ? 1 : 0) > 0 && (
            <span className="more-count"> ({filters.statuses.size + filters.domains.size + (filters.showClosed ? 1 : 0)} actifs)</span>
          )}
        </summary>
        <div className="more-body">
      <fieldset className="group">
        <legend>Statut (tableau 44)</legend>
        <div className="toggles">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              className={`toggle s-${statusKey(s)}`}
              aria-pressed={filters.statuses.has(s)}
              onClick={() => setFilters({ ...filters, statuses: toggleIn(filters.statuses, s) })}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="group">
        <legend>Domaine</legend>
        <div className="toggles">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              className="toggle"
              aria-pressed={filters.domains.has(d)}
              onClick={() => setFilters({ ...filters, domains: toggleIn(filters.domains, d) })}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="switch" htmlFor="show-closed">
        <input
          id="show-closed"
          type="checkbox"
          checked={filters.showClosed}
          onChange={(e) => setFilters({ ...filters, showClosed: e.target.checked })}
        />
        <span>
          <strong>Montrer les fermées</strong>
        </span>
      </label>
        </div>
      </details>

      <p className="filter-count" aria-live="polite">
        <strong>{count}</strong> {count > 1 ? "issues correspondent" : "issue correspond"}
      </p>
      {active ? (
        <button type="button" className="btn btn-quiet" onClick={() => setFilters(emptyFilters())}>
          Retirer les filtres
        </button>
      ) : null}
    </aside>
  );
}
