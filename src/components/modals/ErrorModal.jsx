import React from 'react';
import { Button } from '../ui/Button';

export const ErrorModal = ({ message, onClose }) => {
  const stepStyle = { fontSize: "12.5px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", lineHeight: "1.55" };

  const handleGlowMouseMove = (e) => {
    const target = e.target.closest(".rwa-glow-button");
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--x", `${e.clientX - rect.left}px`);
      target.style.setProperty("--y", `${e.clientY - rect.top}px`);
    }
  };

  return (
    <div className="rwa-ov" style={{ zIndex: 10005 }} onMouseMove={handleGlowMouseMove}>
      <div className="rwa-err-window">
        
        <div className="rwa-err-hdr" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="rwa-err-icon">⚠️</span>
            <div className="rwa-err-title">CONNECTION DIAGNOSTICS</div>
          </div>
          <Button 
            className="rwa-glow-button"
            onClick={onClose} 
            style={{ padding: "4px 10px", fontSize: "11px", fontWeight: "bold", borderRadius: "6px" }}
          >
            ✕
          </Button>
        </div>

        <div className="rwa-err-body" style={{ padding: "24px" }}>
          <div className="rwa-err-msg" style={{ marginBottom: "20px", fontSize: "13px", color: "rgba(255,255,255,0.9)", lineHeight: "1.5" }}>
            {message}
          </div>
          
          <div className="rwa-err-guide" style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="rwa-err-guide-title" style={{ fontSize: "11px", fontWeight: "800", color: "var(--rwa-primary)", letterSpacing: "0.05em", marginBottom: "12px" }}>
              🛠️ HOW TO TROUBLESHOOT:
            </div>
            
            <div className="rwa-err-guide-step" style={stepStyle}>
              <b style={{ color: '#fff' }}>1. Check Model Setting:</b> If using a custom server connection, ensure your specified <code>Model</code> name matches exactly.
            </div>
            
            <div className="rwa-err-guide-step" style={stepStyle}>
              <b style={{ color: '#fff' }}>2. Using Local Sidecar?</b> Leave the Model field <b>completely empty</b> to run Marinara's default internal bridge.
            </div>
            
            <div className="rwa-err-guide-step" style={{ ...stepStyle, marginBottom: "0" }}>
              <b style={{ color: '#fff' }}>3. Verify Sidecar Status:</b> Go to Marinara Settings &rarr; AI Models, and verify that your local sidecar is loaded and responsive.
            </div>
          </div>
        </div>

        <div className="rwa-err-foot">
          <Button 
            className="rwa-glow-button"
            variant="rwa-accept" 
            onClick={onClose} 
            style={{ padding: "8px 24px" }}
          >
            Understood
          </Button>
        </div>
        
      </div>
    </div>
  );
};