import { Fragment, useEffect, useState } from "react";
import { formatDate, isFreeReady, issues, NO_STATUS, projectUrl, repoUrl, STATUSES, statusKey, statusOf, takenAt } from "./data";
import { emptyFilters, type Filters, TreeView } from "./Tree";
import { MaquettesView } from "./Maquettes";

type Tab = "arbre" | "maquettes";
const tabFromHash = (): Tab => (location.hash === "#maquettes" ? "maquettes" : "arbre");

export function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const open = issues.filter((i) => i.state === "OPEN" && i.type !== "Epic");
  const counts = [...STATUSES, NO_STATUS]
    .map((s) => ({ s, n: open.filter((i) => statusOf(i) === s).length }))
    .filter((c) => c.n > 0);
  const free = open.filter(isFreeReady).length;

  const showFree = () => {
    setFilters({ ...emptyFilters(), freeReady: true });
    location.hash = "arbre";
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand">
            <p className="eyebrow on-ink">Rescue Atlas · Data for Good × SOS MEDITERRANEE</p>
            <h1>Atlas des issues</h1>
            <p className="summary">
              <strong>{open.length}</strong> issues ouvertes, sans compter les épopées :{" "}
              {counts.map((c, k) => (
                <Fragment key={c.s}>
                  <span className={`sum s-${statusKey(c.s)}`}>
                    {c.n} {c.s}
                  </span>
                  {k < counts.length - 1 ? ", " : ""}
                </Fragment>
              ))}
              .{" "}
              <button type="button" className="link-btn" onClick={showFree}>
                {free} libres et Ready
              </button>
            </p>
          </div>
          <nav className="tabs" aria-label="Vues">
            <a href="#arbre" className="tab" aria-current={tab === "arbre" ? "page" : undefined}>
              Arbre
            </a>
            <a href="#maquettes" className="tab" aria-current={tab === "maquettes" ? "page" : undefined}>
              Maquettes
            </a>
          </nav>
        </div>
      </header>

      <main className="content">{tab === "arbre" ? <TreeView filters={filters} setFilters={setFilters} /> : <MaquettesView />}</main>

      <footer className="foot">
        <p>
          Instantané lu sur GitHub le {formatDate(takenAt)} : dépôt{" "}
          <a href={repoUrl} target="_blank" rel="noreferrer">
            dataforgoodfr/mediterranean-rescue
          </a>{" "}
          et{" "}
          <a href={projectUrl} target="_blank" rel="noreferrer">
            tableau 44
          </a>
          . Lecture seule : on modifie une issue sur GitHub, jamais ici.
        </p>
        <p className="muted">Document de travail · bénévoles Data for Good · non validé par SOS MEDITERRANEE</p>
      </footer>
    </div>
  );
}
