import { type ReactNode, useId, useRef, useState } from "react";
import { Bubble } from "./Bubble";

/** Un petit « ? » qui explique un élément : au survol, au focus ou au toucher. Échap le ferme. */
export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <span className="helptip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        ref={btn}
        type="button"
        className="helptip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        ?
      </button>
      <Bubble id={id} open={open} anchor={btn}>
        {children}
      </Bubble>
    </span>
  );
}
