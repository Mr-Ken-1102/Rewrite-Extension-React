import { useEffect, useMemo, useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useToastStore } from '../../../store/useToastStore';
import { APIService } from '../../../services/apiService';
import { MarinaraHost } from '../../../services/marinaraHost';
import { isLikelyLocalNetworkUrl } from '../../../services/policies/providerPolicy';
import { DOMUtils } from '../../../utils/domUtils';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';

const t = (language, en, vi) => (language === 'vi' ? vi : en);
const connectionLabel = (connection) => connection?.name || connection?.label || connection?.provider || connection?.id || 'Unknown connection';

const PresetItem = ({ name, url, updateConfig, showToast, language }) => (
  <button
    type="button"
    className="rwa-inp rwa-api-preset"
    onClick={() => {
      updateConfig({ ollamaUrl: url, connMode: 'direct' });
      showToast(t(language, `✓ Preset applied: ${name}`, `✓ Đã áp dụng preset: ${name}`), 'ok');
    }}
  >
    <strong>{name}</strong>
    <span>{url}</span>
  </button>
);

function lanDiagnosticMessage(result, language) {
  if (!result) return '';
  if (result.ok) return result.message || t(language, 'LAN provider is reachable.', 'Có thể kết nối tới provider trong LAN.');
  if (result.issue === 'permission') {
    return t(
      language,
      'Browser Local Network Access is denied for this Marinara site. Allow local-network access in the browser site permissions, then retry.',
      'Trình duyệt đang chặn quyền truy cập mạng cục bộ cho trang Marinara này. Hãy cho phép Local Network trong quyền của trang rồi thử lại.',
    );
  }
  if (result.issue === 'cors') {
    return t(
      language,
      'The laptop is reachable, but readable browser access is blocked. Add this Marinara origin to OLLAMA_ORIGINS, fully restart Ollama, then retry.',
      'Có thể kết nối tới laptop nhưng trình duyệt không được phép đọc phản hồi. Hãy thêm origin Marinara này vào OLLAMA_ORIGINS, khởi động lại hoàn toàn Ollama rồi thử lại.',
    );
  }
  if (result.issue === 'transport') {
    return t(
      language,
      'The 3080 machine cannot reach Ollama on the laptop. Make Ollama listen on 0.0.0.0:11434 and allow inbound TCP 11434 from the local subnet in the laptop firewall.',
      'Máy 3080 không thể kết nối tới Ollama trên laptop. Hãy cho Ollama lắng nghe tại 0.0.0.0:11434 và mở inbound TCP 11434 cho mạng nội bộ trên firewall của laptop.',
    );
  }
  return result.message || t(language, 'LAN diagnosis could not determine the failure.', 'Chẩn đoán LAN chưa xác định được nguyên nhân lỗi.');
}

export const TabAPI = () => {
  const { config, updateConfig } = usePersistentStore();
  const language = config.uiLanguage === 'vi' ? 'vi' : 'en';
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
  const marinaraRouting = config.marinaraRouting === 'fixed' ? 'fixed' : 'chat';
  const fixedConnection = useMemo(
    () => connections.find((connection) => connection.id === config.connectionId) || null,
    [connections, config.connectionId],
  );
  const effectiveConnection = marinaraRouting === 'fixed' ? fixedConnection : currentChatConnection;
  const directIsLan = useMemo(
    () => config.connMode === 'direct' && isLikelyLocalNetworkUrl(config.ollamaUrl),
    [config.connMode, config.ollamaUrl],
  );
  const browserOrigin = globalThis.location?.origin || t(language, 'Unavailable in this host', 'Không xác định trong host này');

  const directUrlAdvisory = useMemo(() => {
    if (config.connMode !== 'direct' || !config.ollamaUrl) return '';
    try {
      const url = new URL(config.ollamaUrl);
      const host = url.hostname.toLowerCase();
      const loopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      const localNetwork = isLikelyLocalNetworkUrl(config.ollamaUrl) && !loopback;
      if (url.username || url.password) {
        return t(language, 'Do not put API credentials in the URL. Use a Marinara connection for credentialed remote providers.', 'Không đặt thông tin xác thực API trong URL. Hãy dùng kết nối Marinara cho provider từ xa có xác thực.');
      }
      if (localNetwork) {
        return t(language, 'LAN Direct API: the browser needs local-network permission, the laptop must expose Ollama to the LAN, and Ollama CORS must allow this Marinara origin.', 'Direct API qua LAN: trình duyệt cần quyền Local Network, laptop phải mở Ollama ra LAN và CORS của Ollama phải cho phép origin Marinara này.');
      }
      if (!loopback && url.protocol !== 'https:') {
        return t(language, 'Remote Direct API is using unencrypted HTTP. Use HTTPS for non-LAN remote servers.', 'Direct API từ xa đang dùng HTTP không mã hóa. Hãy dùng HTTPS cho máy chủ từ xa ngoài LAN.');
      }
      if (!loopback) {
        return t(language, 'Remote Direct API: selected text and any context you explicitly enable will leave this browser session.', 'Direct API từ xa: văn bản đã chọn và ngữ cảnh bạn bật sẽ được gửi ra ngoài phiên trình duyệt này.');
      }
      return '';
    } catch {
      return t(language, 'The Direct API URL is not valid yet.', 'URL Direct API chưa hợp lệ.');
    }
  }, [config.connMode, config.ollamaUrl, language]);

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
          requestTimeoutMs: Math.max(5000, Number(config.requestTimeoutMs) || 45000),
          marinaraTimeoutMs: Math.max(5000, Number(config.requestTimeoutMs) || 45000),
        },
      );
      if (controller.signal.aborted) return;
      if (response?.aborted) {
        showToast(t(language, '⚠️ The provider aborted the connection test before completion.', '⚠️ Provider đã hủy bài kiểm tra kết nối trước khi hoàn tất.'), 'warn');
        return;
      }
      if (response?.error) throw new Error(response.error);
      const suffix = config.connMode === 'marinara' && effectiveConnection ? ` via ${connectionLabel(effectiveConnection)}` : '';
      showToast(t(
        language,
        `✓ Connected${suffix}${response?.result ? `: ${String(response.result).slice(0, 40)}` : ''}`,
        `✓ Đã kết nối${suffix}${response?.result ? `: ${String(response.result).slice(0, 40)}` : ''}`,
      ), 'ok');
    } catch (err) {
      if (!controller.signal.aborted && !MarinaraHost.isAbortError(err)) {
        showToast(t(language, `✕ Connection failed: ${err?.message || String(err)}`, `✕ Kết nối thất bại: ${err?.message || String(err)}`), 'err');
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
      showToast(t(language, 'Model discovery is only needed for Direct API mode.', 'Chỉ cần tìm model khi dùng chế độ Direct API.'), 'warn');
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
    showToast(t(language, `✓ Found ${result.models?.length || 0} model(s)`, `✓ Tìm thấy ${result.models?.length || 0} model`), 'ok');
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
      const message = lanDiagnosticMessage(result, language);
      showToast(`${result.ok ? '✓' : '✕'} ${message}`, result.ok ? 'ok' : 'warn');
    } catch (err) {
      if (!controller.signal.aborted && !MarinaraHost.isAbortError(err)) {
        const result = { ok: false, issue: 'transport', message: err?.message || String(err) };
        setLanDiagnostic(result);
        showToast(`✕ ${lanDiagnosticMessage(result, language)}`, 'err');
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
      <div className="rwa-lbl rwa-settings-section-title">{t(language, 'MODEL SOURCE', 'NGUỒN MODEL')}</div>

      <div className="rwa-form-row">
        <span>{t(language, 'Connection mode', 'Chế độ kết nối')}</span>
        <select className="rwa-inp" value={config.connMode || 'marinara'} onChange={(event) => updateConfig({ connMode: event.target.value })}>
          <option value="marinara">{t(language, 'Marinara connection (recommended)', 'Kết nối Marinara (khuyến nghị)')}</option>
          <option value="sidecar">{t(language, 'Marinara local sidecar model', 'Model Sidecar cục bộ của Marinara')}</option>
          <option value="direct">Direct OpenAI-compatible API</option>
          <option value="extender">Marinara Extender</option>
        </select>
      </div>

      {config.connMode === 'marinara' && (
        <div className="rwa-api-connection-block">
          <div className="rwa-form-row rwa-form-row-compact">
            <span>{t(language, 'Marinara connection source', 'Nguồn kết nối Marinara')}</span>
            <select
              className="rwa-inp"
              value={marinaraRouting}
              onChange={(event) => updateConfig({ marinaraRouting: event.target.value })}
            >
              <option value="chat">{t(language, 'Follow current chat (default)', 'Theo kết nối của chat (mặc định)')}</option>
              <option value="fixed">{t(language, 'Use a specific Marinara connection', 'Dùng một kết nối Marinara cố định')}</option>
            </select>
          </div>

          {marinaraRouting === 'fixed' && (
            <div className="rwa-form-row rwa-form-row-compact">
              <span>{t(language, 'Selected connection', 'Kết nối được chọn')}</span>
              <select className="rwa-inp" value={config.connectionId || ''} onChange={(event) => updateConfig({ connectionId: event.target.value })}>
                <option value="">{connections.length
                  ? t(language, '— Choose a Marinara connection —', '— Chọn một kết nối Marinara —')
                  : t(language, 'No connections found', 'Không tìm thấy kết nối')}</option>
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>{connectionLabel(connection)}</option>
                ))}
              </select>
            </div>
          )}

          <div className={`rwa-connection-card ${
            marinaraRouting === 'fixed'
              ? (config.connectionId && !fixedConnection ? 'rwa-connection-card-error' : '')
              : (chatConnectionId && !currentChatConnection ? 'rwa-connection-card-error' : '')
          }`}>
            <div className="rwa-connection-card-head">
              <div>
                <div className="rwa-connection-eyebrow">
                  {marinaraRouting === 'fixed'
                    ? t(language, 'SELECTED MARINARA CONNECTION', 'KẾT NỐI MARINARA ĐÃ CHỌN')
                    : t(language, 'CURRENT CHAT CONNECTION', 'KẾT NỐI CỦA CHAT HIỆN TẠI')}
                </div>
                <div className="rwa-connection-name">
                  {effectiveConnection
                    ? connectionLabel(effectiveConnection)
                    : marinaraRouting === 'fixed'
                      ? t(language, 'No specific connection selected', 'Chưa chọn kết nối cố định')
                      : (chatConnectionId
                        ? t(language, 'Connection unavailable', 'Kết nối không khả dụng')
                        : t(language, 'No connection selected on this chat', 'Chat này chưa chọn kết nối'))}
                </div>
              </div>
              <Button glow={false} onClick={() => setRefreshSeq((value) => value + 1)} disabled={busy} className="rwa-connection-refresh">
                {t(language, 'Refresh', 'Làm mới')}
              </Button>
            </div>
            <div className="rwa-connection-note">
              {connectionLoadError
                ? t(language, `Could not read Marinara connection state: ${connectionLoadError}`, `Không thể đọc trạng thái kết nối Marinara: ${connectionLoadError}`)
                : marinaraRouting === 'fixed'
                  ? (fixedConnection
                    ? t(
                      language,
                      'Every Marinara rewrite uses this connection, regardless of the connection selected on the current chat. The chat itself is not modified.',
                      'Mọi lần viết lại qua Marinara sẽ dùng kết nối này, bất kể chat hiện tại đang chọn kết nối nào. Kết nối của chat không bị thay đổi.',
                    )
                    : t(language, 'Choose one of the existing Marinara connections above.', 'Hãy chọn một kết nối Marinara hiện có ở phía trên.'))
                  : currentChatConnection
                    ? t(
                      language,
                      `Rewrite Assistant follows this chat automatically. No separate model selection is required.${chatInfo?.name ? ` Chat: ${chatInfo.name}.` : ''}`,
                      `Rewrite Assistant tự động dùng kết nối của chat này. Không cần chọn model riêng.${chatInfo?.name ? ` Chat: ${chatInfo.name}.` : ''}`,
                    )
                    : chatConnectionId
                      ? t(language, 'This chat points to a connection that is no longer present. Fix the chat connection in Marinara before rewriting.', 'Chat này đang trỏ tới một kết nối không còn tồn tại. Hãy sửa kết nối của chat trong Marinara trước khi viết lại.')
                      : t(language, 'This mode follows the chat only. Choose a connection in Marinara chat settings, or switch to a specific connection above.', 'Chế độ này chỉ đi theo chat. Hãy chọn kết nối trong cài đặt chat Marinara, hoặc chuyển sang kết nối cố định ở phía trên.')}
            </div>
          </div>

          <div className="rwa-setting-toggle-row rwa-fast-rewrite-setting">
            <div>
              <div>{t(language, 'Fast rewrite', 'Viết lại nhanh')}</div>
              <small>{t(
                language,
                'Disables model reasoning only for rewrite requests when the provider supports it. The chat model and its saved settings are unchanged. Marinara rewrites are delivered through live SSE streaming.',
                'Chỉ tắt reasoning cho request viết lại khi provider hỗ trợ. Model của chat và thiết lập đã lưu không thay đổi. Kết quả viết lại qua Marinara được nhận trực tiếp bằng SSE streaming.',
              )}</small>
            </div>
            <ToggleSwitch checked={config.fastRewrite !== false} onChange={(value) => updateConfig({ fastRewrite: value })} />
          </div>
        </div>
      )}

      {config.connMode === 'sidecar' && (
        <div className="rwa-prev rwa-api-note">
          {t(language, 'Uses Marinara\'s downloaded local model. If you never installed the local model, choose a Marinara connection instead.', 'Dùng model cục bộ đã tải của Marinara. Nếu bạn chưa cài model cục bộ, hãy chọn kết nối Marinara thay thế.')}
        </div>
      )}

      {config.connMode === 'extender' && (
        <>
          <div className="rwa-form-grid">
            <span>{t(language, 'Extender server', 'Máy chủ Extender')}</span>
            <input type="text" className="rwa-inp" value={config.extenderUrl || ''} onChange={(event) => updateConfig({ extenderUrl: event.target.value })} placeholder="http://127.0.0.1:3001" />
            <span>{t(language, 'Temperature', 'Temperature')}</span>
            <input type="number" className="rwa-inp" min="0" max="2" step="0.1" value={config.directTemp ?? 0.7} onChange={(event) => {
              const value = Number(event.target.value);
              updateConfig({ directTemp: Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0.7 });
            }} />
          </div>
          <div className="rwa-prev rwa-api-note">
            {t(language, 'Extender mode sends rewrite prompts to the configured Marinara Extender sidecar using its OpenAI-compatible /v1/chat/completions endpoint. The Extender chooses its own model; Rewrite Assistant stores no Extender credential.', 'Chế độ Extender gửi prompt viết lại tới Marinara Extender sidecar qua endpoint OpenAI-compatible /v1/chat/completions. Extender tự chọn model; Rewrite Assistant không lưu thông tin xác thực Extender.')}
          </div>
        </>
      )}

      {config.connMode === 'direct' && (
        <>
          <div className="rwa-form-grid">
            <span>API base URL</span>
            <input type="text" className="rwa-inp" value={config.ollamaUrl || ''} onChange={(event) => updateConfig({ ollamaUrl: event.target.value })} placeholder="http://127.0.0.1:11434/v1" />
            <span>{t(language, 'Model', 'Model')}</span>
            {models.length ? (
              <select className="rwa-inp" value={config.ollamaModel || ''} onChange={(event) => updateConfig({ ollamaModel: event.target.value })}>
                <option value="">{t(language, '— Select model —', '— Chọn model —')}</option>
                {models.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
            ) : (
              <input type="text" className="rwa-inp" value={config.ollamaModel || ''} onChange={(event) => updateConfig({ ollamaModel: event.target.value })} />
            )}
            <span>{t(language, 'Temperature', 'Temperature')}</span>
            <input type="number" className="rwa-inp" min="0" max="2" step="0.1" value={config.directTemp ?? 0.7} onChange={(event) => {
              const value = Number(event.target.value);
              updateConfig({ directTemp: Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0.7 });
            }} />
          </div>

          <div className="rwa-api-preset-grid">
            <PresetItem language={language} name="Ollama" url="http://127.0.0.1:11434/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem language={language} name="LM Studio" url="http://127.0.0.1:1234/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem language={language} name="llama.cpp" url="http://127.0.0.1:8080/v1" updateConfig={updateConfig} showToast={showToast} />
            <PresetItem language={language} name="KoboldCPP" url="http://127.0.0.1:5001/v1" updateConfig={updateConfig} showToast={showToast} />
          </div>

          <Button glow={false} className="rwa-full-width" onClick={handleDiscover} disabled={busy}>
            {busy ? t(language, 'Working…', 'Đang xử lý…') : t(language, 'Discover models', 'Tìm model')}
          </Button>

          {directIsLan && (
            <div className="rwa-prev rwa-api-note" style={{ marginTop: '10px', borderColor: 'rgba(209,154,69,.24)' }}>
              <div className="rwa-lbl" style={{ marginBottom: '8px' }}>LAN OLLAMA SETUP</div>
              <div style={{ fontSize: '10px', lineHeight: 1.55, marginBottom: '8px' }}>
                {t(language, 'Direct LAN mode runs from the browser on this machine. The Ollama laptop must listen on the LAN, allow this Marinara web origin through CORS, and permit TCP 11434 through its firewall.', 'Direct LAN chạy từ trình duyệt trên máy này. Laptop chạy Ollama phải lắng nghe trên LAN, cho phép origin web Marinara này qua CORS và mở TCP 11434 trên firewall.')}
              </div>
              <div style={{ fontSize: '9.5px', opacity: 0.7, marginBottom: '4px' }}>{t(language, 'Current Marinara browser origin', 'Origin Marinara hiện tại trong trình duyệt')}</div>
              <code style={{ display: 'block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '10px', marginBottom: '8px' }}>{browserOrigin}</code>
              <div style={{ fontSize: '9.5px', opacity: 0.7, marginBottom: '4px' }}>{t(language, 'Recommended Ollama environment on the backend laptop', 'Biến môi trường Ollama khuyến nghị trên laptop backend')}</div>
              <code style={{ display: 'block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '10px', lineHeight: 1.55, marginBottom: '10px' }}>{`OLLAMA_HOST=0.0.0.0:11434\nOLLAMA_ORIGINS=${browserOrigin}`}</code>
              <Button glow={false} className="rwa-full-width" onClick={handleLanDiagnose} disabled={busy}>
                {busy ? t(language, 'Diagnosing…', 'Đang chẩn đoán…') : t(language, 'Diagnose LAN access', 'Chẩn đoán kết nối LAN')}
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
                  {lanDiagnosticMessage(lanDiagnostic, language)}
                  {lanDiagnostic.permission && lanDiagnostic.permission !== 'unsupported'
                    ? t(language, ` Browser permission: ${lanDiagnostic.permission}.`, ` Quyền trình duyệt: ${lanDiagnostic.permission}.`)
                    : ''}
                </div>
              ) : null}
            </div>
          )}

          <div className="rwa-prev rwa-api-note">
            {t(language, 'Direct mode sends the selected text and enabled context to the URL above. Prefer loopback/local URLs for private content; use HTTPS for remote servers.', 'Direct mode gửi văn bản đã chọn và ngữ cảnh đã bật tới URL phía trên. Ưu tiên URL loopback/LAN cho nội dung riêng tư; dùng HTTPS cho máy chủ từ xa.')}
            {directUrlAdvisory ? <><br /><strong>{directUrlAdvisory}</strong></> : null}
          </div>
        </>
      )}

      <div className="rwa-lbl rwa-settings-section-title">{t(language, 'PROMPT ECONOMY', 'TỐI ƯU PROMPT')}</div>
      <div className="rwa-setting-toggle-row">
        <div>
          <div>{t(language, 'Shorter system instructions', 'Rút gọn system instruction')}</div>
          <small>{t(language, 'Useful for smaller local models; output and context safety rules remain intact.', 'Hữu ích với model cục bộ nhỏ; các quy tắc an toàn cho output và ngữ cảnh vẫn được giữ nguyên.')}</small>
        </div>
        <ToggleSwitch checked={config.conciseSysPrompt} onChange={(value) => updateConfig({ conciseSysPrompt: value })} />
      </div>

      <div className="rwa-lbl rwa-settings-section-title">{t(language, 'REQUEST SAFETY', 'AN TOÀN REQUEST')}</div>
      <div className="rwa-form-grid">
        <span>{t(language, 'Timeout (ms)', 'Timeout (ms)')}</span>
        <input type="number" className="rwa-inp" min="5000" max="180000" step="1000" value={config.requestTimeoutMs || 45000} onChange={(event) => updateConfig({ requestTimeoutMs: Math.max(5000, Math.min(180000, Number(event.target.value) || 45000)) })} />
        <span>{t(language, 'Prompt budget (chars)', 'Giới hạn prompt (ký tự)')}</span>
        <input type="number" className="rwa-inp" min="8000" max="120000" step="1000" value={config.maxPromptChars || 32000} onChange={(event) => updateConfig({ maxPromptChars: Math.max(8000, Math.min(120000, Number(event.target.value) || 32000)) })} />
      </div>
      {config.connMode === 'marinara' && (
        <div className="rwa-request-note">{t(language, 'Normal Marinara rewrites do not use a client-side deadline: the active chat provider is allowed to finish, while Cancel aborts the actual Marinara generation. The timeout field remains applicable to Direct API, Extender, Sidecar, and the connection test.', 'Rewrite bình thường qua Marinara không bị cắt bởi deadline phía extension: provider của chat được phép chạy đến khi hoàn tất, còn nút Hủy sẽ dừng generation thật trong Marinara. Trường timeout vẫn áp dụng cho Direct API, Extender, Sidecar và bài kiểm tra kết nối.')}</div>
      )}

      <Button glow={false} className="rwa-full-width" variant="rwa-accept" onClick={handleTest} disabled={busy}>
        {busy ? t(language, 'Testing…', 'Đang kiểm tra…') : t(language, '⚡ Test effective connection', '⚡ Kiểm tra kết nối hiện dùng')}
      </Button>
    </>
  );
};
