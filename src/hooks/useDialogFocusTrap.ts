import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

function getFocusable(dialog: HTMLElement | null): HTMLElement[] {
  if (!dialog) return [];
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((node) => node.tabIndex !== -1);
}

export function useDialogFocusTrap({
  dialogRef,
  active,
  onEscape,
  capture = false,
  autoFocus = true,
  restoreFocus = true,
}: {
  dialogRef: RefObject<HTMLElement | null>;
  active: boolean;
  onEscape: () => void;
  capture?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}) {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (autoFocus) {
      const focusable = getFocusable(dialog);
      (focusable[0] ?? dialog)?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (capture) event.stopImmediatePropagation();
        onEscapeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = getFocusable(dialog);
      if (nodes.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, capture);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, capture);
      if (restoreFocus) previouslyFocused?.focus();
    };
  }, [active, autoFocus, capture, dialogRef, restoreFocus]);
}
