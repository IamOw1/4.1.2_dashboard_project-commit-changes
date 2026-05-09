import { HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

type Placement = 'top' | 'right' | 'bottom' | 'left';

const placementClass: Record<Placement, string> = {
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function HelpTooltip({
  text,
  placement = 'top',
}: {
  text: string;
  placement?: Placement;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open, close]);

  return (
    <span ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="Справка"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="p-0.5 rounded text-cyan-400/90 hover:text-cyan-300 hover:bg-gray-700/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`absolute z-50 w-56 rounded-md border border-cyan-500/40 bg-gray-900 px-3 py-2 text-xs text-gray-100 shadow-xl ${placementClass[placement]}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
