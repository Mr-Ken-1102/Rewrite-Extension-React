import { useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useToastStore } from '../../../store/useToastStore';
import { APIService } from '../../../services/apiService';
import { MarinaraHost } from '../../../services/marinaraHost';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';

const PresetItem = ({ name, url, updateConfig, showToast }) => (
  <button
    type="button"
    className="rwa-inp"
    onClick={() => {
      updateConfig({ ollamaUrl: url, connMode: 'direct' });
      showToast(`✓ Preset applied: ${name}`, 'ok');
    }}
    style={{ textAlign: 'left', cursor: 'pointer', padding: '9px 10px', margin: 0 }}
  >
    <strong style={{ display: 'block', color: 'var(--rwa-primary)', fontSize: '10px' }}>{name}</strong>
    <span style={{ display: 'block', opacity: 0.6, fontFamily: 'monospace', fontSize: '10px', marginTop: '3px' }}>{url}</span>
  </button>
);

export const TabAPI = () => {
  const { config, updateConfig } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [connections, setConnections] = useState([]);
  const [models, setModels] = useState([]);
  const [busy, setBusy] = useState(false);
  const actionControllerRef = useRef(null);

  useEffect(() => () => actionControllerRef.current?.abort(), []);

  useEffect(() => {
    let alive = true;
    if (config.connMode !== 'marinara') return () => { alive = false; };
    const controller = new AbortController();
    APIService.listConnections(controller.signal)
      .then((list) => {
        if (!alive) return;
        setConnections(list);
        const stillExists = list.some((connection) => connection.id === config.connectionId);
        if (config.connectionId && !stillExists) updateConfig({ connectionId: '' });
      })
      .catch(() => { if (alive) setConnections([]); });
    return () => { alive = false; controller.abort(); };
  }, [config.connMode, config.connectionId, updateConfig]);

  const selectedConnection = useMemo(
    () => connections.find((connection) => connection.id === config.connectionId),
    [connections, config.connectionId],
  );

  const directUrlAdvisory = useMemo(() => {
    if (config.connMode !== 'direct' || !config.ollamaUrl) return '';
    try {
      const url = new URL(config.ollamaUrl);
      const host = url.hostname.toLowerCase();
      const loopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (url.username || url.password) return 'Do not put API credentials in the URL. Use a Marinara connection for credentialed remote providers.';
      if (!loopback && url.protocol !== 'https:') return 'Remote Direct API is using unencrypted HTTP. Use HTTPS or a loopback/local model endpoint.';
      if (!loopback) return 'Remote Direct API: selected text and any context you explicitly enable will leave this browser session.';
      return '';
    } catch {
      return 'The Direct API URL is not valid yet.';
    }
  }, [config.connMode, config.ollamaUrl]);

  const handleTest = async () => {
    actionControllerRef.current?.abort();
    const controller = new AbortController();
    actionControllerRef.current = controller;
    setBusy(true);
    try {
      const response = await APIService.runInference(
        'You are a connection test. Output only the word ok.',
        'Reply with: ok',
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (response?.aborted) {
        showToast('⚠️ The provider aborted the connection test before completion.', 'warn');
        return;
      }
      if (response?.error) throw new Error(response.error);
      showToast(`✓ Connected${response?.result ? `: ${String(response.result).slice(0, 40)}` : ''}`, 'ok');
    } catch (err) {
      if (!controller.signal.aborted && !MarinaraHost.isAbortError(err)) {
        showToast(`✕ Connection failed: ${err?.message || String(err)}`, 'err');
      }
    } finally {
      if (actionControllerRef.current === controller) {
        actionControllerRef.current = null;
        setBusy(false);
      }
    }
  };

  const handleDiscover = async () => {
    if (config.connMode !== 'direct') {
      showToast('Model discovery is only needed for Direct API mode.', 'warn');
      return;
    }
    actionControllerRef.current?.abort();
    const controller = new AbortController();
    actionControllerRef.current = controller;
    setBusy(true);
    const result = await APIService.discoverModels(config.ollamaUrl, controller.signal);
    if (actionControllerRef.current === controller) {
      actionControllerRef.current = null;
      setBusy(false);
    }
    if (controller.signal.aborted) return;
    if (result.error) {
      showToast(`✕ ${result.error}`, 'err');
      return;
    }
    setModels(result.models || []);
    showToast(`✓ Found ${result.models?.length || 0} model(s)`, 'ok');
  };

  return (
    <>
      <div className="rwa-lbl" style={{ marginBottom: '16px' }}>MODEL SOURCE</div>

      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
        <span style={{ fontSize: '12px' }}>Connection mode</span>
        <select
          className="rwa-inp"
          value={config.connMode || 'marinara'}
          onChange={(e) => updateConfig({ connMode: e.target.value })}
          style={{ margin: 0 }}
        >
          <option value="marinara">Marinara connection (recommended)</option>
          <option value="sidecar">Marinara local sidecar model</option>
          <option value="direct">Direct OpenAI-compatible API</option>
          <option value="extender">Marinara Extender</option>
        </select>
      </div>

      {config.connMode === 'marinara' && (
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '12px' }}>Marinara connection</span>
          <select
            className="rwa-inp"
            value={config.connectionId || ''}
            onChange={(e) => updateConfig({ connectionId: e.target.value })}
            style={{ margin: 0 }}
          >
            <option value="">{connections.length ? '— Select connection —' : 'No connections found'}</option>
            {connections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name || connection.label || connection.provider || connection.id}
              </option>
            ))}
          </select>
          <span />
          <div style={{ fontSize: '10px', opacity: 0.62, lineHeight: 1.45 }}>
            Recommended: the API key remains on the Marinara server. The extension only stores the selected connection id.
            {selectedConnection ? ` Selected: ${selectedConnection.name || selectedConnection.provider || selectedConnection.id}.` : ''}
          </div>
        </div>
      )}

      {config.connMode === 'sidecar' && (
        <div className="rwa-prev" style={{ fontSize: '11px', lineHeight: 1.5, marginBottom: '18px' }}>
          Uses Marinara&apos;s downloaded local model. If you never installed the local model, choose a Marinara connection instead.
        </div>
      )}

      {config.connMode === 'extender' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px' }}>Extender server</span>
            <input
              type="text"
              className="rwa-inp"
              value={config.extenderUrl || ''}
              onChange={(e) => updateConfig({ extenderUrl: e.target.value })}
              placeholder="http://127.0.0.1:3001"
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: '12px' }}>Temperature</span>
            <input
              type="number"
              className="rwa-inp"
              min="0"
              max="2"
              step="0.1"
              value={config.directTemp ?? 0.7}
              onChange={(e) => {
                const value = Number(e.target.value);
                updateConfig({ directTemp: Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0.7 });
              }}
              style={{ margin: 0 }}
            />
          </div>
          <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '18px' }}>
            Extender mode sends rewrite prompts to the configured Marinara Extender sidecar using its OpenAI-compatible /v1/chat/completions endpoint. The Extender chooses its own model; Rewrite Assistant stores no Extender credential.
          </div>
        </>
      )}

      {config.connMode === 'direct' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px' }}>API base URL</span>
            <input
              type="text"
              className="rwa-inp"
              value={config.ollamaUrl || ''}
              onChange={(e) => updateConfig({ ollamaUrl: e.target.value })}
              placeholder="http://127.0.0.1:11434/v1"
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: '12px' }}>Model</span>
            {models.length ? (
              <select className="rwa-inp" value={config.ollamaModel || ''} onChange={(e) => updateConfig({ ollamaModel: e.target.value })} style={{ margin: 0 }}>
                <option value="">— Select model —</option>
                {models.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
            ) : (
              <input type="text" className="rwa-inp" value={config.ollamaModel || ''} onChange={(e) => updateConfig({ ollamaModel: e.target.value })} style={{ margin: 0 }} />
            )}
            <span style={{ fontSize: '12px' }}>Temperature</span>
            <input
              type="number"
              className="rwa-inp"
              min="0"
              max="2"
              step="0.1"
              value={config.directTemp ?? 0.7}
              onChange={(e) => {
                const value = Number(e.target.value);
                updateConfig({ directTemp: Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0.7 });
              }}
              style={{ margin: 0 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <PresetItem name="Ollama" url="http://127.0.0.1:11434/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem name="LM Studio" url="http://127.0.0.1:1234/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem name="llama.cpp" url="http://127.0.0.1:8080/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem name="KoboldCPP" url="http://127.0.0.1:5001/v1" updateConfig={updateConfig} showToast={showToast} />
          </div>

          <Button className="rwa-glow-button" onClick={handleDiscover} disabled={busy} style={{ width: '100%', marginBottom: '12px' }}>
            {busy ? 'Working…' : 'Discover models'}
          </Button>
          <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, opacity: 0.8 }}>
            Direct mode sends the selected text and enabled context to the URL above. Prefer loopback/local URLs for private content; use HTTPS for remote servers.
            {directUrlAdvisory ? <><br /><strong>{directUrlAdvisory}</strong></> : null}
          </div>
        </>
      )}

      <div className="rwa-lbl" style={{ marginTop: '24px', marginBottom: '12px' }}>PROMPT ECONOMY</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '12px' }}>Shorter system instructions</div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '3px' }}>Useful for smaller local models; output and context safety rules remain intact.</div>
        </div>
        <ToggleSwitch checked={config.conciseSysPrompt} onChange={(value) => updateConfig({ conciseSysPrompt: value })} />
      </div>

      <div className="rwa-lbl" style={{ marginTop: '24px', marginBottom: '12px' }}>REQUEST SAFETY</div>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px' }}>Timeout (ms)</span>
        <input
          type="number"
          className="rwa-inp"
          min="5000"
          max="180000"
          step="1000"
          value={config.requestTimeoutMs || 45000}
          onChange={(e) => updateConfig({ requestTimeoutMs: Math.max(5000, Math.min(180000, Number(e.target.value) || 45000)) })}
          style={{ margin: 0 }}
        />
        <span style={{ fontSize: '12px' }}>Prompt budget (chars)</span>
        <input
          type="number"
          className="rwa-inp"
          min="8000"
          max="120000"
          step="1000"
          value={config.maxPromptChars || 32000}
          onChange={(e) => updateConfig({ maxPromptChars: Math.max(8000, Math.min(120000, Number(e.target.value) || 32000)) })}
          style={{ margin: 0 }}
        />
      </div>

      <Button className="rwa-glow-button" variant="rwa-accept" onClick={handleTest} disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Testing…' : '⚡ Test connection'}
      </Button>
    </>
  );
};
