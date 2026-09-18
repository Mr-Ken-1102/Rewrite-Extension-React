import { useRef } from 'react';
import { Button } from '../ui/Button';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { usePersistentStore } from '../../store/usePersistentStore';

function providerGuidance(mode, errorCode, vi) {
  const timeout = errorCode === 'RWA_PROVIDER_TIMEOUT';

  if (mode === 'direct') {
    return vi
      ? [
          ['Direct API', 'Kiểm tra base URL và đúng tên model. Với Ollama qua LAN, máy backend phải lắng nghe ngoài loopback, firewall phải mở cổng và CORS/Local Network Access phải cho phép origin Marinara.'],
          ['Timeout', timeout ? 'Request đã vượt quá thời gian chờ cấu hình của Direct API. Tăng timeout chỉ khi backend thực sự cần nhiều thời gian hơn.' : 'Nếu lỗi xảy ra trước khi có HTTP response, hãy chẩn đoán transport/CORS thay vì đổi model một cách ngẫu nhiên.'],
        ]
      : [
          ['Direct API', 'Verify the base URL and exact model name. For LAN Ollama, the backend must listen beyond loopback, the firewall must allow the port, and CORS/Local Network Access must allow the Marinara origin.'],
          ['Timeout', timeout ? 'The request exceeded the configured Direct API deadline. Increase it only when the backend genuinely needs more time.' : 'If the failure occurs before any HTTP response, diagnose transport/CORS rather than changing models at random.'],
        ];
  }

  if (mode === 'sidecar') {
    return vi
      ? [
          ['Local Sidecar', 'Sidecar dùng model cục bộ do Marinara tải xuống, không phải connection của chat. Hãy xác nhận model local đã được cài và đang phản hồi.'],
          ['Giới hạn', 'Sidecar có giới hạn prompt riêng. Nếu selection lớn, Rewrite Assistant sẽ chuyển sang Ledger khi phù hợp thay vì cắt mất nội dung.'],
        ]
      : [
          ['Local Sidecar', 'Sidecar uses Marinara\'s downloaded local model, not the chat connection. Verify that the local model is installed and responsive.'],
          ['Limits', 'Sidecar has its own prompt limits. Large selections should move to Ledger processing instead of being silently truncated.'],
        ];
  }

  if (mode === 'extender') {
    return vi
      ? [
          ['Marinara Extender', 'Kiểm tra URL của Extender và xác nhận sidecar Extender đang chạy. Rewrite Assistant không dùng connection mặc định của chat trong chế độ này.'],
          ['Timeout', timeout ? 'Request tới Extender đã vượt quá timeout cấu hình.' : 'Nếu Extender trả HTTP error, ưu tiên đọc lỗi provider thay vì coi đây là lỗi connection của chat.'],
        ]
      : [
          ['Marinara Extender', 'Verify the Extender URL and that the Extender sidecar is running. Rewrite Assistant does not use the chat connection in this mode.'],
          ['Timeout', timeout ? 'The Extender request exceeded the configured timeout.' : 'If Extender returns an HTTP error, inspect that provider error rather than treating it as a chat-connection failure.'],
        ];
  }

  return vi
    ? [
        ['Connection đang dùng', 'Rewrite Assistant đọc connectionId của chat hiện tại và gửi chính ID đó tới Marinara /generate/raw. Fallback của extension chỉ được dùng khi chat không có connection.'],
        ['Generation', timeout
          ? 'Timeout này là deadline phía Rewrite Assistant, không tự động có nghĩa connection của chat bị hỏng. Có thể đặt Marinara timeout = 0 để chờ provider hoàn tất; nút Hủy vẫn dừng request.'
          : 'Nếu connection hợp lệ nhưng generation thất bại, kiểm tra model/provider và generation parameters của connection hiện tại. Fast rewrite có thể tắt reasoning chỉ cho lượt rewrite khi model hỗ trợ.'],
        ['Hủy', 'Khi bấm Hủy, Rewrite Assistant abort fetch đang chạy. Với Marinara raw streaming, extension còn gửi yêu cầu abort theo runId; Engine cũng abort provider khi client đóng stream.'],
      ]
    : [
        ['Effective connection', 'Rewrite Assistant reads the current chat connectionId and sends that exact ID to Marinara /generate/raw. The extension fallback is used only when the chat has no connection.'],
        ['Generation', timeout
          ? 'This timeout is a Rewrite Assistant client deadline; it does not by itself mean the chat connection is broken. Set Marinara timeout to 0 to wait for the provider; Cancel still stops the request.'
          : 'If the connection is valid but generation fails, inspect the model/provider and generation parameters on the active connection. Fast rewrite can disable reasoning for rewrite calls when supported.'],
        ['Cancel semantics', 'Cancel aborts the active fetch. For Marinara raw streaming, Rewrite Assistant also sends a runId abort request; the Engine additionally aborts the provider when the client stream closes.'],
      ];
}

export const ErrorModal = ({
  message,
  mode = 'marinara',
  errorCode = null,
  connectionSource = null,
  connectionId = null,
  onClose,
}) => {
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onClose);
  const language = usePersistentStore((state) => state.config.uiLanguage);
  const vi = language === 'vi';
  const guidance = providerGuidance(mode, errorCode, vi);
  const sourceLabel = connectionSource === 'chat'
    ? (vi ? 'connection của chat hiện tại' : 'current chat connection')
    : connectionSource === 'fallback'
      ? (vi ? 'connection dự phòng của extension' : 'extension fallback connection')
      : null;

  return (
    <div className="rwa-ov" style={{ zIndex: 10005 }}>
      <div ref={dialogRef} className="rwa-err-window" role="alertdialog" aria-modal="true" aria-label={vi ? 'Chẩn đoán kết nối' : 'Connection diagnostics'} tabIndex={-1}>
        <div className="rwa-err-hdr" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="rwa-err-icon">⚠️</span>
            <div className="rwa-err-title">{vi ? 'CHẨN ĐOÁN KẾT NỐI' : 'CONNECTION DIAGNOSTICS'}</div>
          </div>
          <Button
            glow={false}
            onClick={onClose}
            aria-label={vi ? 'Đóng chẩn đoán' : 'Close diagnostics'}
            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
          >
            ✕
          </Button>
        </div>

        <div className="rwa-err-body" style={{ padding: '24px' }}>
          <div className="rwa-err-msg" style={{ marginBottom: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
            {message}
          </div>

          {sourceLabel ? (
            <div className="rwa-prev" style={{ marginBottom: '14px', padding: '9px 11px', fontSize: '11.5px', lineHeight: 1.45 }}>
              <strong>{vi ? 'Nguồn connection:' : 'Connection source:'}</strong> {sourceLabel}
              {connectionId ? <><br /><code>{connectionId}</code></> : null}
            </div>
          ) : null}

          <div className="rwa-err-guide" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="rwa-err-guide-title" style={{ fontSize: '11px', fontWeight: '800', color: 'var(--rwa-primary)', letterSpacing: '0.05em', marginBottom: '12px' }}>
              🛠️ {vi ? 'KIỂM TRA ĐÚNG ĐƯỜNG KẾT NỐI:' : 'CHECK THE ACTIVE PATH:'}
            </div>
            {guidance.map(([title, body], index) => (
              <div
                key={title}
                className="rwa-err-guide-step"
                style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', marginBottom: index === guidance.length - 1 ? 0 : '12px', lineHeight: '1.55' }}
              >
                <b style={{ color: '#fff' }}>{index + 1}. {title}:</b> {body}
              </div>
            ))}
          </div>
        </div>

        <div className="rwa-err-foot">
          <Button
            glow={false}
            variant="rwa-accept"
            onClick={onClose}
            style={{ padding: '8px 24px' }}
          >
            {vi ? 'Đã hiểu' : 'Understood'}
          </Button>
        </div>
      </div>
    </div>
  );
};
