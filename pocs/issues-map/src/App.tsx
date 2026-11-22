import { useEffect, useState } from "react";
import { formatDate, issues, projectUrl, repoUrl, stepOf, takenAt } from "./data";
import { emptyFilters, type Filters, TreeView } from "./Tree";
import { MaquettesView } from "./Maquettes";

// Les maquettes sont l'accueil ; la liste complète reste à un clic.
type Tab = "maquettes" | "liste";
const tabFromHash = (): Tab => (location.hash === "#liste" ? "liste" : "maquettes");

export function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const open = issues.filter((i) => i.state === "OPEN" && i.type !== "Epic" && i.status !== "Out");
  const free = open.filter((i) => stepOf(i) === "a-prendre").length;
  const doing = open.filter((i) => stepOf(i) === "en-cours").length;

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand">
            <p className="eyebrow on-ink">Rescue Atlas · Data for Good × SOS MEDITERRANEE</p>
            <h1>Atlas des issues</h1>
            <p className="summary">
              <strong>{open.length}</strong> issues ouvertes · <strong>{doing}</strong> en cours ·{" "}
              <strong className="sum-free">{free}</strong> à prendre
            </p>
          </div>
          <nav className="tabs" aria-label="Vues">
            <a href="#maquettes" className="tab" aria-current={tab === "maquettes" ? "page" : undefined}>
              Maquettes
            </a>
            <a href="#liste" className="tab" aria-current={tab === "liste" ? "page" : undefined}>
              Liste complète
            </a>
          </nav>
        </div>
      </header>

      <main className="content">{tab === "liste" ? <TreeView filters={filters} setFilters={setFilters} /> : <MaquettesView />}</main>

      <footer className="foot">
        <p>
          Lu sur GitHub le {formatDate(takenAt)} :{" "}
          <a href={repoUrl} target="_blank" rel="noreferrer">
            dépôt
          </a>{" "}
          et{" "}
          <a href={projectUrl} target="_blank" rel="noreferrer">
            tableau 44
          </a>
          . Lecture seule : une issue se modifie sur GitHub.
        </p>
        <p className="muted">Document de travail · bénévoles Data for Good · non validé par SOS MEDITERRANEE</p>
      </footer>
    </div>
  );
}
