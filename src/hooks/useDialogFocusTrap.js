import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function activeElementFor(node) {
  const root = node?.getRootNode?.();
  if (root && 'activeElement' in root) return root.activeElement;
  return document.activeElement;
}

function isUsable(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  return true;
}

export function useDialogFocusTrap(dialogRef, onClose, enabled = true) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!enabled) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previous = activeElementFor(dialog);
    const focusables = () => Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(isUsable);
    const focusFrame = requestAnimationFrame(() => {
      const target = focusables()[0] || dialog;
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (event) => {
      const eventTarget = event.target instanceof Element ? event.target : null;
      const nearestDialog = eventTarget?.closest?.('[role="dialog"], [role="alertdialog"]');
      if (nearestDialog && nearestDialog !== dialog) return;

      if (event.key === 'Escape' && onCloseRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const current = activeElementFor(dialog);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (current === first || !dialog.contains(current))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (current === last || !dialog.contains(current))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    dialog.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(focusFrame);
      dialog.removeEventListener('keydown', onKeyDown, true);
      if (previous instanceof HTMLElement && previous.isConnected) {
        requestAnimationFrame(() => previous.focus({ preventScroll: true }));
      }
    };
  }, [dialogRef, enabled]);
}
