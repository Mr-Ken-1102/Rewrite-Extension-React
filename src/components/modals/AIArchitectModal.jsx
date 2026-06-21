import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useRuntimeStore } from '../../store/useRuntimeStore';
import { APIService } from '../../services/apiService';

export const AIArchitectModal = ({ onClose, onDone }) => {
  const { config, profiles, updateProfiles } = usePersistentStore();
  const marinara = useRuntimeStore((state) => state.marinara);
  
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [generatedName, setGeneratedName] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [statusText, setStatusText] = useState("");

  const handleGenerate = async () => {
    const d = inputValue.trim();
    if (!d) return;

    setIsGenerating(true);
    setStatusText("AI engine structural modeling in progress...");
    // [BẢN VÁ LỖI]: Bỏ lệnh setHasResult(false) ở đây để không làm biến mất 2 ô text khi ReGenerate

    const sysP_AI = 'Output ONLY valid JSON (no markdown fences) with keys "name" (1-3 words) and "prompt" (starts with "Rewrite the following text").';

    try {
      let resultText = "";

      if (config.ollamaModel && config.ollamaModel.trim() !== "") {
        const url = (config.ollamaUrl || "http://127.0.0.1:11434/v1").replace(/\/$/, "");
        const res = await APIService.fetchWithTimeout(`${url}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.ollamaModel.trim(),
            messages: [
              { role: "system", content: sysP_AI },
              { role: "user", content: `Create a rewrite style for: ${d}` }
            ],
            temperature: 0.7
          })
        }, 25000);
        
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || data.error);
        resultText = data.choices[0].message.content;
      } else {
        if (!marinara) throw new Error("Marinara instance missing");
        const res = await marinara.apiFetch("/sidecar/tracker", {
          method: "POST",
          body: JSON.stringify({
            systemPrompt: sysP_AI,
            userPrompt: `Create a rewrite style for: ${d}`
          }),
        });
        if (res && res.error) throw new Error(res.error);
        if (!res || !res.result) throw new Error("Received empty modeling response");
        resultText = res.result;
      }

      let text = resultText.trim();
      const fence = String.fromCharCode(96, 96, 96); 
      if (text.startsWith(fence)) {
        text = text.replace(new RegExp(`^${fence}(?:json)?`, "i"), "");
        text = text.replace(new RegExp(`${fence}$`), "");
      }
      text = text.trim();

      const dataJSON = JSON.parse(text);
      if (!dataJSON.name || !dataJSON.prompt) throw new Error("JSON payload missing 'name' or 'prompt' attributes");

      setGeneratedName(dataJSON.name);
      setGeneratedPrompt(dataJSON.prompt);
      
      // Bật hiển thị 2 ô text (nếu là lần đầu Generate)
      setHasResult(true);
      setStatusText("");

    } catch (e) {
      setStatusText(`Error modeling: ${e.message || String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddStyle = () => {
    const n = generatedName.trim();
    const p = generatedPrompt.trim();
    if (!n || !p) return;
    
    const newProfiles = [...profiles];
    newProfiles.push({ id: String(Date.now()), name: n, prompt: p, order: newProfiles.length });
    updateProfiles(newProfiles);
    
    onClose();
    if (onDone) onDone();
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
      <Modal title="✨ AI Prompt Architect" onClose={onClose} width="640px">
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "12px", lineHeight: "1.55" }}>
          State the desired rewrite tone. System automatically parses and structures a professional preset name and prompt logic.
        </div>

        <textarea
          className="rwa-inp"
          placeholder='e.g., "A cynical, old, grumbling sailor who uses heavy nautical metaphors"'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isGenerating}
          style={{ height: "120px", resize: "vertical", borderRadius: "12px" }}
        />

        <div style={{ display: hasResult ? "block" : "none" }}>
          <div className="rwa-lbl">Generated Preset Name</div>
          <input 
            type="text" 
            className="rwa-inp" 
            value={generatedName}
            onChange={(e) => setGeneratedName(e.target.value)}
            disabled={isGenerating}
          />
          
          <div className="rwa-lbl">Generated Instruction Prompt</div>
          <textarea 
            className="rwa-inp" 
            value={generatedPrompt}
            onChange={(e) => setGeneratedPrompt(e.target.value)}
            disabled={isGenerating}
            style={{ height: "200px", resize: "vertical", fontSize: "13px", borderRadius: "12px" }}
          />
        </div>

        <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)", minHeight: "16px", marginBottom: "8px" }}>
          {statusText}
        </div>

        <div className="rwa-foot">
          <Button 
            className="rwa-glow-button"
            variant="rwa-replace" 
            onClick={handleAddStyle} 
            style={{ display: hasResult ? "inline-flex" : "none", flex: "1 1 0%", justifyContent: "center" }}
          >
            Add Style
          </Button>

          <Button 
            className="rwa-glow-button"
            variant="rwa-accept" 
            onClick={handleGenerate} 
            disabled={isGenerating}
            style={{ flex: "1 1 0%", color: hasResult ? "white" : undefined }}
          >
            {isGenerating ? "..." : (hasResult ? "ReGenerate" : "Generate")}
          </Button>

          <Button className="rwa-glow-button" onClick={onClose} style={{ flex: "1 1 0%" }}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};