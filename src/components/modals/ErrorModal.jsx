import { useRef } from 'react';
import { Button } from '../ui/Button';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { useGlowPointer } from '../../hooks/useGlowPointer';

export const ErrorModal = ({ message, onClose }) => {
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onClose);
  const stepStyle = { fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', lineHeight: '1.55' };

  const handleGlowPointerMove = useGlowPointer();

  return (
    <div className="rwa-ov" style={{ zIndex: 10005 }} onPointerMove={handleGlowPointerMove}>
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

            <div className="rwa-err-guide-step" style={stepStyle}>
              <b style={{ color: '#fff' }}>1. Marinara connection:</b> Rewrite Assistant follows the current chat connection automatically. Verify that the active chat has a valid Marinara connection in the chat settings.
            </div>

            <div className="rwa-err-guide-step" style={stepStyle}>
              <b style={{ color: '#fff' }}>2. Direct API / LAN Ollama:</b> Verify the base URL and exact model name. For another machine on your LAN, Ollama must listen beyond loopback (for example via <code>OLLAMA_HOST</code>), the firewall must allow TCP 11434, and the Marinara page origin must be allowed by Ollama&apos;s origin/CORS policy (for example via <code>OLLAMA_ORIGINS</code>). A browser-level “Failed to fetch” does not expose which of these layers blocked the request.
            </div>

            <div className="rwa-err-guide-step" style={{ ...stepStyle, marginBottom: '0' }}>
              <b style={{ color: '#fff' }}>3. Local Sidecar:</b> A Sidecar 503 is separate from Direct API. If you selected Sidecar mode, verify Marinara&apos;s downloaded local model is installed and responsive.
            </div>
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
