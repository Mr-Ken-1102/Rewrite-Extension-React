import { useEffect, useState } from 'react';
import { useToastStore } from '../../store/useToastStore';

function toastLifetime(variant) {
  if (variant === 'err') return 6000;
  if (variant === 'warn') return 5000;
  return 3500;
}

const ToastItem = ({ toast }) => {
  const [show, setShow] = useState(false);
  const removeToast = useToastStore((state) => state.removeToast);
  const lifetime = toastLifetime(toast.variant);
  const isError = toast.variant === 'err';

  useEffect(() => {
    const showTimer = window.setTimeout(() => setShow(true), 10);
    let removeTimer = null;
    const hideTimer = window.setTimeout(() => {
      setShow(false);
      removeTimer = window.setTimeout(() => {
        removeToast?.(toast.id);
      }, 400);
    }, lifetime);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [lifetime, toast.id, removeToast]);

  const iconMap = { ok: '✓', err: '✕', warn: '⚠️' };
  const classMap = { ok: 'rwa-toast-icon-ok', err: 'rwa-toast-icon-err', warn: 'rwa-toast-icon-warn' };

  return (
    <div
      className={`rwa-toast-container ${show ? 'rwa-toast-show' : ''}`}
      data-variant={toast.variant || 'warn'}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className={classMap[toast.variant] || classMap.warn} aria-hidden="true">
        {iconMap[toast.variant] || iconMap.warn}
      </span>
      <span>{toast.message}</span>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (!toasts.length) return null;

  return (
    <div className="rwa-toast-stack" aria-label="Rewrite Assistant notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
