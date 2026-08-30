import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Hammer, Bell } from 'lucide-react';
import { SoundFXManager } from '../ble/SoundFX';

interface Props {
  /** Display name shown in the toast */
  label: string;
  children: React.ReactNode;
}

/**
 * Wraps a feature panel that is still under development.
 * Any click anywhere inside the wrapped area shows a
 * "قيد التطوير 🚧 — <label>" toast and plays a click beep.
 * Also renders a small badge in the top-right corner.
 */
export const DevOnlyWrapper: React.FC<Props> = ({ label, children }) => {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const notify = useCallback(
    (specific?: string) => {
      SoundFXManager.playClickBeep();
      setToast(specific ? `قيد التطوير 🚧 — ${specific}` : `قيد التطوير 🚧 — ${label}`);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setToast(null), 2600);
    },
    [label],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Extract the text of the clicked element to show a more specific toast
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Try to find a meaningful label from the clicked element or its nearest heading/button
    const btn = target.closest('button');
    const heading = target.closest('h1, h2, h3, h4, h5, h6');
    const label_ = target.closest('label');
    const link = target.closest('a');
    const input = target.closest('input, select, textarea');

    let specific: string | undefined;
    if (btn && btn.textContent?.trim()) specific = btn.textContent.trim().slice(0, 30);
    else if (heading && heading.textContent?.trim()) specific = heading.textContent.trim().slice(0, 30);
    else if (label_ && label_.textContent?.trim()) specific = label_.textContent.trim().slice(0, 30);
    else if (link && link.textContent?.trim()) specific = link.textContent.trim().slice(0, 30);
    else if (input) {
      const lbl = input.getAttribute('aria-label') || input.getAttribute('placeholder');
      if (lbl) specific = lbl.slice(0, 30);
    }

    notify(specific);
  };

  return (
    <>
      <div
        className="relative"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="absolute top-3 left-3 z-20 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 pointer-events-none">
          <Hammer className="w-3 h-3" />
          <span>قيد التطوير 🚧</span>
        </span>
        <div className="pointer-events-none select-none">{children}</div>
      </div>
      {toast &&
        createPortal(
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2147483000] bg-slate-950/95 border border-amber-500/50 text-amber-200 text-xs font-black px-4 py-2.5 rounded-2xl shadow-2xl shadow-amber-500/20 backdrop-blur whitespace-nowrap max-w-[92vw] text-center flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toast}</span>
          </div>,
          document.body,
        )}
    </>
  );
};
