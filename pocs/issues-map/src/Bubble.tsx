// Une bulle d'aide qui ne se fait jamais couper : rendue à la racine de la page (hors des zones qui
// défilent ou rognent), placée sous son mot, ou au-dessus s'il manque de place, et tenue dans l'écran.
// Sur téléphone, la feuille de style la pose en bas de l'écran, sur toute la largeur.
import { type ReactNode, type RefObject, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 8;
const MARGIN = 16;

export function Bubble(props: { id: string; open: boolean; anchor: RefObject<HTMLElement | null>; className?: string; children: ReactNode }) {
  const { id, open, anchor, className, children } = props;
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchor.current;
      if (!el || matchMedia("(max-width: 599px)").matches) return setPos(null);
      const r = el.getBoundingClientRect();
      const width = Math.min(280, innerWidth - MARGIN * 2);
      const left = Math.min(Math.max(r.left + r.width / 2 - width / 2, MARGIN), innerWidth - width - MARGIN);
      // Sous le mot s'il reste au moins 160 px, sinon au-dessus.
      const below = innerHeight - r.bottom > 160;
      setPos({ left, width, top: below ? r.bottom + GAP : r.top - GAP });
    };
    place();
    addEventListener("scroll", place, true);
    addEventListener("resize", place);
    return () => {
      removeEventListener("scroll", place, true);
      removeEventListener("resize", place);
    };
  }, [open, anchor]);

  const above = pos ? pos.top < (anchor.current?.getBoundingClientRect().top ?? 0) : false;
  return createPortal(
    <span
      id={id}
      role="tooltip"
      className={`helptip-bubble${className ? ` ${className}` : ""}${above ? " is-above" : ""}`}
      data-open={open}
      style={pos ? { left: pos.left, top: pos.top, width: pos.width } : undefined}
    >
      {children}
    </span>,
    document.body,
  );
}
