import { useRef } from 'react';
import { Button } from '../ui/Button';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { usePersistentStore } from '../../store/usePersistentStore';

export const ErrorModal = ({ message, onClose }) => {
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onClose);
  const connMode = usePersistentStore((state) => state.config.connMode || 'marinara');
  const isTimeout = /timed out|timeouterror/i.test(String(message || ''));
  const stepStyle = { fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', lineHeight: '1.55' };

  return (
    <div className="rwa-ov" style={{ zIndex: 10005 }}>
      <div ref={dialogRef} className="rwa-err-window" role="alertdialog" aria-modal="true" aria-label="Connection diagnostics" tabIndex={-1}>
        <div className="rwa-err-hdr" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="rwa-err-icon">⚠️</span>
            <div className="rwa-err-title">CONNECTION DIAGNOSTICS</div>
          </div>
          <Button
            glow={false}
            onClick={onClose}
            aria-label="Close diagnostics"
            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
          >
            ✕
          </Button>
        </div>

        <div className="rwa-err-body" style={{ padding: '24px' }}>
          <div className="rwa-err-msg" style={{ marginBottom: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
            {message}
          </div>

          <div className="rwa-err-guide" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="rwa-err-guide-title" style={{ fontSize: '11px', fontWeight: '800', color: 'var(--rwa-primary)', letterSpacing: '0.05em', marginBottom: '12px' }}>
              🛠️ HOW TO TROUBLESHOOT:
            </div>

            {connMode === 'marinara' ? (
              <>
                <div className="rwa-err-guide-step" style={stepStyle}>
                  <b style={{ color: '#fff' }}>Marinara connection:</b> Rewrite Assistant follows the current chat connection automatically. Verify that the active chat still has a valid connection and model in Marinara.
                </div>
                <div className="rwa-err-guide-step" style={{ ...stepStyle, marginBottom: '0' }}>
                  <b style={{ color: '#fff' }}>{isTimeout ? 'Timeout note:' : 'Generation note:'}</b> Normal rewrites are no longer cut off by an extension-side deadline. If this message came from a connection test, only that test is time-bounded; a normal rewrite is allowed to finish unless you press Cancel.
                </div>
              </>
            ) : connMode === 'direct' ? (
              <div className="rwa-err-guide-step" style={{ ...stepStyle, marginBottom: '0' }}>
                <b style={{ color: '#fff' }}>Direct API / LAN Ollama:</b> Verify the base URL and exact model name. For another machine on your LAN, Ollama must listen beyond loopback, the firewall must allow TCP 11434, and the Marinara page origin must be allowed by Ollama&apos;s CORS policy.
              </div>
            ) : connMode === 'sidecar' ? (
              <div className="rwa-err-guide-step" style={{ ...stepStyle, marginBottom: '0' }}>
                <b style={{ color: '#fff' }}>Local Sidecar:</b> Verify Marinara&apos;s downloaded local model is installed, loaded, and responsive.
              </div>
            ) : (
              <div className="rwa-err-guide-step" style={{ ...stepStyle, marginBottom: '0' }}>
                <b style={{ color: '#fff' }}>Extender:</b> Verify the Marinara Extender server URL and confirm the sidecar is running and reachable.
              </div>
            )}
          </div>
        </div>

        <div className="rwa-err-foot">
          <Button
            glow={false}
            variant="rwa-accept"
            onClick={onClose}
            style={{ padding: '8px 24px' }}
          >
            Understood
          </Button>
        </div>
      </div>
    </div>
  );
};
