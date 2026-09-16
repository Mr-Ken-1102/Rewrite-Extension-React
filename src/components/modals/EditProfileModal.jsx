import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';

export const EditProfileModal = ({ profileToEdit, initialDraft, onClose }) => {
  const { profiles, updateProfiles } = usePersistentStore();
  
  const [name, setName] = useState(profileToEdit ? profileToEdit.name : (initialDraft?.name || ''));
  const [prompt, setPrompt] = useState(profileToEdit ? profileToEdit.prompt : (initialDraft?.prompt || ''));
  const [color, setColor] = useState((profileToEdit && profileToEdit.color) ? profileToEdit.color : "#ff8c00");

  const handleSave = () => {
    const n = name.trim();
    const p = prompt.trim();
    if (!n || !p) return;

    const chosenColor = color !== "#ff8c00" ? color : null;
    
    const newProfile = {
      id: profileToEdit ? profileToEdit.id : String(Date.now()),
      name: n,
      prompt: p,
      order: profileToEdit ? (profileToEdit.order || 0) : profiles.length,
      hidden: profileToEdit?.hidden === true,
      color: chosenColor,
    };

    const newProfiles = [...profiles];
    const actualIndex = profileToEdit ? newProfiles.findIndex((item) => item.id === profileToEdit.id) : -1;
    if (actualIndex >= 0) newProfiles[actualIndex] = newProfile;
    else newProfiles.push(newProfile);
    
    updateProfiles(newProfiles);
    onClose();
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
      <Modal title={`${profileToEdit ? "Modify" : "Create"} Style Preset`} onClose={onClose} width="640px">
        
        <div className="rwa-lbl">Style Name</div>
        <input 
          type="text" 
          className="rwa-inp" 
          placeholder="e.g., Pirate Accent" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          aria-label="Style name"
        />

        <div className="rwa-lbl">Instructional Prompt</div>
        <textarea 
          className="rwa-inp" 
          placeholder="Rewrite the following text converting style..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={5000}
          aria-label="Instructional prompt"
          style={{ height: "180px", resize: "vertical", fontSize: "13px", borderRadius: "12px" }}
        />

        <div className="rwa-lbl">Visual Accent Color Indicator (Default: Orange)</div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: "42px", height: "30px", padding: "2px", cursor: "pointer", border: "none", background: "none", borderRadius: "6px" }}
          />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Orange = Default</span>
          
          <Button 
            className="rwa-glow-button"
            onClick={() => setColor("#ff8c00")}
            style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "6px" }}
          >
            Reset Color
          </Button>
        </div>

        <div className="rwa-foot">
          <Button className="rwa-glow-button" variant="rwa-accept" onClick={handleSave} style={{ flex: 1 }}>
            Save
          </Button>
          <Button className="rwa-glow-button" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
        </div>

      </Modal>
    </div>
  );
};