import { usePersistentStore } from '../../../store/usePersistentStore';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Button } from '../../ui/Button';

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
  const vi = config.uiLanguage === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const profileColumnMax = config.compact ? 6 : 4;
  const visibleProfileColumns = Math.min(Math.max(1, config.cols || 4), profileColumnMax);

  return (
    <>
      <div className="rwa-lbl">{text('Behavior & Viewports', 'Hành vi & khung nhìn')}</div>

      <ConfigRow label={text('Typewriter reveal on final output:', 'Hiệu ứng gõ chữ khi hiện kết quả:')}>
        <ToggleSwitch checked={config.typewriter} onChange={(value) => updateConfig({ typewriter: value })} />
      </ConfigRow>
      <ConfigRow label={text('Show inline visual word diff:', 'Hiển thị so sánh thay đổi trực quan:')}>
        <ToggleSwitch checked={config.showDiff} onChange={(value) => updateConfig({ showDiff: value })} />
      </ConfigRow>
      <ConfigRow label={text('Auto-apply result (skip preview):', 'Tự áp dụng kết quả (bỏ qua xem trước):')}>
        <ToggleSwitch checked={config.autoApply} onChange={(value) => updateConfig({ autoApply: value })} />
      </ConfigRow>
      <ConfigRow label={text('Compact grid (2-letter labels):', 'Lưới gọn (nhãn 2 ký tự):')}>
        <ToggleSwitch
          checked={config.compact}
          onChange={(value) => updateConfig({
            compact: value,
            cols: Math.min(config.cols || 4, value ? 6 : 4),
          })}
        />
      </ConfigRow>

      <ConfigRow label={text('Only show on ALT + R (always hide popup):', 'Chỉ hiện bằng ALT + R (ẩn popup mặc định):')}>
        <ToggleSwitch checked={config.onlyAltR} onChange={(value) => updateConfig({ onlyAltR: value })} />
      </ConfigRow>

      <ConfigRow label={config.compact ? text('Profile columns (compact):', 'Số cột style (gọn):') : text('Profile columns:', 'Số cột style:')}>
        <NumericInput min={1} max={profileColumnMax} value={visibleProfileColumns} onChangeKey="cols" updateConfig={updateConfig} />
      </ConfigRow>
      <ConfigRow label={text('Visible profile rows:', 'Số hàng style hiển thị:')}>
        <NumericInput min={1} max={10} value={config.rows} onChangeKey="rows" updateConfig={updateConfig} />
      </ConfigRow>
      <ConfigRow label={text('Prose history (Undo depth):', 'Lịch sử văn bản (độ sâu Hoàn tác):')}>
        <NumericInput min={1} max={20} value={config.historyDepth} onChangeKey="historyDepth" updateConfig={updateConfig} />
      </ConfigRow>

      <ConfigRow label={text('Popup viewport alignment:', 'Vị trí popup trong khung nhìn:')}>
        <select
          className="rwa-inp"
          value={config.popupPos || 'auto'}
          onChange={(event) => updateConfig({ popupPos: event.target.value })}
          style={{ width: 'auto', margin: '0', padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="auto" style={{ background: '#12121a' }}>{text('Auto flipping viewport', 'Tự động đổi phía')}</option>
          <option value="above" style={{ background: '#12121a' }}>{text('Always above highlight', 'Luôn ở trên vùng chọn')}</option>
          <option value="below" style={{ background: '#12121a' }}>{text('Always below highlight', 'Luôn ở dưới vùng chọn')}</option>
        </select>
      </ConfigRow>

      <div className="rwa-lbl" style={{ marginTop: '26px' }}>{text('Persona Reply launcher', 'Nút Trả lời Persona')}</div>

      <ConfigRow label={text('Launcher positioning:', 'Vị trí nút trả lời nhanh:')}>
        <select
          className="rwa-inp"
          value={config.draftReplyLauncherPlacement || 'auto'}
          onChange={(event) => updateConfig({ draftReplyLauncherPlacement: event.target.value })}
          aria-label={text('Persona Reply launcher positioning', 'Vị trí nút Trả lời Persona')}
          style={{ width: 'auto', margin: '0', padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }}
        >
          <option value="auto" style={{ background: '#12121a' }}>{text('Auto — follow composer', 'Tự động — bám ô nhập')}</option>
          <option value="remember" style={{ background: '#12121a' }}>{text('Remember dragged position', 'Ghi nhớ vị trí đã kéo')}</option>
        </select>
      </ConfigRow>

      <ConfigRow label={text('Reset saved launcher position:', 'Đặt lại vị trí nút đã lưu:')}>
        <Button
          glow={false}
          disabled={!Object.keys(config.draftReplyLauncherPositions || {}).length}
          onClick={() => updateConfig({ draftReplyLauncherPositions: {} })}
          style={{ minWidth: '132px' }}
        >
          {text('Reset position', 'Đặt lại vị trí')}
        </Button>
      </ConfigRow>

      <div style={{ marginTop: '-8px', color: 'rgba(255,255,255,.45)', fontSize: '11px', lineHeight: 1.5 }}>
        {text(
          'Auto keeps the launcher attached to the active composer. Remember lets you drag it; each Marinara chat mode keeps its own saved position.',
          'Tự động giữ nút bám theo ô nhập hiện tại. Ghi nhớ cho phép kéo nút; mỗi chế độ chat Marinara lưu vị trí riêng.',
        )}
      </div>
    </>
  );
};
