import { usePersistentStore } from '../../../store/usePersistentStore';
import { ToggleSwitch } from '../../ui/ToggleSwitch';

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
      const parsed = parseInt(event.target.value, 10);
      if (Number.isNaN(parsed)) return;
      updateConfig({ [onChangeKey]: Math.max(min, Math.min(max, parsed)) });
    }}
    style={{ width: '64px', margin: '0', padding: '6px 10px', fontSize: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
  />
);

export const TabUI = () => {
  const { config, updateConfig } = usePersistentStore();
  const profileColumnMax = config.compact ? 6 : 4;
  const visibleProfileColumns = Math.min(Math.max(1, config.cols || 3), profileColumnMax);

  return (
    <>
      <div className="rwa-lbl">Behavior &amp; Viewports</div>

      <ConfigRow label="Typewriter reveal on final output:">
        <ToggleSwitch checked={config.typewriter} onChange={(value) => updateConfig({ typewriter: value })} />
      </ConfigRow>
      <ConfigRow label="Show inline visual word diff:">
        <ToggleSwitch checked={config.showDiff} onChange={(value) => updateConfig({ showDiff: value })} />
      </ConfigRow>
      <ConfigRow label="Auto-apply result (skip preview):">
        <ToggleSwitch checked={config.autoApply} onChange={(value) => updateConfig({ autoApply: value })} />
      </ConfigRow>
      <ConfigRow label="Compact grid (2-letter labels):">
        <ToggleSwitch
          checked={config.compact}
          onChange={(value) => updateConfig({
            compact: value,
            cols: Math.min(config.cols || 3, value ? 6 : 4),
          })}
        />
      </ConfigRow>

      <ConfigRow label="Only show on ALT + R (always hide popup):">
        <ToggleSwitch checked={config.onlyAltR} onChange={(value) => updateConfig({ onlyAltR: value })} />
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

      <ConfigRow label="Popup viewport alignment:">
        <select
          className="rwa-inp"
          value={config.popupPos || 'auto'}
          onChange={(event) => updateConfig({ popupPos: event.target.value })}
          style={{ width: 'auto', margin: '0', padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="auto" style={{ background: '#12121a' }}>Auto flipping viewport</option>
          <option value="above" style={{ background: '#12121a' }}>Always above highlight</option>
          <option value="below" style={{ background: '#12121a' }}>Always below highlight</option>
        </select>
      </ConfigRow>
    </>
  );
};
