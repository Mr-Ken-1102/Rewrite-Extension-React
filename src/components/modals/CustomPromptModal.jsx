import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';

export const CustomPromptModal = ({ onClose, onRunRewrite }) => {
  const { customs, updateCustoms } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [promptValue, setPromptValue] = useState("");
  
  // [BẢN VÁ]: Khôi phục Reference để Auto-focus vào TextArea
  const textareaRef = useRef(null);

  const handleRun = () => {
    const v = promptValue.trim();
    
    if (!v) {
      showToast("⚠️ Please enter your custom prompt first!", "warn");
      if (textareaRef.current) {
        textareaRef.current.focus(); // Khôi phục trải nghiệm UX hoàn hảo
      }
      return;
    }
    
    const newCustoms = [...customs];
    if (!newCustoms.includes(v)) {
      newCustoms.unshift(v);
      if (newCustoms.length > 8) newCustoms.length = 8;
      updateCustoms(newCustoms);
    }
    
    onClose();
    onRunRewrite({ id: "custom", name: "Custom", order: -1, prompt: v });
  };

  const handleDeleteCustom = (index) => {
    const newCustoms = [...customs];
    newCustoms.splice(index, 1);
    updateCustoms(newCustoms);
  };

  const handleGlowMouseMove = (e) => {
    const target = e.target.closest(".rwa-glow-button");
    if (target) {
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--x", `${e.clientX - rect.left}px`);
      target.style.setProperty("--y", `${e.clientY - rect.top}px`);
    }
  };

  return (
    <div onMouseMove={handleGlowMouseMove}>
      <Modal title="✉️ Compile Custom Prompt" onClose={onClose} width="640px">
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", lineHeight: "1.5" }}>
          Describe detailed rewrite instructions. Prompt registers automatically in the history log for reuse.
        </div>

        <textarea
          ref={textareaRef}
          className="rwa-inp"
          placeholder='e.g., "Make Sarah sound incredibly furious, stammering under her breath, and expand prose by 30%"'
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          style={{ height: "140px", resize: "vertical", marginBottom: "10px", fontSize: "13px", borderRadius: "12px" }}
        />

        {customs.length > 0 && (
          <>
            <div className="rwa-lbl">History Log (Custom Prompts)</div>
            <div style={{ maxHeight: "130px", overflowY: "auto", marginBottom: "10px" }}>
              {customs.map((c, i) => (
                <div 
                  key={i} 
                  style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 12px", background: "rgba(255,255,255,0.015)", borderRadius: "10px", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div style={{ flex: "1", fontSize: "11.5px", color: "rgba(255,255,255,0.8)", lineHeight: "1.45" }}>
                    {c}
                  </div>

                  <Button 
                    className="rwa-glow-button"
                    onClick={() => setPromptValue(c)}
                    style={{ flexShrink: 0, fontSize: "10px", padding: "4px 8px", borderRadius: "6px" }}
                  >
                    Use
                  </Button>

                  <Button 
                    className="rwa-glow-button"
                    variant="rwa-dng" 
                    onClick={() => handleDeleteCustom(i)}
                    style={{ flexShrink: 0, fontSize: "10px", padding: "4px 8px", borderRadius: "6px" }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="rwa-foot">
          <Button className="rwa-glow-button" variant="rwa-accept" onClick={handleRun} style={{ flex: 1 }}>
            Run
          </Button>
          <Button className="rwa-glow-button" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};