import { useRef, useState } from 'react';
import {
  usePersistentStore,
  STORAGE_KEY,
  LEGACY_BACKUP_KEY,
  safeLocalStorage,
} from '../../../store/usePersistentStore';
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
  const vi = state.config.uiLanguage === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const showToast = useToastStore((s) => s.showToast);
  const importRef = useRef(null);
  const [options, setOptions] = useState({ profiles: true, settings: true, customs: true, autoProfiles: true });
  const [, setDebugRevision] = useState(0);
  const [pendingImport, setPendingImport] = useState(null);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const debugEntries = debugLogService.list();

  const toggle = (key) => setOptions((current) => ({ ...current, [key]: !current[key] }));

  const doExport = () => {
    if (!Object.values(options).some(Boolean)) {
      showToast(text('Select at least one section to export.', 'Hãy chọn ít nhất một mục để xuất.'), 'warn');
      return;
    }
    const data = createPortableExport(state, options);
    downloadText('rewrite-assistant-export.json', JSON.stringify(data, null, 2));
    showToast(text('Portable data exported. Provider routing settings were excluded.', 'Đã xuất dữ liệu di động. Cấu hình định tuyến provider không được đưa vào.'), 'ok');
  };

  const onImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error(text('Import file is too large (2 MB maximum).', 'File import quá lớn (tối đa 2 MB).'));
      const patch = parsePortableImport(await file.text());
      setPendingImport({ patch, name: file.name || text('selected file', 'file đã chọn') });
    } catch (err) {
      showToast(text(`Import failed: ${err?.message || String(err)}`, `Import thất bại: ${err?.message || String(err)}`), 'err');
    }
  };

  const confirmImport = () => {
    if (!pendingImport?.patch) return;
    state.importPortableData(pendingImport.patch);
    setPendingImport(null);
    showToast(text('Import complete. Current provider routing was preserved.', 'Import hoàn tất. Cấu hình định tuyến provider hiện tại được giữ nguyên.'), 'ok');
  };

  const setDebugEnabled = (value) => {
    state.updateConfig({ debugEnabled: value });
    debugLogService.setEnabled(value);
    setDebugRevision((revision) => revision + 1);
    showToast(
      value
        ? text('Session debug logging enabled.', 'Đã bật debug log cho phiên này.')
        : text('Session debug logging disabled and cleared.', 'Đã tắt và xóa debug log của phiên.'),
      value ? 'ok' : 'warn',
    );
  };

  const handleCleanData = async () => {
    try {
      await usePersistentStore.persist.clearStorage();
    } catch (err) {
      setShowCleanConfirm(false);
      showToast(text(`Could not clear Marinara private storage: ${err?.message || String(err)}`, `Không thể xóa private storage của Marinara: ${err?.message || String(err)}`), 'err');
      return;
    }

    [STORAGE_KEY, LEGACY_BACKUP_KEY].forEach((key) => safeLocalStorage.removeItem(key));
    state.clearAllData();
    debugLogService.clear();
    debugLogService.setEnabled(false);
    setDebugRevision((revision) => revision + 1);
    setShowCleanConfirm(false);
    showToast(text('Rewrite Assistant data reset to defaults.', 'Dữ liệu Rewrite Assistant đã được đặt lại về mặc định.'), 'ok');
  };

  return (
    <>
      <div className="rwa-lbl">{text('PORTABLE EXPORT / IMPORT', 'XUẤT / NHẬP DỮ LIỆU')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '12px' }}>
        {text('Export files intentionally exclude connection mode, connection IDs, Direct API URL/model, and Extender URL. Importing a file cannot silently redirect where selected text is sent.', 'File xuất cố ý không chứa chế độ kết nối, ID kết nối, URL/model Direct API và URL Extender. Import file không thể âm thầm đổi nơi gửi văn bản đã chọn.')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px', marginBottom: '12px' }}>
        {[
          ['profiles', text('Style profiles', 'Style profile')],
          ['settings', text('Non-routing settings', 'Cài đặt không định tuyến')],
          ['customs', text('Past custom prompts', 'Custom prompt đã dùng')],
          ['autoProfiles', 'Auto-profiles'],
        ].map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <input type="checkbox" checked={!!options[key]} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <Button glow={false} onClick={doExport} style={{ flex: 1 }}>{text('Export selected', 'Xuất mục đã chọn')}</Button>
        <Button glow={false} onClick={() => importRef.current?.click()} style={{ flex: 1 }}>{text('Import…', 'Nhập…')}</Button>
        <input ref={importRef} type="file" accept="application/json,.json" onChange={onImport} style={{ display: 'none' }} />
      </div>

      <div className="rwa-lbl">{text('SESSION DEBUG LOG', 'DEBUG LOG CỦA PHIÊN')}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 650 }}>{text('Enable debug logging for this session', 'Bật debug log cho phiên này')}</div>
        <ToggleSwitch checked={state.config.debugEnabled === true} onChange={setDebugEnabled} />
      </div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {text('Debug logging is opt-in. Entries live only in memory and disappear when the extension/page reloads. Credentials are redacted; request/response bodies are not retained by the logger.', 'Debug logging chỉ bật khi bạn chọn. Log chỉ nằm trong bộ nhớ và biến mất khi extension/trang tải lại. Thông tin xác thực được che; logger không lưu nội dung request/response.')}
      </div>
      <div className="rwa-prev" style={{ maxHeight: '150px', fontFamily: 'monospace', fontSize: '9px', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
        {state.config.debugEnabled !== true
          ? text('Debug logging is OFF.', 'Debug logging đang TẮT.')
          : debugEntries.length
            ? debugEntries.slice(0, 40).map((entry) => `${entry.when}  ${entry.event}  ${JSON.stringify(entry.details)}`).join('\n')
            : text('No debug events in this session.', 'Chưa có sự kiện debug trong phiên này.')}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
        <Button glow={false} disabled={state.config.debugEnabled !== true} onClick={() => { downloadText('rewrite-assistant-debug.json', debugLogService.exportText()); }} style={{ flex: 1 }}>{text('Export debug log', 'Xuất debug log')}</Button>
        <Button glow={false} variant="rwa-dng" onClick={() => { debugLogService.clear(); setDebugRevision((v) => v + 1); }} style={{ flex: 1 }}>{text('Clear session log', 'Xóa log phiên')}</Button>
        <Button glow={false} onClick={() => setDebugRevision((v) => v + 1)}>{text('Refresh', 'Làm mới')}</Button>
      </div>

      <div className="rwa-lbl">{text('DATA RESET', 'ĐẶT LẠI DỮ LIỆU')}</div>
      <div className="rwa-prev" style={{ fontSize: '10px', lineHeight: 1.5, marginBottom: '10px' }}>
        {text('Reset removes Rewrite Assistant profiles, non-routing settings, custom prompts, auto-profiles, and private extension state, then restores safe defaults. This action cannot be undone.', 'Đặt lại sẽ xóa profile Rewrite Assistant, cài đặt không định tuyến, custom prompt, auto-profile và trạng thái riêng của extension, sau đó khôi phục mặc định an toàn. Không thể hoàn tác thao tác này.')}
      </div>
      <Button
        glow={false}
        variant="rwa-dng"
        onClick={() => setShowCleanConfirm(true)}
        style={{ width: '100%', minHeight: '34px' }}
      >
        {text('Reset Rewrite Assistant data…', 'Đặt lại dữ liệu Rewrite Assistant…')}
      </Button>

      {pendingImport ? (
        <ConfirmModal
          zIndex={26000}
          message={text(
            `Import ${pendingImport.name}? This can replace selected profiles, non-provider settings, custom prompts, and auto-profiles. Provider routing remains untouched.`,
            `Nhập ${pendingImport.name}? Thao tác này có thể thay thế profile, cài đặt không thuộc provider, custom prompt và auto-profile đã chọn. Định tuyến provider được giữ nguyên.`,
          )}
          onCancel={() => setPendingImport(null)}
          onConfirm={confirmImport}
        />
      ) : null}

      {showCleanConfirm ? (
        <ConfirmModal
          zIndex={26000}
          message={text(
            'Reset all Rewrite Assistant data to defaults? Profiles, settings, custom prompts, auto-profiles, and private extension state will be cleared. This cannot be undone.',
            'Đặt lại toàn bộ dữ liệu Rewrite Assistant về mặc định? Profile, cài đặt, custom prompt, auto-profile và trạng thái riêng của extension sẽ bị xóa. Không thể hoàn tác.',
          )}
          onConfirm={handleCleanData}
          onCancel={() => setShowCleanConfirm(false)}
        />
      ) : null}
    </>
  );
};
