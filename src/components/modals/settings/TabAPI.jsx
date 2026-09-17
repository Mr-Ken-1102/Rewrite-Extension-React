import { useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useToastStore } from '../../../store/useToastStore';
import { APIService } from '../../../services/apiService';
import { MarinaraHost } from '../../../services/marinaraHost';
import { isLikelyLocalNetworkUrl } from '../../../services/policies/providerPolicy';
import { DOMUtils } from '../../../utils/domUtils';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';

const connectionLabel = (connection) => connection?.name || connection?.label || connection?.provider || connection?.id || 'Unknown connection';

const PresetItem = ({ name, url, updateConfig, showToast }) => (
  <button
    type="button"
    className="rwa-inp rwa-api-preset"
    onClick={() => {
      updateConfig({ ollamaUrl: url, connMode: 'direct' });
      showToast(`✓ Preset applied: ${name}`, 'ok');
    }}
  >
    <strong>{name}</strong>
    <span>{url}</span>
  </button>
);

function lanDiagnosticMessage(result) {
  if (!result) return '';
  if (result.ok) return result.message || 'LAN provider is reachable.';
  if (result.issue === 'permission') {
    return 'Browser Local Network Access is denied for this Marinara site. Allow local-network access in the browser site permissions, then retry.';
  }
  if (result.issue === 'cors') {
    return 'The laptop is reachable, but readable browser access is blocked. Add this Marinara origin to OLLAMA_ORIGINS, fully restart Ollama, then retry.';
  }
  if (result.issue === 'transport') {
    return 'The 3080 machine cannot reach Ollama on the laptop. Make Ollama listen on 0.0.0.0:11434 and allow inbound TCP 11434 from the local subnet in the laptop firewall.';
  }
  return result.message || 'LAN diagnosis could not determine the failure.';
}

export const TabAPI = () => {
  const { config, updateConfig } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [connections, setConnections] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
  const [connectionLoadError, setConnectionLoadError] = useState('');
  const [models, setModels] = useState([]);
  const [busy, setBusy] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const [lanDiagnostic, setLanDiagnostic] = useState(null);
  const actionControllerRef = useRef(null);

  useEffect(() => () => actionControllerRef.current?.abort(), []);
  useEffect(() => { setLanDiagnostic(null); }, [config.ollamaUrl]);

  useEffect(() => {
    let alive = true;
    if (config.connMode !== 'marinara') return () => { alive = false; };
    const controller = new AbortController();
    const chatId = DOMUtils.getChatId();
    setConnectionLoadError('');

    Promise.all([
      APIService.listConnections(controller.signal),
      chatId ? APIService.fetchChat(chatId, controller.signal) : Promise.resolve(null),
    ]).then(([list, chat]) => {
      if (!alive) return;
      setConnections(list);
      setChatInfo(chatId ? { id: chatId, ...(chat || {}) } : null);
      const stillExists = list.some((connection) => connection.id === config.connectionId);
      if (config.connectionId && !stillExists) updateConfig({ connectionId: '' });
    }).catch((err) => {
      if (!alive || controller.signal.aborted) return;
      setConnections([]);
      setChatInfo(chatId ? { id: chatId } : null);
      setConnectionLoadError(err?.message || String(err));
    });

    return () => { alive = false; controller.abort(); };
  }, [config.connMode, config.connectionId, refreshSeq, updateConfig]);

  const activeChatId = chatInfo?.id || DOMUtils.getChatId() || '';
  const chatConnectionId = typeof chatInfo?.connectionId === 'string' ? chatInfo.connectionId.trim() : '';
  const currentChatConnection = useMemo(
    () => connections.find((connection) => connection.id === chatConnectionId) || null,
    [connections, chatConnectionId],
  );
  const fallbackConnection = useMemo(
    () => connections.find((connection) => connection.id === config.connectionId) || null,
    [connections, config.connectionId],
  );
  const effectiveConnection = chatConnectionId ? currentChatConnection : fallbackConnection;
  const directIsLan = useMemo(
    () => config.connMode === 'direct' && isLikelyLocalNetworkUrl(config.ollamaUrl),
    [config.connMode, config.ollamaUrl],
  );
  const browserOrigin = globalThis.location?.origin || 'Unavailable in this host';

  const directUrlAdvisory = useMemo(() => {
    if (config.connMode !== 'direct' || !config.ollamaUrl) return '';
    try {
      const url = new URL(config.ollamaUrl);
      const host = url.hostname.toLowerCase();
      const loopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      const localNetwork = isLikelyLocalNetworkUrl(config.ollamaUrl) && !loopback;
      if (url.username || url.password) return 'Do not put API credentials in the URL. Use a Marinara connection for credentialed remote providers.';
      if (localNetwork) return 'LAN Direct API: the browser needs local-network permission, the laptop must expose Ollama to the LAN, and Ollama CORS must allow this Marinara origin.';
      if (!loopback && url.protocol !== 'https:') return 'Remote Direct API is using unencrypted HTTP. Use HTTPS for non-LAN remote servers.';
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
        {
          chatId: activeChatId,
          requestTimeoutMs: Math.max(90000, Number(config.requestTimeoutMs) || 45000),
        },
      );
      if (controller.signal.aborted) return;
      if (response?.aborted) {
        showToast('⚠️ The provider aborted the connection test before completion.', 'warn');
        return;
      }
      if (response?.error) throw new Error(response.error);
      const suffix = config.connMode === 'marinara' && effectiveConnection ? ` via ${connectionLabel(effectiveConnection)}` : '';
      showToast(`✓ Connected${suffix}${response?.result ? `: ${String(response.result).slice(0, 40)}` : ''}`, 'ok');
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

  const handleLanDiagnose = async () => {
    actionControllerRef.current?.abort();
    const controller = new AbortController();
    actionControllerRef.current = controller;
    setBusy(true);
    setLanDiagnostic(null);
    try {
      const result = await APIService.diagnoseDirectApi(config.ollamaUrl, controller.signal);
      if (controller.signal.aborted) return;
      setLanDiagnostic(result);
      if (result.ok && result.models?.length) setModels(result.models);
      showToast(result.ok ? `✓ ${lanDiagnosticMessage(result)}` : `✕ ${lanDiagnosticMessage(result)}`, result.ok ? 'ok' : 'warn');
    } catch (err) {
      if (!controller.signal.aborted && !MarinaraHost.isAbortError(err)) {
        const result = { ok: false, issue: 'transport', message: err?.message || String(err) };
        setLanDiagnostic(result);
        showToast(`✕ ${lanDiagnosticMessage(result)}`, 'err');
      }
    } finally {
      if (actionControllerRef.current === controller) {
        actionControllerRef.current = null;
        setBusy(false);
      }
    }
  };

  return (
    <>
      <div className="rwa-lbl rwa-settings-section-title">MODEL SOURCE</div>

      <div className="rwa-form-row">
        <span>Connection mode</span>
        <select className="rwa-inp" value={config.connMode || 'marinara'} onChange={(event) => updateConfig({ connMode: event.target.value })}>
          <option value="marinara">Marinara connection (recommended)</option>
          <option value="sidecar">Marinara local sidecar model</option>
          <option value="direct">Direct OpenAI-compatible API</option>
          <option value="extender">Marinara Extender</option>
        </select>
      </div>

      {config.connMode === 'marinara' && (
        <div className="rwa-api-connection-block">
          <div className={`rwa-connection-card ${chatConnectionId && !currentChatConnection ? 'rwa-connection-card-error' : ''}`}>
            <div className="rwa-connection-card-head">
              <div>
                <div className="rwa-connection-eyebrow">CURRENT CHAT CONNECTION</div>
                <div className="rwa-connection-name">
                  {currentChatConnection
                    ? connectionLabel(currentChatConnection)
                    : (chatConnectionId ? 'Connection unavailable' : 'No connection selected on this chat')}
                </div>
              </div>
              <Button glow={false} onClick={() => setRefreshSeq((value) => value + 1)} disabled={busy} className="rwa-connection-refresh">Refresh</Button>
            </div>
            <div className="rwa-connection-note">
              {connectionLoadError
                ? `Could not read Marinara connection state: ${connectionLoadError}`
                : currentChatConnection
                  ? `Rewrite Assistant follows this chat automatically. No separate model selection is required.${chatInfo?.name ? ` Chat: ${chatInfo.name}.` : ''}`
                  : chatConnectionId
                    ? 'This chat points to a connection that is no longer present. Fix the chat connection in Marinara before rewriting.'
                    : 'Choose a connection in Marinara chat settings. The fallback below is used only when the chat itself has no connection.'}
            </div>
          </div>

          {!chatConnectionId && (
            <div className="rwa-form-row rwa-form-row-compact">
              <span>Fallback connection</span>
              <select className="rwa-inp" value={config.connectionId || ''} onChange={(event) => updateConfig({ connectionId: event.target.value })}>
                <option value="">{connections.length ? '— Optional fallback —' : 'No connections found'}</option>
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>{connectionLabel(connection)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {config.connMode === 'sidecar' && (
        <div className="rwa-prev rwa-api-note">
          Uses Marinara&apos;s downloaded local model. If you never installed the local model, choose a Marinara connection instead.
        </div>
      )}

      {config.connMode === 'extender' && (
        <>
          <div className="rwa-form-grid">
            <span>Extender server</span>
            <input type="text" className="rwa-inp" value={config.extenderUrl || ''} onChange={(event) => updateConfig({ extenderUrl: event.target.value })} placeholder="http://127.0.0.1:3001" />
            <span>Temperature</span>
            <input type="number" className="rwa-inp" min="0" max="2" step="0.1" value={config.directTemp ?? 0.7} onChange={(event) => {
              const value = Number(event.target.value);
              updateConfig({ directTemp: Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0.7 });
            }} />
          </div>
          <div className="rwa-prev rwa-api-note">
            Extender mode sends rewrite prompts to the configured Marinara Extender sidecar using its OpenAI-compatible /v1/chat/completions endpoint. The Extender chooses its own model; Rewrite Assistant stores no Extender credential.
          </div>
        </>
      )}

      {config.connMode === 'direct' && (
        <>
          <div className="rwa-form-grid">
            <span>API base URL</span>
            <input type="text" className="rwa-inp" value={config.ollamaUrl || ''} onChange={(event) => updateConfig({ ollamaUrl: event.target.value })} placeholder="http://127.0.0.1:11434/v1" />
            <span>Model</span>
            {models.length ? (
              <select className="rwa-inp" value={config.ollamaModel || ''} onChange={(event) => updateConfig({ ollamaModel: event.target.value })}>
                <option value="">— Select model —</option>
                {models.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
            ) : (
              <input type="text" className="rwa-inp" value={config.ollamaModel || ''} onChange={(event) => updateConfig({ ollamaModel: event.target.value })} />
            )}
            <span>Temperature</span>
            <input type="number" className="rwa-inp" min="0" max="2" step="0.1" value={config.directTemp ?? 0.7} onChange={(event) => {
              const value = Number(event.target.value);
              updateConfig({ directTemp: Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0.7 });
            }} />
          </div>

          <div className="rwa-api-preset-grid">
            <PresetItem name="Ollama" url="http://127.0.0.1:11434/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem name="LM Studio" url="http://127.0.0.1:1234/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem name="llama.cpp" url="http://127.0.0.1:8080/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem name="KoboldCPP" url="http://127.0.0.1:5001/v1" updateConfig={updateConfig} showToast={showToast} />
          </div>

          <Button glow={false} className="rwa-full-width" onClick={handleDiscover} disabled={busy}>
            {busy ? 'Working…' : 'Discover models'}
          </Button>

          {directIsLan && (
            <div className="rwa-prev rwa-api-note" style={{ marginTop: '10px', borderColor: 'rgba(209,154,69,.24)' }}>
              <div className="rwa-lbl" style={{ marginBottom: '8px' }}>LAN OLLAMA SETUP</div>
              <div style={{ fontSize: '10px', lineHeight: 1.55, marginBottom: '8px' }}>
                Direct LAN mode runs from the browser on this machine. The Ollama laptop must listen on the LAN, allow this Marinara web origin through CORS, and permit TCP 11434 through its firewall.
              </div>
              <div style={{ fontSize: '9.5px', opacity: 0.7, marginBottom: '4px' }}>Current Marinara browser origin</div>
              <code style={{ display: 'block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '10px', marginBottom: '8px' }}>{browserOrigin}</code>
              <div style={{ fontSize: '9.5px', opacity: 0.7, marginBottom: '4px' }}>Recommended Ollama environment on the backend laptop</div>
              <code style={{ display: 'block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '10px', lineHeight: 1.55, marginBottom: '10px' }}>{`OLLAMA_HOST=0.0.0.0:11434\nOLLAMA_ORIGINS=${browserOrigin}`}</code>
              <Button glow={false} className="rwa-full-width" onClick={handleLanDiagnose} disabled={busy}>
                {busy ? 'Diagnosing…' : 'Diagnose LAN access'}
              </Button>
              {lanDiagnostic ? (
                <div
                  role="status"
                  style={{
                    marginTop: '9px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    color: lanDiagnostic.ok ? '#77c8a7' : '#ffb5a8',
                    fontSize: '10px',
                    lineHeight: 1.5,
                  }}
                >
                  {lanDiagnosticMessage(lanDiagnostic)}
                  {lanDiagnostic.permission && lanDiagnostic.permission !== 'unsupported'
                    ? ` Browser permission: ${lanDiagnostic.permission}.`
                    : ''}
                </div>
              ) : null}
            </div>
          )}

          <div className="rwa-prev rwa-api-note">
            Direct mode sends the selected text and enabled context to the URL above. Prefer loopback/local URLs for private content; use HTTPS for remote servers.
            {directUrlAdvisory ? <><br /><strong>{directUrlAdvisory}</strong></> : null}
          </div>
        </>
      )}

      <div className="rwa-lbl rwa-settings-section-title">PROMPT ECONOMY</div>
      <div className="rwa-setting-toggle-row">
        <div>
          <div>Shorter system instructions</div>
          <small>Useful for smaller local models; output and context safety rules remain intact.</small>
        </div>
        <ToggleSwitch checked={config.conciseSysPrompt} onChange={(value) => updateConfig({ conciseSysPrompt: value })} />
      </div>

      <div className="rwa-lbl rwa-settings-section-title">REQUEST SAFETY</div>
      <div className="rwa-form-grid">
        <span>Timeout (ms)</span>
        <input type="number" className="rwa-inp" min="5000" max="180000" step="1000" value={config.requestTimeoutMs || 45000} onChange={(event) => updateConfig({ requestTimeoutMs: Math.max(5000, Math.min(180000, Number(event.target.value) || 45000)) })} />
        <span>Prompt budget (chars)</span>
        <input type="number" className="rwa-inp" min="8000" max="120000" step="1000" value={config.maxPromptChars || 32000} onChange={(event) => updateConfig({ maxPromptChars: Math.max(8000, Math.min(120000, Number(event.target.value) || 32000)) })} />
      </div>
      {config.connMode === 'marinara' && (
        <div className="rwa-request-note">Marinara /generate/raw uses at least a 90-second safety window for cold local models; this field can extend it further.</div>
      )}

      <Button glow={false} className="rwa-full-width" variant="rwa-accept" onClick={handleTest} disabled={busy}>
        {busy ? 'Testing…' : '⚡ Test effective connection'}
      </Button>
    </>
  );
};
