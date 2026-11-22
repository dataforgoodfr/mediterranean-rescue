import { useEffect, useRef, useState } from "react";

export type TourStep = {
  /** Sélecteur CSS de l'élément à montrer. */
  target: string;
  title: string;
  text: string;
  /** Prépare l'écran avant l'étape (choisir un objectif, ouvrir une fiche…). */
  before?: () => void;
};

type Rect = { x: number; y: number; w: number; h: number };

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Visite guidée : un halo autour de l'élément, une carte d'explication en bas de l'écran. */
export function Tour({ steps, onClose }: { steps: readonly TourStep[]; onClose: () => void }) {
  const [n, setN] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = steps[n];

  // Préparer l'écran, puis amener l'élément à l'écran.
  useEffect(() => {
    if (!step) return;
    step.before?.();
    const t = window.setTimeout(() => {
      // Sur téléphone, l'élément monte en haut : la carte d'explication garde le bas de l'écran.
      const block = matchMedia("(max-width: 700px)").matches ? "start" : "center";
      document.querySelector(step.target)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block, inline: "nearest" });
      card.current?.focus();
    }, 60);
    return () => window.clearTimeout(t);
    // Rejoué seulement quand l'étape change, pas à chaque rendu de la page.
  }, [n]);

  // Suivre l'élément pendant le défilement et le redimensionnement.
  useEffect(() => {
    if (!step) return;
    let frame = 0;
    const tick = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((old) =>
          old && old.x === r.left && old.y === r.top && old.w === r.width && old.h === r.height ? old : { x: r.left, y: r.top, w: r.width, h: r.height },
        );
      } else {
        setRect(null);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [n]);

  // Pendant la visite, de la marge en bas de page : le dernier élément peut monter au-dessus de la carte.
  useEffect(() => {
    document.documentElement.classList.add("touring");
    return () => document.documentElement.classList.remove("touring");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setN((k) => Math.min(k + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setN((k) => Math.max(k - 1, 0));
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose, steps.length]);

  if (!step) return null;
  const last = n === steps.length - 1;
  const pad = 8;
  // La carte se met du côté où il reste le plus de place.
  const top = rect ? rect.y > innerHeight - (rect.y + rect.h) : false;

  return (
    <div className="tour" role="dialog" aria-modal="false" aria-labelledby="tour-title">
      {rect ? (
        <div
          className="tour-spot"
          style={{ transform: `translate(${rect.x - pad}px, ${rect.y - pad}px)`, width: rect.w + pad * 2, height: rect.h + pad * 2 }}
          aria-hidden="true"
        />
      ) : (
        <div className="tour-veil" aria-hidden="true" />
      )}
      <div className={top ? "tour-card is-top" : "tour-card"} ref={card} tabIndex={-1} key={n}>
        <p className="tour-count">
          Étape {n + 1} sur {steps.length}
        </p>
        <h2 id="tour-title" className="tour-title">
          {step.title}
        </h2>
        <p className="tour-text">{step.text}</p>
        <div className="tour-dots" aria-hidden="true">
          {steps.map((s, k) => (
            <span key={s.title} className={k === n ? "is-on" : k < n ? "is-done" : ""} />
          ))}
        </div>
        <div className="tour-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Passer
          </button>
          <span className="tour-nav">
            {n > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => setN(n - 1)}>
                Précédent
              </button>
            )}
            <button type="button" className="btn" onClick={() => (last ? onClose() : setN(n + 1))}>
              {last ? "C'est parti" : "Suivant"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
