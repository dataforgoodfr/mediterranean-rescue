import { useEffect, useRef, useState } from "react";
import { type Step, byNumber, epics, formatDate, issues, placedEpics, projectUrl, repoUrl, stepOf, takenAt } from "./data";
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
// Pour montrer la fiche pendant la visite : la première issue à prendre posée sur les maquettes de
// l'objectif de départ, choisie au moment de la visite (une issue prise entre-temps n'y est plus).
function demoIssue() {
  const pins = placedEpics.find((p) => p.epic === DEMO_EPIC)?.pins ?? [];
  const nums = pins.map((p) => p.issue);
  const free = nums.find((n) => {
    const i = byNumber.get(n);
    return i ? stepOf(i) === "a-prendre" : false;
  });
  return free ?? nums[0] ?? null;
}

export function App() {
  // Les maquettes sont l'accueil ; la liste complète reste à un clic. La vue suit l'adresse.
  const [view, setView] = useState<View>(() => readView(DEMO_EPIC));
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [helpOpen, setHelpOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  // Première visite : on propose la visite par un bandeau, sans l'imposer.
  const [offer, setOffer] = useState(false);
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
    const t = window.setTimeout(() => setOffer(true), 700);
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

  // Quatre étapes, pas plus : l'écran doit se lire seul, la visite ne fait que montrer où regarder.
  const steps: TourStep[] = [
    {
      target: "[data-tour=objectives]",
      title: "Bienvenue dans l'atlas",
      text: "Sur GitHub, chaque tâche du projet s'appelle une issue. Ici, chaque issue est posée sur l'écran qu'elle change. Commence par un objectif : chaque bouton est une épopée (Epic), un groupe d'issues.",
      shot: SHOTS.epopee,
      before: reset,
    },
    {
      target: "[data-tour=legend]",
      title: "Où en est chaque issue",
      text: "Chaque couleur traduit un statut du tableau GitHub : rouge, à prendre (Ready) ; bleu, en cours ; ocre, bloquée ; gris, à préciser (Refinement) ; vert, faite. Les jalons, au-dessus, disent ce qu'on livre en premier.",
      shot: SHOTS.tableau,
      before: () => setSelected(null),
    },
    {
      target: "[data-tour=fiche]",
      title: "Une issue, en détail",
      text: "Un clic sur un numéro ouvre sa fiche : qui est dessus, sur quels écrans, et ce que tu peux faire. Pour en prendre une : commente « Je prends » sur GitHub, puis assigne-la-toi.",
      shot: SHOTS.jePrends,
      before: () => setSelected(demoIssue()),
    },
    {
      target: ".tabs",
      title: "Selon ce que tu fais",
      text: "Tu ne codes pas ? L'onglet « À relire » rassemble les maquettes à valider et les questions à trancher. Un mot souligné s'explique au survol, et le bouton Aide reprend tout.",
      before: () => setSelected(null),
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
      {offer && !touring && (
        <aside className="offer" aria-label="Visite guidée">
          <p>
            <strong>Première visite ?</strong> L'atlas en 4 étapes, une minute.
          </p>
          <div className="offer-actions">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setOffer(false);
                markSeen();
              }}
            >
              Plus tard
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setOffer(false);
                setTouring(true);
              }}
            >
              Commencer
            </button>
          </div>
        </aside>
      )}
      {touring && <Tour steps={steps} onClose={endTour} />}
    </div>
  );
}
