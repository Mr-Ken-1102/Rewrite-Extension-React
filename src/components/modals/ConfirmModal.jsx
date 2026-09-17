import { useRef } from 'react';
import { Button } from '../ui/Button';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';

export const ConfirmModal = ({ message, onConfirm, onCancel, zIndex = 20000 }) => {
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onCancel);

  return (
    <div className="rwa-ov" style={{ zIndex }}>
      <div ref={dialogRef} className="rwa-win" style={{ width: '340px', textAlign: 'center' }} role="alertdialog" aria-modal="true" aria-label="Confirmation" tabIndex={-1}>
        <div className="rwa-body" style={{ padding: '28px 24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }} aria-hidden="true">
            ⚠️
          </div>
          <div style={{ fontSize: '13.5px', lineHeight: '1.55', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
            {message}
          </div>
        </div>
        <div className="rwa-foot" style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.01)', justifyContent: 'center' }}>
          <Button glow={false} onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            glow={false}
            variant="rwa-dng"
            onClick={onConfirm}
            style={{ flex: 1, background: 'rgba(255, 107, 107, 0.12)', color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.25)' }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
