import { type ReactNode, useId, useState } from "react";

/** Un petit « ? » qui explique un élément : au survol, au focus ou au toucher. Échap le ferme. */
export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="helptip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
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
      <span id={id} role="tooltip" className="helptip-bubble" data-open={open}>
        {children}
      </span>
    </span>
  );
}
