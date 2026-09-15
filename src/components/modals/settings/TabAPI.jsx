import React, { useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useToastStore } from '../../../store/useToastStore';
import { apiJson, fetchJson } from '../../../services/marinaraBridge';
import { Button } from '../../ui/Button';

const PresetItem = ({ name, url, updateConfig, showToast }) => (
  <div
    title="Click to apply this port preset"
    onClick={() => {
      updateConfig({ ollamaUrl: url });
      showToast(`✓ Preset Applied: ${name}`, 'ok');
    }}
    onMouseEnter={(event) => {
      event.currentTarget.style.borderColor = 'var(--rwa-primary)';
      event.currentTarget.style.background = 'rgba(255, 140, 0, 0.02)';
    }}
    onMouseLeave={(event) => {
      event.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
      event.currentTarget.style.background = 'rgba(255,255,255,0.01)';
    }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255,255,255,0.01)',
      padding: '8px 10px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.03)',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    }}
  >
    <span style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--rwa-primary)', textTransform: 'uppercase' }}>{name}</span>
    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginTop: '4px', wordBreak: 'break-all', lineHeight: '1.2' }}>{url}</span>
  </div>
);

export const TabAPI = () => {
  const { config, updateConfig } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedModels, setFetchedModels] = useState([]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    const url = (config.ollamaUrl || '').trim();

    try {
      if (!url) {
        const result = await apiJson('/sidecar/tracker', {
          method: 'POST',
          body: { systemPrompt: 'ping', userPrompt: 'Reply with pong.' },
        });
        if (!result || typeof result.result !== 'string') {
          throw new Error('Sidecar returned an invalid response');
        }
        showToast('✓ Default Sidecar Active!', 'ok');
      } else {
        const baseUrl = url.replace(/\/v1\/?$/, '').replace(/\/$/, '');
        try {
          await fetchJson(`${baseUrl}/api/tags`, {}, 8_000);
          showToast('✓ Ollama Server Active!', 'ok');
        } catch {
          await fetchJson(`${url.replace(/\/$/, '')}/models`, {}, 8_000);
          showToast('✓ API Endpoint Connected!', 'ok');
        }
      }
    } catch (error) {
      console.warn('[Rewrite Assistant] API connection test failed.', error);
      showToast('✕ API Connection Failed!', 'err');
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchModels = async () => {
    const url = (config.ollamaUrl || '').trim();
    if (!url) {
      showToast("ℹ️ Sidecar automatically uses the platform's active model.", 'ok');
      return;
    }

    setIsFetching(true);
    const baseUrl = url.replace(/\/v1\/?$/, '').replace(/\/$/, '');

    try {
      try {
        const data = await fetchJson(`${baseUrl}/api/tags`, {}, 8_000);
        if (Array.isArray(data?.models) && data.models.length > 0) {
          const models = data.models.map((model) => model?.name).filter(Boolean);
          setFetchedModels(models);
          showToast(`Discovered ${models.length} active models!`, 'ok');
          return;
        }
        throw new Error('No Ollama models found');
      } catch {
        const data = await fetchJson(`${url.replace(/\/$/, '')}/models`, {}, 8_000);
        if (Array.isArray(data?.data) && data.data.length > 0) {
          const models = data.data.map((model) => model?.id).filter(Boolean);
          setFetchedModels(models);
          showToast(`Discovered ${models.length} active models!`, 'ok');
          return;
        }
        throw new Error('No OpenAI-compatible models found');
      }
    } catch (error) {
      console.warn('[Rewrite Assistant] Model discovery failed.', error);
      showToast('Failed to fetch server models!', 'err');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      <div className="rwa-lbl" style={{ marginBottom: '20px' }}>API ROUTE CONFIGURATION</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', width: '80px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>API URL:</span>
        <input
          type="text"
          className="rwa-inp"
          placeholder="Leave empty to route through Default Sidecar..."
          value={config.ollamaUrl || ''}
          onChange={(event) => updateConfig({ ollamaUrl: event.target.value })}
          maxLength={2048}
          style={{ flex: '1', margin: '0', padding: '8px 12px', fontSize: '12px' }}
        />
        <Button
          className="rwa-glow-button"
          variant="rwa-btn-action"
          onClick={handleTestConnection}
          disabled={isTesting}
          title="Test server endpoint connection"
          style={{ fontSize: isTesting ? '10px' : '14px' }}
        >
          {isTesting ? '...' : '⚡'}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <span style={{ fontSize: '12px', width: '80px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>LLM Model:</span>
        {fetchedModels.length > 0 ? (
          <select
            className="rwa-inp"
            value={config.ollamaModel || ''}
            onChange={(event) => updateConfig({ ollamaModel: event.target.value })}
            style={{ flex: '1', margin: '0', padding: '8px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
          >
            <option value="" style={{ background: '#13131c' }}>-- Empty (Local Sidecar) --</option>
            {fetchedModels.map((model) => (
              <option key={model} value={model} style={{ background: '#13131c' }}>{model}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="rwa-inp"
            placeholder="Leave blank to default to Sidecar Active Model..."
            value={config.ollamaModel || ''}
            onChange={(event) => updateConfig({ ollamaModel: event.target.value })}
            maxLength={256}
            style={{ flex: '1', margin: '0', padding: '8px 12px', fontSize: '12px' }}
          />
        )}

        <Button
          className="rwa-glow-button"
          variant="rwa-btn-action"
          onClick={handleFetchModels}
          disabled={isFetching}
          title="Refresh model presets list"
          style={{ fontSize: isFetching ? '10px' : '14px' }}
        >
          {isFetching ? '...' : '↻'}
        </Button>
      </div>

      <div style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', marginTop: '20px' }}>
        <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)', marginBottom: '14px', textAlign: 'center' }}>
          POPULAR API ENGINE LOCAL PORTS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <PresetItem name="Ollama" url="http://127.0.0.1:11434/v1" updateConfig={updateConfig} showToast={showToast} />
          <PresetItem name="LM Studio" url="http://127.0.0.1:1234/v1" updateConfig={updateConfig} showToast={showToast} />
          <PresetItem name="llama.cpp" url="http://127.0.0.1:8080/v1" updateConfig={updateConfig} showToast={showToast} />
          <PresetItem name="KoboldCPP" url="http://127.0.0.1:5001/v1" updateConfig={updateConfig} showToast={showToast} />
        </div>
      </div>

      <div className="rwa-err-guide" style={{ background: 'transparent', border: 'none', padding: '8px 0 0', marginTop: '24px' }}>
        <div className="rwa-err-guide-step" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', paddingLeft: '14px' }}>
          Fill port route if using alternative self-hosted LLM endpoints. Otherwise, leave empty.
        </div>
      </div>
    </>
  );
};
