import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  width?: string;
  children: ReactNode;
}

/**
 * Renders via createPortal directly into document.body. This guarantees the modal
 * sits outside every ancestor's stacking context (Leaflet panes, backdrop-filter
 * panels, transformed elements, etc.) — no z-index value anywhere else in the app
 * can ever trap it again.
 */
export function Modal({ open, onClose, title, subtitle, icon, width = 'w-[44rem]', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 12, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
    );
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`${width} max-w-[94vw] max-h-[88vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0c0f18] shadow-2xl shadow-black/50`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c0f18] px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
