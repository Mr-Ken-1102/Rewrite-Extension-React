import { Fragment, useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { usePersistentStore } from '../../store/usePersistentStore';
import { useToastStore } from '../../store/useToastStore';
import { diffWorkerInstance } from '../../services/diffWorkerService';
import { DOMUtils } from '../../utils/domUtils';

export const PreviewModal = ({
  status,
  result,
  profile,
  selection,
  progress = null,
  pieces = null,
  applyReport = '',
  streamed = false,
  onAccept,
  onReplaceAll,
  onManualSave,
  onRetry,
  onClose,
}) => {
  const { config } = usePersistentStore();
  const vi = config.uiLanguage === 'vi';
  const text = (en, viText) => (vi ? viText : en);
  const showToast = useToastStore((state) => state.showToast);
  const [diffOps, setDiffOps] = useState(null);
  const [typewriterText, setTypewriterText] = useState('');
  const typeIndexRef = useRef(0);
  const timerRef = useRef(null);
  const isLoading = status === 'loading';
  const isApplying = status === 'applying';
  const isPartial = status === 'partial';
  const isMerged = Array.isArray(pieces) && pieces.length > 1;

  useEffect(() => {
    let isMounted = true;
    setDiffOps(null);
    if (!isLoading && !isMerged && config.showDiff && result) {
      const safeOldStr = selection?.text || '';
      diffWorkerInstance.computeDiff(safeOldStr, result).then((ops) => {
        if (isMounted) setDiffOps(ops);
      });
    }
    return () => { isMounted = false; };
  }, [isLoading, isMerged, config.showDiff, result, selection]);

  useEffect(() => {
    let mounted = true;
    if (!isLoading && !isMerged && !config.showDiff && config.typewriter && result && !streamed) {
      const tokens = result.split(/(\s+)/);
      if (result.length > 8000 || tokens.length > 1200) {
        setTypewriterText(result);
        return () => { mounted = false; };
      }
      typeIndexRef.current = 0;
      setTypewriterText('');
      const next = () => {
        if (!mounted) return;
        const from = typeIndexRef.current;
        const to = Math.min(tokens.length, from + 12);
        if (from < to) {
          setTypewriterText((prev) => prev + tokens.slice(from, to).join(''));
          typeIndexRef.current = to;
          timerRef.current = setTimeout(next, 16);
        }
      };
      next();
    } else if (!isLoading && result) {
      setTypewriterText(result);
    }
    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, isMerged, config.showDiff, config.typewriter, result, streamed]);

  const getWcDiff = () => {
    const wc = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
    const a = wc(selection?.text);
    const b = wc(result);
    const d = b - a;
    const p = a ? Math.round((d / a) * 100) : 0;
    return vi
      ? `${d >= 0 ? '+' : ''}${d} từ (${p >= 0 ? '+' : ''}${p}%)`
      : `${d >= 0 ? '+' : ''}${d} words (${p >= 0 ? '+' : ''}${p}%)`;
  };

  const handleCopy = async () => {
    const copied = await DOMUtils.safeCopy(result || '');
    showToast(
      copied
        ? text('✓ Copied result to clipboard', '✓ Đã sao chép kết quả vào clipboard')
        : text('✕ Clipboard copy failed. The raw result remains selectable below and can also be saved as .txt.', '✕ Không thể sao chép vào clipboard. Kết quả thô bên dưới vẫn có thể chọn và lưu thành .txt.'),
      copied ? 'ok' : 'warn',
    );
  };

  const handleSaveFile = () => {
    const mid = String(selection?.mid || 'selection').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 50);
    const saved = DOMUtils.saveTextFile(result || '', `rewrite-${mid}.txt`);
    showToast(
      saved
        ? text('✓ Saved rewrite result as a .txt file', '✓ Đã lưu kết quả viết lại thành file .txt')
        : text('Could not create the .txt download. The result remains selectable in this window.', 'Không thể tạo file .txt. Kết quả vẫn có thể chọn trực tiếp trong cửa sổ này.'),
      saved ? 'ok' : 'warn',
    );
  };

  const handleReplaceAllClick = () => {
    const ta = selection?.source === 'textarea' ? selection.el : null;
    if (ta?.isConnected) {
      const fullSel = { ...selection, source: 'textarea', text: ta.value, originalValue: ta.value, start: 0, end: ta.value.length, el: ta };
      onReplaceAll?.(result, fullSel);
    } else {
      showToast(text('⚠️ Replace All is available only while the original edit box is still open.', '⚠️ Chỉ có thể Thay thế toàn bộ khi ô chỉnh sửa gốc vẫn đang mở.'), 'warn');
    }
  };

  const profileName = profile?.name || text('Result', 'Kết quả');
  const modalTitle = isLoading
    ? `${profileName} — ${text('Processing…', 'Đang xử lý…')}`
    : isApplying
      ? `${profileName} — ${text('Applying…', 'Đang áp dụng…')}`
      : isPartial
        ? `${profileName} — ${text('Partial recovery', 'Khôi phục kết quả một phần')}`
        : `${profileName} — ${text('Result', 'Kết quả')}`;

  return (
    <Modal
      title={modalTitle}
      onClose={isApplying ? () => {} : onClose}
      width="600px"
      className="rwar-window"
      bodyClassName="rwar-body"
    >
      {isLoading ? (
        <div className="rwar-loading">
          {progress ? <div className="rwa-prev rwar-progress">{progress}</div> : null}
          <section className="rwar-section">
            <div className="rwa-plbl rwar-label">{text('Selected Passage', 'Đoạn đã chọn')}</div>
            <div className="rwa-prev rwa-shimmer rwar-selected">{selection?.text}</div>
          </section>
          {result ? (
            <section className="rwar-section rwar-live-section" aria-live="polite">
              <div className="rwa-plbl rwar-label">{text('Live output', 'Kết quả đang stream')}</div>
              <div className="rwa-prev rwar-live-output">{result}</div>
              <div className="rwar-writing-copy rwar-writing-copy-live">{text('Receiving from Marinara…', 'Đang nhận dữ liệu từ Marinara…')}</div>
            </section>
          ) : (
            <div className="rwar-writing" aria-live="polite">
              <div className="rwa-pulse" />
              <div className="rwar-writing-copy">{text('Writing with Intelligence…', 'Đang viết lại…')}</div>
            </div>
          )}
          <div className="rwar-loading-actions">
            <Button glow={false} onClick={onClose}>{text('Cancel', 'Hủy')}</Button>
          </div>
        </div>
      ) : (
        <>
          {progress ? <div className="rwa-prev rwar-progress rwar-progress-active">{progress}</div> : null}
          {applyReport ? <div role="status" className="rwa-prev rwar-apply-report">{applyReport}</div> : null}

          <section className="rwar-section">
            <div className="rwa-plbl rwar-label">{text('Original Text', 'Văn bản gốc')}</div>
            <div className="rwa-prev rwar-original">{selection?.text || ''}</div>
          </section>

          {isMerged ? (
            <section className="rwar-section">
              <div className="rwa-plbl rwar-label">{text('Validated merged result — split by message', 'Kết quả gộp đã xác thực — tách theo từng tin nhắn')}</div>
              <div className="rwa-prev rwar-merged">
                {pieces.map((piece, index) => (
                  <div key={index} className="rwar-message-piece">
                    <div className="rwa-plbl rwar-message-label">{text(`Message ${index + 1}`, `Tin nhắn ${index + 1}`)}</div>
                    <div className="rwar-message-text">{piece}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rwar-section">
              <div className="rwar-section-head">
                <div className="rwa-plbl rwar-label">{config.showDiff ? text('Diff Breakdown', 'So sánh thay đổi') : text('Result Preview', 'Xem trước kết quả')}</div>
                <div className="rwar-word-delta">{getWcDiff()}</div>
              </div>
              {config.showDiff ? (
                <div className="rwar-diff-legend">
                  <span className="rwar-added">{text('Added', 'Thêm')}</span>
                  <span className="rwar-removed">{text('Removed', 'Xóa')}</span>
                </div>
              ) : null}
              <div className="rwa-prev rwar-result-preview">
                {config.showDiff ? (
                  diffOps ? diffOps.map((op, idx) => {
                    if (op.t === 'eq') return <Fragment key={idx}>{op.v}</Fragment>;
                    return <span key={idx} className={op.t === 'ins' ? 'rwar-diff-add' : 'rwar-diff-remove'}>{op.v}</span>;
                  }) : <div className="rwar-diff-loading"><div className="rwa-pulse" /><span>{text('Computing diff…', 'Đang tính phần thay đổi…')}</span></div>
                ) : (config.typewriter ? typewriterText : result)}
              </div>
            </section>
          )}

          <section className="rwar-section rwar-raw-section" aria-label={text('Raw result — always selectable for manual recovery', 'Kết quả thô — luôn có thể chọn để khôi phục thủ công')}>
            <div className="rwar-section-head">
              <div className="rwa-plbl rwar-label" title={text('Raw result — always selectable for manual recovery', 'Kết quả thô — luôn có thể chọn để khôi phục thủ công')}>{text('Raw result', 'Kết quả thô')}</div>
              <div className="rwar-recovery-note">{text('Selectable recovery copy', 'Bản sao có thể chọn')}</div>
            </div>
            <textarea
              className="rwa-inp rwar-raw"
              readOnly
              value={result || ''}
              aria-label={text('Raw rewrite result', 'Kết quả viết lại thô')}
              onFocus={(event) => event.currentTarget.select()}
            />
          </section>

          <div className="rwar-actions">
            <div className="rwar-actions-primary">
              <Button glow={false} variant="rwa-accept" onClick={() => onAccept?.(result, selection)} disabled={isApplying || isPartial} className="rwar-accept">
                {isApplying
                  ? text('Applying…', 'Đang áp dụng…')
                  : isPartial
                    ? text('Incomplete result', 'Kết quả chưa hoàn tất')
                    : isMerged
                      ? text('✓ Accept All', '✓ Chấp nhận tất cả')
                      : text('✓ Accept', '✓ Chấp nhận')}
              </Button>
              {!isMerged && onManualSave ? (
                <Button glow={false} onClick={() => onManualSave(result, selection)} disabled={isApplying || isPartial}>{text('Open native editor', 'Mở trình chỉnh sửa gốc')}</Button>
              ) : null}
              {selection?.source === 'textarea' && !isMerged ? (
                <Button glow={false} variant="rwa-replace" onClick={handleReplaceAllClick} disabled={isApplying || isPartial}>{text('Replace All', 'Thay thế toàn bộ')}</Button>
              ) : null}
            </div>
            <div className="rwar-actions-tools">
              <Button glow={false} onClick={handleCopy} disabled={isApplying || !result}>{text('Copy', 'Sao chép')}</Button>
              <Button glow={false} onClick={handleSaveFile} disabled={isApplying || !result}>{text('Save .txt', 'Lưu .txt')}</Button>
              <Button glow={false} onClick={onRetry} disabled={isApplying}>{text('Retry', 'Thử lại')}</Button>
              <Button glow={false} onClick={onClose} disabled={isApplying}>{text('Close', 'Đóng')}</Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
