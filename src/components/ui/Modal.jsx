import { useRef } from 'react';
import { Button } from './Button';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';

export const Modal = ({
  title,
  children,
  onClose,
  width = "560px",
  zIndex = 10002,
}) => {
  const dialogRef = useRef(null);

  useDialogFocusTrap(dialogRef, onClose);

  return (
    <div className="rwa-ov" style={{ zIndex }}>
      <div
        ref={dialogRef}
        className="rwa-win"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Rewrite Assistant dialog'}
        tabIndex={-1}
      >
        <div className="rwa-topbar"></div>
        <div className="rwa-hdr">
          <div className="rwa-title">{title}</div>
          {onClose && (
            <Button
              className="rwa-btn-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ✕
            </Button>
          )}
        </div>
        <div className="rwa-body">
          {children}
        </div>
      </div>
    </div>
  );
};
