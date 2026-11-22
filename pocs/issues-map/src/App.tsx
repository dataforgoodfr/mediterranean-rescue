import { useEffect, useRef, useState } from "react";
import { type Step, epics, formatDate, issues, placedEpics, projectUrl, repoUrl, stepOf, takenAt } from "./data";
import { emptyFilters, type Filters, TreeView } from "./Tree";
import { MaquettesView } from "./Maquettes";
import { RelireView } from "./Relire";
import { Help } from "./Help";
import { Tour, type TourStep } from "./Tour";
import { SHOTS } from "./guide";
import { Term } from "./lexique";
import { readView, type View, viewHash, writeView } from "./route";

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
  // Les maquettes sont l'accueil ; la liste complète reste à un clic. La vue suit l'adresse.
  const [view, setView] = useState<View>(() => readView(DEMO_EPIC));
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [helpOpen, setHelpOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  // La grande entrée animée ne se joue qu'au premier chargement ; ensuite, un simple fondu.
  const [intro, setIntro] = useState(true);
  const { tab, epic: epicNo, issue: selected, focus, jalon } = view;
  const setEpicNo = (epic: number) => setView((v) => ({ ...v, epic, issue: null }));
  const setSelected = (issue: number | null) => setView((v) => ({ ...v, issue }));
  const setFocus = (f: Step | null) => setView((v) => ({ ...v, focus: f }));
  const setJalon = (j: string | null) => setView((v) => ({ ...v, jalon: j }));

  const last = useRef(view);
  useEffect(() => {
    const prev = last.current;
    writeView(view, prev.tab !== view.tab || prev.epic !== view.epic);
    last.current = view;
  }, [view]);
  useEffect(() => {
    const onNav = () => setView(readView(DEMO_EPIC));
    addEventListener("popstate", onNav);
    addEventListener("hashchange", onNav);
    return () => {
      removeEventListener("popstate", onNav);
      removeEventListener("hashchange", onNav);
    };
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1400);
    return () => window.clearTimeout(t);
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

  const reset = () => setView({ tab: "maquettes", epic: DEMO_EPIC, issue: null, focus: null, jalon: null });

  const steps: TourStep[] = [
    {
      target: ".brand h1",
      title: "Bienvenue dans l'atlas des issues",
      text: "Sur GitHub, chaque tâche du projet s'appelle une issue. Ici, chaque issue est posée sur l'écran qu'elle va changer. Un mot souligné en pointillés s'explique au survol.",
      before: reset,
    },
    {
      target: "[data-tour=objectives]",
      title: "Choisis un objectif",
      text: "Chaque bouton est une épopée (Epic sur GitHub) : une grande issue qui en regroupe d'autres. La barre verte montre ce qui est fait.",
      shot: SHOTS.epopee,
      before: reset,
    },
    {
      target: "[data-tour=jalons]",
      title: "Ce qu'on fait en premier",
      text: "Un jalon (Milestone) est un lot d'issues à livrer ensemble, avec une date. P0 · MVP, la première version utile, passe d'abord.",
      before: reset,
    },
    {
      target: "[data-tour=legend]",
      title: "Quatre couleurs, quatre états",
      text: "Chaque couleur traduit un statut du tableau GitHub. Rouge : à prendre (Ready). Bleu : en cours. Ocre : bloquée. Gris : à préciser (Refinement). Vert : faite.",
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
      target: ".ecran",
      title: "Ce qu'il faut pour un écran",
      text: "Sous chaque maquette : la source des données réelles, les données fictives, la maquette validée ou non, puis les tickets d'API et de front. Un numéro ouvre sa fiche.",
      before: () => setSelected(null),
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
      title: "Deux autres vues",
      text: "« À relire » rassemble ce qui attend un avis : maquettes à valider, questions à trancher, sans coder. « Liste complète » montre tout l'arbre des issues.",
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
              <strong>{open.length}</strong> <Term t="issue">issues</Term> ouvertes · <strong>{doing}</strong> en cours ·{" "}
              <strong className="sum-free">{free}</strong> à prendre
            </p>
          </div>
          <div className="mast-bar">
            <nav className="tabs" aria-label="Vues">
              <a href={viewHash({ ...view, tab: "maquettes" })} className="tab" aria-current={tab === "maquettes" ? "page" : undefined}>
                Maquettes
              </a>
              <a href="#relire" className="tab" aria-current={tab === "relire" ? "page" : undefined}>
                À relire
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
        ) : tab === "relire" ? (
          <RelireView />
        ) : (
          <MaquettesView epicNo={epicNo} setEpicNo={setEpicNo} selected={selected} setSelected={setSelected} focus={focus} setFocus={setFocus} jalon={jalon} setJalon={setJalon} intro={intro} />
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
