import React, { useState } from 'react';
import { usePersistentStore } from '../../../store/usePersistentStore';
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
    onChange={(event) => {
      let nextValue = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(nextValue)) nextValue = min;
      updateConfig({ [onChangeKey]: Math.max(min, Math.min(max, nextValue)) });
    }}
    style={{ width: '64px', margin: '0', padding: '6px 10px', fontSize: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
  />
);

export const TabUI = ({ onCloseModal }) => {
  const { config, updateConfig, clearAllData } = usePersistentStore();
  const showToast = useToastStore((state) => state.showToast);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanData = async () => {
    setIsCleaning(true);
    try {
      await clearAllData();
      setShowCleanConfirm(false);
      onCloseModal();
      showToast('All Rewrite Assistant private data was cleaned successfully!', 'ok');
    } catch (error) {
      console.error('[Rewrite Assistant] Failed to clear private storage.', error);
      showToast('Failed to clean Rewrite Assistant data.', 'err');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <>
      <div className="rwa-lbl">Behavior & Viewports</div>

      <ConfigRow label="Typewriter reveal on final output:">
        <ToggleSwitch checked={config.typewriter} onChange={(value) => updateConfig({ typewriter: value })} />
      </ConfigRow>
      <ConfigRow label="Show inline visual word diff:">
        <ToggleSwitch checked={config.showDiff} onChange={(value) => updateConfig({ showDiff: value })} />
      </ConfigRow>
      <ConfigRow label="Auto-apply result(skip preview):">
        <ToggleSwitch checked={config.autoApply} onChange={(value) => updateConfig({ autoApply: value })} />
      </ConfigRow>
      <ConfigRow label="Compact grid (2-letter labels):">
        <ToggleSwitch checked={config.compact} onChange={(value) => updateConfig({ compact: value })} />
      </ConfigRow>
      <ConfigRow label="Only show on ALT + R (Always hide popup):">
        <ToggleSwitch checked={config.onlyAltR} onChange={(value) => updateConfig({ onlyAltR: value })} />
      </ConfigRow>

      <ConfigRow label="Max column grid count:">
        <NumericInput min={1} max={6} value={config.cols} onChangeKey="cols" updateConfig={updateConfig} />
      </ConfigRow>
      <ConfigRow label="Max rows count:">
        <NumericInput min={1} max={10} value={config.rows} onChangeKey="rows" updateConfig={updateConfig} />
      </ConfigRow>
      <ConfigRow label="Prose history (Undo depth):">
        <NumericInput min={1} max={50} value={config.historyDepth} onChangeKey="historyDepth" updateConfig={updateConfig} />
      </ConfigRow>

      <ConfigRow label="Popup viewport alignment:">
        <select
          className="rwa-inp"
          value={config.popupPos || 'auto'}
          onChange={(event) => updateConfig({ popupPos: event.target.value })}
          style={{ width: 'auto', margin: '0', padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="auto" style={{ background: '#12121a' }}>Auto Flipping viewport</option>
          <option value="above" style={{ background: '#12121a' }}>Always above highlight</option>
          <option value="below" style={{ background: '#12121a' }}>Always below highlight</option>
        </select>
      </ConfigRow>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 'auto' }}>
        <Button
          variant="rwa-dng"
          onClick={() => setShowCleanConfirm(true)}
          disabled={isCleaning}
          style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isCleaning ? 'Cleaning…' : '🧹 Clean Data'}
        </Button>
      </div>

      {showCleanConfirm && (
        <ConfirmModal
          message="Warning: clear all Rewrite Assistant settings, profiles, custom prompts, and session history? This cannot be undone."
          onConfirm={handleCleanData}
          onCancel={() => setShowCleanConfirm(false)}
        />
      )}
    </>
  );
};
