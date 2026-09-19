import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function TrimSelectionModal({
  language = 'en',
  selection,
  value,
  onChange,
  onCancel,
  onApply,
}) {
  const vi = language === 'vi';
  const text = (en, viText) => (vi ? viText : en);

  return (
    <Modal title={text('Trim selection before sending', 'Cắt vùng chọn trước khi gửi')} onClose={onCancel} width="500px" zIndex={10004}>
      <div className="rwa-plbl">{text('Captured text — remove only from the edges', 'Văn bản đã chọn — chỉ xóa từ hai đầu')}</div>
      <textarea
        className="rwa-inp"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={Math.max(2, selection?.text?.length || 2)}
        aria-label={text('Trimmed selection text', 'Văn bản vùng chọn đã cắt')}
        style={{ minHeight: '140px', resize: 'vertical', fontSize: '12px' }}
      />
      <div style={{ fontSize: '10px', opacity: 0.65, marginBottom: '10px', lineHeight: 1.5 }}>
        {text(
          'Safety rule: this tool only accepts one unambiguous subspan of the captured selection. It cannot edit interior words.',
          'Quy tắc an toàn: công cụ chỉ chấp nhận một đoạn con rõ ràng của vùng chọn đã chụp và không thể sửa các từ ở giữa.',
        )}
      </div>
      <div className="rwa-foot">
        <Button glow={false} onClick={onCancel} style={{ flex: 1 }}>{text('Cancel', 'Hủy')}</Button>
        <Button glow={false} variant="rwa-accept" onClick={onApply} style={{ flex: 1 }}>{text('Use trimmed selection', 'Dùng vùng chọn đã cắt')}</Button>
      </div>
    </Modal>
  );
}
