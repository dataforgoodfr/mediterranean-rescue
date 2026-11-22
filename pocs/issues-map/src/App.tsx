import { useEffect, useState } from "react";
import { type Step, epics, formatDate, issues, placedEpics, projectUrl, repoUrl, stepOf, takenAt } from "./data";
import { emptyFilters, type Filters, TreeView } from "./Tree";
import { MaquettesView } from "./Maquettes";
import { Help } from "./Help";
import { Tour, type TourStep } from "./Tour";
import { SHOTS } from "./guide";

// Les maquettes sont l'accueil ; la liste complète reste à un clic.
type Tab = "maquettes" | "liste";
const tabFromHash = (): Tab => (location.hash === "#liste" ? "liste" : "maquettes");

// La visite se lance seule à la première visite. Le navigateur peut refuser le stockage : on
// lance alors la visite sans s'en souvenir.
const SEEN_KEY = "atlas-issues-visite-v1";
function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // rien : la visite se relancera à la prochaine ouverture
  }
}

const DEMO_EPIC = placedEpics[0]?.epic ?? epics[0]?.number ?? 0;
// Une issue à prendre, que rien ne bloque, posée sur la carte : pour montrer la fiche pendant la visite.
const DEMO_ISSUE = 24;

export function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [epicNo, setEpicNo] = useState(DEMO_EPIC);
  const [selected, setSelected] = useState<number | null>(null);
  const [focus, setFocus] = useState<Step | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [touring, setTouring] = useState(false);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (seen()) return;
    const t = window.setTimeout(() => setTouring(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  // « ? » ouvre l'aide ; Échap ferme la fiche ouverte.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === "?" && !typing && !touring) setHelpOpen(true);
      if (e.key === "Escape" && !helpOpen && !touring) setSelected(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [helpOpen, touring]);

  const open = issues.filter((i) => i.state === "OPEN" && i.type !== "Epic" && i.status !== "Out");
  const free = open.filter((i) => stepOf(i) === "a-prendre").length;
  const doing = open.filter((i) => stepOf(i) === "en-cours").length;

  const showMaquettes = () => {
    if (location.hash === "#liste") location.hash = "maquettes";
    setTab("maquettes");
  };
  const reset = () => {
    showMaquettes();
    setEpicNo(DEMO_EPIC);
    setFocus(null);
    setSelected(null);
  };

  const steps: TourStep[] = [
    {
      target: ".brand h1",
      title: "Bienvenue dans l'atlas des issues",
      text: "Ici, chaque issue de Rescue Atlas est posée sur l'écran qu'elle va changer. On voit d'un coup d'œil où en est le projet et ce qu'on peut prendre.",
      before: reset,
    },
    {
      target: "[data-tour=objectives]",
      title: "Choisis un objectif",
      text: "Chaque bouton est une épopée, un grand objectif du projet. La barre verte montre ce qui est fait, et le compte dit combien d'issues attendent quelqu'un.",
      shot: SHOTS.epopee,
      before: reset,
    },
    {
      target: "[data-tour=legend]",
      title: "Quatre couleurs, quatre états",
      text: "Orange : à prendre. Bleu : en cours. Gris : à préciser. Vert : faite. Clique sur une couleur pour ne garder qu'elle.",
      shot: SHOTS.tableau,
      before: () => setSelected(null),
    },
    {
      target: ".pin.st-a-prendre",
      title: "Les pastilles",
      text: "Chaque numéro est une issue, posé à l'endroit de l'écran qu'elle change. Survole une pastille pour lire son titre, clique pour ouvrir sa fiche.",
      before: () => {
        setFocus(null);
        setSelected(null);
      },
    },
    {
      target: "[data-tour=fiche]",
      title: "La fiche de l'issue",
      text: "Elle dit qui est dessus, sur quels écrans elle apparaît, et ce que tu peux faire maintenant. Le bouton t'emmène sur GitHub.",
      shot: SHOTS.issueCote,
      before: () => setSelected(DEMO_ISSUE),
    },
    {
      target: "[data-tour=no-screen]",
      title: "Les issues sans écran",
      text: "Données, back-end, enquêtes : certaines issues ne changent aucun écran. Elles sont rangées ici, celles à prendre en premier.",
      before: () => setSelected(null),
    },
    {
      target: "[data-tour=fiche]",
      title: "Prendre une issue",
      text: "Sur GitHub, commente « Je prends » sous l'issue, puis assigne-la-toi. Elle passe alors en cours, et tout le monde voit qui est dessus.",
      shot: SHOTS.jePrends,
      before: () => setSelected(DEMO_ISSUE),
    },
    {
      target: ".tabs",
      title: "La liste complète",
      text: "Besoin de tout voir d'un bloc ? La liste complète montre l'arbre des épopées, issues et sous-issues, avec des filtres.",
    },
    {
      target: ".help-btn",
      title: "L'aide, à tout moment",
      text: "Le bouton Aide (ou la touche « ? ») explique les couleurs et comment prendre une issue. Tu peux y relancer cette visite.",
    },
  ];

  const endTour = () => {
    setTouring(false);
    setSelected(null);
    markSeen();
  };

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
          <div className="mast-bar">
            <nav className="tabs" aria-label="Vues">
              <a href="#maquettes" className="tab" aria-current={tab === "maquettes" ? "page" : undefined}>
                Maquettes
              </a>
              <a href="#liste" className="tab" aria-current={tab === "liste" ? "page" : undefined}>
                Liste complète
              </a>
            </nav>
            <div className="mast-actions">
              <button type="button" className="mast-btn" onClick={() => setTouring(true)}>
                Visite guidée
              </button>
              <button type="button" className="mast-btn help-btn" onClick={() => setHelpOpen(true)} aria-keyshortcuts="?">
                Aide
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="content" key={tab}>
        {tab === "liste" ? (
          <TreeView filters={filters} setFilters={setFilters} />
        ) : (
          <MaquettesView epicNo={epicNo} setEpicNo={setEpicNo} selected={selected} setSelected={setSelected} focus={focus} setFocus={setFocus} />
        )}
      </main>

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

      <Help open={helpOpen} onClose={() => setHelpOpen(false)} onTour={() => setTouring(true)} />
      {touring && <Tour steps={steps} onClose={endTour} />}
    </div>
  );
}
