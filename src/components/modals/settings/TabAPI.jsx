import React, { useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useRuntimeStore } from '../../../store/useRuntimeStore';
import { useToastStore } from '../../../store/useToastStore';
import { Button } from '../../ui/Button';

// [BẢN VÁ LỖI TẬN GỐC]: Xóa bỏ class Glow gây lỗi lớp phủ.
// Thay thế useState bằng can thiệp style trực tiếp giống hệt bản JS gốc để chống React nuốt sự kiện click.
const PresetItem = ({ name, url, updateConfig, showToast }) => (
  <div 
    title="Click to apply this port preset"
    onClick={() => {
      updateConfig({ ollamaUrl: url });
      showToast(`✓ Preset Applied: ${name}`, "ok");
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "var(--rwa-primary)";
      e.currentTarget.style.background = "rgba(255, 140, 0, 0.02)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)";
      e.currentTarget.style.background = "rgba(255,255,255,0.01)";
    }}
    style={{ 
      display: "flex", 
      flexDirection: "column", 
      background: "rgba(255,255,255,0.01)", 
      padding: "8px 10px", 
      borderRadius: "8px", 
      border: "1px solid rgba(255,255,255,0.03)", 
      cursor: "pointer", 
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)" 
    }}
  >
    <span style={{ fontSize: "9.5px", fontWeight: "800", color: "var(--rwa-primary)", textTransform: "uppercase" }}>{name}</span>
    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)", marginTop: "4px", wordBreak: "break-all", lineHeight: "1.2" }}>{url}</span>
  </div>
);

export const TabAPI = () => {
  const { config, updateConfig } = usePersistentStore();
  const marinara = useRuntimeStore((state) => state.marinara);
  const showToast = useToastStore((state) => state.showToast);
  
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedModels, setFetchedModels] = useState([]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    const url = (config.ollamaUrl || "").trim();

    try {
      if (!url) {
        if (!marinara) throw new Error("Marinara Context Missing");
        
        const res = await marinara.apiFetch("/sidecar/tracker", {
          method: "POST",
          body: JSON.stringify({ systemPrompt: "ping", userPrompt: "ping" }),
        });
        
        if (res && res.error) {
           throw new Error("Sidecar engine reported an error");
        }

        showToast("✓ Default Sidecar Active!", "ok");
      } else {
        const baseUrl = url.replace(/\/v1\/?$/, "").replace(/\/$/, "");
        try {
          const res1 = await fetch(`${baseUrl}/api/tags`);
          if (!res1.ok) throw new Error("tags failed");
          showToast("✓ Ollama Server Active!", "ok");
        } catch (e1) {
          const res2 = await fetch(`${url}/models`);
          if (!res2.ok) throw new Error("models failed");
          showToast("✓ API Endpoint Connected!", "ok");
        }
      }
    } catch (error) {
      showToast("✕ API Connection Failed!", "err");
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchModels = async () => {
    const url = (config.ollamaUrl || "").trim();
    if (!url) {
      showToast("ℹ️ Sidecar automatically uses the platform's active model.", "ok");
      return;
    }

    setIsFetching(true);
    const baseUrl = url.replace(/\/v1\/?$/, "").replace(/\/$/, "");

    try {
      try {
        const res1 = await fetch(`${baseUrl}/api/tags`);
        if (!res1.ok) throw new Error("tags failed");
        const data1 = await res1.json();
        if (data1.models && data1.models.length > 0) {
          setFetchedModels(data1.models.map(m => m.name));
          showToast(`Discovered ${data1.models.length} active models!`, "ok");
          return;
        }
        throw new Error("No models found");
      } catch (e1) {
        const res2 = await fetch(`${url}/models`);
        if (!res2.ok) throw new Error("models failed");
        const data2 = await res2.json();
        if (data2.data && data2.data.length > 0) {
          setFetchedModels(data2.data.map(m => m.id));
          showToast(`Discovered ${data2.data.length} active models!`, "ok");
          return;
        }
        throw new Error("No models found");
      }
    } catch (error) {
      showToast("Failed to fetch server models!", "err");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      <div className="rwa-lbl" style={{ marginBottom: "20px" }}>API ROUTE CONFIGURATION</div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "12px", width: "80px", color: "rgba(255,255,255,0.7)", fontWeight: "bold" }}>API URL:</span>
        <input 
          type="text" 
          className="rwa-inp" 
          placeholder="Leave empty to route through Default Sidecar..."
          value={config.ollamaUrl || ""}
          onChange={(e) => updateConfig({ ollamaUrl: e.target.value })}
          style={{ flex: "1", margin: "0", padding: "8px 12px", fontSize: "12px" }}
        />
        <Button 
          className="rwa-glow-button"
          variant="rwa-btn-action" 
          onClick={handleTestConnection} 
          disabled={isTesting}
          title="Test server endpoint connection"
          style={{ fontSize: isTesting ? "10px" : "14px" }} 
        >
          {isTesting ? "..." : "⚡"}
        </Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" }}>
        <span style={{ fontSize: "12px", width: "80px", color: "rgba(255,255,255,0.7)", fontWeight: "bold" }}>LLM Model:</span>
        
        {fetchedModels.length > 0 ? (
          <select 
            className="rwa-inp"
            value={config.ollamaModel || ""}
            onChange={(e) => updateConfig({ ollamaModel: e.target.value })}
            style={{ flex: "1", margin: "0", padding: "8px 12px", fontSize: "12px", background: "rgba(255,255,255,0.02)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
          >
            <option value="" style={{ background: "#13131c" }}>-- Empty (Local Sidecar) --</option>
            {fetchedModels.map(m => (
              <option key={m} value={m} style={{ background: "#13131c" }}>{m}</option>
            ))}
          </select>
        ) : (
          <input 
            type="text" 
            className="rwa-inp" 
            placeholder="Leave blank to default to Sidecar Active Model..."
            value={config.ollamaModel || ""}
            onChange={(e) => updateConfig({ ollamaModel: e.target.value })}
            style={{ flex: "1", margin: "0", padding: "8px 12px", fontSize: "12px" }}
          />
        )}

        <Button 
          className="rwa-glow-button"
          variant="rwa-btn-action" 
          onClick={handleFetchModels} 
          disabled={isFetching}
          title="Refresh model presets list"
          style={{ fontSize: isFetching ? "10px" : "14px" }} 
        >
          {isFetching ? "..." : "↻"}
        </Button>
      </div>

      <div style={{ padding: "18px 16px", background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px", marginTop: "20px" }}>
        <div style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.06em", color: "rgba(255,255,255,0.45)", marginBottom: "14px", textAlign: "center" }}>
          POPULAR API ENGINE LOCAL PORTS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <PresetItem name="Ollama" url="http://127.0.0.1:11434/v1" updateConfig={updateConfig} showToast={showToast} />
          <PresetItem name="LM Studio" url="http://127.0.0.1:1234/v1" updateConfig={updateConfig} showToast={showToast} />
          <PresetItem name="llama.cpp" url="http://127.0.0.1:8080/v1" updateConfig={updateConfig} showToast={showToast} />
          <PresetItem name="KoboldCPP" url="http://127.0.0.1:5001/v1" updateConfig={updateConfig} showToast={showToast} />
        </div>
      </div>

      <div className="rwa-err-guide" style={{ background: "transparent", border: "none", padding: "8px 0 0", marginTop: "24px" }}>
        <div className="rwa-err-guide-step" style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontStyle: "italic", paddingLeft: "14px" }}>
          Fill port route if using alternative self-hosted LLM endpoints. Otherwise, leave empty.
        </div>
      </div>
    </>
  );
};