'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-3xl' };

// The one modal. Native <dialog>: top layer above everything, Esc closes it, focus stays inside,
// and a click on the backdrop closes it. Open/close animation lives in globals.css (`dialog.modal`).
// Children are the body (and optional footer); the body should be `overflow-y-auto`, the footer `shrink-0`.
export function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  size?: keyof typeof SIZES;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`modal m-auto w-[94vw] ${SIZES[size]} max-h-[90vh] p-0 matchbox-border bg-[#FAF3E0] text-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] select-text`}
    >
      <div className="flex flex-col max-h-[90vh] overflow-hidden">
        <div className="vermilion-bg text-white p-3 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 text-amber-300 shrink-0" />
            <h2 className="serif-heading text-lg tracking-tight truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-black text-white border border-white/40 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
