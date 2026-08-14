import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Mail, ArrowUpCircle } from "lucide-react";

export default function RowActionsMenu({ onReminder, onEscalate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
        aria-label="Row actions"
      >
        <MoreHorizontal size={16} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-md border border-border bg-bg-elevated py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              onReminder();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
          >
            <Mail size={14} strokeWidth={1.75} />
            Send reminder email
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onEscalate();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
          >
            <ArrowUpCircle size={14} strokeWidth={1.75} />
            Escalate
          </button>
        </div>
      )}
    </div>
  );
}
