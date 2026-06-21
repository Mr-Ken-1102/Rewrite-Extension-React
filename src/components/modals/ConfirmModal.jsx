import React from 'react';
import { Button } from '../ui/Button';

export const ConfirmModal = ({ message, onConfirm, onCancel, zIndex = 20000 }) => {
  const handleGlowMouseMove = (e) => {
    const target = e.target.closest(".rwa-glow-button");
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--x", `${e.clientX - rect.left}px`);
      target.style.setProperty("--y", `${e.clientY - rect.top}px`);
    }
  };

  return (
    <div className="rwa-ov" style={{ zIndex }} onMouseMove={handleGlowMouseMove}>
      <div className="rwa-win" style={{ width: "340px", textAlign: "center" }}>
        <div className="rwa-body" style={{ padding: "28px 24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "14px", textShadow: "0 0 10px rgba(255, 107, 107, 0.4)" }}>
            ⚠️
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: "1.55", color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>
            {message}
          </div>
        </div>
        <div className="rwa-foot" style={{ padding: "14px 20px", background: "rgba(255,255,255,0.01)", justifyContent: "center" }}>
          <Button className="rwa-glow-button" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          {/* [BẢN VÁ]: Xóa bỏ toàn bộ !important để React nhận diện Inline Style */}
          <Button 
            className="rwa-glow-button"
            variant="rwa-dng" 
            onClick={onConfirm} 
            style={{ flex: 1, background: "rgba(255, 107, 107, 0.12)", color: "#ff6b6b", borderColor: "rgba(255, 107, 107, 0.25)" }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};