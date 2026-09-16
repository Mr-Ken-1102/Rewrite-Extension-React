import { useRef, useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
import { useToastStore } from '../../../store/useToastStore';
import { createPortableExport, parsePortableImport } from '../../../services/portableDataService';
import { debugLogService } from '../../../services/debugLogService';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { ConfirmModal } from '../ConfirmModal';

function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export const TabData = () => {
  const state = usePersistentStore();
  const showToast = useToastStore((s) => s.showToast);
  const importRef = useRef(null);
  const [options, setOptions] = useState({ profiles: true, settings: true, customs: true, autoProfiles: true });
  const [, setDebugRevision] = useState(0);
  const [pendingImport, setPendingImport] = useState(null);
  const debugEntries = debugLogService.list();

  const toggle = (key) => setOptions((current) => ({ ...current, [key]: !current[key] }));

  const doExport = () => {
    if (!Object.values(options).some(Boolean)) {
      showToast('Select at least one section to export.', 'warn');
      return;
    }
    const data = createPortableExport(state, options);
    downloadText('rewrite-assistant-export.json', JSON.stringify(data, null, 2));
    showToast('Portable data exported. Provider routing settings were excluded.', 'ok');
  };

  const onImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Import file is too large (2 MB maximum).');
      const patch = parsePortableImport(await file.text());
      setPendingImport({ patch, name: file.name || 'selected file' });
    } catch (err) {
      showToast(`Import failed: ${err?.message || String(err)}`, 'err');
    }
  };

  const confirmImport = () => {
    if (!pendingImport?.patch) return;
    state.importPortableData(pendingImport.patch);
    setPendingImport(null);
    showToast('Import complete. Current provider routing was preserved.', 'ok');
  };

  const setDebugEnabled = (value) => {
    state.updateConfig({ debugEnabled: value });
    debugLogService.setEnabled(value);
    setDebugRevision((revision) => revision + 1);
    showToast(value ? 'Session debug logging enabled.' : 'Session debug logging disabled and cleared.', value ? 'ok' : 'warn');
  };

  return (
    <>
      <div className="rwa-lbl">PORTABLE EXPORT / IMPORT</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '12px' }}>
        Export files intentionally exclude connection mode, connection IDs, Direct API URL/model, and Extender URL. Importing a file cannot silently redirect where selected text is sent.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px', marginBottom: '12px' }}>
        {[
          ['profiles', 'Style profiles'],
          ['settings', 'Non-routing settings'],
          ['customs', 'Past custom prompts'],
          ['autoProfiles', 'Auto-profiles'],
        ].map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <input type="checkbox" checked={!!options[key]} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <Button className="rwa-glow-button" onClick={doExport} style={{ flex: 1 }}>Export selected</Button>
        <Button className="rwa-glow-button" onClick={() => importRef.current?.click()} style={{ flex: 1 }}>Import…</Button>
        <input ref={importRef} type="file" accept="application/json,.json" onChange={onImport} style={{ display: 'none' }} />
      </div>

      <div className="rwa-lbl">SESSION DEBUG LOG</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 650 }}>Enable debug logging for this session</div>
        <ToggleSwitch checked={state.config.debugEnabled === true} onChange={setDebugEnabled} />
      </div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        Debug logging is opt-in. Entries live only in memory and disappear when the extension/page reloads. Credentials are redacted; request/response bodies are not retained by the logger.
      </div>
      <div className="rwa-prev" style={{ maxHeight: '150px', fontFamily: 'monospace', fontSize: '9px', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
        {state.config.debugEnabled !== true ? 'Debug logging is OFF.' : debugEntries.length ? debugEntries.slice(0, 40).map((entry) => `${entry.when}  ${entry.event}  ${JSON.stringify(entry.details)}`).join('\n') : 'No debug events in this session.'}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button className="rwa-glow-button" disabled={state.config.debugEnabled !== true} onClick={() => { downloadText('rewrite-assistant-debug.json', debugLogService.exportText()); }} style={{ flex: 1 }}>Export debug log</Button>
        <Button className="rwa-glow-button" variant="rwa-dng" onClick={() => { debugLogService.clear(); setDebugRevision((v) => v + 1); }} style={{ flex: 1 }}>Clear session log</Button>
        <Button className="rwa-glow-button" onClick={() => setDebugRevision((v) => v + 1)}>Refresh</Button>
      </div>

      {pendingImport ? (
        <ConfirmModal
          zIndex={26000}
          message={`Import ${pendingImport.name}? This can replace selected profiles, non-provider settings, custom prompts, and auto-profiles. Provider routing remains untouched.`}
          onCancel={() => setPendingImport(null)}
          onConfirm={confirmImport}
        />
      ) : null}
    </>
  );
};
