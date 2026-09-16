import { useState } from 'react';
import { usePersistentStore, STORAGE_KEY, LEGACY_BACKUP_KEY, safeLocalStorage } from '../../../store/usePersistentStore';
import { useToastStore } from '../../../store/useToastStore';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Button } from '../../ui/Button';
import { ConfirmModal } from '../ConfirmModal';

const ConfigRow = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
    <span style={{ fontSize: '14px', flex: '1', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
      {label}
    </span>
    {children}
  </div>
);

const NumericInput = ({ min, max, value, onChangeKey, updateConfig }) => (
  <input
    type="number"
    className="rwa-inp"
    min={min}
    max={max}
    value={value !== undefined ? value : 3}
    onChange={(e) => {
      let val = parseInt(e.target.value, 10);
      if (Number.isNaN(val)) val = min;
      updateConfig({ [onChangeKey]: Math.max(min, Math.min(max, val)) });
    }}
    style={{ width: '64px', margin: '0', padding: '6px 10px', fontSize: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
  />
);

export const TabUI = ({ onCloseModal }) => {
  const { config, updateConfig, clearAllData } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const profileColumnMax = config.compact ? 4 : 2;
  const visibleProfileColumns = Math.min(Math.max(1, config.cols || 2), profileColumnMax);

  const handleCleanData = async () => {
    // Treat private-storage deletion as the commit point. If Marinara rejects
    // it, do not claim success or leave persisted data that reappears on reload.
    try {
      await usePersistentStore.persist.clearStorage();
    } catch (err) {
      setShowCleanConfirm(false);
      showToast(`Could not clear Marinara private storage: ${err?.message || String(err)}`, 'err');
      return;
    }

    [STORAGE_KEY, LEGACY_BACKUP_KEY].forEach((key) => safeLocalStorage.removeItem(key));
    clearAllData();
    setShowCleanConfirm(false);
    onCloseModal();
    showToast('All Rewrite Assistant data cleaned successfully!', 'ok');
  };

  return (
    <>
      <div className="rwa-lbl">Behavior &amp; Viewports</div>

      <ConfigRow label="Typewriter reveal on final output:">
        <ToggleSwitch checked={config.typewriter} onChange={(v) => updateConfig({ typewriter: v })} />
      </ConfigRow>
      <ConfigRow label="Show inline visual word diff:">
        <ToggleSwitch checked={config.showDiff} onChange={(v) => updateConfig({ showDiff: v })} />
      </ConfigRow>
      <ConfigRow label="Auto-apply result (skip preview):">
        <ToggleSwitch checked={config.autoApply} onChange={(v) => updateConfig({ autoApply: v })} />
      </ConfigRow>
      <ConfigRow label="Compact grid (2-letter labels):">
        <ToggleSwitch
          checked={config.compact}
          onChange={(v) => updateConfig({
            compact: v,
            ...(v ? {} : { cols: Math.min(config.cols || 2, 2) }),
          })}
        />
      </ConfigRow>

      <ConfigRow label="Only show on ALT + R (always hide popup):">
        <ToggleSwitch checked={config.onlyAltR} onChange={(v) => updateConfig({ onlyAltR: v })} />
      </ConfigRow>

      <ConfigRow label={config.compact ? 'Profile columns (compact):' : 'Profile columns:'}>
        <NumericInput min={1} max={profileColumnMax} value={visibleProfileColumns} onChangeKey="cols" updateConfig={updateConfig} />
      </ConfigRow>
      <ConfigRow label="Visible profile rows:">
        <NumericInput min={1} max={10} value={config.rows} onChangeKey="rows" updateConfig={updateConfig} />
      </ConfigRow>
      <ConfigRow label="Prose history (Undo depth):">
        <NumericInput min={1} max={20} value={config.historyDepth} onChangeKey="historyDepth" updateConfig={updateConfig} />
      </ConfigRow>

      <ConfigRow label="Surrounding context words / side:">
        <NumericInput min={50} max={400} value={config.localContextWords} onChangeKey="localContextWords" updateConfig={updateConfig} />
      </ConfigRow>

      <ConfigRow label="Popup viewport alignment:">
        <select
          className="rwa-inp"
          value={config.popupPos || 'auto'}
          onChange={(e) => updateConfig({ popupPos: e.target.value })}
          style={{ width: 'auto', margin: '0', padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="auto" style={{ background: '#12121a' }}>Auto flipping viewport</option>
          <option value="above" style={{ background: '#12121a' }}>Always above highlight</option>
          <option value="below" style={{ background: '#12121a' }}>Always below highlight</option>
        </select>
      </ConfigRow>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 'auto' }}>
        <Button
          variant="rwa-dng"
          onClick={() => setShowCleanConfirm(true)}
          style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          🧹 Clean Data
        </Button>
      </div>

      {showCleanConfirm && (
        <ConfirmModal
          message="Warning: Are you sure you want to clear ALL settings, history, and custom styles? This cannot be undone."
          onConfirm={handleCleanData}
          onCancel={() => setShowCleanConfirm(false)}
        />
      )}
    </>
  );
};
